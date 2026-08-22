import { NextResponse } from "next/server";
import { tradingAssets } from "@/lib/trading";
export async function GET(request: Request) {
  const symbol = (
    new URL(request.url).searchParams.get("symbol") ?? "BTC"
  ).toUpperCase();
  if (!(symbol in tradingAssets))
    return NextResponse.json({ error: "Unsupported symbol." }, { status: 400 });
  const response = await fetch(
    `https://data-api.binance.vision/api/v3/depth?symbol=${symbol}USDT&limit=20`,
    { cache: "no-store" },
  );
  return response.ok
    ? NextResponse.json(await response.json())
    : NextResponse.json({ error: "Order book unavailable." }, { status: 502 });
}
