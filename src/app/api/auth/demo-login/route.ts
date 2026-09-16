import {
  getDemoAdminEmail,
  getDemoAdminPassword,
  isDemoAuthEnabled,
  isValidDemoEmail,
} from "@/lib/auth/demo-config";
import {
  DEMO_SESSION_COOKIE,
  encodeDemoSession,
  type DemoSessionPayload,
} from "@/lib/auth/demo-session";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  if (!isDemoAuthEnabled()) {
    return NextResponse.json(
      { error: "Demo authentication is disabled." },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!isValidDemoEmail(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  if (!password) {
    return NextResponse.json({ error: "Password is required." }, { status: 400 });
  }

  const adminEmail = getDemoAdminEmail().toLowerCase();
  const adminPassword = getDemoAdminPassword();
  const isAdmin =
    email.toLowerCase() === adminEmail && password === adminPassword;

  const role: DemoSessionPayload["role"] = isAdmin ? "admin" : "staff";

  // Any other valid email + non-empty password → demo staff
  if (!isAdmin && email.toLowerCase() === adminEmail) {
    return NextResponse.json(
      { error: "Invalid email or password. Please try again." },
      { status: 401 }
    );
  }

  const session: DemoSessionPayload = {
    demo: true,
    email,
    role,
    fullName: isAdmin ? "Demo Admin" : "Demo User",
  };

  const response = NextResponse.json({ ok: true, role });
  response.cookies.set(DEMO_SESSION_COOKIE, encodeDemoSession(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
