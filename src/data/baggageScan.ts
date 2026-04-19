import { supabase } from "@/integrations/supabase/client";
import type { BaggageRecord } from "@/data/baggageDatabase";

/**
 * UNIFIED BAGGAGE FLOW (supports direct + connecting flights)
 *
 * Linear status sequence applied at EACH airport in route_path:
 *   checked_in → screening → sorting → loaded → unloaded → (decision)
 *
 * After "unloaded":
 *   - If current airport != final destination → transfer_sorting → loaded (next leg)
 *   - If current airport == final destination → carousel → collected
 *
 * Airport validation: each stage must occur at the airport that matches the
 * bag's progress along route_path. Skipping a transit airport is blocked.
 */

export type WorkLocation =
  | "Check-in Counter"
  | "Security Screening"
  | "Sorting Area"
  | "Loading Bay"
  | "Arrival Unloading"
  | "Transfer Sorting"
  | "Baggage Carousel"
  | "Collection";

export type ScanStatus =
  | "checked_in"
  | "screening"
  | "sorting"
  | "loaded"
  | "unloaded"
  | "transfer_sorting"
  | "carousel"
  | "collected";

export const WORK_LOCATIONS: WorkLocation[] = [
  "Security Screening",
  "Sorting Area",
  "Loading Bay",
  "Arrival Unloading",
  "Transfer Sorting",
  "Baggage Carousel",
  "Collection",
];

export const LOCATION_TO_STATUS: Record<WorkLocation, ScanStatus> = {
  "Check-in Counter": "checked_in",
  "Security Screening": "screening",
  "Sorting Area": "sorting",
  "Loading Bay": "loaded",
  "Arrival Unloading": "unloaded",
  "Transfer Sorting": "transfer_sorting",
  "Baggage Carousel": "carousel",
  "Collection": "collected",
};

export const STATUS_LABEL: Record<ScanStatus, string> = {
  checked_in: "Checked In",
  screening: "Screening",
  sorting: "Sorting",
  loaded: "Loaded",
  unloaded: "Unloaded",
  transfer_sorting: "Transfer Sorting",
  carousel: "On Carousel",
  collected: "Collected",
};

/** Linear order used for timeline rendering (covers full lifecycle of last leg). */
export const STATUS_ORDER: ScanStatus[] = [
  "checked_in",
  "screening",
  "sorting",
  "loaded",
  "unloaded",
  "transfer_sorting",
  "carousel",
  "collected",
];

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
    | "invalid_airport"
    | "invalid_transition"
    | "duplicate"
    | "no_location"
    | "no_route"
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

/**
 * Compute the airport at which the bag is CURRENTLY located along its route.
 * If the bag's airport_code is set we trust that; otherwise default to source.
 */
function currentAirportFor(bag: BaggageRecord, route: string[]): string {
  const a = bag.airport_code ?? bag.current_location;
  if (a && route.includes(a)) return a;
  return route[0];
}

/**
 * Given the current airport + status, what is the expected next (status, airport)?
 * Returns null if the journey is fully complete.
 */
export function expectedNext(
  status: ScanStatus,
  currentAirport: string,
  route: string[]
): { status: ScanStatus; airport: string } | null {
  const idx = route.indexOf(currentAirport);
  const isFinal = idx === route.length - 1;

  switch (status) {
    case "checked_in":
      return { status: "screening", airport: currentAirport };
    case "screening":
      return { status: "sorting", airport: currentAirport };
    case "sorting":
      return { status: "loaded", airport: currentAirport };
    case "loaded":
      // Next event is unloading at the NEXT airport in the route
      if (isFinal) return null; // shouldn't happen but guard
      return { status: "unloaded", airport: route[idx + 1] };
    case "unloaded":
      // Decision branch
      if (isFinal) return { status: "carousel", airport: currentAirport };
      return { status: "transfer_sorting", airport: currentAirport };
    case "transfer_sorting":
      return { status: "loaded", airport: currentAirport };
    case "carousel":
      return { status: "collected", airport: currentAirport };
    case "collected":
      return null;
  }
}

/** Fetch route_path for a PNR; returns [source, destination] fallback if missing. */
async function getRouteForPNR(pnrCode: string): Promise<string[] | null> {
  const { data } = await supabase
    .from("pnr_records")
    .select("route_path, source_airport, destination_airport")
    .eq("pnr_code", pnrCode)
    .maybeSingle();
  if (!data) return null;
  if (data.route_path && data.route_path.length >= 2) return data.route_path;
  if (data.source_airport && data.destination_airport)
    return [data.source_airport, data.destination_airport];
  return null;
}

/** Perform a route-aware scan with full validation */
export async function performScan(args: {
  rawTag: string;
  location: WorkLocation | null;
  staffAirport: string;
  staffUserId: string;
  method?: "single_scan" | "bulk_scan";
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

  // 2. Resolve route
  const route = await getRouteForPNR(bag.pnr_code);
  if (!route) {
    return {
      success: false,
      message: "No route found for this PNR",
      errorCode: "no_route",
    };
  }

  const newStatus = LOCATION_TO_STATUS[args.location];
  const currentStatus = bag.status as ScanStatus;
  const currentAirport = currentAirportFor(bag, route);

  // 3. Compute expected next step
  const next = expectedNext(currentStatus, currentAirport, route);
  if (!next) {
    return {
      success: false,
      message: "This bag has already completed its journey",
      errorCode: "invalid_transition",
    };
  }

  // 4. Validate status transition
  if (next.status !== newStatus) {
    return {
      success: false,
      message: `Invalid status transition. Expected "${STATUS_LABEL[next.status]}" next, not "${STATUS_LABEL[newStatus]}"`,
      errorCode: "invalid_transition",
    };
  }

  // 5. Validate staff airport matches expected airport for this step
  if (args.staffAirport !== next.airport) {
    return {
      success: false,
      message: `Invalid airport for this route. Expected ${next.airport}, scanned at ${args.staffAirport}`,
      errorCode: "invalid_airport",
    };
  }

  // 6. Duplicate guard (same tag + status + airport already logged)
  const { data: dupLogs } = await supabase
    .from("baggage_status_logs")
    .select("id")
    .eq("tag_number", tag)
    .eq("status", newStatus)
    .eq("airport_code", args.staffAirport)
    .limit(1);
  if (dupLogs && dupLogs.length > 0) {
    return {
      success: false,
      message: `Already scanned as ${STATUS_LABEL[newStatus]} at ${args.staffAirport}`,
      errorCode: "duplicate",
    };
  }

  // 7. Update baggage record
  const { data: updatedRows, error: updateErr } = await supabase
    .from("baggage_records")
    .update({
      status: newStatus,
      current_location: next.airport,
      airport_code: next.airport,
    })
    .eq("tag_number", tag)
    .select();

  if (updateErr) {
    return {
      success: false,
      message: `Failed to update bag: ${updateErr.message}`,
      errorCode: "unknown",
    };
  }

  if (!updatedRows || updatedRows.length === 0) {
    return {
      success: false,
      message: "You are not authorized to update this bag at this stage",
      errorCode: "invalid_airport",
    };
  }

  const updated = updatedRows[0];

  // 8. Insert log
  const { data: log, error: logErr } = await supabase
    .from("baggage_status_logs")
    .insert({
      tag_number: tag,
      status: newStatus,
      airport_code: args.staffAirport,
      location: args.location,
      scanned_by: args.staffUserId,
      method: args.method ?? "single_scan",
    })
    .select()
    .single();

  if (logErr) {
    return { success: false, message: "Failed to record scan log", errorCode: "unknown" };
  }

  return {
    success: true,
    message: `Updated to ${STATUS_LABEL[newStatus]} at ${args.staffAirport}`,
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
