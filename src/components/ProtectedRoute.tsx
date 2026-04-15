import { Navigate } from "react-router-dom";
import { useAuth, type AppRole, getRolePath } from "@/hooks/useAuth";
import { Loader2, Plane } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: AppRole[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { session, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="p-4 rounded-full bg-primary/10 text-primary mx-auto mb-4 w-fit">
            <Plane className="h-8 w-8 animate-pulse" />
          </div>
          <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground mt-2 font-heading">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/staff-login" replace />;
  }

  if (!role) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <h2 className="text-xl font-heading font-bold mb-2">No Role Assigned</h2>
          <p className="text-muted-foreground text-sm">
            Your account does not have a role assigned. Please contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to={getRolePath(role)} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
