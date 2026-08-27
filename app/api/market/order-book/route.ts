import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
const allowed=new Set(["BTC","ETH","SOL","BNB","XRP"]);
export async function GET(request:Request){
  const symbol=(new URL(request.url).searchParams.get("symbol")??"BTC").toUpperCase();
  if(!allowed.has(symbol))return NextResponse.json({error:"Unsupported market."},{status:400});
  const admin=createAdminClient();
  if(!admin)return NextResponse.json({bids:[],asks:[]});
  const {data}=await admin.from("trading_orders").select("side,limit_price,quantity,executed_quantity").eq("pair",`${symbol}/USDT`).eq("product","spot").eq("status","open").not("limit_price","is",null).limit(200);
  const aggregate=(side:"buy"|"sell")=>Object.entries((data??[]).filter(order=>order.side===side).reduce<Record<string,number>>((levels,order)=>{const price=String(order.limit_price);levels[price]=(levels[price]??0)+Number(order.quantity)-Number(order.executed_quantity??0);return levels},{})).sort(([a],[b])=>side==="buy"?Number(b)-Number(a):Number(a)-Number(b)).slice(0,20).map(([price,quantity])=>[price,String(quantity)]);
  return NextResponse.json({bids:aggregate("buy"),asks:aggregate("sell")});
}
