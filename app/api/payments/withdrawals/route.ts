import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { encryptPaymentData } from "@/lib/payment-crypto";
import {
  enforceRateLimit,
  rejectCrossSiteMutation,
} from "@/lib/security/request";
import { requireActiveCustomer } from "@/lib/security/account-status";
import { sendTransactionalEmail } from "@/lib/email";

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
    "withdrawal_create",
  );
  if (blocked) return blocked;
  const limited = await enforceRateLimit(
    request,
    "withdrawal-create",
    5,
    3600,
    user.id,
  );
  if (limited) return limited;
  const body = (await request.json().catch(() => null)) as {
    assetId?: string;
    networkId?: string;
    amount?: string;
    destination?: string;
    requestKey?: string;
  } | null;
  if (
    !body?.assetId ||
    !body.networkId ||
    !body.amount ||
    !body.destination?.trim() ||
    !body.requestKey
  )
    return NextResponse.json(
      { error: "Complete every withdrawal field." },
      { status: 400 },
    );
  const { data: network, error: networkError } = await supabase
    .from("networks")
    .select("id,asset_id,enabled")
    .eq("id", body.networkId)
    .eq("asset_id", body.assetId)
    .eq("enabled", true)
    .maybeSingle();
  if (networkError || !network)
    return NextResponse.json(
      { error: "The selected network is unavailable for this asset." },
      { status: 400 },
    );
  let destination: string;
  try {
    destination = await encryptPaymentData(body.destination.trim());
  } catch (cause) {
    return NextResponse.json(
      {
        error:
          cause instanceof Error
            ? cause.message
            : "Destination encryption failed.",
      },
      { status: 500 },
    );
  }
  const { data, error } = await supabase.rpc("create_withdrawal", {
    asset: body.assetId,
    network: body.networkId,
    amount: body.amount,
    // Network-fee configuration is not available yet. The server owns this
    // value so a client can never reduce a configured fee.
    fee: "0",
    destination,
    request_key: body.requestKey,
  });
  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });
  if (user.email) {
    await sendTransactionalEmail({
      to: user.email,
      subject: "Withdrawal request received",
      heading: "Withdrawal pending",
      message:
        "Your withdrawal request was received and the requested funds are now held while it is reviewed.",
      details: [
        ["Amount", body.amount],
        ["Status", "Pending review"],
      ],
      actionLabel: "View transactions",
      actionPath: "/dashboard/transactions",
      idempotencyKey: `withdrawal-requested-${data}`,
    });
  }
  return NextResponse.json({ id: data, status: "pending" }, { status: 201 });
}
