import { NextResponse } from "next/server";
import { coinGecko } from "@/lib/providers/coingecko";
const allowed = new Set(["bitcoin","ethereum","solana","binancecoin","ripple"]);
export async function GET(request: Request) { const url = new URL(request.url); const id = url.searchParams.get("asset") ?? "bitcoin"; const days = Number(url.searchParams.get("days") ?? 7); if (!allowed.has(id) || ![1,7,14,30,90,180,365].includes(days)) return NextResponse.json({ error: "Unsupported market query." }, { status: 400 }); try { return NextResponse.json({ data: await coinGecko.ohlc(id, days), provider: "coingecko" }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Chart data unavailable." }, { status: 502 }); } }
