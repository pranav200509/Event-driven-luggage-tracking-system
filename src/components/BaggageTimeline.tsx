import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  STATUS_ORDER,
  STATUS_LABEL,
  type ScanStatus,
  type BaggageStatusLog,
  getLogsForTag,
} from "@/data/baggageScan";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  RefreshCw,
  CheckCircle2,
  MapPin,
  Clock,
  PackageCheck,
  Loader2,
} from "lucide-react";

interface Props {
  tagNumber: string;
  currentStatus: ScanStatus;
  currentAirportCode: string | null;
  /** Optional prefetched logs (from public edge function). */
  prefetchedLogs?: BaggageStatusLog[];
}

interface AirportInfo {
  code: string;
  name: string;
  city: string;
}

const STATUS_LOCATION_LABEL: Record<ScanStatus, string> = {
  checked_in: "Check-in Counter",
  screening: "Security Screening",
  sorting: "Sorting Area",
  loaded: "Loading Bay",
  arrived: "Arrival Unloading",
  collected: "Baggage Carousel",
};

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

const BaggageTimeline = ({
  tagNumber,
  currentStatus,
  currentAirportCode,
  prefetchedLogs,
}: Props) => {
  const hasPrefetch = prefetchedLogs !== undefined;
  const [logs, setLogs] = useState<BaggageStatusLog[]>(prefetchedLogs ?? []);
  const [airports, setAirports] = useState<Record<string, AirportInfo>>({});
  const [loading, setLoading] = useState(!hasPrefetch);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    setRefreshing(true);
    const airportsRes = await supabase.from("airports").select("code, name, city");
    if (airportsRes.data) {
      const map: Record<string, AirportInfo> = {};
      airportsRes.data.forEach((a) => {
        map[a.code] = a as AirportInfo;
      });
      setAirports(map);
    }
    if (!hasPrefetch) {
      const logsData = await getLogsForTag(tagNumber);
      setLogs(logsData);
    }
    setLoading(false);
    setRefreshing(false);
  }, [tagNumber, hasPrefetch]);

  useEffect(() => {
    if (!hasPrefetch) setLoading(true);
    loadData();
  }, [loadData, hasPrefetch]);

  useEffect(() => {
    if (hasPrefetch) setLogs(prefetchedLogs ?? []);
  }, [prefetchedLogs, hasPrefetch]);

  const stageLogMap = new Map<ScanStatus, BaggageStatusLog>();
  [...logs].reverse().forEach((log) => {
    if (!stageLogMap.has(log.status as ScanStatus)) {
      stageLogMap.set(log.status as ScanStatus, log);
    }
  });

  const currentIdx = STATUS_ORDER.indexOf(currentStatus);
  const visibleStages = STATUS_ORDER.slice(0, currentIdx + 1);

  const currentAirportName = currentAirportCode
    ? airports[currentAirportCode]?.name ?? currentAirportCode
    : "—";

  const isCollected = currentStatus === "collected";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading timeline...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-heading">
              Current Location
            </p>
            <p className="text-lg font-heading font-bold text-primary">
              {STATUS_LOCATION_LABEL[currentStatus]} ({currentAirportCode ?? "—"})
            </p>
            <p className="text-sm text-muted-foreground">{currentAirportName}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="default" className="bg-primary">
              {STATUS_LABEL[currentStatus]}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {isCollected && (
        <Card className="border-success/40 bg-success/10">
          <CardContent className="p-4 flex items-center gap-3">
            <PackageCheck className="h-6 w-6 text-success" />
            <div>
              <p className="font-heading font-semibold text-success-foreground">
                Baggage successfully collected
              </p>
              <p className="text-sm text-muted-foreground">
                Your journey with this bag is complete.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {visibleStages.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No tracking updates available yet
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6">
            <ol className="relative border-l-2 border-border ml-3 space-y-6">
              {visibleStages.map((stage, idx) => {
                const log = stageLogMap.get(stage);
                const isCurrent = idx === visibleStages.length - 1;
                const airportCode = log?.airport_code ?? currentAirportCode ?? "—";
                const airportName =
                  airports[airportCode]?.name ?? airportCode;

                return (
                  <li key={stage} className="ml-6">
                    <span
                      className={`absolute -left-[13px] flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-background ${
                        isCurrent
                          ? "bg-primary text-primary-foreground"
                          : "bg-success text-success-foreground"
                      }`}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                    <div
                      className={`rounded-lg p-3 transition-colors ${
                        isCurrent ? "bg-primary/5 border border-primary/30" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <h4 className="font-heading font-semibold">
                          {STATUS_LOCATION_LABEL[stage]}
                        </h4>
                        {isCurrent && (
                          <Badge variant="default" className="bg-primary">
                            Current
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1 space-y-0.5">
                        <p className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-primary" />
                          {airportName} ({airportCode})
                        </p>
                        {log?.location && log.location !== STATUS_LOCATION_LABEL[stage] && (
                          <p className="text-xs ml-5">{log.location}</p>
                        )}
                        {log && (
                          <p className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-primary" />
                            {formatTimestamp(log.created_at)}
                          </p>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BaggageTimeline;
