import "server-only";

import {
  demoSessionToUser,
  getDemoSession,
} from "@/lib/auth/demo-session";
import { loadProfileRow, userProfileFromAuth } from "@/lib/auth/resolve-user";
import { syncBootstrapProfileForUser } from "@/lib/auth/sync-profile";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { UserProfile } from "@/lib/projects/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cache } from "react";
import { AuthError } from "./auth-error";

/** One Supabase auth + profile resolution per React request (dedupes layout + page + queries). */
export const getAuthenticatedUser = cache(async (): Promise<UserProfile | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    let profile = await loadProfileRow(supabase, user.id);
    let mapped = userProfileFromAuth(user, profile);
    if (mapped) return mapped;

    await syncBootstrapProfileForUser(user.id, user.email ?? undefined);
    profile = await loadProfileRow(supabase, user.id);
    mapped = userProfileFromAuth(user, profile);
    if (mapped) return mapped;

    try {
      const service = createServiceRoleClient();
      profile = await loadProfileRow(service, user.id);
      return userProfileFromAuth(user, profile);
    } catch {
      return null;
    }
  }

  const demo = await getDemoSession();
  if (demo) return demoSessionToUser(demo);
  return null;
});

export const requireAdmin = cache(async (): Promise<UserProfile> => {
  const user = await getAuthenticatedUser();
  if (!user) throw new AuthError("You must be signed in.", "unauthenticated");
  if (user.role !== "admin") throw new AuthError("Admin access required.", "forbidden");
  return user;
});

export const requireStaffOnly = cache(async (): Promise<UserProfile> => {
  const user = await getAuthenticatedUser();
  if (!user) throw new AuthError("You must be signed in.", "unauthenticated");
  if (user.role !== "staff") {
    throw new AuthError("This area is for employees only.", "forbidden");
  }
  return user;
});

export const getAdminSupabase = cache(async (): Promise<{
  user: UserProfile;
  supabase: SupabaseClient;
}> => {
  const user = await requireAdmin();
  const supabase = user.id.startsWith("demo-")
    ? createServiceRoleClient()
    : await createClient();
  return { user, supabase };
});

export const getStaffSupabase = cache(async (): Promise<{
  user: UserProfile;
  supabase: SupabaseClient;
}> => {
  const user = await requireStaffOnly();
  const supabase = user.id.startsWith("demo-")
    ? createServiceRoleClient()
    : await createClient();
  return { user, supabase };
});
