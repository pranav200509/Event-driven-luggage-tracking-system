import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getAllPNRs, type PNRRecord } from "@/data/pnrDatabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Plane, ClipboardList, CheckCircle, Clock, RefreshCw, Search,
  Loader2, LogOut, Pencil, Trash2, Plus,
} from "lucide-react";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState<PNRRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [activeTab, setActiveTab] = useState<"pnr" | "staff">("pnr");

  const loadData = async () => {
    setLoading(true);
    const data = await getAllPNRs();
    setRecords(data);
    setLoading(false);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/staff-login");
      } else {
        setUserEmail(session.user.email || "");
        loadData();
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) navigate("/staff-login");
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const filteredRecords = records.filter((r) => {
    const q = searchQuery.toLowerCase();
    return (
      r.pnr_code.toLowerCase().includes(q) ||
      r.passenger_name.toLowerCase().includes(q) ||
      r.flight_number.toLowerCase().includes(q) ||
      r.source_airport.toLowerCase().includes(q) ||
      r.destination_airport.toLowerCase().includes(q)
    );
  });

  const checkedInCount = records.filter((r) => r.checkin_status === "checked_in").length;
  const pendingCount = records.length - checkedInCount;

  return (
    <div className="min-h-screen bg-background">
      {/* Top Nav */}
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
            <nav className="flex items-center gap-1 text-sm">
              <Button variant="ghost" size="sm" className="font-heading gap-1.5 text-xs">
                <ClipboardList className="h-3.5 w-3.5" />
                Dashboard
              </Button>
              <Button variant="ghost" size="sm" className="font-heading gap-1.5 text-xs text-muted-foreground">
                <CheckCircle className="h-3.5 w-3.5" />
                Check-in
              </Button>
              <Button variant="ghost" size="sm" className="font-heading gap-1.5 text-xs text-muted-foreground">
                <Plane className="h-3.5 w-3.5" />
                Baggage
              </Button>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">{userEmail}</span>
            <Badge variant="secondary" className="text-xs">Admin</Badge>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-1.5 text-xs">
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Title */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold font-heading">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Manage PNR records and staff members</p>
          </div>
          <Button variant="outline" size="sm" onClick={loadData} className="gap-1.5 font-heading text-xs">
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="border-sky-100">
            <CardContent className="p-5 flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Records</p>
                <p className="text-3xl font-bold font-heading mt-1">{records.length}</p>
                <p className="text-xs text-muted-foreground">PNR records in database</p>
              </div>
              <ClipboardList className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
          <Card className="border-sky-100">
            <CardContent className="p-5 flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Checked In</p>
                <p className="text-3xl font-bold font-heading mt-1 text-primary">{checkedInCount}</p>
                <p className="text-xs text-muted-foreground">Passengers checked in</p>
              </div>
              <CheckCircle className="h-5 w-5 text-primary" />
            </CardContent>
          </Card>
          <Card className="border-sky-100">
            <CardContent className="p-5 flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Check-in</p>
                <p className="text-3xl font-bold font-heading mt-1 text-warning">{pendingCount}</p>
                <p className="text-xs text-muted-foreground">Awaiting check-in</p>
              </div>
              <Clock className="h-5 w-5 text-warning" />
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-4 mb-4 border-b">
          <button
            onClick={() => setActiveTab("pnr")}
            className={`pb-2 text-sm font-heading font-medium border-b-2 transition-colors ${
              activeTab === "pnr"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            PNR Records
          </button>
          <button
            onClick={() => setActiveTab("staff")}
            className={`pb-2 text-sm font-heading font-medium border-b-2 transition-colors ${
              activeTab === "staff"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Staff Management
          </button>
        </div>

        {activeTab === "pnr" && (
          <>
            {/* Add + Search */}
            <div className="flex items-center justify-between mb-4">
              <div />
              <Button size="sm" className="gap-1.5 font-heading bg-primary hover:bg-primary/90">
                <Plus className="h-3.5 w-3.5" />
                Add PNR Record
              </Button>
            </div>

            <Card className="border-sky-100">
              <CardContent className="p-6">
                <div className="mb-4">
                  <h3 className="font-heading font-semibold text-lg">PNR Records</h3>
                  <p className="text-sm text-muted-foreground">View and manage all passenger name records</p>
                </div>

                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by PNR, name, flight, or route..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="overflow-auto rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="font-heading text-xs">PNR Code</TableHead>
                          <TableHead className="font-heading text-xs">Passenger</TableHead>
                          <TableHead className="font-heading text-xs">Flight</TableHead>
                          <TableHead className="font-heading text-xs">Route</TableHead>
                          <TableHead className="font-heading text-xs">Journey</TableHead>
                          <TableHead className="font-heading text-xs">Status</TableHead>
                          <TableHead className="font-heading text-xs">Seat</TableHead>
                          <TableHead className="font-heading text-xs text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRecords.map((r) => (
                          <TableRow key={r.pnr_code} className="hover:bg-muted/30">
                            <TableCell className="font-heading font-semibold text-primary text-sm">{r.pnr_code}</TableCell>
                            <TableCell>
                              <div>
                                <p className="text-sm font-medium">{r.passenger_name}</p>
                                <p className="text-xs text-muted-foreground">{r.email}</p>
                                <p className="text-xs text-muted-foreground">{r.mobile_number}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm">
                                <Plane className="h-3 w-3 text-muted-foreground" />
                                {r.flight_number}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">{r.source_airport} → {r.destination_airport}</TableCell>
                            <TableCell>
                              <div>
                                <p className="text-sm">{r.journey_date}</p>
                                <p className="text-xs text-muted-foreground">{r.journey_time}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={r.checkin_status === "checked_in" ? "default" : "secondary"}
                                className={`text-xs ${
                                  r.checkin_status === "checked_in"
                                    ? "bg-success text-success-foreground"
                                    : "bg-sky-100 text-sky-700"
                                }`}
                              >
                                {r.checkin_status === "checked_in" ? "Checked In" : "Not Checked In"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {r.seat_assignment || "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {activeTab === "staff" && (
          <Card className="border-sky-100">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground font-heading">Staff Management will be available in Step 2</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
