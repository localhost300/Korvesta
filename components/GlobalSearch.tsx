"use client";

import Link from "next/link";
import { IconSearch } from "@tabler/icons-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { assets, navItems } from "@/lib/data";

type SearchArea = "public" | "dashboard" | "admin";
const dashboardPages = [
  ["Overview", "/dashboard"],
  ["Investment Portfolio", "/dashboard/portfolio"],
  ["Markets", "/dashboard/markets"],
  ["Spot Trading", "/dashboard/trade"],
  ["Futures Trading", "/dashboard/trade/futures"],
  ["Demo Trading", "/dashboard/trade/demo"],
  ["AI Trading Bots", "/dashboard/ai-trading"],
  ["Earn", "/dashboard/earn"],
  ["Wallet", "/dashboard/wallet"],
  ["Transactions", "/dashboard/transactions"],
  ["Security", "/dashboard/security"],
  ["KYC Verification", "/dashboard/kyc"],
  ["VIP & Referrals", "/dashboard/referrals"],
  ["Settings", "/dashboard/settings"],
] as const;
const adminPages = [
  ["Overview", "/admin"],
  ["Customers", "/admin/customers"],
  ["KYC & Compliance", "/admin/kyc"],
  ["Deposits & Withdrawals", "/admin/payments"],
  ["Deposit Methods", "/admin/payments/methods"],
  ["Transaction Ledger", "/admin/transactions"],
  ["Investments", "/admin/investments"],
  ["Trading Oversight", "/admin/trading"],
  ["Bots & Copy Trading", "/admin/bots"],
  ["Staking & Earn", "/admin/staking"],
  ["Support Tickets", "/admin/support"],
  ["Communications", "/admin/communications"],
  ["Reports", "/admin/reports"],
  ["Audit Logs", "/admin/audit"],
  ["Team & Roles", "/admin/team"],
  ["Settings", "/admin/settings"],
] as const;

export function GlobalSearch({
  area,
  className = "",
}: {
  area: SearchArea;
  className?: string;
}) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const resultsId = useId();
  const root = useRef<HTMLDivElement>(null);
  const pages = useMemo(
    () =>
      area === "admin"
        ? adminPages
        : area === "dashboard"
          ? dashboardPages
          : navItems.map(({ label, href }) => [label, href] as const),
    [area],
  );
  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return [];
    const pageResults = pages
      .filter(([label]) => label.toLowerCase().includes(term))
      .map(([label, href]) => ({ label, detail: "Page", href }));
    const marketHref = area === "dashboard" ? "/dashboard/markets" : "/markets";
    const marketResults =
      area === "admin"
        ? []
        : assets
            .filter((asset) =>
              `${asset.symbol} ${asset.name}`.toLowerCase().includes(term),
            )
            .map((asset) => ({
              label: asset.name,
              detail: `${asset.symbol} · ${asset.price}`,
              href: `${marketHref}?q=${encodeURIComponent(asset.symbol)}`,
            }));
    return [...pageResults, ...marketResults].slice(0, 8);
  }, [area, pages, query]);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setFocused(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div ref={root} className={`relative ${className}`}>
      <IconSearch
        size={17}
        className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-[var(--dash-muted,var(--muted))]"
      />
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => setFocused(true)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setFocused(false);
        }}
        className={
          area === "public"
            ? "field h-10 w-full pl-10 pr-4 text-xs"
            : "dash-input h-10 w-full pl-10"
        }
        placeholder={
          area === "admin"
            ? "Search customers, transactions, KYC or tickets..."
            : "Search assets, markets, or features..."
        }
        aria-label="Search"
        role="combobox"
        aria-autocomplete="list"
        aria-controls={resultsId}
        aria-expanded={focused && Boolean(query.trim())}
        autoComplete="off"
      />
      {focused && query.trim() ? (
        <div
          id={resultsId}
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+8px)] z-[120] max-h-[360px] overflow-y-auto rounded-xl border border-[var(--dash-line,var(--border))] bg-[var(--dash-card,var(--surface))] p-2 shadow-2xl"
        >
          {results.length ? (
            results.map((result) => (
              <Link
                key={`${result.href}-${result.label}`}
                href={result.href}
                onClick={() => {
                  setFocused(false);
                  setQuery("");
                }}
                className="flex items-center justify-between gap-4 rounded-lg px-3 py-3 text-xs hover:bg-[var(--dash-card-2,var(--surface-2))]"
              >
                <strong>{result.label}</strong>
                <span className="shrink-0 text-[var(--dash-muted,var(--muted))]">
                  {result.detail}
                </span>
              </Link>
            ))
          ) : (
            <p className="px-3 py-5 text-center text-xs text-[var(--dash-muted,var(--muted))]">
              No matching results
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
