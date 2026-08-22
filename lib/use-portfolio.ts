"use client";
import { useCallback, useEffect, useState } from "react";
export type PortfolioPosition = {
  assetId: string;
  symbol: string;
  available: string;
  held: string;
  invested: string;
  quantity: string;
  price: string;
  value: string;
  allocation: number;
};
type Portfolio = {
  positions: PortfolioPosition[];
  totalValue: string;
  availableValue: string;
  heldValue: string;
  investedValue: string;
  updatedAt: number | null;
  provider: string;
};
const empty: Portfolio = {
  positions: [],
  totalValue: "0",
  availableValue: "0",
  heldValue: "0",
  investedValue: "0",
  updatedAt: null,
  provider: "ledger",
};
export function usePortfolio() {
  const [portfolio, setPortfolio] = useState(empty);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/portfolio", { cache: "no-store" });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.error ?? "Unable to load portfolio.");
      setPortfolio(body);
      setError(null);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to load portfolio.",
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    const initial = window.setTimeout(refresh, 0);
    const timer = window.setInterval(refresh, 15000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
    };
  }, [refresh]);
  return { ...portfolio, loading, error, refresh };
}
