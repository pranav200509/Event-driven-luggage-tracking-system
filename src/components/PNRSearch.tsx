import { useState } from "react";
import { lookupPNR, type PNRRecord } from "@/data/pnrDatabase";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const PNRSearch = ({ onResult }: { onResult: (record: PNRRecord | null, pnr: string) => void }) => {
  const [pnr, setPnr] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!pnr.trim()) return;
    setLoading(true);
    try {
      const result = await lookupPNR(pnr);
      onResult(result, pnr);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-3 w-full max-w-lg mx-auto">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Enter PNR (e.g. SKYIND001)"
          value={pnr}
          onChange={(e) => setPnr(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="pl-10 h-12 text-base font-heading tracking-wide border-sky-200 focus-visible:ring-primary"
          disabled={loading}
        />
      </div>
      <Button onClick={handleSearch} className="h-12 px-6 bg-primary hover:bg-sky-600 font-heading" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Track"}
      </Button>
    </div>
  );
};

export default PNRSearch;
