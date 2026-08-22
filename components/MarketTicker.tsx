"use client";
import { assets } from "@/lib/data";
import { changeClass, formatChange } from "@/lib/utils";
import styles from "./MarketTicker.module.css";
import {
  coinGeckoIdBySymbol,
  formatUsd,
  useLivePrices,
} from "@/lib/use-live-prices";

export function MarketTicker() {
  const { prices } = useLivePrices();
  const currentAssets = assets.map((asset) => {
    const live = prices[coinGeckoIdBySymbol[asset.symbol]];
    return live
      ? {
          ...asset,
          price: formatUsd(live.price),
          change24h: live.change24h ?? asset.change24h,
        }
      : asset;
  });
  return (
    <div
      className={`${styles.viewport} border-b`}
      style={{
        borderColor: "var(--border-soft)",
        background: "var(--surface)",
      }}
      role="region"
      aria-label="Market price ticker"
    >
      <div className={`${styles.track} h-10 text-[11px]`}>
        {[false, true].map((duplicate) => (
          <div
            key={duplicate ? "duplicate" : "primary"}
            className={styles.group}
            aria-hidden={duplicate}
          >
            {currentAssets.map((asset) => (
              <div key={asset.symbol} className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: asset.colour }}
                />
                <span className="font-semibold">{asset.symbol}/USDT</span>
                <span className="text-muted">
                  {asset.price.replace("$", "")}
                </span>
                <span className={changeClass(asset.change24h)}>
                  {formatChange(asset.change24h)}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
