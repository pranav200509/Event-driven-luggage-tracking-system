-- Add CCU airport if missing
INSERT INTO public.airports (code, name, city) VALUES
  ('CCU', 'Netaji Subhas Chandra Bose International Airport', 'Kolkata')
ON CONFLICT (code) DO NOTHING;

-- Add route_path column (array of airport codes: source, [transit], destination)
ALTER TABLE public.pnr_records
  ADD COLUMN IF NOT EXISTS route_path text[];