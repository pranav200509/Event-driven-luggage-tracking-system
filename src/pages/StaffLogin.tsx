import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plane, Eye, EyeOff, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth, getRolePath } from "@/hooks/useAuth";
import { recordLogin } from "@/lib/staffLogs";

const StaffLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session, role, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Auto redirect if already logged in
  useEffect(() => {
    if (!authLoading && session && role) {
      navigate(getRolePath(role), { replace: true });
    }
  }, [authLoading, session, role, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast({
          title: "Login Failed",
          description: error.message === "Invalid login credentials"
            ? "Invalid email or password. Please try again."
            : error.message,
          variant: "destructive",
        });
      } else {
        // Log the login activity (fire and forget)
        recordLogin();
      }
      // Redirect is handled by useAuth effect above
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-sky-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sky-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-sm text-foreground hover:text-primary mb-6 font-heading"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </button>

        <Card className="border-sky-100 shadow-lg">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="p-4 rounded-full bg-sky-100 text-primary">
                  <Plane className="h-8 w-8" />
                </div>
              </div>
              <h1 className="text-2xl font-bold font-heading">SkyTrack Staff Login</h1>
              <p className="text-muted-foreground text-sm mt-1">Sign in to access staff portal</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="font-heading font-semibold">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="staff@skytrack.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="font-heading font-semibold">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full h-11 font-heading bg-primary hover:bg-primary/90" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
              Contact your administrator for login credentials
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StaffLogin;
