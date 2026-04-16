import { useState, useCallback, useEffect } from "react";
import StaffHeader from "@/components/StaffHeader";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Search,
  Loader2,
  RefreshCw,
  AlertTriangle,
  User,
  PlaneTakeoff,
  MapPin,
  Calendar,
  X,
  CheckCircle,
} from "lucide-react";
import { lookupPNR, type PNRRecord } from "@/data/pnrDatabase";
import {
  createBaggageForPNR,
  getBaggageByPNR,
  type BagInput,
  type BaggageRecord,
} from "@/data/baggageDatabase";
import AddBaggageForm from "@/components/AddBaggageForm";
import BaggageTagList from "@/components/BaggageTagList";
import BaggageListView from "@/components/BaggageListView";
import { toast } from "@/hooks/use-toast";

type Step = 1 | 2 | 3;

const stepLabels = ["PNR Verify", "Add Bags", "Print Tags"];

const CheckinPage = () => {
  const { airportCode } = useAuth();
  const [pnrInput, setPnrInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [record, setRecord] = useState<PNRRecord | null>(null);
  const [searched, setSearched] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [bags, setBags] = useState<BaggageRecord[]>([]);

  const airportMatch = record ? record.source_airport === airportCode : null;

  // Fetch existing bags when record changes
  useEffect(() => {
    if (record) {
      getBaggageByPNR(record.pnr_code).then(setBags);
    } else {
      setBags([]);
    }
  }, [record]);

  const handleVerify = useCallback(async () => {
    const code = pnrInput.trim().toUpperCase();
    if (!code) {
      toast({ title: "Enter PNR code", variant: "destructive" });
      return;
    }
    setLoading(true);
    setSearched(false);
    try {
      const result = await lookupPNR(code);
      setRecord(result);
      setSearched(true);
      if (result) {
        if (
          result.source_airport === airportCode &&
          result.checkin_status === "not_checked_in"
        ) {
          setCurrentStep(2);
        } else if (result.checkin_status === "checked_in") {
          setCurrentStep(3);
        } else {
          setCurrentStep(1);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [pnrInput, airportCode]);

  const handleClear = () => {
    setPnrInput("");
    setRecord(null);
    setSearched(false);
    setCurrentStep(1);
    setBags([]);
  };

  const handleRefresh = async () => {
    if (!record) return;
    setLoading(true);
    try {
      const result = await lookupPNR(record.pnr_code);
      setRecord(result);
      if (result) {
        const freshBags = await getBaggageByPNR(result.pnr_code);
        setBags(freshBags);
      }
      toast({ title: "Data refreshed" });
    } finally {
      setLoading(false);
    }
  };

  const handleBaggageSubmit = async (bagInputs: BagInput[]) => {
    if (!record || !airportCode) return;
    const result = await createBaggageForPNR(
      record.pnr_code,
      bagInputs,
      airportCode
    );
    if (result.success) {
      setBags(result.records);
      // Re-fetch PNR to get updated checkin_status
      const updated = await lookupPNR(record.pnr_code);
      setRecord(updated);
      setCurrentStep(3);
      toast({
        title: "Check-in completed successfully",
        description: `${result.records.length} baggage tag${result.records.length > 1 ? "s" : ""} generated`,
      });
    } else {
      toast({
        title: "Error creating baggage",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <StaffHeader />
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold font-heading">
              Baggage Check-in
            </h1>
            <p className="text-sm text-muted-foreground">
              Register baggage and generate tags for passengers
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 font-heading"
            onClick={handleRefresh}
            disabled={!record || loading}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-0 mb-6">
          {stepLabels.map((label, i) => {
            const step = (i + 1) as Step;
            const active = currentStep >= step;
            return (
              <div key={label} className="flex items-center">
                <Badge
                  className={`text-xs font-heading px-3 py-1 ${
                    active
                      ? "bg-primary text-primary-foreground hover:bg-primary"
                      : "bg-muted text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {step}. {label}
                </Badge>
                {i < stepLabels.length - 1 && (
                  <div
                    className={`w-8 h-0.5 ${
                      currentStep > step ? "bg-primary" : "bg-border"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* PNR Verification Card */}
        <Card className="border-sky-100 mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Search className="h-5 w-5 text-foreground" />
              <h2 className="text-lg font-heading font-semibold">
                PNR Verification
              </h2>
            </div>

            <div className="flex gap-3">
              <div className="relative flex-1">
                <Input
                  placeholder="Enter PNR Code (e.g. SKYIND001)"
                  value={pnrInput}
                  onChange={(e) => setPnrInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                  className="h-11 text-sm font-heading tracking-wide border-sky-200 focus-visible:ring-primary pr-8"
                  disabled={loading}
                />
                {pnrInput && (
                  <button
                    onClick={handleClear}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Button
                onClick={handleVerify}
                className="h-11 px-6 bg-primary hover:bg-primary/90 font-heading"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Verify"
                )}
              </Button>
            </div>

            {/* PNR not found */}
            {searched && !record && (
              <p className="mt-4 text-sm text-destructive font-medium">
                PNR not found. Please check the code and try again.
              </p>
            )}

            {/* Passenger Details */}
            {record && (
              <div className="mt-4 rounded-lg border border-sky-100 p-4">
                <div className="flex items-center justify-between mb-3">
                  <Badge
                    variant="secondary"
                    className="font-heading font-semibold text-xs"
                  >
                    {record.pnr_code}
                  </Badge>
                  <Badge
                    className={`text-xs ${
                      record.checkin_status === "checked_in"
                        ? "bg-green-100 text-green-800 hover:bg-green-100"
                        : "bg-muted text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {record.checkin_status === "checked_in"
                      ? "Checked In"
                      : "Not Checked In"}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-y-2 gap-x-8 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{record.passenger_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <PlaneTakeoff className="h-4 w-4 text-muted-foreground" />
                    <span>{record.flight_number}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {record.source_airport} → {record.destination_airport}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {new Date(record.journey_date).toLocaleDateString(
                        "en-IN",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }
                      )}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Airport mismatch warning */}
        {record && airportMatch === false && (
          <Alert
            variant="destructive"
            className="mb-6 border-destructive/30 bg-destructive/5"
          >
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="font-heading text-sm">
              Check-in Not Allowed
            </AlertTitle>
            <AlertDescription className="text-xs">
              Passenger departure airport is{" "}
              <strong>{record.source_airport}</strong>. You are assigned to{" "}
              <strong>{airportCode}</strong>. Please perform check-in at the
              correct location.
            </AlertDescription>
          </Alert>
        )}

        {/* Already checked in — show existing tags */}
        {record &&
          airportMatch === true &&
          record.checkin_status === "checked_in" && (
            <Card className="border-green-200 bg-green-50/50 mb-6">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <h3 className="font-heading font-semibold text-green-800">
                    Already Checked In
                  </h3>
                </div>
                {bags.length > 0 ? (
                  <BaggageTagList
                    bags={bags}
                    passengerName={record.passenger_name}
                    flightNumber={record.flight_number}
                    source={record.source_airport}
                    destination={record.destination_airport}
                  />
                ) : (
                  <p className="text-sm text-green-700">
                    This passenger has already been checked in.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

        {/* Add Baggage form — only when not checked in and airport matches */}
        {record &&
          airportMatch === true &&
          record.checkin_status === "not_checked_in" && (
            <Card className="border-sky-100 mb-6">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">🧳</span>
                  <h2 className="text-lg font-heading font-semibold">
                    Add Baggage
                  </h2>
                </div>
                <AddBaggageForm onSubmit={handleBaggageSubmit} />
              </CardContent>
            </Card>
          )}

        {/* Print Tags step — shown after successful creation */}
        {currentStep === 3 &&
          record &&
          bags.length > 0 &&
          record.checkin_status === "checked_in" &&
          airportMatch !== false && (
            <Card className="border-sky-100 mb-6">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">🏷️</span>
                  <h2 className="text-lg font-heading font-semibold">
                    Baggage Tags
                  </h2>
                </div>
                <BaggageTagList
                  bags={bags}
                  passengerName={record.passenger_name}
                  flightNumber={record.flight_number}
                  source={record.source_airport}
                  destination={record.destination_airport}
                />
              </CardContent>
            </Card>
          )}
      </main>
    </div>
  );
};

export default CheckinPage;
