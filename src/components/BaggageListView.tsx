import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
import { Badge } from "@/components/ui/badge";
import { Tag } from "lucide-react";
import type { BaggageRecord } from "@/data/baggageDatabase";

const statusColors: Record<string, string> = {
  checked_in: "bg-green-100 text-green-800",
  in_transit: "bg-blue-100 text-blue-800",
  arrived: "bg-purple-100 text-purple-800",
  collected: "bg-gray-100 text-gray-800",
  lost: "bg-red-100 text-red-800",
};

const statusLabels: Record<string, string> = {
  checked_in: "Checked In",
  in_transit: "In Transit",
  arrived: "Arrived",
  collected: "Collected",
  lost: "Lost",
};

function BagRow({ bag }: { bag: BaggageRecord }) {
  const barcodeRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (barcodeRef.current) {
      JsBarcode(barcodeRef.current, bag.tag_number, {
        format: "CODE128",
        width: 1.5,
        height: 40,
        displayValue: false,
        margin: 4,
      });
    }
  }, [bag.tag_number]);

  return (
    <div className="flex items-center gap-4 p-4 border border-border rounded-lg bg-card">
      <div className="flex-shrink-0">
        <svg ref={barcodeRef} className="h-10" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <Tag className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-heading font-bold text-sm text-foreground">
            {bag.tag_number}
          </span>
        </div>
        <p className="text-xs text-primary font-medium">
          {bag.bag_type.charAt(0).toUpperCase() + bag.bag_type.slice(1)} •{" "}
          {bag.weight} kg • {bag.current_location}
        </p>
      </div>
      <Badge
        className={`text-xs font-heading ${statusColors[bag.status] || "bg-muted text-muted-foreground"} hover:${statusColors[bag.status]?.split(" ")[0] || "bg-muted"}`}
      >
        {statusLabels[bag.status] || bag.status}
      </Badge>
    </div>
  );
}

interface BaggageListViewProps {
  bags: BaggageRecord[];
}

const BaggageListView = ({ bags }: BaggageListViewProps) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🧳</span>
          <h3 className="font-heading font-semibold text-foreground">
            Baggage Details
          </h3>
        </div>
        <Badge variant="outline" className="font-heading text-xs">
          {bags.length} bag{bags.length !== 1 ? "s" : ""}
        </Badge>
      </div>
      {bags.map((bag) => (
        <BagRow key={bag.id} bag={bag} />
      ))}
    </div>
  );
};

export default BaggageListView;
