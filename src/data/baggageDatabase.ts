import { supabase } from "@/integrations/supabase/client";

export interface BaggageRecord {
  id: string;
  tag_number: string;
  pnr_code: string;
  weight: number;
  bag_type: "cabin" | "oversized" | "fragile" | "normal";
  status: "checked_in" | "screening" | "sorting" | "in_transit" | "loaded" | "arrived" | "collected" | "lost";
  current_location: string;
  airport_code: string | null;
  created_at: string;
  updated_at: string;
}

export interface BagInput {
  bag_type: "cabin" | "oversized" | "fragile" | "normal";
  weight: number;
}

/** Fetch all baggage for a given PNR code */
export async function getBaggageByPNR(pnrCode: string): Promise<BaggageRecord[]> {
  const { data, error } = await supabase
    .from("baggage_records")
    .select("*")
    .eq("pnr_code", pnrCode)
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return data as BaggageRecord[];
}

/** Generate the next tag number using DB sequence */
export async function getNextTagNumber(): Promise<string | null> {
  const { data, error } = await supabase.rpc("next_bag_tag");
  if (error || !data) return null;
  return data as string;
}

/** Create multiple bags for a PNR and update checkin status */
export async function createBaggageForPNR(
  pnrCode: string,
  bags: BagInput[],
  staffAirport: string
): Promise<{ success: boolean; records: BaggageRecord[]; error?: string }> {
  // Generate tag numbers for each bag
  const tagNumbers: string[] = [];
  for (let i = 0; i < bags.length; i++) {
    const tag = await getNextTagNumber();
    if (!tag) return { success: false, records: [], error: "Failed to generate tag number" };
    tagNumbers.push(tag);
  }

  // Insert all bags
  const inserts = bags.map((bag, i) => ({
    tag_number: tagNumbers[i],
    pnr_code: pnrCode,
    weight: bag.weight,
    bag_type: bag.bag_type,
    status: "checked_in" as const,
    current_location: staffAirport,
  }));

  const { data, error } = await supabase
    .from("baggage_records")
    .insert(inserts)
    .select();

  if (error) return { success: false, records: [], error: error.message };

  // Update PNR checkin status
  const { error: updateError } = await supabase
    .from("pnr_records")
    .update({ checkin_status: "checked_in" })
    .eq("pnr_code", pnrCode);

  if (updateError) {
    return { success: false, records: data as BaggageRecord[], error: "Bags created but failed to update check-in status" };
  }

  return { success: true, records: data as BaggageRecord[] };
}
