import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plane, Luggage, Search, Loader2 } from "lucide-react";
import { lookupPNR, type PNRRecord } from "@/data/pnrDatabase";
import PNRResult from "@/components/PNRResult";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const TrackBaggage = () => {
  const navigate = useNavigate();
  const [pnr, setPnr] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PNRRecord | null | undefined>(undefined);
  const [searchedPnr, setSearchedPnr] = useState("");

  const handleSearch = async () => {
    if (!pnr.trim()) return;
    setLoading(true);
    try {
      const record = await lookupPNR(pnr);
      setResult(record);
      setSearchedPnr(pnr);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-sky-50/40 to-background">
      {/* Header bar */}
      <header className="border-b bg-background/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
              <Plane className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <p className="font-heading font-bold text-lg">SkyTrack</p>
              <p className="text-xs text-muted-foreground">Smart Luggage Tracking</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-sm font-heading text-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        {/* Search Card */}
        <Card className="shadow-sm border-border/60">
          <CardContent className="p-8 md:p-10">
            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-5">
                <Luggage className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold font-heading mb-2">
                Track Your Baggage
              </h1>
              <p className="text-muted-foreground mb-8">
                Enter your PNR code to track your luggage in real-time
              </p>

              <div className="w-full space-y-3">
                <Input
                  placeholder="PNR Code (e.g., SKYIND001)"
                  value={pnr}
                  onChange={(e) => setPnr(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="h-12 text-base font-heading tracking-wide text-center bg-muted/30"
                  disabled={loading}
                />
                <Button
                  onClick={handleSearch}
                  disabled={loading || !pnr.trim()}
                  className="w-full h-12 font-heading text-base gap-2"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Search className="h-4 w-4" />
                      Track Baggage
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Result */}
        {result !== undefined && (
          <div className="mt-8">
            {result ? (
              <PNRResult record={result} />
            ) : (
              <Card className="animate-in fade-in duration-300">
                <CardContent className="p-10 text-center">
                  <Search className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <h3 className="text-xl font-heading font-semibold mb-1">
                    No Record Found
                  </h3>
                  <p className="text-muted-foreground">
                    PNR{" "}
                    <span className="font-heading font-semibold text-primary">
                      {searchedPnr}
                    </span>{" "}
                    does not exist in our system.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default TrackBaggage;
