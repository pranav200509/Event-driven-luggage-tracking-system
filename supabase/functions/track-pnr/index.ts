import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple in-memory rate limit per IP (best-effort; resets when function cold-starts)
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30;
const ipHits = new Map<string, { count: number; resetAt: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = ipHits.get(ip);
  if (!entry || entry.resetAt < now) {
    ipHits.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  if (entry.count > RATE_LIMIT_MAX) return true;
  return false;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("cf-connecting-ip") ||
      "unknown";

    if (rateLimited(ip)) {
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again shortly." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const rawPnr = typeof body.pnr === "string" ? body.pnr.trim().toUpperCase() : "";

    // Basic format validation: 6-20 alphanumerics
    if (!/^[A-Z0-9]{4,20}$/.test(rawPnr)) {
      return new Response(JSON.stringify({ error: "Invalid PNR format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceRoleKey);

    // Look up the single PNR
    const { data: pnr, error: pnrErr } = await admin
      .from("pnr_records")
      .select(
        `*,
         source:airports!pnr_records_source_airport_fkey(code, name, city),
         destination:airports!pnr_records_destination_airport_fkey(code, name, city)`
      )
      .eq("pnr_code", rawPnr)
      .maybeSingle();

    if (pnrErr) {
      console.error("track-pnr pnr lookup error:", pnrErr);
      return new Response(JSON.stringify({ error: "Lookup failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!pnr) {
      return new Response(JSON.stringify({ pnr: null, bags: [], logs: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Strip sensitive PII before returning to public caller
    const safePnr = {
      id: pnr.id,
      pnr_code: pnr.pnr_code,
      passenger_name: pnr.passenger_name,
      flight_number: pnr.flight_number,
      journey_date: pnr.journey_date,
      journey_time: pnr.journey_time,
      source_airport: pnr.source_airport,
      destination_airport: pnr.destination_airport,
      checkin_status: pnr.checkin_status,
      seat_assignment: pnr.seat_assignment,
      created_at: pnr.created_at,
      updated_at: pnr.updated_at,
      source_city: (pnr as any).source?.city,
      source_name: (pnr as any).source?.name,
      destination_city: (pnr as any).destination?.city,
      destination_name: (pnr as any).destination?.name,
      // Mask email and mobile
      email: pnr.email
        ? pnr.email.replace(/^(.).*(@.*)$/, "$1***$2")
        : null,
      mobile_number: pnr.mobile_number
        ? "******" + pnr.mobile_number.slice(-2)
        : null,
    };

    // Bags + logs for this PNR
    const { data: bags } = await admin
      .from("baggage_records")
      .select("*")
      .eq("pnr_code", rawPnr)
      .order("created_at", { ascending: true });

    const tagNumbers = (bags ?? []).map((b: any) => b.tag_number);
    let logs: any[] = [];
    if (tagNumbers.length > 0) {
      const { data: logsData } = await admin
        .from("baggage_status_logs")
        .select("id, tag_number, status, airport_code, location, method, created_at")
        .in("tag_number", tagNumbers)
        .order("created_at", { ascending: false });
      logs = logsData ?? [];
    }

    return new Response(
      JSON.stringify({ pnr: safePnr, bags: bags ?? [], logs }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("track-pnr unexpected error:", err);
    return new Response(JSON.stringify({ error: "Lookup failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
