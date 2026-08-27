import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { tradingPrices } from "@/lib/providers/market-quotes";
import { parseOrderInput } from "@/lib/trading";
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
  const product = new URL(request.url).searchParams.get("product") ?? "spot";
  const mode = product === "demo" ? "paper" : "live";
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
    .eq("product", product)
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
    {
      const market = await tradingPrices([input.symbol]);
      const price = market[input.symbol];
      if (!price) throw new Error("A current market price is unavailable.");
      if (input.product === "futures") {
        if (input.type !== "market") throw new Error("Futures limit and stop orders are not enabled yet.");
        const { data, error } = await supabase.rpc("place_korvesta_futures_order", {
          asset: asset.id,
          requested_side: input.side,
          requested_quantity: input.quantity,
          market_price: price,
          requested_leverage: input.leverage,
          request_key: input.idempotencyKey,
          fee_rate: 0.0005,
        });
        if (error) throw new Error(error.message);
        return NextResponse.json({ data, engine: "korvesta" }, { status: 201 });
      }
      if (input.type.startsWith("stop_")) throw new Error("Stop orders are temporarily unavailable in the Korvesta engine.");
      const { data, error } = await supabase.rpc("place_korvesta_spot_order", {
            asset: asset.id,
            requested_side: input.side,
            requested_type: input.type,
            requested_quantity: input.quantity,
            requested_limit: input.limitPrice ?? null,
            market_price: price,
            request_key: input.idempotencyKey,
            is_demo: input.product === "demo",
            fee_rate: 0.001,
      });
      if (error) throw new Error(error.message);
      return NextResponse.json({ data, engine: "korvesta" }, { status: 201 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Order failed." },
      { status: 400 },
    );
  }
}
