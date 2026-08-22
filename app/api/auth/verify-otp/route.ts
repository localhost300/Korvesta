import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  enforceRateLimit,
  rejectCrossSiteMutation,
} from "@/lib/security/request";

export async function POST(request: Request) {
  const crossSite = rejectCrossSiteMutation(request);
  if (crossSite) return crossSite;
  const supabase = await createClient();
  if (!supabase)
    return NextResponse.json(
      { error: "Verification requires Supabase configuration." },
      { status: 503 },
    );
  const body = (await request.json().catch(() => null)) as {
    email?: string;
    token?: string;
    action?: string;
  } | null;
  const limited = await enforceRateLimit(
    request,
    "auth-otp",
    6,
    900,
    body?.email?.trim().toLowerCase(),
  );
  if (limited) return limited;
  const email = body?.email?.trim().toLowerCase();
  if (!email?.includes("@"))
    return NextResponse.json(
      { error: "Enter a valid email address." },
      { status: 400 },
    );
  if (body?.action === "resend") {
    const { error } = await supabase.auth.resend({ type: "signup", email });
    return error
      ? NextResponse.json({ error: error.message }, { status: 400 })
      : NextResponse.json({ ok: true });
  }
  const token = body?.token?.replace(/\D/g, "");
  if (!token || token.length < 6)
    return NextResponse.json(
      { error: "Enter the complete verification code." },
      { status: 400 },
    );
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });
  if (error)
    return NextResponse.json(
      { error: "The code is invalid or has expired." },
      { status: 400 },
    );
  return NextResponse.json({ ok: true, authenticated: Boolean(data.session) });
}
