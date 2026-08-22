import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  enforceRateLimit,
  rejectCrossSiteMutation,
} from "@/lib/security/request";
import { requireActiveCustomer } from "@/lib/security/account-status";
import { sendTransactionalEmail } from "@/lib/email";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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
    "investment_redeem",
  );
  if (blocked) return blocked;
  const limited = await enforceRateLimit(
    request,
    "investment-redeem",
    10,
    3600,
    user.id,
  );
  if (limited) return limited;
  const { id } = await params;
  const { error } = await supabase.rpc("redeem_fixed_investment", {
    position_id: id,
    request_key: `investment-redemption:${id}`,
  });
  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });
  if (user.email) {
    await sendTransactionalEmail({
      to: user.email,
      subject: "Investment redemption completed",
      heading: "Funds returned to your balance",
      message:
        "Your matured investment was redeemed successfully and its value was moved to your available balance.",
      actionLabel: "View portfolio",
      actionPath: "/dashboard/portfolio",
      idempotencyKey: `investment-redeemed-${id}`,
    });
  }
  return NextResponse.json({ ok: true });
}
