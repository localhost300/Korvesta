"use client";

import {
  coinGeckoIdBySymbol,
  formatUsd,
  useLivePrices,
} from "./use-live-prices";
import { dashboardAssets as fallbackAssets } from "./dashboard-data";

/** Dashboard balances enriched with the latest shared CoinGecko quote. */
export function useLiveDashboardAssets() {
  const { prices } = useLivePrices();

  return fallbackAssets.map((asset) => {
    const live = prices[coinGeckoIdBySymbol[asset.symbol]];
    if (!live) return asset;

    const balance = Number(asset.balance.replaceAll(",", ""));
    return {
      ...asset,
      price: formatUsd(live.price),
      value: formatUsd(balance * live.price),
      change:
        live.change24h == null
          ? asset.change
          : `${live.change24h >= 0 ? "+" : ""}${live.change24h.toFixed(2)}%`,
    };
  });
}
