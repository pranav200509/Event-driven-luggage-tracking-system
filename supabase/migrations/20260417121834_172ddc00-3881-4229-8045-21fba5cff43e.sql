-- Add new statuses to baggage_status enum
ALTER TYPE public.baggage_status ADD VALUE IF NOT EXISTS 'screening' BEFORE 'in_transit';
ALTER TYPE public.baggage_status ADD VALUE IF NOT EXISTS 'sorting' BEFORE 'in_transit';
ALTER TYPE public.baggage_status ADD VALUE IF NOT EXISTS 'loaded' BEFORE 'arrived';

-- Add airport_code to baggage_records
ALTER TABLE public.baggage_records
  ADD COLUMN IF NOT EXISTS airport_code text;

-- Backfill airport_code from current_location for existing rows
UPDATE public.baggage_records
SET airport_code = current_location
WHERE airport_code IS NULL;

-- Create baggage_status_logs table
CREATE TABLE IF NOT EXISTS public.baggage_status_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tag_number text NOT NULL,
  status public.baggage_status NOT NULL,
  airport_code text NOT NULL,
  location text NOT NULL,
  scanned_by uuid,
  method text NOT NULL DEFAULT 'single_scan',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_baggage_logs_tag ON public.baggage_status_logs(tag_number);
CREATE INDEX IF NOT EXISTS idx_baggage_logs_tag_loc_air ON public.baggage_status_logs(tag_number, location, airport_code);

ALTER TABLE public.baggage_status_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Logs are publicly readable"
ON public.baggage_status_logs FOR SELECT
USING (true);

CREATE POLICY "Baggage staff & admins can insert logs"
ON public.baggage_status_logs FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'baggage_staff'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete logs"
ON public.baggage_status_logs FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));