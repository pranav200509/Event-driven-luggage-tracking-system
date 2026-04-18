import { useCallback, useEffect, useState } from "react";
import StaffHeader from "@/components/StaffHeader";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  MapPin,
  Package,
  ScanLine,
  Lock,
  Unlock,
  Clock,
} from "lucide-react";
import BarcodeScanner from "@/components/BarcodeScanner";
import BulkScanPanel from "@/components/BulkScanPanel";
import {
  WORK_LOCATIONS,
  WorkLocation,
  performScan,
  playBeep,
  STATUS_LABEL,
  ScanStatus,
  getLogsForTag,
  BaggageStatusLog,
} from "@/data/baggageScan";
import type { BaggageRecord } from "@/data/baggageDatabase";
import { toast } from "sonner";

const LOCATION_KEY = "skytrack.work_location";

const statusBadge: Record<string, string> = {
  checked_in: "bg-green-100 text-green-800",
  screening: "bg-amber-100 text-amber-800",
  sorting: "bg-orange-100 text-orange-800",
  loaded: "bg-blue-100 text-blue-800",
  arrived: "bg-purple-100 text-purple-800",
  collected: "bg-gray-100 text-gray-800",
  lost: "bg-red-100 text-red-800",
};

interface LastScan {
  bag: BaggageRecord;
  log: BaggageStatusLog;
}

const BaggagePage = () => {
  const { airportCode, user } = useAuth();

  const [location, setLocation] = useState<WorkLocation | null>(() => {
    const saved = localStorage.getItem(LOCATION_KEY);
    return (saved as WorkLocation) || null;
  });
  const [locked, setLocked] = useState<boolean>(() => !!localStorage.getItem(LOCATION_KEY));
  const [pendingLocation, setPendingLocation] = useState<WorkLocation | null>(location);

  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [scannerOn, setScannerOn] = useState(false);
  const [manualTag, setManualTag] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [lastScan, setLastScan] = useState<LastScan | null>(null);
  const [history, setHistory] = useState<BaggageStatusLog[]>([]);

  const lockLocation = () => {
    if (!pendingLocation) return;
    setLocation(pendingLocation);
    localStorage.setItem(LOCATION_KEY, pendingLocation);
    setLocked(true);
    setFeedback(null);
  };

  const changeLocation = () => {
    setLocked(false);
    setScannerOn(false);
  };

  const handleScan = useCallback(
    async (rawTag: string) => {
      if (busy) return;
      if (!location) {
        setFeedback({ type: "error", msg: "Select a working location first" });
        return;
      }
      if (!user || !airportCode) return;

      setBusy(true);
      setFeedback(null);
      const result = await performScan({
        rawTag,
        location,
        staffAirport: airportCode,
        staffUserId: user.id,
      });
      setBusy(false);

      if (result.success && result.bag && result.log) {
        playBeep();
        setFeedback({ type: "success", msg: result.message });
        setLastScan({ bag: result.bag, log: result.log });
        const logs = await getLogsForTag(result.bag.tag_number);
        setHistory(logs);
        toast.success(result.message);
      } else {
        setFeedback({ type: "error", msg: result.message });
        setLastScan(null);
        setHistory([]);
      }
    },
    [busy, location, user, airportCode]
  );

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tag = manualTag.trim().toUpperCase();
    if (!tag) {
      setFeedback({ type: "error", msg: "Enter a baggage tag" });
      return;
    }
    handleScan(tag);
    setManualTag("");
  };

  // Clear feedback after 4s
  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(t);
  }, [feedback]);

  return (
    <div className="min-h-screen bg-background">
      <StaffHeader />
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-heading">Baggage Update Module</h1>
          <p className="text-sm text-muted-foreground">
            Airport: <span className="font-medium text-foreground">{airportCode}</span>
          </p>
        </div>

        {/* Step 1: Working Location */}
        <Card className="border-sky-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-heading flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Working Location
              {locked && location && (
                <Badge className="ml-2 bg-primary/10 text-primary hover:bg-primary/10">
                  <Lock className="h-3 w-3 mr-1" /> Locked
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!locked ? (
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">
                    Select your station for this session
                  </Label>
                  <Select
                    value={pendingLocation ?? undefined}
                    onValueChange={(v) => setPendingLocation(v as WorkLocation)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Choose a working location" />
                    </SelectTrigger>
                    <SelectContent>
                      {WORK_LOCATIONS.map((loc) => (
                        <SelectItem key={loc} value={loc}>
                          {loc}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={lockLocation} disabled={!pendingLocation} className="w-full sm:w-auto">
                    <Lock className="h-4 w-4 mr-2" />
                    Lock Location
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-heading font-semibold">{location}</p>
                  <p className="text-xs text-muted-foreground">
                    Locked for session — all scans will be recorded here
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={changeLocation}>
                  <Unlock className="h-3.5 w-3.5 mr-1.5" /> Change
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 2: Scanner */}
        {locked && location && user && airportCode && (
          <Card className="border-sky-100">
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-heading flex items-center gap-2">
                <ScanLine className="h-4 w-4 text-primary" />
                Scan Baggage Tag
              </CardTitle>
              <div className="inline-flex rounded-md border border-border p-0.5 bg-muted/30">
                <button
                  type="button"
                  onClick={() => setMode("single")}
                  className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                    mode === "single"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Single Scan
                </button>
                <button
                  type="button"
                  onClick={() => setMode("bulk")}
                  className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                    mode === "bulk"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Bulk Scan
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {mode === "single" ? (
                <>
                  <BarcodeScanner
                    active={scannerOn}
                    onToggle={setScannerOn}
                    onDetected={handleScan}
                  />

                  <div className="relative flex items-center">
                    <div className="flex-1 border-t border-border" />
                    <span className="px-3 text-xs text-muted-foreground">OR</span>
                    <div className="flex-1 border-t border-border" />
                  </div>

                  <form onSubmit={handleManualSubmit} className="flex gap-2">
                    <Input
                      placeholder="Enter tag manually e.g. SKYBAG0001"
                      value={manualTag}
                      onChange={(e) => setManualTag(e.target.value.toUpperCase())}
                      disabled={busy}
                    />
                    <Button type="submit" disabled={busy || !manualTag.trim()}>
                      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit"}
                    </Button>
                  </form>

                  {feedback && (
                    <Alert
                      variant={feedback.type === "error" ? "destructive" : "default"}
                      className={
                        feedback.type === "success" ? "border-green-200 bg-green-50" : ""
                      }
                    >
                      {feedback.type === "success" ? (
                        <CheckCircle2 className="h-4 w-4 text-green-700" />
                      ) : (
                        <AlertCircle className="h-4 w-4" />
                      )}
                      <AlertDescription
                        className={feedback.type === "success" ? "text-green-800" : ""}
                      >
                        {feedback.msg}
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              ) : (
                <BulkScanPanel
                  location={location}
                  staffAirport={airportCode}
                  staffUserId={user.id}
                />
              )}
            </CardContent>
          </Card>
        )}

        {/* Hide single-scan last result while in bulk mode */}
        {mode === "single" && lastScan && (
          <Card className="border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-heading flex items-center gap-2">
                <Package className="h-4 w-4 text-green-700" />
                Last Scan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Tag</p>
                  <p className="font-heading font-bold">{lastScan.bag.tag_number}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge className={statusBadge[lastScan.bag.status] || "bg-muted"}>
                    {STATUS_LABEL[lastScan.bag.status as ScanStatus] || lastScan.bag.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="font-medium">{lastScan.log.location}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Airport</p>
                  <p className="font-medium">{lastScan.log.airport_code}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {new Date(lastScan.log.created_at).toLocaleString()}
              </div>

              {history.length > 1 && (
                <div className="pt-3 border-t border-border">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">
                    Scan history ({history.length})
                  </p>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {history.map((h) => (
                      <div
                        key={h.id}
                        className="flex items-center justify-between text-xs py-1.5 px-2 rounded bg-muted/40"
                      >
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={`${statusBadge[h.status]} border-0 text-[10px]`}
                          >
                            {STATUS_LABEL[h.status as ScanStatus] || h.status}
                          </Badge>
                          <span>{h.location}</span>
                          <span className="text-muted-foreground">@ {h.airport_code}</span>
                        </div>
                        <span className="text-muted-foreground">
                          {new Date(h.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default BaggagePage;
