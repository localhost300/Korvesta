import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  enforceRateLimit,
  rejectCrossSiteMutation,
} from "@/lib/security/request";
import { requireActiveCustomer } from "@/lib/security/account-status";
export async function GET() {
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
      { error: "Authentication required." },
      { status: 401 },
    );
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id,full_name,country,role,account_status,kyc_status,created_at,updated_at",
    )
    .eq("id", user.id)
    .single();
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  const { data: factors } = await supabase.auth.mfa.listFactors();
  return NextResponse.json({
    profile: {
      ...data,
      email: user.email ?? "",
      mfaEnabled: Boolean(
        factors?.totp.some((item) => item.status === "verified"),
      ),
    },
  });
}
export async function PATCH(request: Request) {
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
      { error: "Authentication required." },
      { status: 401 },
    );
  const blocked = await requireActiveCustomer(
    request,
    supabase,
    user.id,
    "profile_update",
  );
  if (blocked) return blocked;
  const limited = await enforceRateLimit(
    request,
    "profile-update",
    10,
    3600,
    user.id,
  );
  if (limited) return limited;
  const body = await request.json().catch(() => null);
  const { data, error } = await supabase.rpc("update_own_profile", {
    requested_name: body?.fullName,
    requested_country: body?.country,
  });
  return error
    ? NextResponse.json({ error: error.message }, { status: 400 })
    : NextResponse.json({ profile: data });
}
