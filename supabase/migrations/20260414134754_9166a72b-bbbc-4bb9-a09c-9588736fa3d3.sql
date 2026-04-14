-- Create checkin status enum
CREATE TYPE public.checkin_status AS ENUM ('not_checked_in', 'checked_in');

-- Create airports master table
CREATE TABLE public.airports (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL
);

ALTER TABLE public.airports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Airports are publicly readable"
  ON public.airports FOR SELECT
  USING (true);

INSERT INTO public.airports (code, name, city) VALUES
  ('MAA', 'Chennai International Airport', 'Chennai'),
  ('BLR', 'Kempegowda International Airport', 'Bengaluru'),
  ('HYD', 'Rajiv Gandhi International Airport', 'Hyderabad'),
  ('DEL', 'Indira Gandhi International Airport', 'Delhi'),
  ('BOM', 'Chhatrapati Shivaji Maharaj International Airport', 'Mumbai');

-- Create pnr_records table
CREATE TABLE public.pnr_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pnr_code TEXT NOT NULL UNIQUE,
  passenger_name TEXT NOT NULL,
  mobile_number TEXT NOT NULL,
  email TEXT NOT NULL,
  flight_number TEXT NOT NULL,
  journey_date DATE NOT NULL,
  journey_time TIME NOT NULL,
  source_airport TEXT NOT NULL REFERENCES public.airports(code),
  destination_airport TEXT NOT NULL REFERENCES public.airports(code),
  checkin_status public.checkin_status NOT NULL DEFAULT 'not_checked_in',
  seat_assignment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT different_airports CHECK (source_airport <> destination_airport)
);

ALTER TABLE public.pnr_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "PNR records are publicly readable"
  ON public.pnr_records FOR SELECT
  USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_pnr_records_updated_at
  BEFORE UPDATE ON public.pnr_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_pnr_code ON public.pnr_records(pnr_code);
CREATE INDEX idx_source_airport ON public.pnr_records(source_airport);
CREATE INDEX idx_destination_airport ON public.pnr_records(destination_airport);
CREATE INDEX idx_checkin_status ON public.pnr_records(checkin_status);