import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { decryptPaymentData } from "@/lib/payment-crypto";

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
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin")
    return NextResponse.json(
      { error: "Administrator access required." },
      { status: 403 },
    );
  const [deposits, withdrawals] = await Promise.all([
    supabase
      .from("deposit_requests")
      .select(
        "id,amount,transaction_hash,proof_path,status,review_note,created_at,assets(symbol),networks(name)",
      ),
    supabase
      .from("withdrawal_requests")
      .select(
        "id,amount,fee,destination,status,review_note,created_at,assets(symbol),networks(name)",
      ),
  ]);
  const error = deposits.error ?? withdrawals.error;
  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });
  const data = await Promise.all([
    ...(deposits.data ?? []).map((item) => ({ ...item, type: "deposit" })),
    ...(withdrawals.data ?? []).map(async (item) => ({
      ...item,
      destination: await decryptPaymentData(item.destination),
      type: "withdrawal",
    })),
  ]);
  data.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  return NextResponse.json({ data });
}
