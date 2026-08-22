"use client";
import {
  Card,
  Coin,
  DataTable,
  MetricCard,
  PageHeading,
  Status,
} from "./DashboardUI";
import {
  coinGeckoIdBySymbol,
  formatCompactUsd,
  formatUsd,
  useLivePrices,
} from "@/lib/use-live-prices";
const assets = [
  { symbol: "BTC", name: "Bitcoin", colour: "#f7931a" },
  { symbol: "ETH", name: "Ethereum", colour: "#627eea" },
  { symbol: "USDT", name: "Tether", colour: "#26a17b" },
  { symbol: "SOL", name: "Solana", colour: "#7c3aed" },
  { symbol: "BNB", name: "BNB", colour: "#f3ba2f" },
  { symbol: "XRP", name: "XRP", colour: "#64748b" },
];
export function RealMarketsPage() {
  const { prices, loading, error } = useLivePrices();
  const rows = assets.flatMap((asset) => {
    const quote = prices[coinGeckoIdBySymbol[asset.symbol]];
    return quote
      ? [
          [
            <span key="asset" className="flex items-center gap-2">
              <Coin symbol={asset.symbol} colour={asset.colour} size="sm" />
              <span>
                <b>{asset.name}</b>
                <small className="ml-2 text-[#819099]">{asset.symbol}</small>
              </span>
            </span>,
            formatUsd(quote.price),
            <span
              key="change"
              className={
                (quote.change24h ?? 0) >= 0 ? "text-[#00d084]" : "text-red-400"
              }
            >
              {quote.change24h == null
                ? "—"
                : `${quote.change24h >= 0 ? "+" : ""}${quote.change24h.toFixed(2)}%`}
            </span>,
            quote.marketCap == null ? "—" : formatCompactUsd(quote.marketCap),
            quote.volume24h == null ? "—" : formatCompactUsd(quote.volume24h),
            new Date(quote.updatedAt).toLocaleTimeString(),
          ],
        ]
      : [];
  });
  const values = Object.values(prices);
  const cap = values.reduce((sum, item) => sum + (item.marketCap ?? 0), 0);
  const volume = values.reduce((sum, item) => sum + (item.volume24h ?? 0), 0);
  const btc = prices.bitcoin?.marketCap ?? 0;
  return (
    <>
      <PageHeading
        title="Markets"
        subtitle="Live price, market-cap, and volume data from CoinGecko."
      />
      {error && (
        <p className="mb-4 rounded-lg border border-red-500/30 p-3 text-sm text-red-400">
          {error}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Tracked market cap"
          value={cap ? formatCompactUsd(cap) : loading ? "Loading…" : "—"}
          change="Supported live assets"
        />
        <MetricCard
          label="24h volume"
          value={volume ? formatCompactUsd(volume) : loading ? "Loading…" : "—"}
          change="Provider-reported volume"
        />
        <MetricCard
          label="BTC share"
          value={cap ? `${((btc / cap) * 100).toFixed(2)}%` : "—"}
          change="Share of tracked market cap"
        />
        <MetricCard
          label="Data source"
          value="CoinGecko"
          change="Refreshes every 30 seconds"
        />
      </div>
      <Card className="mt-4" title="Live cryptocurrency market">
        {rows.length ? (
          <DataTable
            headers={[
              "Asset",
              "Price",
              "24h change",
              "Market cap",
              "24h volume",
              "Updated",
            ]}
            rows={rows}
          />
        ) : (
          <p className="py-10 text-center text-sm text-[#819099]">
            {loading ? "Loading live markets…" : "Market data is unavailable."}
          </p>
        )}
      </Card>
      <Card className="mt-4" title="Data scope">
        <div className="flex items-center gap-3 text-sm">
          <Status tone="green">Live</Status>
          <p className="text-[#819099]">
            No sentiment score, trending ranking, new-listing claim, or
            historical chart is displayed unless the provider supplies that
            dataset.
          </p>
        </div>
      </Card>
    </>
  );
}
