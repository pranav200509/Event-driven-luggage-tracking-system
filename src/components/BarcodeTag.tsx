import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

interface BarcodeTagProps {
  tagNumber: string;
  passengerName: string;
  flightNumber: string;
  source: string;
  destination: string;
  bagType: string;
  weight: number;
}

const BarcodeTag = ({
  tagNumber,
  passengerName,
  flightNumber,
  source,
  destination,
  bagType,
  weight,
}: BarcodeTagProps) => {
  const barcodeRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (barcodeRef.current) {
      JsBarcode(barcodeRef.current, tagNumber, {
        format: "CODE128",
        width: 2,
        height: 50,
        displayValue: true,
        fontSize: 14,
        font: "monospace",
        margin: 5,
      });
    }
  }, [tagNumber]);

  return (
    <div className="border border-border rounded-lg p-4 bg-card print:border-black print:bg-white">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-heading font-bold tracking-wider text-primary">
          SKY TRACK
        </span>
        <span className="text-xs font-heading font-semibold text-muted-foreground uppercase">
          {bagType}
        </span>
      </div>

      <div className="flex justify-center my-2">
        <svg ref={barcodeRef} />
      </div>

      <div className="grid grid-cols-2 gap-1 text-xs text-foreground">
        <div>
          <span className="text-muted-foreground">Passenger:</span>{" "}
          <span className="font-medium">{passengerName}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Flight:</span>{" "}
          <span className="font-medium">{flightNumber}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Route:</span>{" "}
          <span className="font-medium">
            {source} → {destination}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">Weight:</span>{" "}
          <span className="font-medium">{weight} kg</span>
        </div>
      </div>
    </div>
  );
};

export default BarcodeTag;
