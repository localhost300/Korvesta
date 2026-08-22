"use client";
import {
  IconArrowUpRight,
  IconChevronRight,
  IconStar,
} from "@tabler/icons-react";
import { assets, type Asset } from "@/lib/data";
import { changeClass, formatChange } from "@/lib/utils";
import { Sparkline } from "./Charts";
import {
  coinGeckoIdBySymbol,
  formatCompactUsd,
  formatUsd,
  useLivePrices,
} from "@/lib/use-live-prices";

function liveAsset(
  asset: Asset,
  prices: ReturnType<typeof useLivePrices>["prices"],
): Asset {
  const live = prices[coinGeckoIdBySymbol[asset.symbol]];
  return live
    ? {
        ...asset,
        price: formatUsd(live.price),
        change24h: live.change24h ?? asset.change24h,
        marketCap:
          live.marketCap == null
            ? asset.marketCap
            : formatCompactUsd(live.marketCap),
        volume:
          live.volume24h == null
            ? asset.volume
            : formatCompactUsd(live.volume24h),
      }
    : asset;
}

export function CoinBadge({
  asset,
  small = false,
}: {
  asset: Asset;
  small?: boolean;
}) {
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full font-bold text-white ${small ? "h-6 w-6 text-[9px]" : "h-9 w-9 text-[11px]"}`}
      style={{ background: asset.colour }}
    >
      {asset.symbol.slice(0, 1)}
    </span>
  );
}

export function MarketStatCard({
  label,
  value,
  change,
  data,
}: {
  label: string;
  value: string;
  change: number;
  data: number[];
}) {
  return (
    <div className="surface p-4">
      <span className="text-[11px] text-muted">{label}</span>
      <div className="mt-2 grid grid-cols-[1fr_90px] items-end gap-2">
        <div>
          <strong className="metric-value block text-xl">{value}</strong>
          <span className={`mt-1 block text-xs ${changeClass(change)}`}>
            {formatChange(change)}
          </span>
        </div>
        <Sparkline data={data} positive={change >= 0} height={36} />
      </div>
    </div>
  );
}

export function AssetCard({ asset }: { asset: Asset }) {
  const { prices } = useLivePrices();
  asset = liveAsset(asset, prices);
  return (
    <article className="surface group p-4 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--amber)] hover:shadow-[0_16px_40px_rgba(0,0,0,.2)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CoinBadge asset={asset} />
          <div>
            <strong className="block text-sm">{asset.symbol}/USDT</strong>
            <span className="text-[10px] text-muted">{asset.name}</span>
          </div>
        </div>
        <IconStar
          size={17}
          className="text-muted group-hover:text-[var(--amber)]"
        />
      </div>
      <div className="mt-5 grid grid-cols-[1fr_120px] items-end">
        <div>
          <strong className="metric-value block text-lg">{asset.price}</strong>
          <span className={`text-xs ${changeClass(asset.change24h)}`}>
            {formatChange(asset.change24h)}
          </span>
        </div>
        <Sparkline data={asset.data} positive={asset.change24h >= 0} />
      </div>
      <div
        className="mt-4 flex justify-between border-t pt-3 text-[10px] text-muted"
        style={{ borderColor: "var(--border-soft)" }}
      >
        <span>Vol {asset.volume}</span>
        <span>Cap {asset.marketCap}</span>
      </div>
    </article>
  );
}

export function MarketsTable({ limit = 8 }: { limit?: number }) {
  const { prices } = useLivePrices();
  const currentAssets = assets.map((asset) => liveAsset(asset, prices));
  return (
    <div className="surface overflow-hidden">
      <div className="divide-y divide-[var(--border-soft)] md:hidden">
        {currentAssets.slice(0, limit).map((asset) => (
          <article
            data-market-row={`${asset.name} ${asset.symbol}`.toLowerCase()}
            key={asset.symbol}
            className="space-y-4 p-4"
          >
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <CoinBadge asset={asset} small />
                <div className="min-w-0">
                  <strong className="block truncate text-sm">{asset.name}</strong>
                  <span className="text-[10px] text-muted">
                    #{asset.rank} · {asset.symbol}
                  </span>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <strong className="block text-sm">{asset.price}</strong>
                <span className={`text-xs ${changeClass(asset.change24h)}`}>
                  {formatChange(asset.change24h)}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-[10px]">
              <div className="min-w-0">
                <span className="block text-muted">Market cap</span>
                <strong className="block truncate font-medium">{asset.marketCap}</strong>
              </div>
              <div className="min-w-0">
                <span className="block text-muted">Volume</span>
                <strong className="block truncate font-medium">{asset.volume}</strong>
              </div>
              <div className="text-right">
                <span className="block text-muted">7d</span>
                <strong className={changeClass(asset.change7d)}>
                  {formatChange(asset.change7d)}
                </strong>
              </div>
            </div>
          </article>
        ))}
      </div>
      <div className="scrollbar-none hidden overflow-x-auto md:block">
        <table className="w-full min-w-[820px] border-collapse text-left">
          <thead>
            <tr
              className="border-b text-[10px] uppercase tracking-[.08em] text-muted"
              style={{ borderColor: "var(--border)" }}
            >
              <th className="px-5 py-4">#</th>
              <th>Asset</th>
              <th>Price</th>
              <th>24h %</th>
              <th>7d %</th>
              <th>Market cap</th>
              <th>Volume (24h)</th>
              <th className="pr-5">Last 7 days</th>
            </tr>
          </thead>
          <tbody>
            {currentAssets.slice(0, limit).map((asset) => (
              <tr
                data-market-row={`${asset.name} ${asset.symbol}`.toLowerCase()}
                key={asset.symbol}
                className="border-b text-xs transition-colors hover:bg-[var(--surface-2)]"
                style={{ borderColor: "var(--border-soft)" }}
              >
                <td className="px-5 py-3 text-muted">{asset.rank}</td>
                <td>
                  <div className="flex items-center gap-2.5">
                    <CoinBadge asset={asset} small />
                    <strong>{asset.name}</strong>
                    <span className="text-muted">{asset.symbol}</span>
                  </div>
                </td>
                <td className="font-medium">{asset.price}</td>
                <td className={changeClass(asset.change24h)}>
                  {formatChange(asset.change24h)}
                </td>
                <td className={changeClass(asset.change7d)}>
                  {formatChange(asset.change7d)}
                </td>
                <td>{asset.marketCap}</td>
                <td>{asset.volume}</td>
                <td className="w-[120px] pr-5">
                  <Sparkline
                    data={asset.data}
                    positive={asset.change7d >= 0}
                    height={34}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <a
        href="/markets"
        className="flex items-center justify-center gap-1.5 py-3 text-xs text-muted hover:text-[var(--amber)]"
      >
        View all markets <IconChevronRight size={14} />
      </a>
    </div>
  );
}

export function MoversList() {
  const { prices } = useLivePrices();
  return (
    <div className="grid gap-3">
      {assets
        .slice(4, 8)
        .map((asset) => liveAsset(asset, prices))
        .map((a) => (
          <div key={a.symbol} className="flex items-center gap-3">
            <CoinBadge asset={a} small />
            <span className="flex-1 text-xs font-semibold">
              {a.symbol}/USDT
            </span>
            <span className={changeClass(a.change24h)}>
              {formatChange(a.change24h)}
            </span>
            <IconArrowUpRight size={14} className="text-muted" />
          </div>
        ))}
    </div>
  );
}
