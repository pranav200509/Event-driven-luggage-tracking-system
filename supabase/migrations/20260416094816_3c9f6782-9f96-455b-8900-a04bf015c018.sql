
-- Create bag_type enum
CREATE TYPE public.bag_type AS ENUM ('cabin', 'oversized', 'fragile', 'normal');

-- Create baggage_status enum
CREATE TYPE public.baggage_status AS ENUM ('checked_in', 'in_transit', 'arrived', 'collected', 'lost');

-- Create sequence for tag numbers
CREATE SEQUENCE public.baggage_tag_seq START 1;

-- Create baggage_records table
CREATE TABLE public.baggage_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tag_number TEXT NOT NULL UNIQUE,
  pnr_code TEXT NOT NULL REFERENCES public.pnr_records(pnr_code),
  weight NUMERIC(5,2) NOT NULL,
  bag_type public.bag_type NOT NULL DEFAULT 'normal',
  status public.baggage_status NOT NULL DEFAULT 'checked_in',
  current_location TEXT NOT NULL REFERENCES public.airports(code),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.baggage_records ENABLE ROW LEVEL SECURITY;

-- Public can read (for passenger tracking page)
CREATE POLICY "Baggage records are publicly readable"
  ON public.baggage_records FOR SELECT
  TO public
  USING (true);

-- Staff can insert baggage
CREATE POLICY "Staff can insert baggage records"
  ON public.baggage_records FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'checkin_staff'::app_role)
    OR has_role(auth.uid(), 'baggage_staff'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- Staff can update baggage
CREATE POLICY "Staff can update baggage records"
  ON public.baggage_records FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'checkin_staff'::app_role)
    OR has_role(auth.uid(), 'baggage_staff'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- Admins can delete
CREATE POLICY "Admins can delete baggage records"
  ON public.baggage_records FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_baggage_records_updated_at
  BEFORE UPDATE ON public.baggage_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate next tag number
CREATE OR REPLACE FUNCTION public.next_bag_tag()
RETURNS TEXT
LANGUAGE sql
VOLATILE
SET search_path = public
AS $$
  SELECT 'SKYBAG' || LPAD(nextval('public.baggage_tag_seq')::text, 4, '0')
$$;
