import "server-only";
import type { MarketDataProvider, OhlcCandle } from "./types";

const base =
  process.env.COINGECKO_API_TIER === "pro"
    ? "https://pro-api.coingecko.com/api/v3"
    : "https://api.coingecko.com/api/v3";
function headers() {
  const key = process.env.COINGECKO_API_KEY;
  return key
    ? {
        [process.env.COINGECKO_API_TIER === "pro"
          ? "x-cg-pro-api-key"
          : "x-cg-demo-api-key"]: key,
      }
    : {};
}
async function request(path: string, revalidate: number) {
  const response = await fetch(`${base}${path}`, {
    headers: headers(),
    next: { revalidate },
  });
  if (!response.ok)
    throw new Error(`CoinGecko request failed (${response.status}).`);
  return response.json();
}

export const coinGecko: MarketDataProvider = {
  async prices(ids, currency = "usd") {
    const data = (await request(
      `/simple/price?ids=${encodeURIComponent(ids.join(","))}&vs_currencies=${encodeURIComponent(currency)}&include_24hr_change=true&include_last_updated_at=true&include_market_cap=true&include_24hr_vol=true`,
      30,
    )) as Record<string, Record<string, number | null>>;
    return Object.fromEntries(
      ids
        .filter((id) => data[id])
        .map((id) => [
          id,
          {
            price: Number(data[id][currency]),
            change24h:
              data[id][`${currency}_24h_change`] == null
                ? null
                : Number(data[id][`${currency}_24h_change`]),
            updatedAt: Number(data[id].last_updated_at),
            marketCap:
              data[id][`${currency}_market_cap`] == null
                ? null
                : Number(data[id][`${currency}_market_cap`]),
            volume24h:
              data[id][`${currency}_24h_vol`] == null
                ? null
                : Number(data[id][`${currency}_24h_vol`]),
          },
        ]),
    );
  },
  async ohlc(id, days = 7) {
    const rows = (await request(
      `/coins/${encodeURIComponent(id)}/ohlc?vs_currency=usd&days=${days}`,
      60,
    )) as number[][];
    return rows.map(([timestamp, open, high, low, close]): OhlcCandle => ({
      time: Math.floor(timestamp / 1000),
      open,
      high,
      low,
      close,
    }));
  },
};
