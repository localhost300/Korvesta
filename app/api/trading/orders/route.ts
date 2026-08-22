import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { coinGecko } from "@/lib/providers/coingecko";
import { executionStatus, placeBinanceOrder } from "@/lib/providers/binance";
import { parseOrderInput, tradingAssets } from "@/lib/trading";
import { rejectCrossSiteMutation } from "@/lib/security/request";
import { requireActiveCustomer } from "@/lib/security/account-status";

export async function GET(request: Request) {
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
  const mode =
    new URL(request.url).searchParams.get("mode") === "live" ? "live" : "paper";
  const { data: account, error: accountError } = await supabase.rpc(
    "ensure_trading_account",
    { requested_mode: mode },
  );
  if (accountError)
    return NextResponse.json({ error: accountError.message }, { status: 400 });
  const { data: orders, error } = await supabase
    .from("trading_orders")
    .select(
      "id,pair,side,order_type,quantity,executed_quantity,limit_price,stop_price,triggered_at,fill_price,fee,status,provider,external_order_id,provider_updated_at,created_at,filled_at",
    )
    .eq("account_id", account.id)
    .order("created_at", { ascending: false })
    .limit(100);
  return error
    ? NextResponse.json({ error: error.message }, { status: 500 })
    : NextResponse.json({ data: orders, account });
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
    "trading_order_create",
  );
  if (blocked) return blocked;
  let input;
  try {
    input = parseOrderInput(await request.json());
  } catch (error) {
    if (input?.mode === "live")
      await supabase.rpc("mark_live_execution", {
        request_key: input.idempotencyKey,
        next_state: "unknown",
        provider_order_id: null,
        error_message: error instanceof Error ? error.message : "Order failed.",
      });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid order." },
      { status: 400 },
    );
  }
  const { data: rateAccount } = await supabase
    .from("trading_accounts")
    .select("id")
    .eq("user_id", user.id)
    .eq("mode", input.mode)
    .maybeSingle();
  if (rateAccount) {
    const since = new Date(Date.now() - 60_000).toISOString();
    const { count } = await supabase
      .from("trading_orders")
      .select("id", { count: "exact", head: true })
      .eq("account_id", rateAccount.id)
      .gte("created_at", since);
    if ((count ?? 0) >= 10)
      return NextResponse.json(
        { error: "Order rate limit reached. Wait one minute and try again." },
        { status: 429 },
      );
  }
  const { data: asset } = await supabase
    .from("assets")
    .select("id")
    .eq("symbol", input.symbol)
    .eq("enabled", true)
    .single();
  if (!asset)
    return NextResponse.json({ error: "Unsupported asset." }, { status: 400 });
  try {
    if (input.mode === "paper") {
      const market = await coinGecko.prices([tradingAssets[input.symbol]]);
      const price = market[tradingAssets[input.symbol]]?.price;
      if (!price) throw new Error("A current market price is unavailable.");
      const procedure = input.type.startsWith("stop_")
        ? "place_paper_stop_order"
        : "place_paper_order";
      const parameters = input.type.startsWith("stop_")
        ? {
            asset: asset.id,
            requested_side: input.side,
            requested_type: input.type,
            requested_quantity: input.quantity,
            requested_stop: input.stopPrice,
            requested_limit: input.limitPrice ?? null,
            market_price: price,
            request_key: input.idempotencyKey,
          }
        : {
            asset: asset.id,
            requested_side: input.side,
            requested_type: input.type,
            requested_quantity: input.quantity,
            requested_limit: input.limitPrice ?? null,
            market_price: price,
            request_key: input.idempotencyKey,
            fee_rate: 0.001,
          };
      const { data, error } = await supabase.rpc(procedure, parameters);
      if (error) throw new Error(error.message);
      return NextResponse.json({ data, marketPrice: price }, { status: 201 });
    }
    const execution = executionStatus();
    if (!execution.testnet) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if (profile?.role !== "admin")
        throw new Error(
          "Mainnet execution is restricted to administrators until per-user exchange accounts are implemented.",
        );
    }
    const prepared = await supabase.rpc("prepare_live_execution", {
      request_key: input.idempotencyKey,
      requested_pair: `${input.symbol}/USDT`,
      request_payload: input,
    });
    if (prepared.error)
      throw new Error(
        `Could not prepare durable execution: ${prepared.error.message}`,
      );
    if (prepared.data?.state !== "prepared")
      throw new Error(
        `This execution key is already ${prepared.data?.state}; reconcile it instead of submitting again.`,
      );
    const claim = await supabase.rpc("claim_live_execution", {
      request_key: input.idempotencyKey,
    });
    if (claim.error || !claim.data)
      throw new Error(
        "This order is already being submitted or requires reconciliation.",
      );
    const placed = await placeBinanceOrder(input);
    await supabase.rpc("mark_live_execution", {
      request_key: input.idempotencyKey,
      next_state: "submitted",
      provider_order_id: String(placed.orderId),
      error_message: null,
    });
    const fills = Array.isArray(placed.fills)
      ? (placed.fills as Array<Record<string, string>>)
      : [];
    const fillPrice =
      Number(placed.executedQty) > 0
        ? Number(placed.cummulativeQuoteQty) / Number(placed.executedQty)
        : null;
    const fee = fills.reduce(
      (sum, item) => sum + Number(item.commission || 0),
      0,
    );
    const { data, error } = await supabase.rpc("record_live_order_v2", {
      asset: asset.id,
      requested_side: input.side,
      requested_type: input.type,
      requested_quantity: input.quantity,
      requested_limit: input.limitPrice ?? null,
      requested_stop: input.stopPrice ?? null,
      request_key: input.idempotencyKey,
      provider_order_id: String(placed.orderId),
      provider_status: String(placed.status),
      provider_fill: fillPrice,
      provider_fee: fee,
    });
    if (error)
      throw new Error(
        `Order placed but local recording failed: ${error.message}`,
      );
    await supabase.rpc("mark_live_execution", {
      request_key: input.idempotencyKey,
      next_state: "recorded",
      provider_order_id: String(placed.orderId),
      error_message: null,
    });
    return NextResponse.json({ data, provider: "binance" }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Order failed." },
      { status: 400 },
    );
  }
}
