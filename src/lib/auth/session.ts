import { getAuthenticatedUser } from "@/lib/auth/session-cache";
import { isAdminRole } from "@/lib/auth/roles";
import type { UserProfile } from "@/lib/projects/types";

export async function getSessionUser(): Promise<UserProfile | null> {
  return getAuthenticatedUser();
}

export async function isRequestAdmin(): Promise<boolean> {
  const user = await getSessionUser();
  return isAdminRole(user?.role);
}
