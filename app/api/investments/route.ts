import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  enforceRateLimit,
  rejectCrossSiteMutation,
} from "@/lib/security/request";
import { requireActiveCustomer } from "@/lib/security/account-status";
import { sendTransactionalEmail } from "@/lib/email";
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
  const [plans, positions] = await Promise.all([
    supabase
      .from("investment_plans")
      .select(
        "id,name,description,apy_bps,duration_days,minimum_amount,maximum_amount",
      )
      .eq("active", true)
      .order("apy_bps"),
    supabase
      .from("investment_positions")
      .select(
        "id,principal,apy_bps,accrued_return,status,started_on,maturity_on,last_accrual_date,investment_plans(name)",
      )
      .order("created_at", { ascending: false }),
  ]);
  if (plans.error || positions.error)
    return NextResponse.json(
      { error: plans.error?.message ?? positions.error?.message },
      { status: 500 },
    );
  return NextResponse.json({ plans: plans.data, positions: positions.data });
}
export async function POST(request: Request) {
  const crossSite = rejectCrossSiteMutation(request);
  if (crossSite) return crossSite;
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
    "investment_create",
  );
  if (blocked) return blocked;
  const limited = await enforceRateLimit(
    request,
    "investment-create",
    10,
    3600,
    user.id,
  );
  if (limited) return limited;
  const body = (await request.json().catch(() => null)) as {
    planId?: string;
    amount?: number;
    idempotencyKey?: string;
  } | null;
  const amount = Number(body?.amount);
  if (
    !body?.planId ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    !body.idempotencyKey
  )
    return NextResponse.json(
      { error: "Plan, positive amount and idempotency key are required." },
      { status: 400 },
    );
  const { data, error } = await supabase.rpc("subscribe_fixed_investment", {
    requested_plan: body.planId,
    requested_amount: amount,
    request_key: body.idempotencyKey,
  });
  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });
  if (user.email) {
    await sendTransactionalEmail({
      to: user.email,
      subject: "Your fixed-APY investment is active",
      heading: "Investment started",
      message:
        "Your investment was created successfully. Returns will accrue according to the plan schedule.",
      details: [
        ["Principal", String(amount)],
        ["Status", "Active"],
      ],
      actionLabel: "View investments",
      actionPath: "/dashboard/investments",
      idempotencyKey: `investment-created-${String(data)}`,
    });
  }
  return NextResponse.json({ data }, { status: 201 });
}
