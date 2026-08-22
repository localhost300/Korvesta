import { NextResponse } from "next/server";
import { coinGecko } from "@/lib/providers/coingecko";
const allowed = new Set(["bitcoin","ethereum","tether","solana","binancecoin","ripple"]);
export async function GET(request: Request) { const ids = (new URL(request.url).searchParams.get("ids") ?? "bitcoin,ethereum,tether,solana,binancecoin,ripple").split(",").filter((id) => allowed.has(id)).slice(0,20); try { return NextResponse.json({ data: await coinGecko.prices(ids), provider: "coingecko" }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Market data unavailable." }, { status: 502 }); } }
