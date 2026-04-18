import { useEffect, useState } from "react";
import { getBaggageByPNR, type BaggageRecord } from "@/data/baggageDatabase";
import BaggageTimeline from "@/components/BaggageTimeline";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Luggage, Loader2 } from "lucide-react";
import type { ScanStatus } from "@/data/baggageScan";

interface Props {
  pnrCode: string;
}

const BaggageTracker = ({ pnrCode }: Props) => {
  const [bags, setBags] = useState<BaggageRecord[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const data = await getBaggageByPNR(pnrCode);
      if (!mounted) return;
      setBags(data);
      if (data.length > 0) setSelectedTag(data[0].tag_number);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [pnrCode]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading baggage...
      </div>
    );
  }

  if (bags.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <Luggage className="h-8 w-8 mx-auto mb-2 opacity-50" />
          No baggage checked in for this PNR yet.
        </CardContent>
      </Card>
    );
  }

  const selected = bags.find((b) => b.tag_number === selectedTag) ?? bags[0];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-heading font-semibold text-lg mb-3 flex items-center gap-2">
          <Luggage className="h-5 w-5 text-primary" />
          Baggage Tracking ({bags.length})
        </h3>
        {bags.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {bags.map((bag) => (
              <Button
                key={bag.tag_number}
                variant={bag.tag_number === selectedTag ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTag(bag.tag_number)}
                className="font-heading"
              >
                {bag.tag_number}
              </Button>
            ))}
          </div>
        )}
      </div>

      <BaggageTimeline
        key={selected.tag_number}
        tagNumber={selected.tag_number}
        currentStatus={selected.status as ScanStatus}
        currentAirportCode={selected.airport_code ?? selected.current_location}
      />
    </div>
  );
};

export default BaggageTracker;
