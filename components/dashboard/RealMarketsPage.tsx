"use client";
import {
  Card,
  Coin,
  DataTable,
  MetricCard,
  PageHeading,
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
const traditionalMarkets = {
  Bonds: [
    ["US 3-Month Treasury Bill", "UST-3M", "Government", "3 months"],
    ["US 2-Year Treasury Note", "UST-2Y", "Government", "2 years"],
    ["US 10-Year Treasury Note", "UST-10Y", "Government", "10 years"],
    ["US 30-Year Treasury Bond", "UST-30Y", "Government", "30 years"],
  ],
  ETFs: [
    ["Vanguard Total Bond Market ETF", "BND", "Bond ETF", "US aggregate bonds"],
    ["iShares Core US Aggregate Bond ETF", "AGG", "Bond ETF", "US aggregate bonds"],
    ["SPDR S&P 500 ETF Trust", "SPY", "Equity ETF", "Large-cap US stocks"],
    ["Invesco QQQ Trust", "QQQ", "Equity ETF", "Nasdaq-100"],
  ],
  Stocks: [
    ["Apple", "AAPL", "Technology", "NASDAQ"],
    ["Microsoft", "MSFT", "Technology", "NASDAQ"],
    ["NVIDIA", "NVDA", "Technology", "NASDAQ"],
    ["Tesla", "TSLA", "Automotive", "NASDAQ"],
  ],
} as const;
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
        subtitle="Explore bonds, ETFs, stocks, and digital assets from one market directory."
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
        <MetricCard label="Market coverage" value="4 classes" change="Bonds, ETFs, stocks, and crypto" />
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        {Object.entries(traditionalMarkets).map(([category, instruments]) => (
          <Card key={category} title={category}>
            <DataTable
              headers={["Instrument", "Symbol", "Type", "Market"]}
              rows={instruments.map(([name, symbol, type, market]) => [name, <b key={symbol}>{symbol}</b>, type, market])}
            />
          </Card>
        ))}
      </div>
      <Card className="mt-4" title="Digital assets">
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
    </>
  );
}
