"use client";

import Link from "next/link";
import {
  IconArrowRight,
  IconBell,
  IconChartCandle,
  IconChartDots3,
  IconDeviceMobile,
  IconLock,
  IconWorldSearch,
} from "@tabler/icons-react";
import { assets } from "@/lib/data";
import { AssetCard, MarketStatCard } from "./MarketCards";
import { LightweightMarketChart } from "./LightweightMarketChart";
import {
  formatCompactUsd,
  formatUsd,
  useLivePrices,
} from "@/lib/use-live-prices";

export function HomeExperience() {
  const btc = useLivePrices().prices.bitcoin;
  return (
    <>
      <section className="container-shell grid min-h-[620px] items-center gap-12 py-16 lg:grid-cols-[.82fr_1.18fr]">
        <div>
          <p className="kicker">Live markets. Real insights.</p>
          <h1 className="mt-5 max-w-[650px] text-5xl font-semibold leading-[1.02] tracking-[-.055em] sm:text-6xl xl:text-[74px]">
            Smarter market navigation with{" "}
            <span className="amber-text">live data.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-muted sm:text-lg">
            Track prices, analyse trends and explore global markets with
            professional-grade tools and reliable intelligence.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/markets" className="gold-button">
              Explore Markets <IconArrowRight size={18} />
            </Link>
            <Link href="/insights" className="ghost-button">
              View Insights
            </Link>
          </div>
          <div className="mt-9 grid max-w-[620px] grid-cols-3 gap-4 text-xs text-muted">
            {[
              [IconChartDots3, "Real-time data", "Live & reliable"],
              [IconChartCandle, "Advanced tools", "Pro-level analysis"],
              [IconLock, "Secure & private", "Your data, protected"],
            ].map(([Icon, title, sub]) => (
              <div key={String(title)} className="flex gap-2">
                <Icon size={20} className="text-[var(--amber)]" />
                <div>
                  <strong className="block text-[var(--text)]">
                    {String(title)}
                  </strong>
                  <span>{String(sub)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="surface grid-bg overflow-hidden p-5 sm:p-7">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-[#f7931a] font-bold text-white">
                B
              </span>
              <div>
                <strong>BTC/USDT</strong>
                <span className="ml-3 text-xs text-muted">Bitcoin</span>
              </div>
            </div>
            <div className="text-right">
              <strong className="metric-value block text-2xl">
                {btc ? formatUsd(btc.price).replace("$", "") : "Loading…"}
              </strong>
              <span
                className={
                  btc?.change24h != null && btc.change24h < 0
                    ? "text-xs text-[#ff4d43]"
                    : "text-xs text-[#28c76f]"
                }
              >
                {btc?.change24h == null
                  ? "—"
                  : `${btc.change24h >= 0 ? "+" : ""}${btc.change24h.toFixed(2)}% (24h)`}
              </span>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            {["1D", "1W", "1M", "3M", "1Y"].map((t, i) => (
              <button
                key={t}
                className={`rounded-md px-3 py-1.5 text-[10px] ${i === 0 ? "bg-[var(--amber)] text-black" : "text-muted hover:bg-[var(--surface-3)]"}`}
              >
                {t}
              </button>
            ))}
          </div>
          <LightweightMarketChart asset="bitcoin" days={7} height={290} />
          <div
            className="grid grid-cols-2 gap-3 border-t pt-5 text-xs sm:grid-cols-4"
            style={{ borderColor: "var(--border)" }}
          >
            {[
              [
                "Market Cap",
                btc?.marketCap == null ? "—" : formatCompactUsd(btc.marketCap),
              ],
              [
                "24h Volume",
                btc?.volume24h == null ? "—" : formatCompactUsd(btc.volume24h),
              ],
              ["Current Price", btc ? formatUsd(btc.price) : "—"],
              ["Data Source", "CoinGecko"],
            ].map(([l, v]) => (
              <div key={l}>
                <span className="block text-muted">{l}</span>
                <strong className="mt-1.5 block text-sm">{v}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-shell py-4">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-semibold">Global Market Snapshot</h2>
            <p className="mt-1 text-xs text-muted">
              The world&apos;s major markets at a glance
            </p>
          </div>
          <Link
            href="/markets"
            className="text-xs text-muted hover:text-[var(--amber)]"
          >
            View all markets →
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <MarketStatCard
            label="S&P 500"
            value="5,303.27"
            change={0.68}
            data={assets[0].data}
          />
          <MarketStatCard
            label="NASDAQ 100"
            value="18,550.12"
            change={0.85}
            data={assets[1].data}
          />
          <MarketStatCard
            label="DOW JONES"
            value="38,872.99"
            change={0.8}
            data={assets[4].data}
          />
          <MarketStatCard
            label="GOLD"
            value="2,345.68"
            change={0.31}
            data={assets[2].data}
          />
          <MarketStatCard
            label="OIL (WTI)"
            value="78.56"
            change={-1.67}
            data={assets[5].data}
          />
        </div>
      </section>

      <section className="container-shell py-14">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-semibold">Top Movers</h2>
            <p className="mt-1 text-xs text-muted">
              Assets making the biggest moves today
            </p>
          </div>
          <Link
            href="/markets"
            className="text-xs text-muted hover:text-[var(--amber)]"
          >
            View all movers →
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {assets.slice(1, 6).map((a) => (
            <AssetCard key={a.symbol} asset={a} />
          ))}
        </div>
      </section>

      <section id="tools" className="container-shell pb-14">
        <div className="surface overflow-hidden">
          <div className="grid gap-8 p-7 lg:grid-cols-3">
            {[
              [
                IconChartCandle,
                "Real-time Charts",
                "Advanced charting with indicators, drawing tools and customisable views.",
                "Explore Charts",
              ],
              [
                IconWorldSearch,
                "Market Insights",
                "Expert analysis and transparent data to keep you informed.",
                "Read Insights",
              ],
              [
                IconBell,
                "Index Tracking",
                "Track global indices, sectors and performance in real time.",
                "Track Indices",
              ],
            ].map(([Icon, title, desc, cta]) => (
              <article key={String(title)} className="surface-soft p-6">
                <Icon size={34} className="text-[var(--amber)]" />
                <h3 className="mt-5 text-lg font-semibold">{String(title)}</h3>
                <p className="mt-2 min-h-[48px] text-sm leading-6 text-muted">
                  {String(desc)}
                </p>
                <Link
                  href="/markets"
                  className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-[var(--amber)]"
                >
                  {String(cta)} <IconArrowRight size={14} />
                </Link>
              </article>
            ))}
          </div>
          <div
            className="border-t bg-[linear-gradient(90deg,rgba(255,196,0,.08),transparent)] p-8"
            style={{ borderColor: "var(--border)" }}
          >
            <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-6 text-center md:flex-row md:text-left">
              <IconDeviceMobile
                size={72}
                stroke={1.2}
                className="text-[var(--amber)]"
              />
              <div className="flex-1">
                <h2 className="text-2xl font-semibold">
                  Take the market with you.
                </h2>
                <p className="mt-2 text-sm text-muted">
                  Access live data, set alerts and manage watchlists anywhere.
                </p>
              </div>
              <button className="gold-button">Get the App</button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
