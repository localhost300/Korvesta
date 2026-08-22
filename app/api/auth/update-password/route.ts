import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  enforceRateLimit,
  recordSecurityEvent,
  rejectCrossSiteMutation,
} from "@/lib/security/request";
export async function POST(request: Request) {
  const cross = rejectCrossSiteMutation(request);
  if (cross) return cross;
  const supabase = await createClient();
  if (!supabase)
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 },
    );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json(
      { error: "The recovery session is invalid or expired." },
      { status: 401 },
    );
  const limited = await enforceRateLimit(
    request,
    "password-update",
    4,
    3600,
    user.id,
  );
  if (limited) return limited;
  const body = await request.json().catch(() => null);
  const password = body?.password;
  if (
    typeof password !== "string" ||
    password.length < 12 ||
    !/[0-9]/.test(password) ||
    !/[^A-Za-z0-9]/.test(password)
  )
    return NextResponse.json(
      { error: "Use at least 12 characters with a number and symbol." },
      { status: 400 },
    );
  const { error } = await supabase.auth.updateUser({ password });
  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });
  await recordSecurityEvent(request, "password_changed", user.id);
  await supabase.auth.signOut({ scope: "others" });
  return NextResponse.json({ ok: true });
}
