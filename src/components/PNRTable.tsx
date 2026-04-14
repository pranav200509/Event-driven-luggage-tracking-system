import { useEffect, useState } from "react";
import { getAllPNRs, type PNRRecord } from "@/data/pnrDatabase";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PNRTable = ({ onSelect }: { onSelect: (pnr: string) => void }) => {
  const [records, setRecords] = useState<PNRRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllPNRs().then((data) => {
      setRecords(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
              key={r.pnr_code}
              className="cursor-pointer hover:bg-sky-50/50 transition-colors"
              onClick={() => onSelect(r.pnr_code)}
            >
              <TableCell className="font-heading font-semibold text-primary">{r.pnr_code}</TableCell>
              <TableCell>{r.passenger_name}</TableCell>
              <TableCell className="text-muted-foreground">{r.flight_number}</TableCell>
              <TableCell>{r.source_airport} → {r.destination_airport}</TableCell>
              <TableCell className="text-muted-foreground">{r.journey_date}</TableCell>
              <TableCell>
                <Badge
                  variant={r.checkin_status === "checked_in" ? "default" : "secondary"}
                  className={r.checkin_status === "checked_in" ? "bg-success text-success-foreground" : "bg-warning text-warning-foreground"}
                >
                  {r.checkin_status === "checked_in" ? "Checked-in" : "Not Checked-in"}
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
