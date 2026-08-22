import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  enforceRateLimit,
  rejectCrossSiteMutation,
} from "@/lib/security/request";
export async function POST(request: Request) {
  const cross = rejectCrossSiteMutation(request);
  if (cross) return cross;
  const body = await request.json().catch(() => null);
  const email = body?.email?.trim().toLowerCase();
  const limited = await enforceRateLimit(
    request,
    "password-reset",
    4,
    3600,
    email,
  );
  if (limited) return limited;
  if (!email?.includes("@"))
    return NextResponse.json(
      { error: "Enter a valid email address." },
      { status: 400 },
    );
  const supabase = await createClient();
  if (!supabase)
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 },
    );
  const origin = new URL(request.url).origin;
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });
  return NextResponse.json({
    ok: true,
    message: "If that account exists, a password reset link has been sent.",
  });
}
