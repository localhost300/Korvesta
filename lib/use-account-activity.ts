"use client";
import { useCallback, useEffect, useState } from "react";

export type AccountActivity = {
  id: string;
  activity_type: string;
  asset_symbol: string;
  amount: string;
  status: string;
  reference: string;
  occurred_at: string;
};
export function useAccountActivity() {
  const [transactions, setTransactions] = useState<AccountActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/transactions", { cache: "no-store" });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.error ?? "Unable to load transactions.");
      setTransactions(body.transactions);
      setError(null);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to load transactions.",
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
  return { transactions, loading, error, refresh };
}
