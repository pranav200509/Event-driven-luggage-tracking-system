import { supabase } from "@/integrations/supabase/client";
import type { BaggageRecord } from "@/data/baggageDatabase";

export type WorkLocation =
  | "Security Screening"
  | "Sorting Area"
  | "Loading Bay"
  | "Arrival Unloading"
  | "Baggage Carousel";

export type ScanStatus =
  | "checked_in"
  | "screening"
  | "sorting"
  | "loaded"
  | "arrived"
  | "collected";

export const WORK_LOCATIONS: WorkLocation[] = [
  "Security Screening",
  "Sorting Area",
  "Loading Bay",
  "Arrival Unloading",
  "Baggage Carousel",
];

export const LOCATION_TO_STATUS: Record<WorkLocation, ScanStatus> = {
  "Security Screening": "screening",
  "Sorting Area": "sorting",
  "Loading Bay": "loaded",
  "Arrival Unloading": "arrived",
  "Baggage Carousel": "collected",
};

// Defines the linear progression order. Index = stage number.
export const STATUS_ORDER: ScanStatus[] = [
  "checked_in",
  "screening",
  "sorting",
  "loaded",
  "arrived",
  "collected",
];

export const STATUS_LABEL: Record<ScanStatus, string> = {
  checked_in: "Checked In",
  screening: "Screening",
  sorting: "Sorting",
  loaded: "Loaded",
  arrived: "Arrived",
  collected: "Collected",
};

export interface BaggageStatusLog {
  id: string;
  tag_number: string;
  status: ScanStatus;
  airport_code: string;
  location: string;
  scanned_by: string | null;
  method: string;
  created_at: string;
}

export interface ScanResult {
  success: boolean;
  message: string;
  bag?: BaggageRecord;
  log?: BaggageStatusLog;
  errorCode?:
    | "invalid_tag"
    | "duplicate"
    | "stage_jump"
    | "no_location"
    | "unknown";
}

/** Lookup baggage by tag */
export async function getBaggageByTag(
  tagNumber: string
): Promise<BaggageRecord | null> {
  const { data, error } = await supabase
    .from("baggage_records")
    .select("*")
    .eq("tag_number", tagNumber)
    .maybeSingle();
  if (error || !data) return null;
  return data as unknown as BaggageRecord;
}

/** Get latest scan logs for a tag (descending) */
export async function getLogsForTag(
  tagNumber: string
): Promise<BaggageStatusLog[]> {
  const { data, error } = await supabase
    .from("baggage_status_logs")
    .select("*")
    .eq("tag_number", tagNumber)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data as unknown as BaggageStatusLog[];
}

/** Perform a scan with full validation */
export async function performScan(args: {
  rawTag: string;
  location: WorkLocation | null;
  staffAirport: string;
  staffUserId: string;
}): Promise<ScanResult> {
  const tag = args.rawTag.trim().toUpperCase();

  if (!args.location) {
    return {
      success: false,
      message: "Please select a working location first",
      errorCode: "no_location",
    };
  }

  if (!tag) {
    return { success: false, message: "Invalid baggage tag", errorCode: "invalid_tag" };
  }

  // 1. Tag must exist
  const bag = await getBaggageByTag(tag);
  if (!bag) {
    return { success: false, message: "Invalid baggage tag", errorCode: "invalid_tag" };
  }

  const newStatus = LOCATION_TO_STATUS[args.location];
  const location = args.location;

  // 2. Check duplicate: same location + same airport
  const { data: dupLogs } = await supabase
    .from("baggage_status_logs")
    .select("id")
    .eq("tag_number", tag)
    .eq("location", location)
    .eq("airport_code", args.staffAirport)
    .limit(1);

  if (dupLogs && dupLogs.length > 0) {
    return {
      success: false,
      message: `Already scanned at ${location} in ${args.staffAirport}`,
      errorCode: "duplicate",
    };
  }

  // 3. Stage progression check (based on current bag status)
  const currentIdx = STATUS_ORDER.indexOf(bag.status as ScanStatus);
  const newIdx = STATUS_ORDER.indexOf(newStatus);

  // Allow same stage at a new airport (handled above by duplicate check
  // returning false for different airports). Block backwards or skipping.
  if (newIdx < currentIdx) {
    return {
      success: false,
      message: `Cannot move backwards from ${STATUS_LABEL[bag.status as ScanStatus]} to ${STATUS_LABEL[newStatus]}`,
      errorCode: "stage_jump",
    };
  }
  if (newIdx > currentIdx + 1) {
    const expected = STATUS_ORDER[currentIdx + 1];
    return {
      success: false,
      message: `Invalid stage. Expected ${STATUS_LABEL[expected]} next, not ${STATUS_LABEL[newStatus]}`,
      errorCode: "stage_jump",
    };
  }

  // 4. Update baggage_records
  const { data: updated, error: updateErr } = await supabase
    .from("baggage_records")
    .update({
      status: newStatus,
      current_location: location,
      airport_code: args.staffAirport,
    })
    .eq("tag_number", tag)
    .select()
    .single();

  if (updateErr || !updated) {
    return { success: false, message: "Failed to update bag", errorCode: "unknown" };
  }

  // 5. Insert log
  const { data: log, error: logErr } = await supabase
    .from("baggage_status_logs")
    .insert({
      tag_number: tag,
      status: newStatus,
      airport_code: args.staffAirport,
      location,
      scanned_by: args.staffUserId,
      method: "single_scan",
    })
    .select()
    .single();

  if (logErr) {
    return { success: false, message: "Failed to record scan log", errorCode: "unknown" };
  }

  return {
    success: true,
    message: `Updated to ${STATUS_LABEL[newStatus]} at ${location}`,
    bag: updated as unknown as BaggageRecord,
    log: log as unknown as BaggageStatusLog,
  };
}

/** Soft beep (success only) */
export function playBeep() {
  try {
    const ctx = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  } catch {
    // ignore
  }
}
