import { supabase } from "@/integrations/supabase/client";

export interface PNRRecord {
  id: string;
  pnr_code: string;
  passenger_name: string;
  mobile_number: string;
  email: string;
  flight_number: string;
  journey_date: string;
  journey_time: string;
  source_airport: string;
  destination_airport: string;
  checkin_status: "not_checked_in" | "checked_in";
  seat_assignment: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields from airports table
  source_city?: string;
  source_name?: string;
  destination_city?: string;
  destination_name?: string;
}

export interface Airport {
  code: string;
  name: string;
  city: string;
}

export async function lookupPNR(pnr: string): Promise<PNRRecord | null> {
  const { data, error } = await supabase
    .from("pnr_records")
    .select(`
      *,
      source:airports!pnr_records_source_airport_fkey(code, name, city),
      destination:airports!pnr_records_destination_airport_fkey(code, name, city)
    `)
    .eq("pnr_code", pnr.trim().toUpperCase())
    .maybeSingle();

  if (error || !data) return null;

  return {
    ...data,
    source_city: (data.source as any)?.city,
    source_name: (data.source as any)?.name,
    destination_city: (data.destination as any)?.city,
    destination_name: (data.destination as any)?.name,
  } as PNRRecord;
}

export async function getAllPNRs(): Promise<PNRRecord[]> {
  const { data, error } = await supabase
    .from("pnr_records")
    .select(`
      *,
      source:airports!pnr_records_source_airport_fkey(code, name, city),
      destination:airports!pnr_records_destination_airport_fkey(code, name, city)
    `)
    .order("pnr_code", { ascending: true });

  if (error || !data) return [];

  return data.map((record) => ({
    ...record,
    source_city: (record.source as any)?.city,
    source_name: (record.source as any)?.name,
    destination_city: (record.destination as any)?.city,
    destination_name: (record.destination as any)?.name,
  })) as PNRRecord[];
}

export async function getAirports(): Promise<Airport[]> {
  const { data, error } = await supabase
    .from("airports")
    .select("*")
    .order("code");

  if (error || !data) return [];
  return data;
}
