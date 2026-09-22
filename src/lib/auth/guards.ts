import type { UserProfile } from "@/lib/projects/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { roleHomePath } from "@/lib/auth/roles";
import { AuthError } from "@/lib/auth/auth-error";
import {
  getAdminSupabase,
  getAuthenticatedUser,
  getStaffSupabase,
  requireAdmin,
  requireStaffOnly,
} from "@/lib/auth/session-cache";

export { AuthError };

export {
  getAuthenticatedUser,
  requireAdmin,
  requireStaffOnly,
  getAdminSupabase,
  getStaffSupabase,
};

export async function requireAuthenticatedUser(): Promise<UserProfile> {
  const user = await getAuthenticatedUser();
  if (!user) throw new AuthError("You must be signed in.", "unauthenticated");
  return user;
}

/** @deprecated Use requireStaffOnly. */
export async function requireEmployee(): Promise<UserProfile> {
  return requireStaffOnly();
}

export async function getCatalogueMutationClient(): Promise<{
  supabase: SupabaseClient;
  user: UserProfile;
}> {
  const user = await requireAuthenticatedUser();
  if (user.role !== "staff" && user.role !== "admin") {
    throw new AuthError("You do not have access.", "forbidden");
  }

  if (user.id.startsWith("demo-")) {
    const { createServiceRoleClient } = await import("@/lib/supabase/admin");
    return { supabase: createServiceRoleClient(), user };
  }

  const { createClient } = await import("@/lib/supabase/server");
  return { supabase: await createClient(), user };
}

export async function getAdminReadClient(): Promise<SupabaseClient> {
  const { supabase } = await getAdminSupabase();
  return supabase;
}

export { roleHomePath };
