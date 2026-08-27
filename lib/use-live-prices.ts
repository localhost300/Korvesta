"use client";
import { useSyncExternalStore } from "react";
export type LivePrice = {
  price: number;
  change24h: number | null;
  updatedAt: number;
  marketCap: number | null;
  volume24h: number | null;
};
type Snapshot = {
  prices: Record<string, LivePrice>;
  loading: boolean;
  error: string | null;
};
const ids = [
  "bitcoin",
  "ethereum",
  "tether",
  "solana",
  "binancecoin",
  "ripple",
  "cardano",
  "dogecoin",
  "avalanche-2",
  "polkadot",
  "chainlink",
  "litecoin",
  "bitcoin-cash",
  "uniswap",
  "cosmos",
  "tron",
];
let snapshot: Snapshot = { prices: {}, loading: true, error: null };
let request: Promise<void> | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());
async function refresh() {
  if (request) return request;
  request = fetch(`/api/market/prices?ids=${ids.join(",")}`)
    .then(async (response) => {
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Prices unavailable.");
      snapshot = { prices: body.data, loading: false, error: null };
      emit();
    })
    .catch((error) => {
      snapshot = {
        ...snapshot,
        loading: false,
        error: error instanceof Error ? error.message : "Prices unavailable.",
      };
      emit();
    })
    .finally(() => {
      request = null;
    });
  return request;
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  void refresh();
  if (!timer) timer = setInterval(() => void refresh(), 30_000);
  return () => {
    listeners.delete(listener);
    if (!listeners.size && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}
const serverSnapshot: Snapshot = { prices: {}, loading: true, error: null };
export function useLivePrices() {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => serverSnapshot,
  );
}
export const coinGeckoIdBySymbol: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  USDT: "tether",
  SOL: "solana",
  BNB: "binancecoin",
  XRP: "ripple",
  ADA: "cardano",
  DOGE: "dogecoin",
  AVAX: "avalanche-2",
  DOT: "polkadot",
  LINK: "chainlink",
  LTC: "litecoin",
  BCH: "bitcoin-cash",
  UNI: "uniswap",
  ATOM: "cosmos",
  TRX: "tron",
};
export function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: value < 1 ? 4 : 2,
    maximumFractionDigits: value < 1 ? 6 : 2,
  }).format(value);
}
export function formatCompactUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}
