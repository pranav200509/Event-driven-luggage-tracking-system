import { getAllPNRs, type PNRRecord } from "@/data/pnrDatabase";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PNRTable = ({ onSelect }: { onSelect: (pnr: string) => void }) => {
  const records = getAllPNRs();

  return (
    <div className="w-full overflow-auto rounded-lg border border-sky-200">
      <Table>
        <TableHeader>
          <TableRow className="bg-sky-50 hover:bg-sky-50">
            <TableHead className="font-heading text-sky-700">PNR</TableHead>
            <TableHead className="font-heading text-sky-700">Passenger</TableHead>
            <TableHead className="font-heading text-sky-700">Flight</TableHead>
            <TableHead className="font-heading text-sky-700">Route</TableHead>
            <TableHead className="font-heading text-sky-700">Date</TableHead>
            <TableHead className="font-heading text-sky-700">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((r) => (
            <TableRow
              key={r.pnr}
              className="cursor-pointer hover:bg-sky-50/50 transition-colors"
              onClick={() => onSelect(r.pnr)}
            >
              <TableCell className="font-heading font-semibold text-primary">{r.pnr}</TableCell>
              <TableCell>{r.passengerName}</TableCell>
              <TableCell className="text-muted-foreground">{r.flightNo}</TableCell>
              <TableCell>{r.sourceAirport} → {r.destinationAirport}</TableCell>
              <TableCell className="text-muted-foreground">{r.journeyDate}</TableCell>
              <TableCell>
                <Badge
                  variant={r.checkInStatus === "Checked-in" ? "default" : "secondary"}
                  className={r.checkInStatus === "Checked-in" ? "bg-success text-success-foreground" : "bg-warning text-warning-foreground"}
                >
                  {r.checkInStatus}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default PNRTable;
