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
}

const BaggageTagList = ({
  bags,
  passengerName,
  flightNumber,
  source,
  destination,
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
          variant="outline"
          size="sm"
          className="gap-1.5 font-heading"
          onClick={handlePrint}
        >
          <Printer className="h-3.5 w-3.5" />
          Reprint Tags
        </Button>
      </div>

      <div className="grid gap-3 print:grid-cols-1">
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
          />
        ))}
      </div>
    </div>
  );
};

export default BaggageTagList;
