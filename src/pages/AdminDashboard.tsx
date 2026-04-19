import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getAllPNRs, type PNRRecord } from "@/data/pnrDatabase";
import { useAuth, getRoleLabel, type AppRole } from "@/hooks/useAuth";
import StaffHeader from "@/components/StaffHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ClipboardList, CheckCircle, Clock, RefreshCw, Search,
  Loader2, Pencil, Trash2, Plus, UserPlus, Key, Plane,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StaffMember {
  user_id: string;
  email: string;
  full_name: string;
  role: AppRole;
  airport_code: string;
  created_at: string;
}

const AdminDashboard = () => {
  const { toast } = useToast();
  const { session } = useAuth();
  const [records, setRecords] = useState<PNRRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [routeTypeFilter, setRouteTypeFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [destFilter, setDestFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"pnr" | "staff" | "logs">("pnr");

  // Activity logs state
  interface StaffLog {
    id: string;
    user_id: string;
    staff_name: string | null;
    email: string | null;
    role: string | null;
    airport_code: string | null;
    login_time: string;
    logout_time: string | null;
  }
  const [logs, setLogs] = useState<StaffLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logRoleFilter, setLogRoleFilter] = useState<string>("all");
  const [logStatusFilter, setLogStatusFilter] = useState<string>("all");

  // Staff management state
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);

  // Add staff form
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newFullName, setNewFullName] = useState("");
  const [newRole, setNewRole] = useState<AppRole>("checkin_staff");
  const [newAirport, setNewAirport] = useState("MAA");
  const [formLoading, setFormLoading] = useState(false);

  // Reset password
  const [resetPassword, setResetPassword] = useState("");

  const loadPNRs = async () => {
    setLoading(true);
    const data = await getAllPNRs();
    setRecords(data);
    setLoading(false);
  };

  const callManageStaff = async (body: any) => {
    const { data, error } = await supabase.functions.invoke("manage-staff", { body });
    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(data.error);
    return data;
  };

  const loadStaff = async () => {
    setStaffLoading(true);
    try {
      const data = await callManageStaff({ action: "list_staff" });
      setStaffList(data.staff || []);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setStaffLoading(false);
    }
  };

  useEffect(() => {
    loadPNRs();
  }, []);

  useEffect(() => {
    if (activeTab === "staff") loadStaff();
    if (activeTab === "logs") loadLogs();
  }, [activeTab]);

  const loadLogs = async () => {
    setLogsLoading(true);
    const { data, error } = await supabase
      .from("staff_logs")
      .select("*")
      .order("login_time", { ascending: false })
      .limit(200);
    if (error) {
      toast({ title: "Failed to load logs", description: error.message, variant: "destructive" });
    } else {
      setLogs((data ?? []) as StaffLog[]);
    }
    setLogsLoading(false);
  };

  const formatDuration = (loginIso: string, logoutIso: string | null) => {
    const start = new Date(loginIso).getTime();
    const end = logoutIso ? new Date(logoutIso).getTime() : Date.now();
    const ms = Math.max(0, end - start);
    const mins = Math.floor(ms / 60000);
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const filteredLogs = logs.filter((l) => {
    if (logRoleFilter !== "all" && l.role !== logRoleFilter) return false;
    if (logStatusFilter === "active" && l.logout_time !== null) return false;
    if (logStatusFilter === "logged_out" && l.logout_time === null) return false;
    return true;
  });

  const handleAddStaff = async () => {
    if (!newEmail || !newPassword || !newFullName) return;
    setFormLoading(true);
    try {
      await callManageStaff({
        action: "create_staff",
        email: newEmail,
        password: newPassword,
        full_name: newFullName,
        role: newRole,
        airport_code: newAirport,
      });
      toast({ title: "Staff Created", description: `${newFullName} added as ${getRoleLabel(newRole)} at ${newAirport}` });
      setShowAddDialog(false);
      setNewEmail("");
      setNewPassword("");
      setNewFullName("");
      setNewRole("checkin_staff");
      setNewAirport("MAA");
      loadStaff();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteStaff = async (staff: StaffMember) => {
    if (!confirm(`Delete ${staff.full_name} (${staff.email})?`)) return;
    try {
      await callManageStaff({ action: "delete_staff", user_id: staff.user_id });
      toast({ title: "Staff Deleted", description: `${staff.full_name} has been removed` });
      loadStaff();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleResetPassword = async () => {
    if (!selectedStaff || !resetPassword) return;
    setFormLoading(true);
    try {
      await callManageStaff({
        action: "reset_password",
        user_id: selectedStaff.user_id,
        new_password: resetPassword,
      });
      toast({ title: "Password Reset", description: `Password updated for ${selectedStaff.full_name}` });
      setShowResetDialog(false);
      setResetPassword("");
      setSelectedStaff(null);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setFormLoading(false);
    }
  };

  const filteredRecords = records.filter((r) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      r.pnr_code.toLowerCase().includes(q) ||
      r.passenger_name.toLowerCase().includes(q) ||
      r.flight_number.toLowerCase().includes(q) ||
      r.source_airport.toLowerCase().includes(q) ||
      r.destination_airport.toLowerCase().includes(q);

    const matchesStatus = statusFilter === "all" || r.checkin_status === statusFilter;

    const hops = r.route_path?.length ?? 2;
    const matchesRouteType =
      routeTypeFilter === "all" ||
      (routeTypeFilter === "direct" && hops === 2) ||
      (routeTypeFilter === "connecting" && hops >= 3);

    const matchesSource = sourceFilter === "all" || r.source_airport === sourceFilter;
    const matchesDest = destFilter === "all" || r.destination_airport === destFilter;

    return matchesSearch && matchesStatus && matchesRouteType && matchesSource && matchesDest;
  });

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setRouteTypeFilter("all");
    setSourceFilter("all");
    setDestFilter("all");
  };

  const checkedInCount = records.filter((r) => r.checkin_status === "checked_in").length;
  const pendingCount = records.length - checkedInCount;

  const airports = [
    { code: "MAA", name: "Chennai" },
    { code: "BLR", name: "Bangalore" },
    { code: "HYD", name: "Hyderabad" },
    { code: "DEL", name: "Delhi" },
    { code: "BOM", name: "Mumbai" },
    { code: "CCU", name: "Kolkata" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <StaffHeader />

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold font-heading">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Manage PNR records and staff members</p>
          </div>
          <Button variant="outline" size="sm" onClick={loadPNRs} className="gap-1.5 font-heading text-xs">
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
                <p className="text-3xl font-bold font-heading mt-1">{pendingCount}</p>
                <p className="text-xs text-muted-foreground">Awaiting check-in</p>
              </div>
              <Clock className="h-5 w-5 text-muted-foreground" />
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
          <button
            onClick={() => setActiveTab("logs")}
            className={`pb-2 text-sm font-heading font-medium border-b-2 transition-colors ${
              activeTab === "logs"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Activity Logs
          </button>
        </div>

        {/* PNR Tab */}
        {activeTab === "pnr" && (
          <Card className="border-sky-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-heading font-semibold text-lg">PNR Records</h3>
                  <p className="text-sm text-muted-foreground">
                    Showing {filteredRecords.length} of {records.length} records
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={resetFilters} className="gap-1.5 font-heading text-xs">
                  Reset Filters
                </Button>
              </div>

              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by PNR, name, flight, or route..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="checked_in">Checked In</SelectItem>
                    <SelectItem value="not_checked_in">Not Checked In</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={routeTypeFilter} onValueChange={setRouteTypeFilter}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Route Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Routes</SelectItem>
                    <SelectItem value="direct">Direct Only</SelectItem>
                    <SelectItem value="connecting">Connecting Only</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Source Airport" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    {airports.map((a) => (
                      <SelectItem key={a.code} value={a.code}>{a.code} — {a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={destFilter} onValueChange={setDestFilter}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Destination Airport" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Destinations</SelectItem>
                    {airports.map((a) => (
                      <SelectItem key={a.code} value={a.code}>{a.code} — {a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-sky-100 text-sky-700"
                              }`}
                            >
                              {r.checkin_status === "checked_in" ? "Checked In" : "Not Checked In"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {r.seat_assignment || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Staff Tab */}
        {activeTab === "staff" && (
          <Card className="border-sky-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-heading font-semibold text-lg">Staff Members</h3>
                  <p className="text-sm text-muted-foreground">Manage staff accounts, roles, and airport assignments</p>
                </div>
                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-1.5 font-heading bg-primary hover:bg-primary/90">
                      <UserPlus className="h-3.5 w-3.5" />
                      Add Staff
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="font-heading">Add New Staff Member</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                      <div className="space-y-2">
                        <Label className="font-heading font-semibold text-sm">Full Name</Label>
                        <Input placeholder="e.g. Pranav Kumar" value={newFullName} onChange={(e) => setNewFullName(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-heading font-semibold text-sm">Email</Label>
                        <Input type="email" placeholder="staff@skytrack.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-heading font-semibold text-sm">Password</Label>
                        <Input type="text" placeholder="Temporary password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="font-heading font-semibold text-sm">Role</Label>
                          <Select value={newRole} onValueChange={(v) => setNewRole(v as AppRole)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="checkin_staff">Check-in Staff</SelectItem>
                              <SelectItem value="baggage_staff">Baggage Staff</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="font-heading font-semibold text-sm">Airport</Label>
                          <Select value={newAirport} onValueChange={setNewAirport}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {airports.map((a) => (
                                <SelectItem key={a.code} value={a.code}>{a.code} — {a.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                      <Button onClick={handleAddStaff} disabled={formLoading} className="gap-1.5">
                        {formLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                        Create Staff
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Reset Password Dialog */}
              <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="font-heading">Reset Password</DialogTitle>
                  </DialogHeader>
                  <p className="text-sm text-muted-foreground">
                    Set a new password for <strong>{selectedStaff?.full_name}</strong> ({selectedStaff?.email})
                  </p>
                  <div className="space-y-2 py-2">
                    <Label className="font-heading font-semibold text-sm">New Password</Label>
                    <Input type="text" placeholder="New temporary password" value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowResetDialog(false)}>Cancel</Button>
                    <Button onClick={handleResetPassword} disabled={formLoading} className="gap-1.5">
                      {formLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />}
                      Reset Password
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {staffLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : staffList.length === 0 ? (
                <div className="text-center py-12">
                  <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-heading font-semibold mb-1">No Staff Members</h3>
                  <p className="text-sm text-muted-foreground">Click "Add Staff" to create your first staff account.</p>
                </div>
              ) : (
                <div className="overflow-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-heading text-xs">Name</TableHead>
                        <TableHead className="font-heading text-xs">Email</TableHead>
                        <TableHead className="font-heading text-xs">Role</TableHead>
                        <TableHead className="font-heading text-xs">Airport</TableHead>
                        <TableHead className="font-heading text-xs text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {staffList.map((s) => (
                        <TableRow key={s.user_id} className="hover:bg-muted/30">
                          <TableCell className="font-medium text-sm">{s.full_name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{s.email}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">
                              {getRoleLabel(s.role)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">{s.airport_code}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                title="Reset Password"
                                onClick={() => { setSelectedStaff(s); setResetPassword(""); setShowResetDialog(true); }}
                              >
                                <Key className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                title="Delete Staff"
                                onClick={() => handleDeleteStaff(s)}
                              >
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
        )}

        {/* Activity Logs Tab */}
        {activeTab === "logs" && (
          <Card className="border-sky-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div>
                  <h2 className="text-lg font-bold font-heading">Staff Activity Logs</h2>
                  <p className="text-xs text-muted-foreground">Login &amp; logout history (latest 200)</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Select value={logRoleFilter} onValueChange={setLogRoleFilter}>
                    <SelectTrigger className="h-9 w-[160px]"><SelectValue placeholder="Role" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="checkin_staff">Check-in Staff</SelectItem>
                      <SelectItem value="baggage_staff">Baggage Staff</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={logStatusFilter} onValueChange={setLogStatusFilter}>
                    <SelectTrigger className="h-9 w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="logged_out">Logged Out</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={loadLogs} className="gap-1.5">
                    <RefreshCw className="h-3.5 w-3.5" /> Refresh
                  </Button>
                </div>
              </div>

              {logsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : filteredLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No activity logs found.</p>
              ) : (
                <div className="border rounded-md overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Staff Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Airport</TableHead>
                        <TableHead>Login Time</TableHead>
                        <TableHead>Logout Time</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-medium">{log.staff_name ?? "—"}</TableCell>
                          <TableCell className="text-xs">{log.email ?? "—"}</TableCell>
                          <TableCell className="text-xs">{log.role ? getRoleLabel(log.role as AppRole) : "—"}</TableCell>
                          <TableCell className="text-xs">{log.airport_code ?? "—"}</TableCell>
                          <TableCell className="text-xs">{new Date(log.login_time).toLocaleString()}</TableCell>
                          <TableCell className="text-xs">
                            {log.logout_time ? new Date(log.logout_time).toLocaleString() : "—"}
                          </TableCell>
                          <TableCell className="text-xs">{formatDuration(log.login_time, log.logout_time)}</TableCell>
                          <TableCell>
                            {log.logout_time === null ? (
                              <Badge className="bg-emerald-500 hover:bg-emerald-500 text-white">Active</Badge>
                            ) : (
                              <Badge variant="secondary">Logged Out</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
