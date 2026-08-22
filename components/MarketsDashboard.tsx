"use client";

import { useMemo, useState } from "react";
import {
  IconBell,
  IconSearch,
  IconSettings,
  IconStar,
} from "@tabler/icons-react";
import { assets } from "@/lib/data";
import { MarketStatCard, MarketsTable, MoversList } from "./MarketCards";
import { LightweightMarketChart } from "./LightweightMarketChart";
import {
  coinGeckoIdBySymbol,
  formatCompactUsd,
  formatUsd,
  useLivePrices,
} from "@/lib/use-live-prices";

export function MarketsDashboard() {
  const [tab, setTab] = useState("All Assets");
  const [query, setQuery] = useState("");
  const { prices: livePrices } = useLivePrices();
  const currentAssets = useMemo(
    () =>
      assets.map((asset) => {
        const live = livePrices[coinGeckoIdBySymbol[asset.symbol]];
        return live
          ? {
              ...asset,
              price: formatUsd(live.price),
              change24h: live.change24h ?? asset.change24h,
            }
          : asset;
      }),
    [livePrices],
  );
  const filtered = useMemo(
    () =>
      currentAssets.filter((a) =>
        `${a.name} ${a.symbol}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [currentAssets, query],
  );
  const trackedMarketCap = Object.values(livePrices).reduce(
    (sum, item) => sum + (item.marketCap ?? 0),
    0,
  );
  const trackedVolume = Object.values(livePrices).reduce(
    (sum, item) => sum + (item.volume24h ?? 0),
    0,
  );
  const btcShare = trackedMarketCap
    ? ((livePrices.bitcoin?.marketCap ?? 0) / trackedMarketCap) * 100
    : null;
  return (
    <div className="container-shell py-10">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-4xl font-semibold tracking-[-.04em]">
            Markets Overview
          </h1>
          <p className="mt-2 text-sm text-muted">
            Real-time market data, trends and analytics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="relative">
            <IconSearch
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              data-market-search
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="field h-10 min-h-10 w-56 pl-9 pr-3 text-xs"
              placeholder="Search markets..."
            />
          </label>
          <button className="ghost-button h-10 min-h-10 w-10 p-0">
            <IconStar size={17} />
          </button>
          <button className="ghost-button h-10 min-h-10 w-10 p-0">
            <IconBell size={17} />
          </button>
          <button className="ghost-button h-10 min-h-10 w-10 p-0">
            <IconSettings size={17} />
          </button>
        </div>
      </div>
      <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MarketStatCard
          label="Tracked Market Cap"
          value={
            trackedMarketCap ? formatCompactUsd(trackedMarketCap) : "Loading…"
          }
          change={1.25}
          data={assets[0].data}
        />
        <MarketStatCard
          label="24h Volume"
          value={trackedVolume ? formatCompactUsd(trackedVolume) : "Loading…"}
          change={2.34}
          data={assets[4].data}
        />
        <MarketStatCard
          label="BTC Share (Tracked)"
          value={btcShare == null ? "Loading…" : `${btcShare.toFixed(2)}%`}
          change={-0.35}
          data={assets[5].data}
        />
        <div className="surface p-4">
          <span className="text-[11px] text-muted">Fear & Greed Index</span>
          <div className="mt-2 flex items-center justify-between">
            <div>
              <strong className="metric-value block text-xl">62</strong>
              <span className="text-xs text-[var(--amber)]">Greed</span>
            </div>
            <div className="relative h-12 w-24 overflow-hidden">
              <div className="absolute inset-x-0 top-4 h-12 rounded-t-full border-[8px] border-b-0 border-[#ffc400]" />
              <span className="absolute bottom-0 left-1/2 h-8 w-[2px] origin-bottom rotate-[35deg] bg-[var(--text)]" />
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_330px]">
        <section>
          <div
            className="mb-3 flex gap-5 border-b text-xs"
            style={{ borderColor: "var(--border)" }}
          >
            {["All Assets", "Crypto", "Indices", "Commodities", "Stocks"].map(
              (t) => (
                <button
                  data-market-tab
                  onClick={() => setTab(t)}
                  key={t}
                  className={`relative pb-3 ${tab === t ? "text-[var(--amber)]" : "text-muted"}`}
                >
                  {t}
                  {tab === t && (
                    <span className="absolute inset-x-0 bottom-0 h-[2px] bg-[var(--amber)]" />
                  )}
                </button>
              ),
            )}
          </div>
          {query ? (
            <div className="surface p-5">
              <p className="mb-4 text-sm text-muted">
                {filtered.length} matching assets
              </p>
              {filtered.map((a) => (
                <div
                  key={a.symbol}
                  className="border-b py-3 text-sm"
                  style={{ borderColor: "var(--border)" }}
                >
                  {a.name} <span className="text-muted">{a.symbol}</span>
                  <strong className="float-right">{a.price}</strong>
                </div>
              ))}
            </div>
          ) : (
            <MarketsTable />
          )}
        </section>
        <aside className="surface p-5">
          <h2 className="mb-5 font-semibold">Trending Pairs</h2>
          <MoversList />
          <button className="ghost-button mt-6 w-full text-xs">
            View all pairs
          </button>
        </aside>
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-[1.4fr_.8fr]">
        <section className="surface p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">BTC/USDT Candles</h2>
              <strong className="metric-value mt-1 block text-2xl">
                CoinGecko OHLC
              </strong>
            </div>
            <div className="text-xs text-muted">Interactive · 7 days</div>
          </div>
          <LightweightMarketChart height={230} />
        </section>
        <section className="surface p-5">
          <h2 className="font-semibold">Sector Heatmap</h2>
          <div className="mt-4 grid h-[230px] grid-cols-4 grid-rows-3 gap-1 text-center text-xs font-semibold">
            <div className="col-span-2 row-span-2 grid place-items-center bg-[#206d40]">
              DeFi
              <br />
              +2.45%
            </div>
            <div className="grid place-items-center bg-[#388957]">
              Layer 1<br />
              +1.92%
            </div>
            <div className="grid place-items-center bg-[#4d9a66]">
              CeFi
              <br />
              +0.88%
            </div>
            <div className="grid place-items-center bg-[#267849]">
              AI
              <br />
              +2.18%
            </div>
            <div className="grid place-items-center bg-[#8b3a36]">
              NFT
              <br />
              -0.43%
            </div>
            <div className="col-span-2 grid place-items-center bg-[#2a7247]">
              Meme +1.23%
            </div>
          </div>
        </section>
      </div>
      <div className="mt-4 surface flex flex-col items-start gap-5 bg-[linear-gradient(90deg,rgba(255,196,0,.12),transparent)] p-6 sm:flex-row sm:items-center">
        <IconStar size={36} className="text-[var(--amber)]" />
        <div className="flex-1">
          <h3 className="font-semibold">
            Stay ahead with real-time alerts and custom watchlists.
          </h3>
          <p className="mt-1 text-xs text-muted">
            Create alerts, track your favourite assets and never miss an
            important move.
          </p>
        </div>
        <button className="gold-button text-xs">Create Alert</button>
        <button className="ghost-button text-xs">Learn More</button>
      </div>
    </div>
  );
}
