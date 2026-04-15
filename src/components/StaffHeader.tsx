import { useNavigate } from "react-router-dom";
import { Plane, LogOut, ClipboardList, CheckCircle, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth, getRoleLabel } from "@/hooks/useAuth";

const StaffHeader = () => {
  const navigate = useNavigate();
  const { fullName, role, airportCode, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="border-b bg-card">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary text-primary-foreground">
              <Plane className="h-4 w-4" />
            </div>
            <div>
              <span className="font-heading font-bold text-sm">SkyTrack</span>
              <p className="text-[10px] text-muted-foreground leading-none">Smart Luggage Tracking</p>
            </div>
          </div>

          {role === "admin" && (
            <nav className="hidden md:flex items-center gap-1 text-sm">
              <Button
                variant="ghost"
                size="sm"
                className="font-heading gap-1.5 text-xs"
                onClick={() => navigate("/admin")}
              >
                <ClipboardList className="h-3.5 w-3.5" />
                Dashboard
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="font-heading gap-1.5 text-xs text-muted-foreground"
                onClick={() => navigate("/checkin")}
              >
                <CheckCircle className="h-3.5 w-3.5" />
                Check-in
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="font-heading gap-1.5 text-xs text-muted-foreground"
                onClick={() => navigate("/baggage")}
              >
                <Package className="h-3.5 w-3.5" />
                Baggage
              </Button>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-medium">{fullName}</p>
            <p className="text-[10px] text-muted-foreground">
              {getRoleLabel(role)} | {airportCode}
            </p>
          </div>
          <Badge variant="secondary" className="text-xs">{airportCode}</Badge>
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-1.5 text-xs">
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  );
};

export default StaffHeader;
