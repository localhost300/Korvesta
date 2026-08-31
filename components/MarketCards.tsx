"use client";
import Link from "next/link";
import {
  IconArrowUpRight,
  IconChevronRight,
  IconStar,
} from "@tabler/icons-react";
import { assets, type Asset } from "@/lib/data";
import { changeClass, formatChange } from "@/lib/utils";
import { Sparkline } from "./Charts";
export function CoinBadge({
  asset,
  small = false,
}: {
  asset: Asset;
  small?: boolean;
}) {
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full font-bold text-white ${small ? "h-6 w-6 text-[8px]" : "h-9 w-9 text-[9px]"}`}
      style={{ background: asset.colour }}
    >
      {asset.symbol.slice(0, 2)}
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
  return (
    <article className="surface group p-4 transition-all hover:-translate-y-1 hover:border-[var(--amber)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CoinBadge asset={asset} />
          <div>
            <strong className="block text-sm">{asset.symbol}</strong>
            <span className="text-[10px] text-muted">{asset.name}</span>
          </div>
        </div>
        <IconStar size={17} className="text-muted" />
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
        <span>{asset.volume}</span>
        <span>{asset.marketCap}</span>
      </div>
    </article>
  );
}
export function MarketsTable({
  limit = 8,
  items = assets,
}: {
  limit?: number;
  items?: Asset[];
}) {
  return (
    <div className="surface overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[780px] border-collapse text-left text-xs">
          <thead>
            <tr
              className="border-b text-[10px] uppercase text-muted"
              style={{ borderColor: "var(--border)" }}
            >
              <th className="px-5 py-4">#</th>
              <th>Security</th>
              <th>Price / yield</th>
              <th>1 day</th>
              <th>7 day</th>
              <th>Size</th>
              <th>Liquidity</th>
              <th>Trend</th>
            </tr>
          </thead>
          <tbody>
            {items.slice(0, limit).map((a) => (
              <tr
                data-market-row={`${a.name} ${a.symbol}`.toLowerCase()}
                key={a.symbol}
                className="border-b"
                style={{ borderColor: "var(--border-soft)" }}
              >
                <td className="px-5 py-4 text-muted">{a.rank}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <CoinBadge asset={a} small />
                    <strong>{a.name}</strong>
                    <span className="text-muted">{a.symbol}</span>
                  </div>
                </td>
                <td>{a.price}</td>
                <td className={changeClass(a.change24h)}>
                  {formatChange(a.change24h)}
                </td>
                <td className={changeClass(a.change7d)}>
                  {formatChange(a.change7d)}
                </td>
                <td>{a.marketCap}</td>
                <td>{a.volume}</td>
                <td className="w-28">
                  <Sparkline
                    data={a.data}
                    positive={a.change7d >= 0}
                    height={32}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Link
        href="/markets"
        className="flex items-center justify-center gap-1 py-3 text-xs text-muted hover:text-[var(--amber)]"
      >
        View all fixed-income markets <IconChevronRight size={14} />
      </Link>
    </div>
  );
}
export function MoversList() {
  return (
    <div className="grid gap-3">
      {assets.slice(3, 7).map((a) => (
        <div key={a.symbol} className="flex items-center gap-3">
          <CoinBadge asset={a} small />
          <span className="flex-1 text-xs font-semibold">{a.symbol}</span>
          <span className={changeClass(a.change24h)}>
            {formatChange(a.change24h)}
          </span>
          <IconArrowUpRight size={14} className="text-muted" />
        </div>
      ))}
    </div>
  );
}
