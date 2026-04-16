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
  pnrCode?: string;
}

const BarcodeTag = ({
  tagNumber,
  passengerName,
  flightNumber,
  source,
  destination,
  bagType,
  weight,
  pnrCode,
}: BarcodeTagProps) => {
  const barcodeRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (barcodeRef.current) {
      JsBarcode(barcodeRef.current, tagNumber, {
        format: "CODE128",
        width: 2,
        height: 60,
        displayValue: true,
        fontSize: 13,
        font: "monospace",
        margin: 8,
      });
    }
  }, [tagNumber]);

  return (
    <div className="border border-border rounded-xl p-5 bg-card max-w-lg print:border-black print:bg-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-base font-heading font-bold text-foreground">SkyTrack</p>
          <p className="text-[11px] text-primary font-medium">Smart Luggage Tracking</p>
        </div>
        <div className="text-right">
          <p className="text-base font-heading font-bold text-foreground">{tagNumber}</p>
          <p className="text-[11px] text-primary font-medium uppercase">{bagType}</p>
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm mb-4">
        <div>
          <span className="text-muted-foreground text-xs">Passenger</span>
          <p className="font-heading font-semibold text-foreground">{passengerName}</p>
        </div>
        <div>
          <span className="text-muted-foreground text-xs">Flight</span>
          <p className="font-heading font-semibold text-foreground">{flightNumber}</p>
        </div>
        <div>
          <span className="text-muted-foreground text-xs">Route</span>
          <p className="font-heading font-semibold text-foreground">{source} → {destination}</p>
        </div>
        <div>
          <span className="text-muted-foreground text-xs">Weight</span>
          <p className="font-heading font-semibold text-foreground">{weight} kg</p>
        </div>
      </div>

      {/* Barcode */}
      <div className="bg-muted/30 rounded-lg flex justify-center py-2">
        <svg ref={barcodeRef} />
      </div>

      {/* Footer */}
      {pnrCode && (
        <p className="text-center text-xs text-muted-foreground mt-2 font-heading tracking-wide">
          {pnrCode} • {flightNumber}
        </p>
      )}
    </div>
  );
};

export default BarcodeTag;
