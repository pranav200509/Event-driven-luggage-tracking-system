import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import BarcodeTag from "@/components/BarcodeTag";
import type { BaggageRecord } from "@/data/baggageDatabase";

interface BaggageTagListProps {
  bags: BaggageRecord[];
  passengerName: string;
  flightNumber: string;
  source: string;
  destination: string;
  pnrCode?: string;
}

const BaggageTagList = ({
  bags,
  passengerName,
  flightNumber,
  source,
  destination,
  pnrCode,
}: BaggageTagListProps) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {bags.length} bag{bags.length > 1 ? "s" : ""} tagged
        </p>
        <Button
          variant="default"
          size="sm"
          className="gap-1.5 font-heading bg-primary hover:bg-primary/90"
          onClick={handlePrint}
        >
          <Printer className="h-3.5 w-3.5" />
          Print All Tags
        </Button>
      </div>

      <div className="grid gap-4 print:grid-cols-1">
        {bags.map((bag) => (
          <BarcodeTag
            key={bag.id}
            tagNumber={bag.tag_number}
            passengerName={passengerName}
            flightNumber={flightNumber}
            source={source}
            destination={destination}
            bagType={bag.bag_type}
            weight={bag.weight}
            pnrCode={pnrCode}
          />
        ))}
      </div>
    </div>
  );
};

export default BaggageTagList;
