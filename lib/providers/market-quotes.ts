import { coinGecko } from "./coingecko";
import { cryptoTradingAssets, isCryptoTradingSymbol, type TradingSymbol } from "@/lib/trading";

export async function tradingPrices(symbols: TradingSymbol[]) {
  const unique = [...new Set(symbols)];
  const cryptoSymbols = unique.filter(isCryptoTradingSymbol);
  const securitySymbols = unique.filter((symbol) => !isCryptoTradingSymbol(symbol));
  const crypto = cryptoSymbols.length
    ? await coinGecko.prices(cryptoSymbols.map((symbol) => cryptoTradingAssets[symbol]))
    : {};
  const result: Partial<Record<TradingSymbol, number>> = {};
  for (const symbol of cryptoSymbols)
    result[symbol] = crypto[cryptoTradingAssets[symbol]]?.price;
  await Promise.all(securitySymbols.map(async (symbol) => {
    const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1m`, { headers: { "User-Agent": "Mozilla/5.0" }, cache: "no-store" });
    if (!response.ok) return;
    const chart = (await response.json()).chart?.result?.[0];
    const closes = (chart?.indicators?.quote?.[0]?.close ?? []).filter((value: unknown) => typeof value === "number") as number[];
    const price = Number(chart?.meta?.regularMarketPrice ?? closes.at(-1));
    if (Number.isFinite(price) && price > 0) result[symbol] = price;
  }));
  return result;
}
