import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { coinGecko } from "@/lib/providers/coingecko";
import { tradingAssets } from "@/lib/trading";
export async function POST(request: Request) {
  const secret = process.env.TRADING_CRON_SECRET ?? process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`)
    return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  const admin = createAdminClient();
  if (!admin)
    return NextResponse.json(
      { error: "Service role is not configured." },
      { status: 503 },
    );
  const { data: orders, error } = await admin
    .from("trading_orders")
    .select("id,pair,limit_price")
    .eq("provider", "paper")
    .eq("status", "open")
    .limit(200);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  const symbols = [
    ...new Set((orders ?? []).map((o) => o.pair.split("/")[0])),
  ].filter((s): s is keyof typeof tradingAssets => s in tradingAssets);
  const prices = symbols.length
    ? await coinGecko.prices(symbols.map((s) => tradingAssets[s]))
    : {};
  let filled = 0;
  for (const order of orders ?? []) {
    const symbol = order.pair.split("/")[0] as keyof typeof tradingAssets;
    const price = prices[tradingAssets[symbol]]?.price;
    if (!price) continue;
    const result = await admin.rpc("process_paper_order", {
      order_id: order.id,
      market_price: price,
      fee_rate: 0.001,
    });
    if (!result.error && result.data?.status === "filled") filled++;
  }
  return NextResponse.json({ checked: orders?.length ?? 0, filled });
}
export { POST as GET };
