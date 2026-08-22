"use client";

import { useState } from "react";
import Link from "next/link";
import {
  IconBolt,
  IconChartCandle,
  IconRefresh,
  IconRobot,
  IconShield,
  IconTarget,
  IconTrendingUp,
} from "@tabler/icons-react";
import {
  bots,
  dashboardAssets,
  demoSeries,
  earnAssets,
  marketSeries,
  traders,
} from "@/lib/dashboard-data";
import {
  Card,
  Coin,
  DataTable,
  LineChart,
  MetricCard,
  PageHeading,
  Segmented,
  Status,
} from "./DashboardUI";

function TradingChart({ colour = "#00d084" }: { colour?: string }) {
  return (
    <div className="h-[330px]">
      <LineChart
        data={marketSeries.map(
          (value, index) => value + (index % 3 === 0 ? 10 : -4),
        )}
        colour={colour}
        yAxis
      />
    </div>
  );
}

export function TradePage({ futures = false }: { futures?: boolean }) {
  const [side, setSide] = useState("Buy");
  return (
    <>
      <PageHeading
        title={futures ? "Futures Trading" : "BTC/USDT"}
        subtitle={
          futures
            ? "Trade perpetual futures with precision."
            : "Bitcoin · Live market"
        }
      />
      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-5">
          <Coin symbol="BTC" colour="#f7931a" size="lg" />
          <div>
            <b>BTC/USDT</b>
            <p className="text-xs text-[#849099]">Bitcoin</p>
          </div>
          <strong className="text-3xl text-[#00d084]">68,420.50</strong>
          {[
            ["24h Change", "+2.45%"],
            ["24h High", "68,932.10"],
            ["24h Low", "66,210.30"],
            ["24h Volume", "12,458.32 BTC"],
          ].map(([a, b]) => (
            <div key={a} className="ml-auto min-w-[110px]">
              <small className="text-[#7f8b93]">{a}</small>
              <b className="mt-1 block text-sm">{b}</b>
            </div>
          ))}
        </div>
      </Card>
      <div className="grid gap-4 xl:grid-cols-[1.8fr_.78fr]">
        <div className="space-y-4">
          <Card title="Chart">
            <div className="mb-4 flex flex-wrap gap-2 text-xs">
              {["1m", "5m", "15m", "1h", "4h", "1D"].map((a) => (
                <button
                  key={a}
                  className={`rounded px-3 py-1.5 ${a === "1h" ? "bg-[#4d248e] text-white" : "text-[#849099]"}`}
                >
                  {a}
                </button>
              ))}
            </div>
            <TradingChart />
          </Card>
          <div className="grid gap-4 md:grid-cols-2">
            <Card title="Order Book">
              <OrderBook />
            </Card>
            <Card title="Recent Trades">
              <OrderBook recent />
            </Card>
          </div>
        </div>
        <div className="space-y-4">
          <Card>
            <Segmented
              options={["Buy", "Sell"]}
              value={side}
              onChange={setSide}
            />
            <div className="mt-5 flex gap-4 text-xs">
              <button className="text-[#ffc400]">Limit</button>
              <button className="text-[#819099]">Market</button>
              <button className="text-[#819099]">Stop Limit</button>
            </div>
            <label className="mt-5 block text-xs text-[#8b969e]">
              Price (USDT)
              <input className="dash-input mt-2" defaultValue="68420.50" />
            </label>
            <label className="mt-4 block text-xs text-[#8b969e]">
              Amount (BTC)
              <input className="dash-input mt-2" defaultValue="0.100000" />
            </label>
            <input
              type="range"
              className="mt-5 w-full accent-[#ffc400]"
              defaultValue="50"
            />
            <label className="mt-4 block text-xs text-[#8b969e]">
              Total
              <input className="dash-input mt-2" defaultValue="6842.05" />
            </label>
            <button
              className={`mt-5 min-h-12 w-full rounded-lg font-semibold ${side === "Buy" ? "bg-[#00d084] text-black" : "bg-[#ef4444] text-white"}`}
            >
              {side} BTC
            </button>
          </Card>
          <Card title="Market Stats">
            {[
              ["Market Cap", "$1.35T"],
              ["Circulating Supply", "19.72M BTC"],
              ["Max Supply", "21M BTC"],
              ["All Time High", "$73,737.94"],
            ].map(([a, b]) => (
              <div
                key={a}
                className="flex justify-between border-b border-[#1f292f] py-3 text-xs"
              >
                <span className="text-[#819099]">{a}</span>
                <b>{b}</b>
              </div>
            ))}
          </Card>
        </div>
      </div>
      <Card className="mt-4" title="Open Orders">
        <DataTable
          headers={[
            "Pair",
            "Type",
            "Side",
            "Price",
            "Amount",
            "Filled",
            "Status",
            "Action",
          ]}
          rows={dashboardAssets.slice(0, 3).map((a, index) => [
            `${a.symbol}/USDT`,
            `Limit`,
            <span
              key="side"
              className={index === 1 ? "text-[#ef4444]" : "text-[#00d084]"}
            >
              {index === 1 ? "Sell" : "Buy"}
            </span>,
            a.price,
            `${index + 1}.0000`,
            `${index * 25}%`,
            <Status key="status">Open</Status>,
            <button key="cancel" className="text-[#ffc400]">
              Cancel
            </button>,
          ])}
        />
      </Card>
    </>
  );
}

function OrderBook({ recent = false }: { recent?: boolean }) {
  const prices = [
    68426.1, 68425.8, 68425.6, 68425.2, 68424.9, 68420.4, 68420.1, 68419.8,
  ];
  return (
    <div>
      {prices.map((price, i) => (
        <div key={price} className="grid grid-cols-3 py-1.5 text-[11px]">
          <span className={i < 5 ? "text-[#ef4444]" : "text-[#00d084]"}>
            {price.toFixed(2)}
          </span>
          <span>{(0.12 + i * 0.07).toFixed(4)}</span>
          <span className="text-right">
            {recent
              ? `18:37:${21 - i}`
              : `${(8000 + i * 2450).toLocaleString()}`}
          </span>
        </div>
      ))}
    </div>
  );
}

export function DemoTradingPage() {
  return (
    <>
      <PageHeading
        title="Demo Trading"
        subtitle="Practice trading with virtual funds. Sharpen your skills risk-free."
        action={<button className="gold-button">Switch to Live Trading</button>}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Virtual Balance"
          value="$100,000.00"
          change="Virtual Funds"
          colour="#8b5cf6"
        />
        <MetricCard label="Today's P&L" value="+$2,450.75" change="+2.45%" />
        <MetricCard label="Total P&L" value="+$8,765.40" change="+8.77%" />
        <MetricCard label="Win Rate" value="68.42%" change="24/35 Trades" />
        <Card>
          <p className="text-xs text-[#819099]">Trading Score</p>
          <p className="mt-6 text-center text-4xl font-semibold text-[#8b5cf6]">
            87<span className="text-sm">/100</span>
          </p>
        </Card>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.7fr_.7fr]">
        <Card title="Demo Performance">
          <div className="h-[320px]">
            <LineChart data={demoSeries} colour="#8b5cf6" yAxis />
          </div>
        </Card>
        <Card title="Practice Tips">
          {[
            [IconChartCandle, "Test Strategies"],
            [IconTrendingUp, "Learn & Improve"],
            [IconShield, "Risk Management"],
            [IconTarget, "Track Progress"],
          ].map(([Icon, label]) => (
            <div key={String(label)} className="flex gap-3 py-4">
              <span className="grid size-10 place-items-center rounded-full bg-[#8b5cf618]">
                <Icon size={20} />
              </span>
              <div>
                <b className="text-sm">{String(label)}</b>
                <p className="mt-1 text-xs text-[#819099]">
                  Practice confidently with virtual capital.
                </p>
              </div>
            </div>
          ))}
        </Card>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title="Popular Markets">
          <SimpleAssetTable />
        </Card>
        <Card title="Recent Demo Trades">
          <SimpleAssetTable />
        </Card>
      </div>
    </>
  );
}

export function BotsPage() {
  return (
    <>
      <PageHeading
        title="AI Trading Bots"
        subtitle="Deploy intelligent bots and automate your trading strategy."
        action={
          <Link href="/dashboard/ai-trading/create" className="gold-button">
            + Create New Bot
          </Link>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Total Bots"
          value="12"
          change="7 Active"
          icon={IconRobot}
          colour="#8b5cf6"
        />
        <MetricCard label="Total Invested" value="$28,450.00" />
        <MetricCard label="Total Profit" value="$4,562.75" change="+19.12%" />
        <MetricCard label="Win Rate (Avg)" value="72.48%" change="+4.32%" />
        <MetricCard label="24h Profit" value="$563.45" change="+2.05%" />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.55fr_1fr]">
        <Card title="Active Bots (7)">
          <DataTable
            headers={[
              "Bot Name",
              "Strategy",
              "Pair",
              "Invested",
              "Total Profit",
              "Status",
            ]}
            rows={bots.map((b) => [
              <span key="name" className="flex items-center gap-2">
                <Coin symbol={b[0]} colour="#6d36c9" size="sm" />
                {b[0]}
              </span>,
              b[1],
              b[2],
              b[3],
              <span key="profit" className="text-[#00d084]">
                {b[4]}
              </span>,
              <Status key="status">{b[5]}</Status>,
            ])}
          />
        </Card>
        <Card title="Bot Performance">
          <div className="h-[320px]">
            <LineChart data={marketSeries} colour="#00d084" yAxis />
          </div>
        </Card>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          [
            IconChartCandle,
            "Grid Trading",
            "Automated buy and sell within price ranges",
          ],
          [
            IconTrendingUp,
            "Trend Following",
            "Follow strong market trends automatically",
          ],
          [IconBolt, "Scalping", "High-frequency trades for small profits"],
          [IconRefresh, "DCA Bot", "Invest regularly over time"],
        ].map(([Icon, title, copy]) => (
          <Card key={String(title)} className="text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-full bg-[#6d36c91f] text-[#9b61ff]">
              <Icon size={27} />
            </span>
            <h3 className="mt-4 font-semibold">{String(title)}</h3>
            <p className="mt-2 min-h-10 text-xs text-[#849099]">
              {String(copy)}
            </p>
            <button className="dash-button mt-4 w-full border-[#65510b] text-[#ffc400]">
              Select
            </button>
          </Card>
        ))}
      </div>
    </>
  );
}

export function CreateBotPage() {
  const [strategy, setStrategy] = useState("Trend Following");
  return (
    <>
      <PageHeading
        title="Create AI Trading Bot"
        subtitle="Build your custom trading bot in a few simple steps."
      />
      <div className="mx-auto max-w-[1050px]">
        <div className="mb-7 flex justify-between text-xs text-[#71808a]">
          {[
            "Strategy",
            "Pair",
            "Investment",
            "Risk Settings",
            "Bot Settings",
            "Backtest",
            "Confirm",
          ].map((s, i) => (
            <span key={s} className={i === 0 ? "text-[#a855f7]" : ""}>
              {i + 1}. {s}
            </span>
          ))}
        </div>
        <Card title="Choose a Strategy">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              "Trend Following",
              "Mean Reversion",
              "Grid Trading",
              "Arbitrage",
              "Scalping",
              "Custom Strategy",
            ].map((name) => (
              <button
                key={name}
                onClick={() => setStrategy(name)}
                className={`min-h-[135px] rounded-xl border p-5 text-left ${strategy === name ? "border-[#8b5cf6] bg-[#1a1128]" : "border-[#273138]"}`}
              >
                <span className="grid size-10 place-items-center rounded-full bg-[#8b5cf61f] text-[#a855f7]">
                  <IconRobot size={21} />
                </span>
                <b className="mt-4 block">{name}</b>
                <p className="mt-2 text-xs text-[#829099]">
                  Automated strategy designed for disciplined market execution.
                </p>
              </button>
            ))}
          </div>
          <div className="mt-6 flex justify-end">
            <button className="gold-button bg-[#7c3aed] text-white">
              Continue →
            </button>
          </div>
        </Card>
      </div>
    </>
  );
}

export function CopyTradingPage() {
  return (
    <>
      <PageHeading
        title="Copy Trading"
        subtitle="Follow top traders and automatically copy their trades."
      />
      <Card>
        <DataTable
          headers={[
            "Trader",
            "ROI (30D)",
            "Total P&L",
            "Win Rate",
            "Followers",
            "Risk Score",
            "Action",
          ]}
          rows={traders.map((t, i) => [
            <span key="t" className="flex items-center gap-2">
              <Coin symbol={t[0]} colour="#5f3a99" size="sm" />
              <b>{t[0]}</b>
            </span>,
            <span key="roi" className="text-[#00d084]">
              {t[1]}
            </span>,
            t[2],
            t[3],
            t[4],
            t[5],
            <Link
              key="copy"
              href={`/dashboard/copy-trading/${i === 0 ? "cryptomaster" : "trader"}`}
              className="rounded-md bg-[#ffc400] px-3 py-2 text-xs font-semibold text-black"
            >
              Copy
            </Link>,
          ])}
        />
      </Card>
      <div className="mt-4 grid gap-4 md:grid-cols-4">
        {[
          "Choose a trader",
          "Set your amount",
          "Start copying",
          "Earn together",
        ].map((a, i) => (
          <Card key={a}>
            <span className="grid size-8 place-items-center rounded-full bg-[#59309a] text-sm">
              {i + 1}
            </span>
            <b className="mt-3 block text-sm">{a}</b>
            <p className="mt-1 text-xs text-[#7f8d95]">
              A simple, transparent way to follow proven strategies.
            </p>
          </Card>
        ))}
      </div>
    </>
  );
}

export function TraderProfilePage() {
  return (
    <>
      <PageHeading
        title="CryptoMaster"
        subtitle="Ranked trader · Member since Jan 2023"
        action={
          <button className="gold-button bg-[#7c3aed] text-white">
            Copy This Trader
          </button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="ROI (All Time)" value="+214.35%" change="" />
        <MetricCard label="Max Drawdown" value="12.45%" />
        <MetricCard label="Win Rate" value="73.62%" />
        <MetricCard label="Profit Sharing" value="15%" />
        <MetricCard label="AUM" value="$2,458,320" />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.6fr_.7fr]">
        <Card title="Performance Overview">
          <div className="h-[340px]">
            <LineChart data={marketSeries} colour="#00d084" yAxis />
          </div>
        </Card>
        <Card title="About Trader">
          <p className="text-sm leading-6 text-[#8b969e]">
            Focuses on high-probability swing trades and trend-following
            strategies with disciplined risk management.
          </p>
          {[
            ["Trading Style", "Swing Trader"],
            ["Risk Level", "Medium"],
            ["Avg. Holding Time", "2–5 Days"],
            ["Preferred Markets", "BTC, ETH, SOL, BNB"],
          ].map(([a, b]) => (
            <div key={a} className="mt-4 flex justify-between text-xs">
              <span className="text-[#7d8a92]">{a}</span>
              <b>{b}</b>
            </div>
          ))}
        </Card>
      </div>
      <Card className="mt-4" title="Start Copying This Trader">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            className="dash-input flex-1"
            placeholder="Enter amount (USDT)"
          />
          {[100, 500, 1000, 5000].map((v) => (
            <button key={v} className="dash-button">
              {v.toLocaleString()}
            </button>
          ))}
          <button className="gold-button bg-[#7c3aed] text-white">
            Start Copying
          </button>
        </div>
      </Card>
    </>
  );
}

export function EarnPage() {
  return (
    <>
      <PageHeading
        title="Earn & Grow"
        subtitle="Stake your crypto and earn passive income."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Total Staked Value"
          value="$78,540.30"
          change="+12.45%"
          colour="#8b5cf6"
        />
        <MetricCard label="Total Earned" value="$4,250.30" change="+8.21%" />
        <MetricCard
          label="Average APY"
          value="18.65%"
          change="+2.35%"
          colour="#f97316"
        />
        <MetricCard
          label="Active Positions"
          value="7"
          change="Across 5 Assets"
        />
        <MetricCard
          label="Next Payout"
          value="$125.40"
          change="In 2d 14h"
          colour="#ffc400"
        />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.6fr_.85fr]">
        <Card title="Top Staking Opportunities">
          <DataTable
            headers={[
              "Asset",
              "APY",
              "Min. Stake",
              "Duration",
              "Risk",
              "Action",
            ]}
            rows={earnAssets.map((a, i) => [
              <span key="a" className="flex items-center gap-2">
                <Coin
                  symbol={a[1]}
                  colour={dashboardAssets[i % dashboardAssets.length].colour}
                  size="sm"
                />
                {a[0]} {a[1]}
              </span>,
              <span key="apy" className="text-[#00d084]">
                {a[2]}
              </span>,
              a[3],
              a[4],
              <Status key="risk" tone={a[5] === "Low" ? "green" : "yellow"}>
                {a[5]}
              </Status>,
              <button
                key="stake"
                className="dash-button min-h-8 border-[#6c5600] px-3 text-[#ffc400]"
              >
                Stake Now
              </button>,
            ])}
          />
        </Card>
        <Card title="Portfolio Earnings">
          <p className="text-2xl font-semibold">$4,250.30</p>
          <p className="mt-1 text-xs text-[#00d084]">+8.21% vs last month</p>
          <div className="h-[260px]">
            <LineChart data={demoSeries} colour="#00d084" yAxis />
          </div>
        </Card>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card title="My Staking Positions">
          <SimpleAssetTable />
        </Card>
        <Card title="Savings Accounts">
          <SimpleAssetTable />
        </Card>
        <Card title="Upcoming Payouts">
          <SimpleAssetTable />
        </Card>
      </div>
    </>
  );
}

function SimpleAssetTable() {
  return (
    <div>
      {dashboardAssets.slice(0, 5).map((a, i) => (
        <div
          key={a.symbol}
          className="flex items-center gap-3 border-b border-[#1f292f] py-3"
        >
          <Coin symbol={a.symbol} colour={a.colour} size="sm" />
          <div>
            <b className="text-xs">{a.symbol}/USDT</b>
            <p className="text-[10px] text-[#7d8991]">{a.name}</p>
          </div>
          <span className="ml-auto text-xs">{a.price}</span>
          <b
            className={
              i === 3 ? "text-xs text-[#ef4444]" : "text-xs text-[#00d084]"
            }
          >
            {a.change}
          </b>
        </div>
      ))}
    </div>
  );
}
