import {
  demoSessionToUser,
  getDemoSession,
} from "@/lib/auth/demo-session";
import { createClient } from "@/lib/supabase/server";
import type { UserProfile } from "@/lib/projects/types";

export async function getSessionUser(): Promise<UserProfile | null> {
  const demo = await getDemoSession();
  if (demo) {
    return demoSessionToUser(demo);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: user.email ?? "",
    fullName: profile?.full_name ?? null,
    role: (profile?.role as "staff" | "admin") ?? "staff",
  };
}

export async function isRequestAdmin(): Promise<boolean> {
  const user = await getSessionUser();
  return user?.role === "admin";
}
