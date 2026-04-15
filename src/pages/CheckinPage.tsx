import StaffHeader from "@/components/StaffHeader";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

const CheckinPage = () => {
  const { airportCode } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <StaffHeader />
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold font-heading">Check-in Module</h1>
          <p className="text-sm text-muted-foreground">Airport: {airportCode}</p>
        </div>
        <Card className="border-sky-100">
          <CardContent className="p-12 text-center">
            <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-heading font-semibold mb-1">Check-in Module</h3>
            <p className="text-sm text-muted-foreground">This module will be implemented in Step 3.</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CheckinPage;
