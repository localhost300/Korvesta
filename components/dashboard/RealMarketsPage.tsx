"use client";
import { Card, Coin, DataTable, MetricCard, PageHeading } from "./DashboardUI";
import {
  coinGeckoIdBySymbol,
  formatCompactUsd,
  formatUsd,
  useLivePrices,
} from "@/lib/use-live-prices";
import { MarketLogo } from "@/components/MarketLogo";
const assets = [
  { symbol: "BTC", name: "Bitcoin", colour: "#f7931a" },
  { symbol: "ETH", name: "Ethereum", colour: "#627eea" },
  { symbol: "USDT", name: "Tether", colour: "#26a17b" },
  { symbol: "SOL", name: "Solana", colour: "#7c3aed" },
  { symbol: "BNB", name: "BNB", colour: "#f3ba2f" },
  { symbol: "XRP", name: "XRP", colour: "#64748b" },
  { symbol: "ADA", name: "Cardano", colour: "#2a71d0" },
  { symbol: "DOGE", name: "Dogecoin", colour: "#c2a633" },
  { symbol: "AVAX", name: "Avalanche", colour: "#e84142" },
  { symbol: "DOT", name: "Polkadot", colour: "#e6007a" },
  { symbol: "LINK", name: "Chainlink", colour: "#2a5ada" },
  { symbol: "LTC", name: "Litecoin", colour: "#345d9d" },
  { symbol: "BCH", name: "Bitcoin Cash", colour: "#8dc351" },
  { symbol: "UNI", name: "Uniswap", colour: "#ff007a" },
  { symbol: "ATOM", name: "Cosmos", colour: "#6f7390" },
  { symbol: "TRX", name: "TRON", colour: "#ef0027" },
];
const traditionalMarkets = {
  Bonds: [
    ["US 3-Month Treasury Bill", "UST-3M", "Government", "3 months"],
    ["US 6-Month Treasury Bill", "UST-6M", "Government", "6 months"],
    ["US 1-Year Treasury Bill", "UST-1Y", "Government", "1 year"],
    ["US 2-Year Treasury Note", "UST-2Y", "Government", "2 years"],
    ["US 5-Year Treasury Note", "UST-5Y", "Government", "5 years"],
    ["US 10-Year Treasury Note", "UST-10Y", "Government", "10 years"],
    ["US 30-Year Treasury Bond", "UST-30Y", "Government", "30 years"],
    [
      "Treasury Inflation-Protected Security",
      "TIPS",
      "Government",
      "Inflation-linked",
    ],
    ["US Series I Savings Bond", "I-BOND", "Savings bond", "Inflation-linked"],
    ["Investment-Grade Corporate Bonds", "US-IG", "Corporate", "Broad market"],
    ["High-Yield Corporate Bonds", "US-HY", "Corporate", "Broad market"],
    ["Municipal Bonds", "US-MUNI", "Municipal", "Tax-exempt income"],
  ],
  ETFs: [
    ["Vanguard Total Bond Market ETF", "BND", "Bond ETF", "US aggregate bonds"],
    [
      "iShares Core US Aggregate Bond ETF",
      "AGG",
      "Bond ETF",
      "US aggregate bonds",
    ],
    [
      "iShares 20+ Year Treasury Bond ETF",
      "TLT",
      "Bond ETF",
      "Long Treasuries",
    ],
    [
      "iShares 1-3 Year Treasury Bond ETF",
      "SHY",
      "Bond ETF",
      "Short Treasuries",
    ],
    [
      "iShares iBoxx Investment Grade Corporate Bond ETF",
      "LQD",
      "Bond ETF",
      "Corporate bonds",
    ],
    ["iShares TIPS Bond ETF", "TIP", "Bond ETF", "Inflation-protected"],
    ["SPDR S&P 500 ETF Trust", "SPY", "Equity ETF", "Large-cap US stocks"],
    ["Invesco QQQ Trust", "QQQ", "Equity ETF", "Nasdaq-100"],
    ["Vanguard Total Stock Market ETF", "VTI", "Equity ETF", "Total US market"],
    [
      "Vanguard FTSE Developed Markets ETF",
      "VEA",
      "Equity ETF",
      "Developed markets",
    ],
    [
      "Vanguard FTSE Emerging Markets ETF",
      "VWO",
      "Equity ETF",
      "Emerging markets",
    ],
    ["SPDR Gold Shares", "GLD", "Commodity ETF", "Gold"],
  ],
  Stocks: [
    ["Apple", "AAPL", "Technology", "NASDAQ"],
    ["Microsoft", "MSFT", "Technology", "NASDAQ"],
    ["NVIDIA", "NVDA", "Technology", "NASDAQ"],
    ["Tesla", "TSLA", "Automotive", "NASDAQ"],
    ["Amazon", "AMZN", "Consumer/Cloud", "NASDAQ"],
    ["Alphabet", "GOOGL", "Technology", "NASDAQ"],
    ["Meta Platforms", "META", "Technology", "NASDAQ"],
    ["JPMorgan Chase", "JPM", "Financials", "NYSE"],
    ["Berkshire Hathaway", "BRK.B", "Financials", "NYSE"],
    ["Johnson & Johnson", "JNJ", "Healthcare", "NYSE"],
    ["Exxon Mobil", "XOM", "Energy", "NYSE"],
    ["Coca-Cola", "KO", "Consumer staples", "NYSE"],
  ],
  "Retirement Accounts": [
    ["Traditional 401(k)", "401K", "Employer account", "Pre-tax contributions"],
    ["Roth 401(k)", "R401K", "Employer account", "After-tax contributions"],
    ["Traditional IRA", "IRA", "Individual account", "Tax-deferred"],
    [
      "Roth IRA",
      "ROTH-IRA",
      "Individual account",
      "Qualified tax-free withdrawals",
    ],
    ["SEP IRA", "SEP-IRA", "Business retirement", "Employer contributions"],
    [
      "SIMPLE IRA",
      "SIMPLE-IRA",
      "Small-business retirement",
      "Employer sponsored",
    ],
    ["403(b)", "403B", "Employer account", "Education/nonprofit employees"],
    ["457(b)", "457B", "Employer account", "Government employees"],
  ],
  "Funds & REITs": [
    ["Vanguard 500 Index Fund Admiral", "VFIAX", "Mutual fund", "S&P 500"],
    ["Fidelity 500 Index Fund", "FXAIX", "Mutual fund", "S&P 500"],
    ["Schwab S&P 500 Index Fund", "SWPPX", "Mutual fund", "S&P 500"],
    ["Vanguard Real Estate ETF", "VNQ", "REIT ETF", "US real estate"],
    ["Realty Income", "O", "REIT", "Retail properties"],
    ["Prologis", "PLD", "REIT", "Logistics properties"],
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
        subtitle="Explore bonds, ETFs, stocks, retirement accounts, and digital assets from one directory."
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
          label="Market coverage"
          value="6 classes"
          change="Bonds, funds, stocks, retirement, REITs, and crypto"
        />
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        {Object.entries(traditionalMarkets).map(([category, instruments]) => (
          <Card key={category} title={category}>
            <DataTable
              headers={["Instrument", "Symbol", "Type", "Market"]}
              rows={instruments.map(([name, symbol, type, market]) => [
                <span
                  key={symbol}
                  className="flex min-w-[190px] items-center gap-3"
                >
                  <MarketLogo symbol={symbol} size="sm" />
                  <b>{name}</b>
                </span>,
                <b key={symbol}>{symbol}</b>,
                type,
                market,
              ])}
            />
          </Card>
        ))}
      </div>
      <Card className="mt-4">
        <p className="text-xs leading-6 text-[#819099]">
          401(k), IRA, 403(b), and 457(b) products are account structures, not
          market pairs. They can hold eligible funds, ETFs, stocks, and bonds
          after an administrator configures the available retirement offering.
        </p>
      </Card>
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
