import { useCallback, useEffect, useRef, useState } from "react";
import BarcodeScanner from "@/components/BarcodeScanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  XCircle,
  Pause,
  Play,
  Square,
  Loader2,
  Package,
} from "lucide-react";
import {
  performScan,
  playBeep,
  STATUS_LABEL,
  ScanStatus,
  WorkLocation,
} from "@/data/baggageScan";
import { toast } from "sonner";

interface SuccessItem {
  id: string;
  tag: string;
  status: ScanStatus;
  location: string;
  airport: string;
  ts: string;
}
interface FailItem {
  id: string;
  tag: string;
  reason: string;
  ts: string;
}

interface Props {
  location: WorkLocation;
  staffAirport: string;
  staffUserId: string;
}

const BulkScanPanel = ({ location, staffAirport, staffUserId }: Props) => {
  const [scannerOn, setScannerOn] = useState(false);
  const [paused, setPaused] = useState(false);
  const [stopped, setStopped] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [manualTag, setManualTag] = useState("");

  const [successList, setSuccessList] = useState<SuccessItem[]>([]);
  const [failList, setFailList] = useState<FailItem[]>([]);

  // Buffer to prevent duplicate processing within the session
  const processedRef = useRef<Set<string>>(new Set());
  const inFlightRef = useRef<Set<string>>(new Set());
  const queueRef = useRef<string[]>([]);
  const draining = useRef(false);
  const pausedRef = useRef(paused);
  const stoppedRef = useRef(stopped);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);
  useEffect(() => {
    stoppedRef.current = stopped;
  }, [stopped]);

  const drainQueue = useCallback(async () => {
    if (draining.current) return;
    draining.current = true;
    try {
      while (queueRef.current.length > 0) {
        if (stoppedRef.current) {
          queueRef.current = [];
          break;
        }
        if (pausedRef.current) {
          await new Promise((r) => setTimeout(r, 200));
          continue;
        }
        const tag = queueRef.current.shift()!;
        setProcessing(true);
        try {
          const result = await performScan({
            rawTag: tag,
            location,
            staffAirport,
            staffUserId,
            method: "bulk_scan",
          });
          const ts = new Date().toISOString();
          if (result.success && result.bag && result.log) {
            playBeep();
            setSuccessList((prev) => [
              {
                id: result.log!.id,
                tag: result.bag!.tag_number,
                status: result.bag!.status as ScanStatus,
                location: result.log!.location,
                airport: result.log!.airport_code,
                ts: result.log!.created_at,
              },
              ...prev,
            ]);
          } else {
            setFailList((prev) => [
              {
                id: `${tag}-${ts}`,
                tag,
                reason: result.message,
                ts,
              },
              ...prev,
            ]);
          }
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Unknown error";
          setFailList((prev) => [
            { id: `${tag}-${Date.now()}`, tag, reason: msg, ts: new Date().toISOString() },
            ...prev,
          ]);
        } finally {
          inFlightRef.current.delete(tag);
        }
      }
    } finally {
      setProcessing(false);
      draining.current = false;
    }
  }, [location, staffAirport, staffUserId]);

  const enqueue = useCallback(
    (rawTag: string) => {
      const tag = rawTag.trim().toUpperCase();
      if (!tag) return;
      if (stoppedRef.current) return;
      // Session-level dedupe: don't reprocess same tag in same session
      if (processedRef.current.has(tag)) return;
      if (inFlightRef.current.has(tag)) return;
      processedRef.current.add(tag);
      inFlightRef.current.add(tag);
      queueRef.current.push(tag);
      drainQueue();
    },
    [drainQueue]
  );

  const handleManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTag.trim()) return;
    enqueue(manualTag);
    setManualTag("");
  };

  const handleStop = () => {
    setStopped(true);
    setScannerOn(false);
    queueRef.current = [];
    toast.info("Bulk scan session stopped");
  };

  const handleReset = () => {
    setStopped(false);
    setPaused(false);
    setSuccessList([]);
    setFailList([]);
    processedRef.current.clear();
    inFlightRef.current.clear();
    queueRef.current = [];
  };

  const total = successList.length + failList.length;

  return (
    <div className="space-y-4">
      {/* Counters */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-border p-3 bg-muted/30">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-2xl font-bold font-heading">{total}</p>
        </div>
        <div className="rounded-lg border border-green-200 p-3 bg-green-50">
          <p className="text-xs text-green-700">Success</p>
          <p className="text-2xl font-bold font-heading text-green-800">
            {successList.length}
          </p>
        </div>
        <div className="rounded-lg border border-red-200 p-3 bg-red-50">
          <p className="text-xs text-red-700">Failed</p>
          <p className="text-2xl font-bold font-heading text-red-800">
            {failList.length}
          </p>
        </div>
      </div>

      {/* Scanner */}
      {!stopped && (
        <BarcodeScanner active={scannerOn} onToggle={setScannerOn} onDetected={enqueue} />
      )}

      {/* Controls */}
      <div className="flex flex-wrap gap-2">
        {!stopped ? (
          <>
            {!paused ? (
              <Button variant="secondary" size="sm" onClick={() => setPaused(true)}>
                <Pause className="h-4 w-4 mr-1.5" /> Pause
              </Button>
            ) : (
              <Button size="sm" onClick={() => setPaused(false)}>
                <Play className="h-4 w-4 mr-1.5" /> Resume
              </Button>
            )}
            <Button variant="destructive" size="sm" onClick={handleStop}>
              <Square className="h-4 w-4 mr-1.5" /> Stop Session
            </Button>
          </>
        ) : (
          <Button size="sm" onClick={handleReset}>
            New Session
          </Button>
        )}
        {processing && (
          <span className="inline-flex items-center text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Processing…
          </span>
        )}
        {paused && (
          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Paused</Badge>
        )}
      </div>

      {/* Manual entry */}
      {!stopped && (
        <form onSubmit={handleManual} className="flex gap-2">
          <Input
            placeholder="Manual tag e.g. SKYBAG0001"
            value={manualTag}
            onChange={(e) => setManualTag(e.target.value.toUpperCase())}
          />
          <Button type="submit" disabled={!manualTag.trim()}>
            Add
          </Button>
        </form>
      )}

      {/* Session summary when stopped */}
      {stopped && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
          <p className="font-heading font-semibold mb-1">Session Summary</p>
          <p className="text-sm text-muted-foreground">
            Total: <span className="font-medium text-foreground">{total}</span> · Success:{" "}
            <span className="font-medium text-green-700">{successList.length}</span> · Failed:{" "}
            <span className="font-medium text-red-700">{failList.length}</span>
          </p>
        </div>
      )}

      {/* Lists */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-green-200 bg-green-50/50">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-700" />
            <p className="font-heading font-semibold text-sm text-green-800">
              Scanned ({successList.length})
            </p>
          </div>
          <div className="max-h-72 overflow-y-auto divide-y divide-green-100">
            {successList.length === 0 ? (
              <p className="text-xs text-muted-foreground p-3">No scans yet</p>
            ) : (
              successList.map((s) => (
                <div key={s.id} className="px-3 py-2 text-xs animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="font-heading font-bold flex items-center gap-1.5">
                      <Package className="h-3 w-3" /> {s.tag}
                    </span>
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-0 text-[10px]">
                      {STATUS_LABEL[s.status]}
                    </Badge>
                  </div>
                  <div className="text-muted-foreground mt-0.5">
                    {s.location} @ {s.airport} ·{" "}
                    {new Date(s.ts).toLocaleTimeString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-lg border border-red-200 bg-red-50/50">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-red-200">
            <XCircle className="h-4 w-4 text-red-700" />
            <p className="font-heading font-semibold text-sm text-red-800">
              Failed ({failList.length})
            </p>
          </div>
          <div className="max-h-72 overflow-y-auto divide-y divide-red-100">
            {failList.length === 0 ? (
              <p className="text-xs text-muted-foreground p-3">No failures</p>
            ) : (
              failList.map((f) => (
                <div key={f.id} className="px-3 py-2 text-xs animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="font-heading font-bold">{f.tag}</span>
                    <span className="text-muted-foreground">
                      {new Date(f.ts).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-red-700 mt-0.5">{f.reason}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkScanPanel;
