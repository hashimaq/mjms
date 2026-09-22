import { normalizeProfileRole } from "@/lib/auth/roles";
import type { UserProfile } from "@/lib/projects/types";
import type { SupabaseClient } from "@supabase/supabase-js";

type ProfileRow = {
  role: string | null;
  full_name: string | null;
};

export async function loadProfileRow(
  supabase: SupabaseClient,
  userId: string
): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return data as ProfileRow;
}

export function userProfileFromAuth(
  user: { id: string; email?: string | null },
  profile: ProfileRow | null
): UserProfile | null {
  const role = normalizeProfileRole(profile?.role);
  if (!role) return null;

  return {
    id: user.id,
    email: user.email ?? "",
    fullName: profile?.full_name ?? null,
    role,
  };
}
