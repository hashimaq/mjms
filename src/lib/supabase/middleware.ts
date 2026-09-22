import { adminDashboardPath, employeeDashboardPath } from "@/lib/auth/roles";
import { decodeDemoFromRequest, resolveRequestRole } from "@/lib/auth/middleware-role";
import { WELCOME_PENDING_COOKIE } from "@/lib/auth/welcome-cookie";
import { DEMO_SESSION_COOKIE } from "@/lib/auth/demo-session";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const demoSession = decodeDemoFromRequest(request.cookies.get(DEMO_SESSION_COOKIE)?.value);
  const isAuthenticated = Boolean(user || demoSession);

  const pathname = request.nextUrl.pathname;
  const needsRoleResolution =
    isAuthenticated &&
    (pathname.startsWith("/admin") ||
      pathname.startsWith("/employee") ||
      pathname.startsWith("/login") ||
      pathname === "/search");

  const role = needsRoleResolution
    ? await resolveRequestRole(supabase, user, demoSession)
    : null;
  const isAuthRoute = pathname.startsWith("/login");
  const isWelcome = pathname.startsWith("/welcome");
  const isProtected =
    pathname.startsWith("/projects") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/employee");

  if (!isAuthenticated && (isProtected || isWelcome)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (pathname === "/admin" || pathname === "/admin/") {
    const url = request.nextUrl.clone();
    url.pathname = adminDashboardPath();
    return NextResponse.redirect(url);
  }

  if (pathname === "/employee" || pathname === "/employee/") {
    const url = request.nextUrl.clone();
    url.pathname = employeeDashboardPath();
    return NextResponse.redirect(url);
  }

  if (isAuthenticated && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = role === "admin" ? adminDashboardPath() : employeeDashboardPath();
    return NextResponse.redirect(url);
  }

  if (isAuthenticated && pathname.startsWith("/admin") && role !== "admin") {
    const url = request.nextUrl.clone();
    url.pathname = employeeDashboardPath();
    return NextResponse.redirect(url);
  }

  if (isAuthenticated && pathname.startsWith("/employee") && role === "admin") {
    const url = request.nextUrl.clone();
    url.pathname = adminDashboardPath();
    return NextResponse.redirect(url);
  }

  if (isAuthenticated && pathname === "/search") {
    const url = request.nextUrl.clone();
    url.pathname = role === "admin" ? "/admin/search" : "/employee/search";
    url.search = request.nextUrl.search;
    return NextResponse.redirect(url);
  }

  if (
    isWelcome &&
    isAuthenticated &&
    request.cookies.get(WELCOME_PENDING_COOKIE)?.value
  ) {
    supabaseResponse.cookies.delete(WELCOME_PENDING_COOKIE);
  }

  return supabaseResponse;
}
