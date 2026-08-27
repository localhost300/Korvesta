import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { tradingPrices } from "@/lib/providers/market-quotes";
import { tradingAssets, type TradingSymbol } from "@/lib/trading";

export async function POST(request:Request){
 const secret=process.env.TRADING_CRON_SECRET??process.env.CRON_SECRET;if(!secret||request.headers.get("authorization")!==`Bearer ${secret}`)return NextResponse.json({error:"Unauthorised."},{status:401});
 const admin=createAdminClient();if(!admin)return NextResponse.json({error:"Service role is unavailable."},{status:503});
 const {data:positions,error}=await admin.from("futures_positions").select("account_id,asset_id,quantity,liquidation_price,stop_loss,take_profit,assets(symbol)").neq("quantity",0);if(error)return NextResponse.json({error:error.message},{status:500});
 const symbols=[...new Set((positions??[]).map(p=>(p.assets as unknown as {symbol:string}).symbol))].filter((s):s is TradingSymbol=>s in tradingAssets);const prices=await tradingPrices(symbols);let closed=0;
 for(const p of positions??[]){const symbol=(p.assets as unknown as {symbol:TradingSymbol}).symbol;const price=prices[symbol];if(!price)continue;const long=Number(p.quantity)>0;const reason=(long&&price<=Number(p.liquidation_price))||(!long&&price>=Number(p.liquidation_price))?"liquidation":p.stop_loss&&((long&&price<=Number(p.stop_loss))||(!long&&price>=Number(p.stop_loss)))?"stop_loss":p.take_profit&&((long&&price>=Number(p.take_profit))||(!long&&price<=Number(p.take_profit)))?"take_profit":null;if(!reason)continue;const result=await admin.rpc("settle_futures_position",{requested_account:p.account_id,requested_asset:p.asset_id,mark_price:price,close_reason:reason,fee_rate:.0005});if(!result.error)closed++;}
 return NextResponse.json({checked:positions?.length??0,closed});
}
export { POST as GET };
