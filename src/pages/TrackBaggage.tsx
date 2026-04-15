import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { lookupPNR, type PNRRecord } from "@/data/pnrDatabase";
import PNRSearch from "@/components/PNRSearch";
import PNRResult from "@/components/PNRResult";
import { Search } from "lucide-react";

const TrackBaggage = () => {
  const navigate = useNavigate();
  const [result, setResult] = useState<PNRRecord | null | undefined>(undefined);
  const [searchedPnr, setSearchedPnr] = useState("");

  const handleResult = (record: PNRRecord | null, pnr: string) => {
    setResult(record);
    setSearchedPnr(pnr);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-sm text-foreground hover:text-primary mb-8 font-heading"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold font-heading mb-2">Track Your Baggage</h1>
          <p className="text-muted-foreground">Enter your PNR to check passenger and flight details</p>
        </div>

        <PNRSearch onResult={handleResult} />

        {result !== undefined && (
          <div className="mt-10">
            {result ? (
              <PNRResult record={result} />
            ) : (
              <div className="text-center py-12 animate-in fade-in duration-300">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-heading font-semibold mb-2">No Record Found</h3>
                <p className="text-muted-foreground">
                  PNR <span className="font-heading font-semibold text-primary">{searchedPnr}</span> does not exist in the database.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackBaggage;
