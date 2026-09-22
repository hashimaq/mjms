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
import { demoFullNameForEmail } from "@/lib/auth/bootstrap-names";
import {
  WELCOME_PENDING_COOKIE,
  welcomePendingCookieOptions,
} from "@/lib/auth/welcome-cookie";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

function withWelcomePending(response: NextResponse): NextResponse {
  response.cookies.set(WELCOME_PENDING_COOKIE, "1", welcomePendingCookieOptions());
  return response;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!isValidDemoEmail(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  if (!password) {
    return NextResponse.json({ error: "Password is required." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  const bootstrapAdminEmail = process.env.MJMS_INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
  const bootstrapEmployeeEmail = process.env.MJMS_INITIAL_EMPLOYEE_EMAIL?.trim().toLowerCase();
  const normalizedEmail = email.toLowerCase();
  const isConfiguredMjmsAccount =
    (bootstrapAdminEmail && normalizedEmail === bootstrapAdminEmail) ||
    (bootstrapEmployeeEmail && normalizedEmail === bootstrapEmployeeEmail);

  if (!signInError && signInData.user) {
    const { syncBootstrapProfileForUser } = await import("@/lib/auth/sync-profile");
    await syncBootstrapProfileForUser(signInData.user.id, signInData.user.email ?? undefined);

    try {
      await supabase.rpc("append_activity_log", {
        p_action: "LOGIN",
        p_entity_type: "session",
        p_entity_id: null,
        p_metadata: {},
      });
    } catch {
      /* non-blocking when migration not applied */
    }

    const response = withWelcomePending(
      NextResponse.json({
        ok: true,
        redirect: "/welcome",
      })
    );
    response.cookies.delete(DEMO_SESSION_COOKIE);
    return response;
  }

  if (isConfiguredMjmsAccount) {
    return NextResponse.json(
      { error: "Invalid email or password. Please try again." },
      { status: 401 }
    );
  }

  if (!isDemoAuthEnabled()) {
    return NextResponse.json(
      { error: "Invalid email or password. Please try again." },
      { status: 401 }
    );
  }

  const adminEmail = getDemoAdminEmail().toLowerCase();
  const adminPassword = getDemoAdminPassword();
  const isAdmin = email.toLowerCase() === adminEmail && password === adminPassword;

  if (!isAdmin && email.toLowerCase() === adminEmail) {
    return NextResponse.json(
      { error: "Invalid email or password. Please try again." },
      { status: 401 }
    );
  }

  const role: DemoSessionPayload["role"] = isAdmin ? "admin" : "staff";
  const configuredName = demoFullNameForEmail(email, role);
  const session: DemoSessionPayload = {
    demo: true,
    email,
    role,
    fullName: configuredName ?? "",
  };

  const response = withWelcomePending(
    NextResponse.json({
      ok: true,
      redirect: "/welcome",
    })
  );

  response.cookies.set(DEMO_SESSION_COOKIE, encodeDemoSession(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
