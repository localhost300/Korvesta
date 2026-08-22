import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { updateSupabaseSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  if (hasSupabaseConfig()) {
    const { response, user, role, accountStatus, currentLevel, nextLevel } =
      await updateSupabaseSession(request);
    const adminRoute =
      request.nextUrl.pathname.startsWith("/admin") &&
      request.nextUrl.pathname !== "/admin-sign-in";
    const customerRoute = request.nextUrl.pathname.startsWith("/dashboard");
    const mfaRoute = request.nextUrl.pathname === "/mfa";
    const suspendedRoute = request.nextUrl.pathname === "/account-suspended";
    if (!user && (adminRoute || customerRoute || mfaRoute || suspendedRoute))
      return NextResponse.redirect(
        new URL(adminRoute ? "/admin-sign-in" : "/sign-in", request.url),
      );
    if (customerRoute && accountStatus === "suspended")
      return NextResponse.redirect(new URL("/account-suspended", request.url));
    if (suspendedRoute && accountStatus !== "suspended")
      return NextResponse.redirect(new URL("/dashboard", request.url));
    if (customerRoute && currentLevel === "aal1" && nextLevel === "aal2")
      return NextResponse.redirect(new URL("/mfa", request.url));
    if (mfaRoute && currentLevel === "aal2")
      return NextResponse.redirect(
        new URL(role === "admin" ? "/admin" : "/dashboard", request.url),
      );
    if (adminRoute && role !== "admin")
      return NextResponse.redirect(new URL("/admin-sign-in", request.url));
    if (customerRoute && role !== "customer")
      return NextResponse.redirect(
        new URL(role === "admin" ? "/admin" : "/sign-in", request.url),
      );
    return response;
  }
  const session = await verifySessionToken(
    request.cookies.get(SESSION_COOKIE)?.value,
  );
  const adminRoute =
    request.nextUrl.pathname.startsWith("/admin") &&
    request.nextUrl.pathname !== "/admin-sign-in";
  const customerRoute = request.nextUrl.pathname.startsWith("/dashboard");
  if (adminRoute && session?.role !== "admin")
    return NextResponse.redirect(new URL("/admin-sign-in", request.url));
  if (customerRoute && session?.role !== "customer")
    return NextResponse.redirect(new URL("/sign-in", request.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/mfa", "/account-suspended"],
};
