-- Add new statuses to support unified direct + connecting flight flow
ALTER TYPE public.baggage_status ADD VALUE IF NOT EXISTS 'unloaded';
ALTER TYPE public.baggage_status ADD VALUE IF NOT EXISTS 'transfer_sorting';
ALTER TYPE public.baggage_status ADD VALUE IF NOT EXISTS 'carousel';