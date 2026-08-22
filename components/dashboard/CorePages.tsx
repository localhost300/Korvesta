"use client";

import Link from "next/link";
import {
  IconArrowDown,
  IconArrowUp,
  IconBriefcase,
  IconChartBar,
  IconCoins,
  IconFilter,
  IconRefresh,
  IconRocket,
  IconWallet,
} from "@tabler/icons-react";
import {
  AllocationChart,
  Card,
  Coin,
  DataTable,
  LineChart,
  MetricCard,
  PageHeading,
  Status,
} from "./DashboardUI";
import {
  dashboardMetrics,
  marketSeries,
  portfolioSeries,
} from "@/lib/dashboard-data";
import { useLiveDashboardAssets } from "@/lib/use-live-dashboard-assets";
import { formatCompactUsd, useLivePrices } from "@/lib/use-live-prices";
import { usePortfolio } from "@/lib/use-portfolio";

const allocation = [
  ["Bitcoin (BTC)", "42.13%", "#ffc400"],
  ["Ethereum (ETH)", "25.24%", "#2f80ed"],
  ["Stablecoins", "18.35%", "#20c7c7"],
  ["Others", "14.28%", "#7847e7"],
];

export function LegacyOverviewPage() {
  const dashboardAssets = useLiveDashboardAssets();
  const liveTotal = dashboardAssets.reduce(
    (sum, asset) => sum + Number(asset.value.replace(/[$,]/g, "")),
    0,
  );
  const investmentTotal = dashboardAssets
    .slice(0, 4)
    .reduce((sum, asset) => sum + Number(asset.value.replace(/[$,]/g, "")), 0);
  return (
    <>
      <PageHeading
        title="Welcome back, Alex 👋"
        subtitle="Here's what's happening with your portfolio today."
      />
      <div className="grid gap-4 lg:grid-cols-[1.7fr_.9fr]">
        <Card className="min-h-[250px]">
          <div className="flex flex-col justify-between gap-4 sm:flex-row">
            <div>
              <p className="text-xs text-[#8b969e]">Total Portfolio Value</p>
              <p className="metric-value mt-4 text-4xl font-semibold sm:text-[42px]">
                {liveTotal.toLocaleString(undefined, {
                  style: "currency",
                  currency: "USD",
                })}
              </p>
              <p className="mt-3 text-sm font-semibold text-[#00d084]">
                +12.45%{" "}
                <span className="ml-2 text-[#d4dade]">+$27,520.30 (24h)</span>
              </p>
            </div>
            <div className="h-[128px] min-w-0 flex-1 sm:max-w-[360px]">
              <LineChart data={portfolioSeries} colour="#ffc400" />
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/dashboard/wallet/deposit" className="gold-button">
              <IconArrowDown size={17} />
              Deposit
            </Link>
            <Link href="/dashboard/wallet/withdraw" className="dash-button">
              <IconArrowUp size={17} />
              Withdraw
            </Link>
            <button className="dash-button">
              <IconRefresh size={17} />
              Transfer
            </button>
            <Link href="/dashboard/wallet/connect" className="dash-button">
              <IconWallet size={17} />
              Connect Wallet
            </Link>
          </div>
        </Card>
        <Card title="Portfolio Allocation">
          <div className="grid grid-cols-[150px_1fr] items-center">
            <AllocationChart value="" />
            <div className="space-y-4">
              {allocation.map(([name, value, colour]) => (
                <div
                  key={name}
                  className="flex items-center justify-between gap-3 text-xs"
                >
                  <span className="flex items-center gap-2">
                    <i
                      className="size-2.5 rounded-full"
                      style={{ background: colour }}
                    />
                    {name}
                  </span>
                  <b>{value}</b>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardMetrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card title="Investment Portfolio">
          <p className="metric-value text-2xl font-semibold">
            {investmentTotal.toLocaleString(undefined, {
              style: "currency",
              currency: "USD",
            })}
          </p>
          <div className="h-28">
            <LineChart data={marketSeries} colour="#ffc400" compact />
          </div>
          {dashboardAssets.slice(0, 4).map((asset) => (
            <div
              key={asset.symbol}
              className="flex items-center gap-3 border-t border-[#1f292f] py-3"
            >
              <Coin symbol={asset.symbol} colour={asset.colour} size="sm" />
              <div>
                <p className="text-xs font-semibold">
                  {asset.name}{" "}
                  <span className="text-[#76838b]">{asset.symbol}</span>
                </p>
                <p className="text-[10px] text-[#76838b]">
                  {asset.balance} {asset.symbol}
                </p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-xs font-semibold">{asset.value}</p>
                <p className="text-[10px] text-[#00d084]">{asset.change}</p>
              </div>
            </div>
          ))}
        </Card>
        <Card title="Trading Portfolio">
          <p className="metric-value text-2xl font-semibold">
            $78,920.30 <span className="text-sm text-[#00d084]">+8.21%</span>
          </p>
          <div className="h-28">
            <LineChart data={portfolioSeries} colour="#2f80ed" compact />
          </div>
          {[
            ["Spot Wallet", "$32,450.20"],
            ["Futures Wallet", "$28,670.10"],
            ["Margin Balance", "$12,800.00"],
            ["Available Balance", "$5,000.00"],
          ].map(([a, b]) => (
            <div
              key={a}
              className="flex justify-between border-t border-[#1f292f] py-3 text-xs"
            >
              <span>{a}</span>
              <b>{b}</b>
            </div>
          ))}
        </Card>
        <Card
          title="Active Positions"
          action={
            <Link href="/dashboard/trade" className="text-xs text-[#ffc400]">
              View All →
            </Link>
          }
        >
          {dashboardAssets.slice(0, 3).map((asset, index) => (
            <div
              key={asset.symbol}
              className="flex items-center gap-3 border-b border-[#1f292f] py-4 last:border-0"
            >
              <Coin symbol={asset.symbol} colour={asset.colour} size="sm" />
              <div>
                <b className="text-xs">{asset.symbol}/USDT</b>
                <p
                  className={
                    index === 2
                      ? "text-[10px] text-[#ef4444]"
                      : "text-[10px] text-[#00d084]"
                  }
                >
                  {index === 2 ? "Short · 3x" : "Long · 10x"}
                </p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-xs">{asset.price}</p>
                <Status tone={index === 2 ? "red" : "green"}>
                  {index === 2 ? "-3.21%" : "+6.54%"}
                </Status>
              </div>
            </div>
          ))}
        </Card>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card title="Market Watch" className="lg:col-span-2">
          <AssetTable compact />
        </Card>
        <Card title="AI Bot Performance">
          <div className="grid min-w-0 gap-4 sm:grid-cols-[140px_minmax(0,1fr)] sm:items-center">
            <AllocationChart value="+12.34%" />
            <div className="min-w-0">
              <p className="text-xs text-[#8a969e]">Total Bot P&L (30D)</p>
              <p className="mt-2 text-xl font-semibold">+$1,250.60</p>
              <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
                <span>
                  Active Bots
                  <br />
                  <b className="mt-1 block text-lg">4</b>
                </span>
                <span>
                  Total Invested
                  <br />
                  <b className="mt-1 block text-lg">$10,200</b>
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}

function AssetTable({ compact = false }: { compact?: boolean }) {
  const dashboardAssets = useLiveDashboardAssets();
  const rows = dashboardAssets.map((asset, index) => [
    <span key="asset" className="flex items-center gap-2">
      <Coin symbol={asset.symbol} colour={asset.colour} size="sm" />
      <span>
        <b>{asset.name}</b>{" "}
        <small className="text-[#72808a]">{asset.symbol}</small>
      </span>
    </span>,
    asset.price,
    <span
      key="change"
      className={
        asset.change.startsWith("-") ? "text-[#ef4444]" : "text-[#00d084]"
      }
    >
      {asset.change}
    </span>,
    asset.value,
    <div key="chart" className="h-8 w-24">
      <LineChart
        data={[10, 14, 12, 17, 15, 22, 20, 27, 25, 32].map((v) => v + index)}
        compact
        colour="#00d084"
      />
    </div>,
  ]);
  return (
    <DataTable
      compact={compact}
      headers={["Asset", "Price", "24h Change", "Value", "Last 7 Days"]}
      rows={rows}
    />
  );
}

export function PortfolioPage() {
  const dashboardAssets = useLiveDashboardAssets();
  return (
    <>
      <PageHeading
        title="Investment Portfolio"
        subtitle="Track your long-term holdings and wealth growth."
        action={<button className="dash-button">Export Report</button>}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Total Investment Value"
          value="$168,240.70"
          change="+15.34% All Time"
          icon={IconBriefcase}
        />
        <MetricCard
          label="Total Profit / Loss"
          value="$22,240.70"
          change="+15.34%"
        />
        <MetricCard
          label="ROI (All Time)"
          value="+42.68%"
          change=""
          colour="#8b5cf6"
        />
        <MetricCard
          label="Annualized Return"
          value="+28.65%"
          colour="#20c7c7"
        />
        <MetricCard
          label="Income Earned"
          value="$6,540.80"
          change="From Staking & Earn"
          colour="#ff6b35"
        />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card title="Portfolio Growth">
          <p className="text-2xl font-semibold">
            $168,240.70 <span className="text-xs text-[#00d084]">+15.34%</span>
          </p>
          <div className="h-[300px]">
            <LineChart data={marketSeries} colour="#ffc400" yAxis />
          </div>
        </Card>
        <Card title="Asset Allocation">
          <AllocationChart value="$168,240.70" />
          {allocation.map(([a, b, c]) => (
            <div key={a} className="flex justify-between py-2 text-xs">
              <span className="flex items-center gap-2">
                <i className="size-2 rounded-full" style={{ background: c }} />
                {a}
              </span>
              <b>{b}</b>
            </div>
          ))}
        </Card>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.7fr_1fr]">
        <Card title="Long-term Holdings">
          <AssetTable />
        </Card>
        <div className="grid gap-4">
          <Card title="Income Summary">
            <div className="grid grid-cols-2 gap-3">
              <MiniBox title="Staking Rewards" value="$4,250.30" />
              <MiniBox title="Earn Interest" value="$2,290.50" />
            </div>
          </Card>
          <Card title="Recent Activity">
            {dashboardAssets.slice(0, 4).map((a, i) => (
              <div
                key={a.symbol}
                className="flex justify-between border-b border-[#1f292f] py-3 text-xs"
              >
                <span>
                  {["Staking Reward", "Buy", "Earn Interest", "Stake"][i]} ·{" "}
                  {a.symbol}
                </span>
                <b className={i === 1 ? "text-[#ef4444]" : "text-[#00d084]"}>
                  {i === 1 ? "-$3,410.20" : "+$250.80"}
                </b>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </>
  );
}

export function MarketsPage() {
  const dashboardAssets = useLiveDashboardAssets();
  const { prices, loading, error } = useLivePrices();
  const trackedMarketCap = Object.values(prices).reduce(
    (sum, item) => sum + (item.marketCap ?? 0),
    0,
  );
  const trackedVolume = Object.values(prices).reduce(
    (sum, item) => sum + (item.volume24h ?? 0),
    0,
  );
  const btcMarketCap = prices.bitcoin?.marketCap ?? 0;
  const trackedDominance = trackedMarketCap
    ? (btcMarketCap / trackedMarketCap) * 100
    : null;
  return (
    <>
      <PageHeading
        title="Markets"
        subtitle="Explore global crypto markets and trending opportunities."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Tracked Market Cap"
          value={
            trackedMarketCap ? formatCompactUsd(trackedMarketCap) : "Loading…"
          }
          change="BTC, ETH, USDT, SOL, BNB & XRP"
        />
        <MetricCard
          label="24h Trading Volume"
          value={trackedVolume ? formatCompactUsd(trackedVolume) : "Loading…"}
          change="Live CoinGecko volume"
          colour="#00d084"
        />
        <MetricCard
          label="BTC Dominance"
          value={
            trackedDominance == null
              ? "Loading…"
              : `${trackedDominance.toFixed(2)}%`
          }
          change="Share of tracked assets"
          colour="#f7931a"
        />
        <MetricCard
          label="Active Cryptocurrencies"
          value={String(Object.keys(prices).length || 6)}
          change={
            error ? "Feed unavailable" : loading ? "Refreshing…" : "Live assets"
          }
          colour="#20c7c7"
        />
        <Card>
          <p className="text-xs text-[#8b969e]">Market Sentiment</p>
          <p className="mt-3 text-2xl font-semibold">Greed</p>
          <p className="mt-1 text-lg text-[#00d084]">
            72 <small className="text-[#8b969e]">/ 100</small>
          </p>
        </Card>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.8fr_.7fr]">
        <Card
          title="All Cryptocurrencies"
          action={
            <button className="dash-button min-h-8 px-3">
              <IconFilter size={14} />
              Filters
            </button>
          }
        >
          <AssetTable />
        </Card>
        <div className="space-y-4">
          <Card title="Trending Coins">
            {dashboardAssets.slice(1, 6).map((a, i) => (
              <div
                key={a.symbol}
                className="flex items-center gap-2 py-3 text-xs"
              >
                <span className="w-4 text-[#78858d]">{i + 1}</span>
                <Coin symbol={a.symbol} colour={a.colour} size="sm" />
                <span>{a.symbol}</span>
                <b
                  className={`ml-auto ${a.change.startsWith("-") ? "text-[#ef4444]" : "text-[#00d084]"}`}
                >
                  {a.change}
                </b>
              </div>
            ))}
          </Card>
          <Card title="New Listings">
            {["ZKAI", "NOVA", "LUMI", "AERO"].map((a, i) => (
              <div key={a} className="flex justify-between py-3 text-xs">
                <span>{a}</span>
                <Status tone="yellow">New</Status>
                <b className="text-[#00d084]">+{24 - i * 3}.18%</b>
              </div>
            ))}
          </Card>
        </div>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.7fr_.8fr]">
        <Card title="Market Overview">
          <div className="h-[280px]">
            <LineChart data={marketSeries} colour="#00d084" yAxis />
          </div>
        </Card>
        <Card title="Market Stats">
          {[
            [
              "Tracked Market Cap",
              trackedMarketCap ? formatCompactUsd(trackedMarketCap) : "—",
            ],
            [
              "Tracked 24h Volume",
              trackedVolume ? formatCompactUsd(trackedVolume) : "—",
            ],
            [
              "BTC Share",
              trackedDominance == null
                ? "—"
                : `${trackedDominance.toFixed(2)}%`,
            ],
            ["Live Assets", String(Object.keys(prices).length)],
            ["Source", error ? "Cached fallback" : "CoinGecko"],
          ].map(([a, b]) => (
            <div
              key={a}
              className="flex justify-between border-b border-[#1f292f] py-4 text-sm"
            >
              <span className="text-[#89949c]">{a}</span>
              <b>{b}</b>
            </div>
          ))}
        </Card>
      </div>
    </>
  );
}

export function LegacyWalletPage() {
  const dashboardAssets = useLiveDashboardAssets();
  const liveTotal = dashboardAssets.reduce(
    (sum, asset) => sum + Number(asset.value.replace(/[$,]/g, "")),
    0,
  );
  return (
    <>
      <PageHeading
        title="Wallet Overview"
        subtitle="Manage your assets, view balances, and track all wallet activities."
      />
      <div className="grid gap-4 lg:grid-cols-[1.8fr_.8fr]">
        <div className="space-y-4">
          <Card>
            <div className="grid items-center gap-4 md:grid-cols-[1fr_220px_1fr]">
              <div>
                <p className="text-xs text-[#8b969e]">Total Balance</p>
                <p className="mt-3 text-4xl font-semibold">
                  {liveTotal.toLocaleString(undefined, {
                    style: "currency",
                    currency: "USD",
                  })}
                </p>
                <p className="mt-3 text-sm text-[#00d084]">
                  +$12,450.30 (+5.29%)
                </p>
              </div>
              <AllocationChart value="" />
              <div className="space-y-4">
                {allocation.map(([a, b, c]) => (
                  <div key={a} className="flex justify-between text-xs">
                    <span className="flex items-center gap-2">
                      <i
                        className="size-2.5 rounded-full"
                        style={{ background: c }}
                      />
                      {a.replace(/ \(.+\)/, " Wallet")}
                    </span>
                    <b>{b}</b>
                  </div>
                ))}
              </div>
            </div>
          </Card>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Funding Wallet", "$45,020.30", IconWallet],
              ["Spot Wallet", "$120,080.40", IconBriefcase],
              ["Futures Wallet", "$50,240.60", IconChartBar],
              ["Earn Wallet", "$33,080.90", IconCoins],
            ].map(([a, b, Icon]) => (
              <Card key={String(a)}>
                <span className="grid size-10 place-items-center rounded-full bg-[#ffc40018] text-[#ffc400]">
                  <Icon size={20} />
                </span>
                <p className="mt-4 text-sm font-semibold">{String(a)}</p>
                <p className="mt-2 text-xl font-semibold">{String(b)}</p>
                <p className="mt-2 text-xs text-[#00d084]">+4.78%</p>
              </Card>
            ))}
          </div>
          <Card title="Your Assets">
            <AssetTable />
          </Card>
        </div>
        <div className="space-y-4">
          <Card title="Quick Actions">
            {[
              ["Deposit", IconArrowDown, "/dashboard/wallet/deposit"],
              ["Withdraw", IconArrowUp, "/dashboard/wallet/withdraw"],
              ["Transfer", IconRefresh, "#"],
              ["Connect Wallet", IconWallet, "/dashboard/wallet/connect"],
            ].map(([a, Icon, href]) => (
              <Link
                key={String(a)}
                href={String(href)}
                className="mb-3 flex items-center gap-3 rounded-xl border border-[#253039] p-4 last:mb-0 hover:border-[#ffc400]"
              >
                <Icon className="text-[#ffc400]" size={22} />
                <div>
                  <b className="text-sm text-[#ffc400]">{String(a)}</b>
                  <p className="mt-1 text-xs text-[#819099]">
                    Manage your assets
                  </p>
                </div>
                <span className="ml-auto">→</span>
              </Link>
            ))}
          </Card>
          <Card title="Recent Transactions">
            {dashboardAssets.slice(0, 5).map((a, i) => (
              <div
                key={a.symbol}
                className="flex justify-between border-b border-[#1f292f] py-3 text-xs"
              >
                <span>
                  <b>{i % 2 ? "Transfer" : "Deposit"}</b>
                  <br />
                  <small className="text-[#7c8991]">{a.symbol} · May 24</small>
                </span>
                <b className={i === 3 ? "text-[#ef4444]" : "text-[#00d084]"}>
                  {i === 3 ? "-0.5800 BTC" : "+2,500.00 USDT"}
                </b>
              </div>
            ))}
          </Card>
        </div>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Card title="Connected Wallets">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              "MetaMask",
              "WalletConnect",
              "Ledger Nano X",
              "Connect New Wallet",
            ].map((a) => (
              <div
                key={a}
                className="rounded-xl border border-[#263039] p-4 text-center"
              >
                <Coin symbol={a} colour="#6d4aff" />
                <p className="mt-3 text-xs font-semibold">{a}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Asset Allocation">
          <div className="mt-5 flex h-9 overflow-hidden rounded-lg">
            {allocation.map(([a, b, c]) => (
              <span
                key={a}
                title={`${a} ${b}`}
                style={{ width: b, background: c }}
              />
            ))}
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4">
            {allocation.map(([a, b, c]) => (
              <div key={a} className="text-xs">
                <span className="flex items-center gap-2">
                  <i
                    className="size-2 rounded-full"
                    style={{ background: c }}
                  />
                  {a}
                </span>
                <b className="mt-2 block">{b}</b>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}

const portfolioColours = [
  "#ffc400",
  "#2f80ed",
  "#20c7c7",
  "#7847e7",
  "#00d084",
  "#ff6b35",
];
const money = (value: string) =>
  Number(value).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
  });

function RealAssetBalances() {
  const { positions, loading } = usePortfolio();
  if (loading)
    return (
      <p className="py-8 text-center text-sm text-[#819099]">
        Loading ledger balances…
      </p>
    );
  if (!positions.length)
    return (
      <p className="py-8 text-center text-sm text-[#819099]">
        No approved deposits yet. Approved deposits will appear here
        automatically.
      </p>
    );
  return (
    <DataTable
      headers={["Asset", "Available", "Invested", "On hold", "Total value"]}
      rows={positions.map((position, index) => [
        <span key="asset" className="flex items-center gap-2">
          <Coin
            symbol={position.symbol}
            colour={portfolioColours[index % portfolioColours.length]}
            size="sm"
          />
          <b>{position.symbol}</b>
        </span>,
        `${Number(position.available).toLocaleString()} ${position.symbol}`,
        `${Number(position.invested).toLocaleString()} ${position.symbol}`,
        `${Number(position.held).toLocaleString()} ${position.symbol}`,
        money(position.value),
      ])}
    />
  );
}

function RealAllocation() {
  const { positions } = usePortfolio();
  if (!positions.length)
    return (
      <p className="py-8 text-center text-sm text-[#819099]">
        No assets to allocate.
      </p>
    );
  return (
    <div className="space-y-4">
      {positions.map((position, index) => (
        <div key={position.assetId}>
          <div className="mb-2 flex justify-between text-xs">
            <span>{position.symbol}</span>
            <b>{position.allocation.toFixed(2)}%</b>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#253038]">
            <div
              className="h-full rounded-full"
              style={{
                width: `${position.allocation}%`,
                background: portfolioColours[index % portfolioColours.length],
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function OverviewPage() {
  const portfolio = usePortfolio();
  return (
    <>
      <PageHeading
        title="Welcome back"
        subtitle="Your balances below come directly from the financial ledger."
      />
      {portfolio.error && (
        <p className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          {portfolio.error}
        </p>
      )}
      <div className="grid gap-4 lg:grid-cols-[1.7fr_.9fr]">
        <Card>
          <p className="text-xs text-[#8b969e]">Total Portfolio Value</p>
          <p className="metric-value mt-4 text-4xl font-semibold">
            {portfolio.loading ? "Loading…" : money(portfolio.totalValue)}
          </p>
          <p className="mt-3 text-xs text-[#819099]">
            Available, invested, and held ledger balances at current market
            prices.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/dashboard/wallet/deposit" className="gold-button">
              <IconArrowDown size={17} />
              Deposit
            </Link>
            <Link href="/dashboard/wallet/withdraw" className="dash-button">
              <IconArrowUp size={17} />
              Withdraw
            </Link>
            <button
              className="dash-button"
              onClick={() => void portfolio.refresh()}
            >
              <IconRefresh size={17} />
              Refresh
            </button>
          </div>
        </Card>
        <Card title="Portfolio Allocation">
          <RealAllocation />
        </Card>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Available Balance"
          value={
            portfolio.loading ? "Loading…" : money(portfolio.availableValue)
          }
          change="Spendable ledger balance"
          icon={IconWallet}
        />
        <MetricCard
          label="Invested Balance"
          value={
            portfolio.loading ? "Loading…" : money(portfolio.investedValue)
          }
          change="Fixed APY principal + rewards"
          icon={IconBriefcase}
        />
        <MetricCard
          label="Funds On Hold"
          value={portfolio.loading ? "Loading…" : money(portfolio.heldValue)}
          change="Pending withdrawals"
          icon={IconChartBar}
        />
        <MetricCard
          label="Assets Held"
          value={String(portfolio.positions.length)}
          change="Non-zero ledger assets"
          icon={IconCoins}
        />
      </div>
      <div className="mt-4">
        <Card title="Your Assets">
          <RealAssetBalances />
        </Card>
      </div>
    </>
  );
}

export function WalletPage() {
  const portfolio = usePortfolio();
  return (
    <>
      <PageHeading
        title="Wallet Overview"
        subtitle="Balances update automatically after a deposit is approved."
      />
      {portfolio.error && (
        <p className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          {portfolio.error}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total Balance"
          value={portfolio.loading ? "Loading…" : money(portfolio.totalValue)}
          change="All ledger buckets"
          icon={IconWallet}
        />
        <MetricCard
          label="Available"
          value={
            portfolio.loading ? "Loading…" : money(portfolio.availableValue)
          }
          change="Ready to use"
          icon={IconCoins}
        />
        <MetricCard
          label="Invested"
          value={
            portfolio.loading ? "Loading…" : money(portfolio.investedValue)
          }
          change="Fixed APY investments"
          icon={IconBriefcase}
        />
        <MetricCard
          label="On Hold"
          value={portfolio.loading ? "Loading…" : money(portfolio.heldValue)}
          change="Pending withdrawal funds"
          icon={IconChartBar}
        />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.7fr_.8fr]">
        <Card title="Your Assets">
          <RealAssetBalances />
        </Card>
        <div className="space-y-4">
          <Card title="Quick Actions">
            <div className="grid gap-3">
              <Link
                href="/dashboard/wallet/deposit"
                className="gold-button justify-center"
              >
                <IconArrowDown size={17} />
                Deposit
              </Link>
              <Link
                href="/dashboard/wallet/withdraw"
                className="dash-button justify-center"
              >
                <IconArrowUp size={17} />
                Withdraw
              </Link>
              <button
                className="dash-button justify-center"
                onClick={() => void portfolio.refresh()}
              >
                <IconRefresh size={17} />
                Refresh balances
              </button>
            </div>
          </Card>
          <Card title="Asset Allocation">
            <RealAllocation />
          </Card>
        </div>
      </div>
    </>
  );
}

function MiniBox({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#222c32] bg-[#0a0f12] p-4">
      <IconRocket size={20} className="text-[#8b5cf6]" />
      <p className="mt-3 text-xs text-[#89949c]">{title}</p>
      <b className="mt-1 block text-lg">{value}</b>
    </div>
  );
}
