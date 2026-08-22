"use client";
import {
  IconBell,
  IconBulb,
  IconChartLine,
  IconCheck,
  IconShieldCheck,
} from "@tabler/icons-react";
import { LightweightMarketChart } from "./LightweightMarketChart";
import { MarketsTable, MoversList } from "./MarketCards";
import {
  formatCompactUsd,
  formatUsd,
  useLivePrices,
} from "@/lib/use-live-prices";

export function SignInMarketPanel() {
  const btc = useLivePrices().prices.bitcoin;
  return (
    <div className="grid gap-4">
      <section className="surface p-5 shadow-[var(--shadow)]">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Market Snapshot</h2>
          <span className="text-xs text-[#28c76f]">● Live</span>
        </div>
        <div className="mt-5 flex items-end justify-between">
          <div>
            <span className="text-xs text-muted">BTC/USDT</span>
            <strong className="metric-value mt-1 block text-3xl">
              {btc ? formatUsd(btc.price).replace("$", "") : "Loading…"}{" "}
              <small
                className={
                  btc?.change24h != null && btc.change24h < 0
                    ? "text-xs text-[#ff4d43]"
                    : "text-xs text-[#28c76f]"
                }
              >
                {btc?.change24h == null
                  ? "—"
                  : `${btc.change24h >= 0 ? "+" : ""}${btc.change24h.toFixed(2)}%`}
              </small>
            </strong>
          </div>
        </div>
        <div className="mt-3 flex gap-2 text-[10px]">
          {["1D", "1W", "1M", "1Y"].map((period, index) => (
            <span
              key={period}
              className={`rounded px-2 py-1 ${index === 0 ? "bg-[var(--amber)] text-black" : "text-muted"}`}
            >
              {period}
            </span>
          ))}
        </div>
        <LightweightMarketChart asset="bitcoin" days={7} height={190} />
        <div
          className="grid grid-cols-3 gap-3 border-t pt-4 text-xs"
          style={{ borderColor: "var(--border)" }}
        >
          {[
            ["Current", btc ? formatUsd(btc.price) : "—"],
            [
              "Market Cap",
              btc?.marketCap == null ? "—" : formatCompactUsd(btc.marketCap),
            ],
            [
              "24h Volume",
              btc?.volume24h == null ? "—" : formatCompactUsd(btc.volume24h),
            ],
          ].map(([l, v]) => (
            <div key={l}>
              <span className="block text-muted">{l}</span>
              <strong className="mt-1 block">{v}</strong>
            </div>
          ))}
        </div>
      </section>
      <section className="surface p-5">
        <h2 className="mb-4 font-semibold">Top Movers (24h)</h2>
        <MoversList />
      </section>
    </div>
  );
}

export function BenefitsPanel() {
  const items = [
    [
      IconChartLine,
      "Live market data",
      "Real-time prices and charts across 100+ exchanges.",
    ],
    [
      IconBulb,
      "Actionable insights",
      "Track trends and uncover opportunities with advanced analytics.",
    ],
    [
      IconBell,
      "Smart alerts",
      "Get instant notifications on price moves and market events.",
    ],
    [
      IconShieldCheck,
      "Secure access",
      "Enterprise-grade security to protect your account and data.",
    ],
  ] as const;
  return (
    <aside className="surface-soft p-7">
      <h2 className="mb-5 text-lg font-semibold">
        Why traders choose Korvesta
      </h2>
      <div className="grid gap-4">
        {items.map(([Icon, title, desc]) => (
          <div key={title} className="surface flex gap-4 p-5">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#fff4cf] text-[#e8a900]">
              <Icon size={24} />
            </span>
            <div>
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-1 text-xs leading-5 text-muted">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

export function SecurityPanel() {
  return (
    <aside className="surface grid min-h-[540px] content-center justify-items-center overflow-hidden p-8 text-center">
      <div
        className="relative grid h-56 w-56 place-items-center rounded-[48px] border bg-[var(--surface-2)] shadow-2xl rotate-[-6deg]"
        style={{ borderColor: "var(--border)" }}
      >
        <IconShieldCheck
          size={110}
          stroke={1.2}
          className="text-[var(--amber)]"
        />
        <span
          className="absolute -bottom-5 rounded-xl border bg-[var(--surface-3)] px-8 py-3 text-xl tracking-[.45em]"
          style={{ borderColor: "var(--border)" }}
        >
          ••••
        </span>
      </div>
      <h2 className="mt-14 text-2xl font-semibold">
        One more step for security
      </h2>
      <p className="mt-3 max-w-sm leading-6 text-muted">
        We&apos;ve sent a verification code to your email. Enter it to confirm
        your identity and complete the sign-in process.
      </p>
      <div className="mt-8 flex gap-2">
        <span className="h-2 w-2 rounded-full bg-[var(--amber)]" />
        <span className="h-2 w-2 rounded-full bg-[var(--border)]" />
        <span className="h-2 w-2 rounded-full bg-[var(--border)]" />
      </div>
    </aside>
  );
}

export function SuccessPreview() {
  return (
    <div className="surface w-full max-w-[670px] p-5 shadow-[var(--shadow)]">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Markets Overview</h2>
          <p className="mt-1 text-xs text-muted">
            Real-time market data, trends and analytics
          </p>
        </div>
        <span className="surface-soft px-4 py-2 text-xs text-muted">
          Search markets...
        </span>
      </div>
      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="surface-soft p-3">
          <span className="text-[10px] text-muted">Total Market Cap</span>
          <strong className="mt-2 block">$2.47T</strong>
        </div>
        <div className="surface-soft p-3">
          <span className="text-[10px] text-muted">24h Volume</span>
          <strong className="mt-2 block">$125.68B</strong>
        </div>
        <div className="surface-soft p-3">
          <span className="text-[10px] text-muted">BTC Dominance</span>
          <strong className="mt-2 block">52.41%</strong>
        </div>
      </div>
      <MarketsTable limit={4} />
    </div>
  );
}

export function SuccessMark() {
  return (
    <div className="grid h-20 w-20 place-items-center rounded-full bg-[#daf6e2] text-[#2dae58] ring-8 ring-[#effbf2]">
      <IconCheck size={42} stroke={3} />
    </div>
  );
}
