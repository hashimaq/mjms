import { decodeDemoSession, type DemoSessionPayload } from "@/lib/auth/demo-session";
import { loadProfileRow, userProfileFromAuth } from "@/lib/auth/resolve-user";
import { normalizeProfileRole, type AppRole } from "@/lib/auth/roles";
import type { SupabaseClient, User } from "@supabase/supabase-js";

export async function resolveRequestRole(
  supabase: SupabaseClient,
  user: User | null,
  demoSession: DemoSessionPayload | null
): Promise<AppRole | null> {
  if (user) {
    const profile = await loadProfileRow(supabase, user.id);
    const mapped = userProfileFromAuth(user, profile);
    if (mapped) return mapped.role;
    const fromRaw = normalizeProfileRole(profile?.role);
    if (fromRaw) return fromRaw;
  }

  if (demoSession && !user) {
    return demoSession.role === "admin" ? "admin" : "staff";
  }

  return null;
}

export function decodeDemoFromRequest(cookieValue: string | undefined) {
  return decodeDemoSession(cookieValue);
}
