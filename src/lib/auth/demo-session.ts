import { cookies } from "next/headers";
import type { UserProfile } from "@/lib/projects/types";

export const DEMO_SESSION_COOKIE = "mjms_demo_session";

export type DemoSessionPayload = {
  demo: true;
  email: string;
  role: "staff" | "admin";
  fullName: string;
};

export function encodeDemoSession(payload: DemoSessionPayload): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

export function decodeDemoSession(value: string | undefined): DemoSessionPayload | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8")
    ) as DemoSessionPayload;
    if (parsed?.demo !== true || !parsed.email || !parsed.role) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function getDemoSession(): Promise<DemoSessionPayload | null> {
  const cookieStore = await cookies();
  return decodeDemoSession(cookieStore.get(DEMO_SESSION_COOKIE)?.value);
}

export function demoSessionToUser(session: DemoSessionPayload): UserProfile {
  return {
    id: session.role === "admin" ? "demo-admin" : "demo-staff",
    email: session.email,
    fullName: session.fullName,
    role: session.role,
  };
}

export async function clearDemoSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(DEMO_SESSION_COOKIE);
}
