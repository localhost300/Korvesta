import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { tradingPrices } from "@/lib/providers/market-quotes";
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
  if (product === "futures") {
    const [{ data: wallet }, { data: futures }] = await Promise.all([
      supabase.rpc("ensure_futures_wallet"),
      supabase.from("futures_positions").select("asset_id,quantity,entry_price,leverage,margin,realised_pnl,liquidation_price,stop_loss,take_profit,assets(symbol)").eq("account_id", account.id).neq("quantity", 0),
    ]);
    const symbols=(futures??[]).map(p=>(p.assets as unknown as {symbol:string}).symbol).filter((s):s is keyof typeof tradingAssets=>s in tradingAssets);
    const market=symbols.length?await tradingPrices(symbols):{};
    const positions=(futures??[]).map(p=>{const symbol=(p.assets as unknown as {symbol:keyof typeof tradingAssets}).symbol;const price=market[symbol]??0;const quantity=Number(p.quantity);const entry=Number(p.entry_price);const unrealisedPnl=quantity>0?(price-entry)*quantity:(entry-price)*Math.abs(quantity);return {assetId:p.asset_id,symbol,quantity,averageCost:entry,entryPrice:entry,price,value:Number(p.margin)+unrealisedPnl,margin:Number(p.margin),leverage:Number(p.leverage),liquidationPrice:Number(p.liquidation_price),stopLoss:p.stop_loss==null?null:Number(p.stop_loss),takeProfit:p.take_profit==null?null:Number(p.take_profit),realisedPnl:Number(p.realised_pnl),unrealisedPnl};});
    const cash=Number(wallet?.cash_balance??0);return NextResponse.json({account:{...account,cash_balance:String(cash)},positions,equity:cash+positions.reduce((sum,p)=>sum+p.margin+p.unrealisedPnl,0),execution});
  }
  const { data: positions } = await supabase
    .from("trading_positions")
    .select("quantity,average_cost,realised_pnl,assets(symbol)")
    .eq("account_id", account.id);
  const symbols = (positions ?? [])
    .map((p) => (p.assets as unknown as { symbol: string })?.symbol)
    .filter((s): s is keyof typeof tradingAssets => s in tradingAssets);
  const market = symbols.length ? await tradingPrices(symbols) : {};
  const enriched = (positions ?? []).map((p) => {
    const symbol = (p.assets as unknown as { symbol: string })
      .symbol as keyof typeof tradingAssets;
    const price = market[symbol] ?? 0;
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
