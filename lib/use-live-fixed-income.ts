"use client";
import { useEffect, useState } from "react";
import type { LivePrice } from "./use-live-prices";
import { traditionalTradingSymbols } from "./trading";
const symbols = [...traditionalTradingSymbols, "^TNX", "^IRX"];
export function useLiveFixedIncome() {
  const [prices, setPrices] = useState<Record<string, LivePrice>>({});
  useEffect(() => {
    let active = true;
    const refresh = () =>
      fetch(
        `/api/market/prices?symbols=${encodeURIComponent(symbols.join(","))}`,
      )
        .then((r) => r.json())
        .then((body) => {
          if (active && body.data) setPrices(body.data);
        })
        .catch(() => {});
    void refresh();
    const timer = setInterval(refresh, 30000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);
  return prices;
}
