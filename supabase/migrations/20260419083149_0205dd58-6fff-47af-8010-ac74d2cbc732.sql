CREATE TABLE public.staff_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  staff_name TEXT,
  email TEXT,
  role TEXT,
  airport_code TEXT,
  login_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  logout_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_staff_logs_active ON public.staff_logs(user_id) WHERE logout_time IS NULL;
CREATE INDEX idx_staff_logs_login_time ON public.staff_logs(login_time DESC);

ALTER TABLE public.staff_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all staff logs"
ON public.staff_logs FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own staff logs"
ON public.staff_logs FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own login records"
ON public.staff_logs FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own logout time"
ON public.staff_logs FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage staff logs"
ON public.staff_logs FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));