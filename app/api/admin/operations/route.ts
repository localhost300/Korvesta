import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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
  const admin = createAdminClient();
  if (!admin)
    return NextResponse.json(
      { error: "Server administrator key is not configured." },
      { status: 503 },
    );
  const [customers, deposits, withdrawals, kyc, ledger, investments, trading] =
    await Promise.all([
      admin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "customer"),
      admin
        .from("deposit_requests")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      admin
        .from("withdrawal_requests")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      admin
        .from("kyc_submissions")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      admin
        .from("ledger_transactions")
        .select(
          "id,reference,kind,status,created_at,ledger_entries(amount,ledger_accounts(owner_id,purpose,assets(symbol),profiles(full_name)))",
        )
        .order("created_at", { ascending: false })
        .limit(250),
      admin
        .from("investment_positions")
        .select(
          "id,user_id,principal,apy_bps,accrued_return,status,started_on,maturity_on,created_at,profiles(full_name),investment_plans(name)",
        )
        .order("created_at", { ascending: false })
        .limit(250),
      admin
        .from("trading_orders")
        .select(
          "id,pair,side,order_type,quantity,fill_price,fee,status,provider,created_at,trading_accounts(mode,user_id,profiles(full_name))",
        )
        .order("created_at", { ascending: false })
        .limit(250),
    ]);
  const error =
    customers.error ??
    deposits.error ??
    withdrawals.error ??
    kyc.error ??
    ledger.error ??
    investments.error ??
    trading.error;
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    summary: {
      customers: customers.count ?? 0,
      pendingDeposits: deposits.count ?? 0,
      pendingWithdrawals: withdrawals.count ?? 0,
      pendingKyc: kyc.count ?? 0,
      ledgerTransactions: ledger.data?.length ?? 0,
      investmentPositions: investments.data?.length ?? 0,
      tradingOrders: trading.data?.length ?? 0,
    },
    ledger: ledger.data ?? [],
    investments: investments.data ?? [],
    trading: trading.data ?? [],
  });
}
