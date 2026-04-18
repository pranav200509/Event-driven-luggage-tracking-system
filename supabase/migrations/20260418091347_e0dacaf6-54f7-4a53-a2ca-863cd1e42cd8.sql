
-- 1) Helper: check role at a specific airport
CREATE OR REPLACE FUNCTION public.has_role_at_airport(_user_id uuid, _role app_role, _airport_code text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND airport_code = _airport_code
  )
$$;

-- 2) Drop overly-permissive public SELECT policies
DROP POLICY IF EXISTS "PNR records are publicly readable" ON public.pnr_records;
DROP POLICY IF EXISTS "Baggage records are publicly readable" ON public.baggage_records;
DROP POLICY IF EXISTS "Logs are publicly readable" ON public.baggage_status_logs;

-- 3) Add authenticated SELECT policies so staff/admin can still read
CREATE POLICY "Staff can read baggage records"
  ON public.baggage_records FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can read baggage status logs"
  ON public.baggage_status_logs FOR SELECT
  TO authenticated
  USING (true);

-- 4) Tighten staff write policies to require airport match (admins always allowed)
DROP POLICY IF EXISTS "Staff can update PNR records" ON public.pnr_records;
CREATE POLICY "Staff can update PNR records at their airport"
  ON public.pnr_records FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role_at_airport(auth.uid(), 'checkin_staff'::app_role, source_airport)
    OR has_role_at_airport(auth.uid(), 'baggage_staff'::app_role, source_airport)
    OR has_role_at_airport(auth.uid(), 'checkin_staff'::app_role, destination_airport)
    OR has_role_at_airport(auth.uid(), 'baggage_staff'::app_role, destination_airport)
  );

DROP POLICY IF EXISTS "Staff can insert baggage records" ON public.baggage_records;
CREATE POLICY "Staff can insert baggage records at their airport"
  ON public.baggage_records FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role_at_airport(auth.uid(), 'checkin_staff'::app_role, current_location)
    OR has_role_at_airport(auth.uid(), 'baggage_staff'::app_role, current_location)
  );

DROP POLICY IF EXISTS "Staff can update baggage records" ON public.baggage_records;
CREATE POLICY "Staff can update baggage records at their airport"
  ON public.baggage_records FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role_at_airport(auth.uid(), 'baggage_staff'::app_role, current_location)
    OR has_role_at_airport(auth.uid(), 'checkin_staff'::app_role, current_location)
  );

DROP POLICY IF EXISTS "Baggage staff & admins can insert logs" ON public.baggage_status_logs;
CREATE POLICY "Baggage staff & admins can insert logs at their airport"
  ON public.baggage_status_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role_at_airport(auth.uid(), 'baggage_staff'::app_role, airport_code)
  );
