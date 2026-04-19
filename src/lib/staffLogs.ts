import { supabase } from "@/integrations/supabase/client";

/**
 * Records a staff login. Closes any previously-open active session for the
 * same user (single active session rule) and inserts a new active log row.
 */
export async function recordLogin(): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Close any existing open sessions for this user
    await supabase
      .from("staff_logs")
      .update({ logout_time: new Date().toISOString() })
      .eq("user_id", user.id)
      .is("logout_time", null);

    // Fetch role + airport
    const { data: roleData } = await supabase.rpc("get_my_role");
    const roleRow = Array.isArray(roleData) ? roleData[0] : roleData;

    // Fetch profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", user.id)
      .maybeSingle();

    await supabase.from("staff_logs").insert({
      user_id: user.id,
      staff_name: profile?.full_name ?? user.email ?? null,
      email: user.email ?? null,
      role: (roleRow?.role as string) ?? null,
      airport_code: (roleRow?.airport_code as string) ?? null,
      login_time: new Date().toISOString(),
    });
  } catch (err) {
    console.error("recordLogin failed", err);
  }
}

/**
 * Marks the latest active session for the current user as logged out.
 * Must be called BEFORE supabase.auth.signOut() so we still have a session.
 */
export async function recordLogout(): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("staff_logs")
      .update({ logout_time: new Date().toISOString() })
      .eq("user_id", user.id)
      .is("logout_time", null);
  } catch (err) {
    console.error("recordLogout failed", err);
  }
}
