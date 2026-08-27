import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { coinGecko } from "@/lib/providers/coingecko";
import { tradingAssets } from "@/lib/trading";
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
  const execution = { enabled: true, configured: true, testnet: false, provider: "korvesta" };
  const { data: account, error } = await supabase.rpc(
    "ensure_trading_account",
    { requested_mode: mode },
  );
  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });
  const { data: positions } = await supabase
    .from("trading_positions")
    .select("quantity,average_cost,realised_pnl,assets(symbol)")
    .eq("account_id", account.id);
  const symbols = (positions ?? [])
    .map((p) => (p.assets as unknown as { symbol: string })?.symbol)
    .filter((s): s is keyof typeof tradingAssets => s in tradingAssets);
  const market = symbols.length
    ? await coinGecko.prices(symbols.map((s) => tradingAssets[s]))
    : {};
  const enriched = (positions ?? []).map((p) => {
    const symbol = (p.assets as unknown as { symbol: string })
      .symbol as keyof typeof tradingAssets;
    const price = market[tradingAssets[symbol]]?.price ?? 0;
    return {
      symbol,
      quantity: Number(p.quantity),
      averageCost: Number(p.average_cost),
      realisedPnl: Number(p.realised_pnl),
      price,
      value: Number(p.quantity) * price,
      unrealisedPnl: (price - Number(p.average_cost)) * Number(p.quantity),
    };
  });
  return NextResponse.json({
    account,
    positions: enriched,
    equity:
      Number(account.cash_balance) + enriched.reduce((s, p) => s + p.value, 0),
    execution,
  });
}
