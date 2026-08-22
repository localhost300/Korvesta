import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  enforceRateLimit,
  rejectCrossSiteMutation,
} from "@/lib/security/request";
import { ensureCustomerProfile } from "@/lib/supabase/profiles";

export async function POST(request: Request) {
  const crossSite = rejectCrossSiteMutation(request);
  if (crossSite) return crossSite;
  const supabase = await createClient();
  if (!supabase)
    return NextResponse.json(
      { error: "Registration requires Supabase configuration." },
      { status: 503 },
    );
  const body = (await request.json().catch(() => null)) as {
    fullName?: string;
    email?: string;
    password?: string;
    country?: string;
  } | null;
  const limited = await enforceRateLimit(
    request,
    "auth-register",
    5,
    3600,
    body?.email?.trim().toLowerCase(),
  );
  if (limited) return limited;
  if (
    !body?.fullName?.trim() ||
    !body.email?.includes("@") ||
    !body.country ||
    !body.password ||
    body.password.length < 10 ||
    !/[0-9]/.test(body.password) ||
    !/[^A-Za-z0-9]/.test(body.password)
  )
    return NextResponse.json(
      {
        error:
          "Complete every field and use a password of at least 10 characters with a number and symbol.",
      },
      { status: 400 },
    );
  const { data, error } = await supabase.auth.signUp({
    email: body.email,
    password: body.password,
    options: {
      data: { full_name: body.fullName.trim(), country: body.country },
    },
  });
  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });
  if (data.user) await ensureCustomerProfile(data.user);
  if (!data.session) {
    (await cookies()).set("korvesta_pending_verification", body.email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60,
      path: "/",
      priority: "high",
    });
  }
  return NextResponse.json({ ok: true, requiresVerification: !data.session });
}
