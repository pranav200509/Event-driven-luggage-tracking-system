import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

export type AppRole = "admin" | "checkin_staff" | "baggage_staff";

export interface AuthState {
  session: Session | null;
  user: User | null;
  role: AppRole | null;
  airportCode: string | null;
  fullName: string | null;
  loading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    role: null,
    airportCode: null,
    fullName: null,
    loading: true,
  });

  const fetchRoleAndProfile = useCallback(async (user: User) => {
    // Fetch role
    const { data: roleData } = await supabase.rpc("get_my_role");
    const roleRow = Array.isArray(roleData) ? roleData[0] : roleData;

    // Fetch profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", user.id)
      .maybeSingle();

    return {
      role: (roleRow?.role as AppRole) ?? null,
      airportCode: roleRow?.airport_code ?? null,
      fullName: profile?.full_name ?? user.email ?? null,
    };
  }, []);

  useEffect(() => {
    // Set up listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          // Use setTimeout to avoid deadlock with Supabase auth
          setTimeout(async () => {
            const info = await fetchRoleAndProfile(session.user);
            setState({
              session,
              user: session.user,
              ...info,
              loading: false,
            });
          }, 0);
        } else {
          setState({
            session: null,
            user: null,
            role: null,
            airportCode: null,
            fullName: null,
            loading: false,
          });
        }
      }
    );

    // THEN check existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const info = await fetchRoleAndProfile(session.user);
        setState({
          session,
          user: session.user,
          ...info,
          loading: false,
        });
      } else {
        setState((s) => ({ ...s, loading: false }));
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchRoleAndProfile]);

  const signOut = useCallback(async () => {
    // Record logout BEFORE signing out so we still have an authenticated session
    try {
      const { recordLogout } = await import("@/lib/staffLogs");
      await recordLogout();
    } catch (err) {
      console.error("recordLogout failed", err);
    }
    await supabase.auth.signOut();
  }, []);

  return { ...state, signOut };
}

export function getRolePath(role: AppRole | null): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "checkin_staff":
      return "/checkin";
    case "baggage_staff":
      return "/baggage";
    default:
      return "/staff-login";
  }
}

export function getRoleLabel(role: AppRole | null): string {
  switch (role) {
    case "admin":
      return "Admin";
    case "checkin_staff":
      return "Check-in Staff";
    case "baggage_staff":
      return "Baggage Staff";
    default:
      return "Unknown";
  }
}
