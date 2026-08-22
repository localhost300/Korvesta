import { NextResponse } from "next/server";
import {
  authIsConfigured,
  createSessionToken,
  credentialsMatch,
  SESSION_COOKIE,
  type SessionRole,
} from "@/lib/auth";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import {
  enforceRateLimit,
  recordSecurityEvent,
  rejectCrossSiteMutation,
} from "@/lib/security/request";

export async function POST(request: Request) {
  const crossSite = rejectCrossSiteMutation(request);
  if (crossSite) return crossSite;
  const body = (await request.json().catch(() => null)) as {
    email?: string;
    password?: string;
    role?: string;
  } | null;
  const limited = await enforceRateLimit(
    request,
    "auth-login",
    8,
    900,
    body?.email?.trim().toLowerCase(),
  );
  if (limited) return limited;
  const role: SessionRole = body?.role === "admin" ? "admin" : "customer";
  const supabase = await createSupabaseClient();
  if (supabase) {
    if (typeof body?.email !== "string" || typeof body.password !== "string")
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 },
      );
    const { data, error } = await supabase.auth.signInWithPassword({
      email: body.email,
      password: body.password,
    });
    if (error || !data.user) {
      await recordSecurityEvent(request, "login_failed", null, {
        email: body.email.trim().toLowerCase(),
      });
      return NextResponse.json(
        { error: "The credentials provided are not valid." },
        { status: 401 },
      );
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("role,account_status")
      .eq("id", data.user.id)
      .single();
    const isAdmin = profile?.role === "admin";
    if ((role === "admin") !== isAdmin) {
      await supabase.auth.signOut();
      return NextResponse.json(
        { error: "This account cannot access the requested area." },
        { status: 403 },
      );
    }
    if (!isAdmin && profile?.account_status === "suspended") {
      await recordSecurityEvent(request, "suspended_login", data.user.id);
      await supabase.auth.signOut();
      return NextResponse.json(
        {
          error:
            "This account is suspended. Contact support if you believe this is a mistake.",
        },
        { status: 403 },
      );
    }
    const { data: assurance } =
      await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    await recordSecurityEvent(request, "login_succeeded", data.user.id);
    return NextResponse.json({
      ok: true,
      destination:
        assurance?.currentLevel === "aal1" && assurance.nextLevel === "aal2"
          ? "/mfa"
          : role === "admin"
            ? "/admin"
            : "/dashboard",
    });
  }
  if (!authIsConfigured(role))
    return NextResponse.json(
      { error: "Sign-in is not configured on this deployment." },
      { status: 503 },
    );
  if (
    typeof body?.email !== "string" ||
    typeof body.password !== "string" ||
    !(await credentialsMatch(body.email, body.password, role))
  ) {
    return NextResponse.json(
      { error: "The credentials provided are not valid." },
      { status: 401 },
    );
  }
  const response = NextResponse.json({
    ok: true,
    destination: role === "admin" ? "/admin" : "/dashboard",
  });
  response.cookies.set(
    SESSION_COOKIE,
    await createSessionToken(role, body.email.trim().toLowerCase()),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 8 * 60 * 60,
    },
  );
  return response;
}
