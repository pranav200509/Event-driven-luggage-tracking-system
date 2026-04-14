import type { PNRRecord } from "@/data/pnrDatabase";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Plane,
  User,
  Phone,
  Mail,
  Calendar,
  Clock,
  MapPin,
  Luggage,
  Tag,
  Armchair,
} from "lucide-react";

const DetailRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
  <div className="flex items-center gap-3 py-2">
    <Icon className="h-4 w-4 text-primary shrink-0" />
    <span className="text-muted-foreground text-sm min-w-[120px]">{label}</span>
    <span className="font-medium text-sm">{value}</span>
  </div>
);

const PNRResult = ({ record }: { record: PNRRecord }) => {
  const isCheckedIn = record.checkInStatus === "Checked-in";

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm text-muted-foreground font-heading">PNR</p>
          <h3 className="text-2xl font-bold font-heading tracking-wide text-primary">{record.pnr}</h3>
        </div>
        <Badge
          variant={isCheckedIn ? "default" : "secondary"}
          className={isCheckedIn ? "bg-success text-success-foreground" : "bg-warning text-warning-foreground"}
        >
          {record.checkInStatus}
        </Badge>
      </div>

      {/* Route Visual */}
      <Card className="border-sky-200 bg-sky-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold font-heading">{record.sourceAirport}</p>
              <p className="text-sm text-muted-foreground">{record.sourceCity}</p>
            </div>
            <div className="flex-1 flex items-center gap-2">
              <div className="h-px flex-1 bg-sky-200" />
              <Plane className="h-5 w-5 text-primary" />
              <div className="h-px flex-1 bg-sky-200" />
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold font-heading">{record.destinationAirport}</p>
              <p className="text-sm text-muted-foreground">{record.destinationCity}</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-4 mt-3">
            <span className="text-sm text-muted-foreground">{record.flightNo} • {record.airline}</span>
          </div>
        </CardContent>
      </Card>

      {/* Details Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-5">
            <h4 className="font-heading font-semibold mb-3 text-sky-700">Passenger Info</h4>
            <DetailRow icon={User} label="Name" value={record.passengerName} />
            <DetailRow icon={User} label="Gender / Age" value={`${record.gender}, ${record.age} yrs`} />
            <DetailRow icon={Phone} label="Mobile" value={record.mobile} />
            <DetailRow icon={Mail} label="Email" value={record.email} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h4 className="font-heading font-semibold mb-3 text-sky-700">Flight Details</h4>
            <DetailRow icon={Calendar} label="Date" value={record.journeyDate} />
            <DetailRow icon={Clock} label="Departure" value={record.departureTime} />
            <DetailRow icon={Clock} label="Arrival" value={record.arrivalTime} />
            <DetailRow icon={Armchair} label="Seat / Class" value={`${record.seatNo} (${record.classType})`} />
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardContent className="p-5">
            <h4 className="font-heading font-semibold mb-3 text-sky-700">Baggage Info</h4>
            <div className="grid sm:grid-cols-3 gap-2">
              <DetailRow icon={Luggage} label="No. of Bags" value={String(record.numBags)} />
              <DetailRow
                icon={Tag}
                label="Baggage Tag"
                value={record.baggageTagId || "Not Assigned"}
              />
              <DetailRow icon={MapPin} label="Route" value={`${record.sourceAirport} → ${record.destinationAirport}`} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PNRResult;
