import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  enforceRateLimit,
  rejectCrossSiteMutation,
} from "@/lib/security/request";
import { sendTransactionalEmail } from "@/lib/email";
import { ensureCustomerProfile } from "@/lib/supabase/profiles";

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
    token?: string;
    action?: string;
  } | null;
  const cookieStore = await cookies();
  const email = cookieStore
    .get("korvesta_pending_verification")
    ?.value.trim()
    .toLowerCase();
  const limited = await enforceRateLimit(
    request,
    "auth-otp",
    6,
    900,
    email,
  );
  if (limited) return limited;
  if (!email?.includes("@"))
    return NextResponse.json(
      { error: "Start registration again to request a verification code." },
      { status: 401 },
    );
  if (body?.action === "resend") {
    const { error } = await supabase.auth.resend({ type: "signup", email });
    return error
      ? NextResponse.json({ error: error.message }, { status: 400 })
      : NextResponse.json({ ok: true });
  }
  const token = body?.token?.replace(/\D/g, "");
  if (!token || token.length !== 8)
    return NextResponse.json(
      { error: "Enter the complete 8-digit verification code." },
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
  cookieStore.delete("korvesta_pending_verification");
  cookieStore.set("korvesta_registration_complete", "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 5 * 60,
    path: "/",
    priority: "high",
  });
  const verifiedUser = data.user;
  if (verifiedUser?.email) {
    await ensureCustomerProfile(verifiedUser);
    const fullName =
      typeof verifiedUser.user_metadata?.full_name === "string"
        ? verifiedUser.user_metadata.full_name.trim()
        : "";
    await sendTransactionalEmail({
      to: verifiedUser.email,
      subject: "Welcome to Korvesta",
      heading: fullName ? `Welcome, ${fullName}` : "Welcome to Korvesta",
      message:
        "Your email address has been verified and your Korvesta account is ready. You can now complete your profile, submit identity verification and explore your dashboard.",
      details: [
        ["Email", verifiedUser.email],
        ["Account status", "Verified"],
      ],
      actionLabel: "Open your dashboard",
      actionPath: "/dashboard",
      idempotencyKey: `welcome-${verifiedUser.id}`,
    });
  }
  return NextResponse.json({ ok: true, authenticated: Boolean(data.session) });
}
