import { useState } from "react";
import { lookupPNR, type PNRRecord } from "@/data/pnrDatabase";
import PNRSearch from "@/components/PNRSearch";
import PNRResult from "@/components/PNRResult";
import PNRTable from "@/components/PNRTable";
import { Plane, Database, Search, Luggage } from "lucide-react";

const Index = () => {
  const [result, setResult] = useState<PNRRecord | null | undefined>(undefined);
  const [searchedPnr, setSearchedPnr] = useState("");

  const handleResult = (record: PNRRecord | null, pnr: string) => {
    setResult(record);
    setSearchedPnr(pnr);
  };

  const handleTableSelect = (pnr: string) => {
    const record = lookupPNR(pnr);
    setResult(record || null);
    setSearchedPnr(pnr);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-sky-900 via-sky-700 to-primary py-20 px-4">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDJ2LTJoMzR6bTAtMzBWMkgydjJoMzR6TTIgMzR2MmgzNHYtMkgyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-2xl bg-accent/20 backdrop-blur-sm">
              <Plane className="h-8 w-8 text-sky-100" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold font-heading text-sky-50 mb-3 tracking-tight">
            SKY TRACK
          </h1>
          <p className="text-sky-200 text-lg mb-10 max-w-md mx-auto">
            Smart Flight Passenger & Luggage Tracking
          </p>
          <PNRSearch onResult={handleResult} />
        </div>
      </section>

      {/* Result / Error Section */}
      {result !== undefined && (
        <section className="py-12 px-4">
          <div className="max-w-4xl mx-auto">
            {result ? (
              <PNRResult record={result} />
            ) : (
              <div className="text-center py-12 animate-in fade-in duration-300">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-heading font-semibold mb-2">No Record Found</h3>
                <p className="text-muted-foreground">
                  PNR <span className="font-heading font-semibold text-primary">{searchedPnr}</span> does not exist in the demo database.
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Stats */}
      <section className="py-12 px-4 bg-sky-50">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: Database, label: "PNR Records", value: "12" },
            { icon: Plane, label: "Airlines", value: "4" },
            { icon: Luggage, label: "Bags Tracked", value: "21" },
            { icon: Search, label: "Airports", value: "10" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <stat.icon className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold font-heading">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Database Table */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold font-heading mb-2">Demo PNR Database</h2>
            <p className="text-muted-foreground">Click any row to view full details</p>
          </div>
          <PNRTable onSelect={handleTableSelect} />
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-4 border-t border-sky-100 text-center">
        <p className="text-sm text-muted-foreground font-heading">
          SkyTrack — College Project Demo • Indian Routes & Passengers
        </p>
      </footer>
    </div>
  );
};

export default Index;
