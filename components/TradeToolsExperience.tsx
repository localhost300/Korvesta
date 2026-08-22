"use client";

import { useMemo, useState } from "react";
import {
  IconBellRinging,
  IconCalculator,
  IconChartCandle,
  IconChevronRight,
  IconFilter,
  IconFlame,
  IconPercentage,
  IconSearch,
  IconShieldCheck,
  IconTargetArrow,
  IconTrendingUp,
} from "@tabler/icons-react";
import { assets } from "@/lib/data";
import { changeClass, formatChange } from "@/lib/utils";
import { Sparkline } from "./Charts";
import {
  coinGeckoIdBySymbol,
  formatCompactUsd,
  formatUsd,
  useLivePrices,
} from "@/lib/use-live-prices";

const tools = [
  {
    icon: IconCalculator,
    title: "Position Size",
    description:
      "Calculate a position from your account risk and stop distance.",
  },
  {
    icon: IconTargetArrow,
    title: "Risk / Reward",
    description: "Compare potential downside with your planned profit target.",
  },
  {
    icon: IconFilter,
    title: "Market Screener",
    description: "Review assets by momentum, price movement and volume.",
  },
  {
    icon: IconBellRinging,
    title: "Price Alerts",
    description: "Prepare alerts for important levels and market movements.",
  },
];

const inputClass =
  "mt-2 h-11 w-full rounded-lg border bg-[var(--surface-2)] px-3 text-sm outline-none transition focus:border-[var(--amber)] focus:ring-2 focus:ring-[rgba(255,196,0,.12)]";

function NumericInput({
  label,
  value,
  onChange,
  prefix,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  prefix?: string;
  suffix?: string;
}) {
  return (
    <label className="block text-xs font-semibold">
      {label}
      <span className="relative block">
        {prefix ? (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            {prefix}
          </span>
        ) : null}
        <input
          type="number"
          min="0"
          step="any"
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className={`${inputClass} ${prefix ? "pl-8" : ""} ${suffix ? "pr-10" : ""}`}
          style={{ borderColor: "var(--border)" }}
        />
        {suffix ? (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">
            {suffix}
          </span>
        ) : null}
      </span>
    </label>
  );
}

function ResultCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "positive" | "warning";
}) {
  const colour =
    tone === "positive"
      ? "text-[var(--green)]"
      : tone === "warning"
        ? "text-[var(--amber)]"
        : "text-[var(--text)]";

  return (
    <div className="surface-soft p-4">
      <span className="text-[11px] text-muted">{label}</span>
      <strong className={`metric-value mt-2 block text-xl ${colour}`}>
        {value}
      </strong>
    </div>
  );
}

export function TradeToolsExperience() {
  const [balance, setBalance] = useState(10000);
  const [riskPercent, setRiskPercent] = useState(1);
  const [entryPrice, setEntryPrice] = useState(68247.21);
  const [stopPrice, setStopPrice] = useState(67100);
  const [targetPrice, setTargetPrice] = useState(70541.63);
  const [search, setSearch] = useState("");
  const { prices, loading, error } = useLivePrices();

  const liveAssets = useMemo(
    () =>
      assets.slice(0, 6).map((asset) => {
        const live = prices[coinGeckoIdBySymbol[asset.symbol]];
        return live
          ? {
              ...asset,
              price: formatUsd(live.price),
              change24h: live.change24h ?? asset.change24h,
              volume:
                live.volume24h == null
                  ? asset.volume
                  : formatCompactUsd(live.volume24h),
            }
          : asset;
      }),
    [prices],
  );

  const calculation = useMemo(() => {
    const riskAmount = balance * (riskPercent / 100);
    const stopDistance = Math.abs(entryPrice - stopPrice);
    const rewardDistance = Math.abs(targetPrice - entryPrice);
    const positionSize = stopDistance > 0 ? riskAmount / stopDistance : 0;
    const positionValue = positionSize * entryPrice;
    const ratio = stopDistance > 0 ? rewardDistance / stopDistance : 0;

    return { riskAmount, stopDistance, positionSize, positionValue, ratio };
  }, [balance, entryPrice, riskPercent, stopPrice, targetPrice]);

  const filteredAssets = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return liveAssets;

    return liveAssets
      .filter((asset) =>
        `${asset.name} ${asset.symbol}`.toLowerCase().includes(query),
      )
      .slice(0, 6);
  }, [liveAssets, search]);

  return (
    <div className="container-shell py-10">
      <section className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div>
          <h1 className="text-4xl font-semibold tracking-[-.045em] sm:text-5xl">
            Trade with a plan.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
            Calculate risk, screen markets and prepare trading levels before
            placing a position.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-[rgba(40,199,111,.12)] text-[var(--green)]">
            <IconShieldCheck size={19} />
          </span>
          Calculations stay on your device
        </div>
      </section>

      <section className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {tools.map(({ icon: Icon, title, description }) => (
          <article key={title} className="surface p-5">
            <div className="flex items-start justify-between gap-4">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-[rgba(255,196,0,.1)] text-[var(--amber)]">
                <Icon size={21} />
              </span>
              <IconChevronRight size={17} className="text-muted" />
            </div>
            <h2 className="mt-5 font-semibold">{title}</h2>
            <p className="mt-2 text-xs leading-5 text-muted">{description}</p>
          </article>
        ))}
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[1.12fr_.88fr]">
        <div className="surface p-6">
          <div
            className="flex flex-col justify-between gap-4 border-b pb-5 sm:flex-row sm:items-center"
            style={{ borderColor: "var(--border-soft)" }}
          >
            <div>
              <h2 className="text-xl font-semibold">
                Position Size Calculator
              </h2>
              <p className="mt-1 text-xs text-muted">
                Set the maximum account risk for this trade.
              </p>
            </div>
            <span className="rounded-lg bg-[rgba(255,196,0,.1)] px-3 py-2 text-xs font-semibold text-[var(--amber)]">
              BTC / USDT
            </span>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <NumericInput
              label="Account balance"
              prefix="$"
              value={balance}
              onChange={setBalance}
            />
            <NumericInput
              label="Risk per trade"
              suffix="%"
              value={riskPercent}
              onChange={setRiskPercent}
            />
            <NumericInput
              label="Entry price"
              prefix="$"
              value={entryPrice}
              onChange={setEntryPrice}
            />
            <NumericInput
              label="Stop-loss price"
              prefix="$"
              value={stopPrice}
              onChange={setStopPrice}
            />
            <div className="sm:col-span-2">
              <NumericInput
                label="Target price"
                prefix="$"
                value={targetPrice}
                onChange={setTargetPrice}
              />
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <ResultCard
              label="Amount at risk"
              value={`$${calculation.riskAmount.toFixed(2)}`}
              tone="warning"
            />
            <ResultCard
              label="Position size"
              value={`${calculation.positionSize.toFixed(5)} BTC`}
            />
            <ResultCard
              label="Position value"
              value={`$${calculation.positionValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
            />
            <ResultCard
              label="Risk / reward"
              value={`1 : ${calculation.ratio.toFixed(2)}`}
              tone="positive"
            />
          </div>
        </div>

        <div className="surface overflow-hidden">
          <div
            className="border-b p-6"
            style={{ borderColor: "var(--border-soft)" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Trade Plan</h2>
                <p className="mt-1 text-xs text-muted">Long setup preview</p>
              </div>
              <span className="rounded-md bg-[rgba(40,199,111,.12)] px-3 py-1.5 text-xs font-semibold text-[var(--green)]">
                BUY
              </span>
            </div>
          </div>

          <div className="grid-bg p-6">
            <div
              className="relative h-64 overflow-hidden rounded-xl border bg-[var(--surface-2)]"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="absolute inset-x-5 top-[18%] flex items-center gap-3 text-xs text-[var(--green)]">
                <span>Target ${targetPrice.toLocaleString()}</span>
                <span className="h-px flex-1 bg-[var(--green)] opacity-60" />
              </div>
              <div className="absolute inset-x-5 top-1/2 flex items-center gap-3 text-xs text-[var(--amber)]">
                <span>Entry ${entryPrice.toLocaleString()}</span>
                <span className="h-px flex-1 bg-[var(--amber)] opacity-60" />
              </div>
              <div className="absolute inset-x-5 top-[78%] flex items-center gap-3 text-xs text-[var(--red)]">
                <span>Stop ${stopPrice.toLocaleString()}</span>
                <span className="h-px flex-1 bg-[var(--red)] opacity-60" />
              </div>
              <div className="absolute bottom-[22%] right-8 top-[18%] w-14 rounded-t-md border-x border-t border-[rgba(40,199,111,.5)] bg-[rgba(40,199,111,.08)]" />
              <div className="absolute bottom-[22%] right-8 h-[28%] w-14 rounded-b-md border-x border-b border-[rgba(255,77,67,.5)] bg-[rgba(255,77,67,.08)]" />
            </div>

            <div className="mt-5 flex items-center justify-between text-xs">
              <span className="text-muted">Maximum loss</span>
              <strong className="text-[var(--red)]">
                -${calculation.riskAmount.toFixed(2)}
              </strong>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-muted">Potential profit</span>
              <strong className="text-[var(--green)]">
                +${(calculation.riskAmount * calculation.ratio).toFixed(2)}
              </strong>
            </div>
          </div>
        </div>
      </section>

      <section className="surface mt-4 overflow-hidden">
        <div
          className="flex flex-col justify-between gap-4 border-b p-6 sm:flex-row sm:items-center"
          style={{ borderColor: "var(--border-soft)" }}
        >
          <div>
            <div className="flex items-center gap-2">
              <IconFlame size={20} className="text-[var(--amber)]" />
              <h2 className="text-xl font-semibold">Market Screener</h2>
            </div>
            <p className="mt-1 text-xs text-muted">
              {error
                ? "Live prices are temporarily unavailable; showing cached fallbacks."
                : loading
                  ? "Loading the latest CoinGecko prices…"
                  : "Live CoinGecko prices, changes and 24-hour volume."}
            </p>
          </div>

          <label className="relative block w-full sm:w-64">
            <span className="sr-only">Search assets</span>
            <IconSearch
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="field h-10 min-h-10 pl-9 pr-3 text-xs"
              placeholder="Search assets..."
            />
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead className="bg-[var(--surface-2)] text-[10px] uppercase tracking-[.08em] text-muted">
              <tr>
                <th className="px-6 py-4 font-medium">Asset</th>
                <th className="px-4 py-4 font-medium">Price</th>
                <th className="px-4 py-4 font-medium">24h change</th>
                <th className="px-4 py-4 font-medium">Volume</th>
                <th className="px-4 py-4 font-medium">Trend</th>
                <th className="px-6 py-4 text-right font-medium">Signal</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.map((asset) => {
                const positive = asset.change24h >= 0;
                return (
                  <tr
                    key={asset.symbol}
                    className="border-t"
                    style={{ borderColor: "var(--border-soft)" }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span
                          className="h-8 w-8 rounded-full"
                          style={{ background: asset.colour }}
                        />
                        <div>
                          <strong className="block text-sm">
                            {asset.name}
                          </strong>
                          <span className="text-[10px] text-muted">
                            {asset.symbol}/USDT
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="metric-value px-4 py-4 text-sm font-semibold">
                      {asset.price}
                    </td>
                    <td
                      className={`px-4 py-4 text-sm font-semibold ${changeClass(asset.change24h)}`}
                    >
                      {formatChange(asset.change24h)}
                    </td>
                    <td className="px-4 py-4 text-sm text-muted">
                      {asset.volume}
                    </td>
                    <td className="w-28 px-4 py-4">
                      <Sparkline
                        data={asset.data}
                        positive={positive}
                        height={34}
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[10px] font-semibold ${positive ? "bg-[rgba(40,199,111,.1)] text-[var(--green)]" : "bg-[rgba(255,77,67,.1)] text-[var(--red)]"}`}
                      >
                        {positive ? (
                          <IconTrendingUp size={13} />
                        ) : (
                          <IconPercentage size={13} />
                        )}
                        {positive ? "Momentum" : "Watch"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div
        className="mt-4 flex flex-col items-start gap-5 rounded-xl border bg-[linear-gradient(90deg,rgba(255,196,0,.1),transparent)] p-6 sm:flex-row sm:items-center"
        style={{ borderColor: "var(--border)" }}
      >
        <IconChartCandle size={34} className="text-[var(--amber)]" />
        <div className="flex-1">
          <h2 className="font-semibold">
            Charts and indicators are coming next.
          </h2>
          <p className="mt-1 text-xs text-muted">
            The current tools use demonstration values until the live market
            connection is added.
          </p>
        </div>
        <button type="button" className="gold-button text-xs">
          Create Price Alert
        </button>
      </div>
    </div>
  );
}
