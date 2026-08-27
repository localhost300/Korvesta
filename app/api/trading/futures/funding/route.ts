import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { tradingPrices } from "@/lib/providers/market-quotes";
import { tradingAssets, type TradingSymbol } from "@/lib/trading";

export async function POST(request:Request){
 const secret=process.env.TRADING_CRON_SECRET??process.env.CRON_SECRET;if(!secret||request.headers.get("authorization")!==`Bearer ${secret}`)return NextResponse.json({error:"Unauthorised."},{status:401});
 const admin=createAdminClient();if(!admin)return NextResponse.json({error:"Service role is unavailable."},{status:503});
 const {data:assets,error}=await admin.from("futures_positions").select("asset_id,assets(symbol)").neq("quantity",0);if(error)return NextResponse.json({error:error.message},{status:500});
 const unique=[...new Map((assets??[]).map(item=>[item.asset_id,item])).values()];const symbols=unique.map(item=>(item.assets as unknown as {symbol:TradingSymbol}).symbol).filter(symbol=>symbol in tradingAssets);const prices=await tradingPrices(symbols);let processed=0;
 for(const item of unique){const symbol=(item.assets as unknown as {symbol:TradingSymbol}).symbol;const price=prices[symbol];if(!price)continue;const result=await admin.rpc("process_futures_funding",{requested_asset:item.asset_id,mark_price:price,rate_bps:1});if(!result.error)processed+=Number(result.data??0);}
 return NextResponse.json({assets:unique.length,processed,rateBps:1});
}
export { POST as GET };
