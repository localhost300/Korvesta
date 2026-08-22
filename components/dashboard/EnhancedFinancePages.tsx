"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  IconBriefcase,
  IconCalendar,
  IconChartLine,
  IconCheck,
  IconChevronDown,
  IconCoins,
  IconDownload,
  IconFileAnalytics,
  IconHistory,
  IconInfoCircle,
  IconRefresh,
  IconReportAnalytics,
  IconRocket,
  IconShieldCheck,
  IconTarget,
  IconTrendingUp,
  IconWallet,
  IconX,
} from "@tabler/icons-react";
import { clsx } from "clsx";
import {
  Card,
  Coin,
  DataTable,
  MetricCard,
  PageHeading,
  Segmented,
  Status,
} from "./DashboardUI";
import { InteractiveChart } from "./InteractiveChart";
import { LightweightMarketChart } from "@/components/LightweightMarketChart";
import {
  coinGeckoIdBySymbol,
  formatCompactUsd,
  useLivePrices,
} from "@/lib/use-live-prices";

type Pair = {
  symbol: string;
  name: string;
  base: string;
  price: number;
  change: number;
  high: number;
  low: number;
  volume: string;
  colour: string;
  series: number[];
};

type InvestmentPlan = {
  name: string;
  apy: number;
  duration: string;
  minimum: number;
  risk: "Low" | "Medium";
  copy: string;
  colour: string;
};

type Investment = {
  plan: string;
  principal: number;
  current: number;
  returnRate: number;
  started: string;
  maturity: string;
  status: "Active" | "Maturing";
};

type StakeOpportunity = {
  name: string;
  symbol: string;
  apy: number;
  minimum: number;
  duration: string;
  risk: "Low" | "Medium";
  colour: string;
};

type StakePosition = {
  asset: string;
  symbol: string;
  amount: number;
  apy: number;
  reward: number;
  started: string;
  nextPayout: string;
  status: "Active" | "Completed";
  colour: string;
};

const PAIRS: Pair[] = [
  {
    symbol: "BTC/USDT",
    name: "Bitcoin",
    base: "BTC",
    price: 68420.5,
    change: 2.45,
    high: 68932.1,
    low: 66210.3,
    volume: "12,458.32 BTC",
    colour: "#f7931a",
    series: [
      64210, 64880, 64620, 65540, 66220, 65940, 66730, 67380, 67110, 67920,
      67680, 68460, 68120, 68910, 68570, 69230, 68720, 68420,
    ],
  },
  {
    symbol: "ETH/USDT",
    name: "Ethereum",
    base: "ETH",
    price: 3512.65,
    change: 1.82,
    high: 3588.2,
    low: 3421.4,
    volume: "184,250 ETH",
    colour: "#627eea",
    series: [
      3290, 3320, 3365, 3340, 3392, 3418, 3388, 3440, 3472, 3456, 3490, 3530,
      3502, 3568, 3544, 3590, 3550, 3513,
    ],
  },
  {
    symbol: "SOL/USDT",
    name: "Solana",
    base: "SOL",
    price: 156.78,
    change: 3.21,
    high: 161.42,
    low: 149.28,
    volume: "2.34M SOL",
    colour: "#8b5cf6",
    series: [
      142, 145, 143, 148, 151, 149, 153, 152, 155, 158, 154, 159, 157, 162, 160,
      164, 159, 156.78,
    ],
  },
  {
    symbol: "BNB/USDT",
    name: "BNB",
    base: "BNB",
    price: 598.42,
    change: -0.45,
    high: 612.8,
    low: 586.4,
    volume: "985,420 BNB",
    colour: "#f3ba2f",
    series: [
      612, 608, 614, 607, 603, 606, 601, 597, 602, 595, 591, 596, 593, 600, 604,
      601, 599, 598.42,
    ],
  },
  {
    symbol: "XRP/USDT",
    name: "XRP",
    base: "XRP",
    price: 0.5286,
    change: 0.85,
    high: 0.542,
    low: 0.511,
    volume: "82.4M XRP",
    colour: "#64748b",
    series: [
      0.501, 0.507, 0.504, 0.512, 0.516, 0.511, 0.519, 0.522, 0.518, 0.526,
      0.523, 0.531, 0.528, 0.534, 0.529, 0.536, 0.532, 0.5286,
    ],
  },
];

const PORTFOLIO_SERIES = [
  92000, 96800, 101200, 99500, 108400, 112800, 119500, 116200, 124800, 131600,
  128400, 137200, 141800, 139500, 148700, 153200, 150600, 158400, 162900,
  168240,
];

const REWARD_SERIES = [
  340, 410, 385, 520, 610, 590, 720, 845, 810, 960, 1100, 1040, 1280, 1450,
  1510, 1730, 1980, 2210, 2460, 2680,
];

const INVESTMENT_PLANS: InvestmentPlan[] = [
  {
    name: "Starter Yield",
    apy: 5.5,
    duration: "30 days",
    minimum: 100,
    risk: "Low",
    copy: "A flexible introduction to diversified digital-asset yield.",
    colour: "#2f80ed",
  },
  {
    name: "Growth Portfolio",
    apy: 10.8,
    duration: "90 days",
    minimum: 1000,
    risk: "Low",
    copy: "A balanced allocation designed for steady medium-term growth.",
    colour: "#00d084",
  },
  {
    name: "Balanced Growth",
    apy: 15.4,
    duration: "180 days",
    minimum: 2500,
    risk: "Medium",
    copy: "Higher growth exposure with active portfolio rebalancing.",
    colour: "#8b5cf6",
  },
  {
    name: "Elite Wealth",
    apy: 22.5,
    duration: "365 days",
    minimum: 10000,
    risk: "Medium",
    copy: "Long-term managed strategy for experienced investors.",
    colour: "#ffc400",
  },
];

const INITIAL_INVESTMENTS: Investment[] = [
  {
    plan: "Balanced Growth",
    principal: 50000,
    current: 57840,
    returnRate: 15.68,
    started: "Jan 15, 2024",
    maturity: "Jul 13, 2024",
    status: "Maturing",
  },
  {
    plan: "Growth Portfolio",
    principal: 35000,
    current: 38292,
    returnRate: 9.41,
    started: "Mar 08, 2024",
    maturity: "Jun 06, 2024",
    status: "Active",
  },
  {
    plan: "Elite Wealth",
    principal: 60000,
    current: 72108,
    returnRate: 20.18,
    started: "Jun 10, 2023",
    maturity: "Jun 09, 2024",
    status: "Maturing",
  },
];

const STAKING_OPPORTUNITIES: StakeOpportunity[] = [
  {
    name: "Ethereum",
    symbol: "ETH",
    apy: 6.25,
    minimum: 0.1,
    duration: "Flexible",
    risk: "Low",
    colour: "#627eea",
  },
  {
    name: "Solana",
    symbol: "SOL",
    apy: 8.35,
    minimum: 1,
    duration: "Flexible",
    risk: "Low",
    colour: "#8b5cf6",
  },
  {
    name: "BNB",
    symbol: "BNB",
    apy: 5.75,
    minimum: 0.5,
    duration: "30 days",
    risk: "Low",
    colour: "#f3ba2f",
  },
  {
    name: "Cardano",
    symbol: "ADA",
    apy: 4.9,
    minimum: 10,
    duration: "60 days",
    risk: "Low",
    colour: "#2f80ed",
  },
  {
    name: "Polkadot",
    symbol: "DOT",
    apy: 11.2,
    minimum: 5,
    duration: "90 days",
    risk: "Medium",
    colour: "#e6007a",
  },
];

const INITIAL_STAKES: StakePosition[] = [
  {
    asset: "Ethereum",
    symbol: "ETH",
    amount: 1.25,
    apy: 6.25,
    reward: 0.0485,
    started: "Jan 14, 2024",
    nextPayout: "2d 14h",
    status: "Active",
    colour: "#627eea",
  },
  {
    asset: "Solana",
    symbol: "SOL",
    amount: 25,
    apy: 8.35,
    reward: 1.29,
    started: "Feb 02, 2024",
    nextPayout: "2d 14h",
    status: "Active",
    colour: "#8b5cf6",
  },
  {
    asset: "BNB",
    symbol: "BNB",
    amount: 5,
    apy: 5.75,
    reward: 0.124,
    started: "Mar 12, 2024",
    nextPayout: "3d 6h",
    status: "Active",
    colour: "#f3ba2f",
  },
];

function money(value: number) {
  return value.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

function downloadCsv(filename: string, rows: Array<Array<string | number>>) {
  const csv = rows
    .map((row) =>
      row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","),
    )
    .join("\n");
  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function Modal({
  title,
  copy,
  close,
  children,
}: {
  title: string;
  copy?: string;
  close: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-[120] grid place-items-center bg-black/75 p-4 backdrop-blur-sm"
      onMouseDown={close}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
        className="dash-card max-h-[92vh] w-full max-w-lg overflow-y-auto p-0 shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-[var(--dash-line)] px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            {copy ? (
              <p className="mt-1 text-xs text-[var(--dash-muted)]">{copy}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={close}
            className="grid size-8 place-items-center rounded-lg border border-[var(--dash-line)]"
            aria-label="Close"
          >
            <IconX size={17} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </section>
    </div>
  );
}

function PlanCard({
  plan,
  onSelect,
}: {
  plan: InvestmentPlan;
  onSelect: (plan: InvestmentPlan) => void;
}) {
  return (
    <Card className="flex min-h-[255px] flex-col">
      <div className="flex items-start justify-between gap-3">
        <span
          className="grid size-11 place-items-center rounded-xl"
          style={{
            color: plan.colour,
            background: `${plan.colour}18`,
            border: `1px solid ${plan.colour}38`,
          }}
        >
          <IconTrendingUp size={22} />
        </span>
        <Status tone={plan.risk === "Low" ? "green" : "yellow"}>
          {plan.risk} risk
        </Status>
      </div>
      <h3 className="mt-5 text-base font-semibold">{plan.name}</h3>
      <p className="mt-2 min-h-10 text-xs leading-5 text-[var(--dash-muted)]">
        {plan.copy}
      </p>
      <div className="mt-5 grid grid-cols-3 gap-2 border-y border-[var(--dash-line)] py-4 text-xs">
        <span>
          <small className="block text-[var(--dash-muted)]">Target APY</small>
          <b className="mt-1 block text-[#00d084]">{plan.apy}%</b>
        </span>
        <span>
          <small className="block text-[var(--dash-muted)]">Duration</small>
          <b className="mt-1 block">{plan.duration}</b>
        </span>
        <span>
          <small className="block text-[var(--dash-muted)]">Minimum</small>
          <b className="mt-1 block">{money(plan.minimum)}</b>
        </span>
      </div>
      <button
        type="button"
        onClick={() => onSelect(plan)}
        className="gold-button mt-auto w-full"
      >
        Choose plan
      </button>
    </Card>
  );
}

export function InvestmentPortfolioPage() {
  const [plansOpen, setPlansOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<InvestmentPlan | null>(null);
  const [amount, setAmount] = useState("2500");
  const [investments, setInvestments] = useState(INITIAL_INVESTMENTS);
  const [trackedPlan, setTrackedPlan] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const totalPrincipal = investments.reduce(
    (total, item) => total + item.principal,
    0,
  );
  const totalCurrent = investments.reduce(
    (total, item) => total + item.current,
    0,
  );
  const profit = totalCurrent - totalPrincipal;

  const openInvestment = (plan: InvestmentPlan) => {
    setSelectedPlan(plan);
    setAmount(String(plan.minimum));
  };

  const confirmInvestment = () => {
    if (!selectedPlan) return;
    const numericAmount = Number(amount);
    if (
      !Number.isFinite(numericAmount) ||
      numericAmount < selectedPlan.minimum
    ) {
      setMessage(`Minimum investment is ${money(selectedPlan.minimum)}.`);
      return;
    }
    const today = new Date();
    const maturity = new Date(today);
    const days = Number.parseInt(selectedPlan.duration, 10);
    maturity.setDate(maturity.getDate() + days);
    setInvestments((current) => [
      ...current,
      {
        plan: selectedPlan.name,
        principal: numericAmount,
        current: numericAmount,
        returnRate: 0,
        started: today.toLocaleDateString(undefined, {
          month: "short",
          day: "2-digit",
          year: "numeric",
        }),
        maturity: maturity.toLocaleDateString(undefined, {
          month: "short",
          day: "2-digit",
          year: "numeric",
        }),
        status: "Active",
      },
    ]);
    setSelectedPlan(null);
    setMessage(`Your ${selectedPlan.name} investment is now active.`);
  };

  const exportReport = () => {
    downloadCsv("korvesta-investment-report.csv", [
      [
        "Plan",
        "Principal",
        "Current value",
        "Return",
        "Started",
        "Maturity",
        "Status",
      ],
      ...investments.map((item) => [
        item.plan,
        item.principal,
        item.current,
        `${item.returnRate}%`,
        item.started,
        item.maturity,
        item.status,
      ]),
    ]);
    setMessage("Investment report downloaded.");
  };

  return (
    <>
      <PageHeading
        title="Investment Portfolio"
        subtitle="Choose an investment plan, grow your capital, and track every position."
        action={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setPlansOpen((open) => !open)}
              className="gold-button"
            >
              <IconRocket size={17} />
              Invest now
            </button>
            <button
              type="button"
              onClick={exportReport}
              className="dash-button"
            >
              <IconDownload size={17} />
              Export report
            </button>
          </div>
        }
      />
      {message ? (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-[#00d08455] bg-[#00d08410] px-4 py-3 text-xs text-[#00d084]">
          <span className="flex items-center gap-2">
            <IconCheck size={17} />
            {message}
          </span>
          <button type="button" onClick={() => setMessage("")}>
            <IconX size={15} />
          </button>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Investment Value"
          value={money(totalCurrent)}
          change="+15.34% all time"
          icon={IconBriefcase}
        />
        <MetricCard
          label="Net Profit"
          value={`+${money(profit)}`}
          change="Realized + unrealized"
          icon={IconChartLine}
          colour="#00d084"
        />
        <MetricCard
          label="Active Plans"
          value={String(investments.length)}
          change="Across 4 strategies"
          icon={IconTarget}
          colour="#8b5cf6"
        />
        <MetricCard
          label="Next Maturity"
          value="18 days"
          change="Balanced Growth"
          icon={IconCalendar}
          colour="#20c7c7"
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.65fr_.75fr]">
        <Card
          title="Portfolio Growth"
          action={
            <span className="text-xs text-[#00d084]">
              +{money(profit)} profit
            </span>
          }
        >
          <InteractiveChart
            data={PORTFOLIO_SERIES}
            symbol="Investment portfolio"
            height={300}
            defaultTimeframe="1Y"
          />
        </Card>
        <Card title="Investment Health">
          <div className="rounded-xl border border-[var(--dash-line)] bg-[var(--dash-card-2)] p-5 text-center">
            <span className="mx-auto grid size-16 place-items-center rounded-full bg-[#00d08418] text-[#00d084]">
              <IconShieldCheck size={32} />
            </span>
            <p className="mt-4 text-3xl font-semibold">
              92<span className="text-sm text-[var(--dash-muted)]">/100</span>
            </p>
            <p className="mt-1 text-xs text-[#00d084]">Well diversified</p>
          </div>
          {[
            ["Diversification", "Excellent"],
            ["Risk exposure", "Moderate"],
            ["Auto-rebalance", "Enabled"],
            ["Income reinvestment", "On"],
          ].map(([label, value]) => (
            <div
              key={label}
              className="flex justify-between border-b border-[var(--dash-line)] py-3 text-xs last:border-0"
            >
              <span className="text-[var(--dash-muted)]">{label}</span>
              <b>{value}</b>
            </div>
          ))}
        </Card>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Investment Plans</h2>
          <p className="mt-1 text-xs text-[var(--dash-muted)]">
            Select a plan that matches your time horizon and goals.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setPlansOpen((open) => !open)}
          className="dash-button"
        >
          {plansOpen ? "Hide plans" : "Browse plans"}
          <IconChevronDown size={15} />
        </button>
      </div>
      <div
        className={clsx(
          "mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4",
          !plansOpen && "hidden xl:grid",
        )}
      >
        {INVESTMENT_PLANS.map((plan) => (
          <PlanCard key={plan.name} plan={plan} onSelect={openInvestment} />
        ))}
      </div>

      <Card
        className="mt-4"
        title="Track Your Investments"
        action={
          <button
            type="button"
            onClick={exportReport}
            className="text-xs font-semibold text-[#ffc400]"
          >
            Download full report →
          </button>
        }
      >
        <DataTable
          headers={[
            "Plan",
            "Invested",
            "Current Value",
            "Profit",
            "Return",
            "Started",
            "Maturity",
            "Status",
            "Action",
          ]}
          rows={investments.map((investment) => [
            <span key="plan" className="font-semibold">
              {investment.plan}
            </span>,
            money(investment.principal),
            money(investment.current),
            <span key="profit" className="text-[#00d084]">
              +{money(investment.current - investment.principal)}
            </span>,
            <span key="return" className="text-[#00d084]">
              +{investment.returnRate.toFixed(2)}%
            </span>,
            investment.started,
            investment.maturity,
            <Status
              key="status"
              tone={investment.status === "Active" ? "green" : "yellow"}
            >
              {investment.status}
            </Status>,
            <button
              key="track"
              type="button"
              onClick={() =>
                setTrackedPlan((current) =>
                  current === investment.plan ? null : investment.plan,
                )
              }
              className="text-[#ffc400]"
            >
              {trackedPlan === investment.plan ? "Close" : "Track"}
            </button>,
          ])}
        />
        {trackedPlan ? (
          <div className="mt-4 grid gap-3 rounded-xl border border-[#ffc40045] bg-[#ffc40008] p-4 sm:grid-cols-4">
            <div>
              <small className="text-[var(--dash-muted)]">
                Selected investment
              </small>
              <b className="mt-1 block text-sm">{trackedPlan}</b>
            </div>
            <div>
              <small className="text-[var(--dash-muted)]">Performance</small>
              <b className="mt-1 block text-sm text-[#00d084]">On target</b>
            </div>
            <div>
              <small className="text-[var(--dash-muted)]">Next review</small>
              <b className="mt-1 block text-sm">In 7 days</b>
            </div>
            <div>
              <small className="text-[var(--dash-muted)]">
                Projected payout
              </small>
              <b className="mt-1 block text-sm">$74,420.00</b>
            </div>
          </div>
        ) : null}
      </Card>

      {selectedPlan ? (
        <Modal
          title={`Invest in ${selectedPlan.name}`}
          copy="Review the plan and choose the amount you want to invest."
          close={() => setSelectedPlan(null)}
        >
          <div className="grid grid-cols-3 gap-3 rounded-xl border border-[var(--dash-line)] bg-[var(--dash-card-2)] p-4 text-xs">
            <span>
              <small className="text-[var(--dash-muted)]">Target APY</small>
              <b className="mt-1 block text-[#00d084]">{selectedPlan.apy}%</b>
            </span>
            <span>
              <small className="text-[var(--dash-muted)]">Duration</small>
              <b className="mt-1 block">{selectedPlan.duration}</b>
            </span>
            <span>
              <small className="text-[var(--dash-muted)]">Risk</small>
              <b className="mt-1 block">{selectedPlan.risk}</b>
            </span>
          </div>
          <label className="mt-5 block text-xs text-[var(--dash-muted)]">
            Investment amount (USDT)
            <input
              className="dash-input mt-2"
              value={amount}
              inputMode="decimal"
              onChange={(event) => setAmount(event.target.value)}
            />
          </label>
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              selectedPlan.minimum,
              selectedPlan.minimum * 2,
              selectedPlan.minimum * 5,
            ].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setAmount(String(value))}
                className="dash-button min-h-8 px-3"
              >
                {money(value)}
              </button>
            ))}
          </div>
          <div className="mt-5 rounded-xl border border-[var(--dash-line)] p-4 text-xs">
            <div className="flex justify-between">
              <span className="text-[var(--dash-muted)]">
                Estimated annual return
              </span>
              <b className="text-[#00d084]">
                {money(((Number(amount) || 0) * selectedPlan.apy) / 100)}
              </b>
            </div>
            <div className="mt-3 flex justify-between">
              <span className="text-[var(--dash-muted)]">
                Available balance
              </span>
              <b>$45,020.30</b>
            </div>
          </div>
          <button
            type="button"
            onClick={confirmInvestment}
            className="gold-button mt-5 w-full"
          >
            Confirm investment
          </button>
        </Modal>
      ) : null}
    </>
  );
}

function PairSelector({
  selected,
  onSelect,
}: {
  selected: Pair;
  onSelect: (pair: Pair) => void;
}) {
  return (
    <label className="relative block min-w-[190px]">
      <span className="sr-only">Select trading pair</span>
      <select
        className="dash-input appearance-none pr-10 font-semibold"
        value={selected.symbol}
        onChange={(event) =>
          onSelect(
            PAIRS.find((pair) => pair.symbol === event.target.value) ??
              PAIRS[0],
          )
        }
      >
        {PAIRS.map((pair) => (
          <option key={pair.symbol} value={pair.symbol}>
            {pair.symbol} · {pair.name}
          </option>
        ))}
      </select>
      <IconChevronDown
        size={16}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--dash-muted)]"
      />
    </label>
  );
}

function PairWatch({
  selected,
  onSelect,
}: {
  selected: Pair;
  onSelect: (pair: Pair) => void;
}) {
  const livePrices = useLivePrices().prices;
  const pairs = PAIRS.map((pair) => {
    const live = livePrices[coinGeckoIdBySymbol[pair.base]];
    return live
      ? { ...pair, price: live.price, change: live.change24h ?? pair.change }
      : pair;
  });
  return (
    <div className="space-y-1">
      {pairs.map((pair) => (
        <button
          key={pair.symbol}
          type="button"
          onClick={() => onSelect(pair)}
          className={clsx(
            "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition",
            selected.symbol === pair.symbol
              ? "border-[#ffc400] bg-[#ffc4000d]"
              : "border-transparent hover:border-[var(--dash-line)] hover:bg-[var(--dash-card-2)]",
          )}
        >
          <Coin symbol={pair.base} colour={pair.colour} size="sm" />
          <span>
            <b className="block text-xs">{pair.symbol}</b>
            <small className="text-[10px] text-[var(--dash-muted)]">
              {pair.name}
            </small>
          </span>
          <span className="ml-auto text-right">
            <b className="block text-xs">{pair.price.toLocaleString()}</b>
            <small
              className={pair.change >= 0 ? "text-[#00d084]" : "text-[#ef4444]"}
            >
              {pair.change >= 0 ? "+" : ""}
              {pair.change}%
            </small>
          </span>
        </button>
      ))}
    </div>
  );
}

function OrderBook({ pair }: { pair: Pair }) {
  const decimals = pair.price < 1 ? 4 : 2;
  const steps = [
    0.008, 0.006, 0.004, 0.002, 0.001, -0.001, -0.002, -0.004, -0.006, -0.008,
  ];
  return (
    <div>
      {steps.map((step, index) => {
        const price = pair.price * (1 + step);
        return (
          <div key={step} className="grid grid-cols-3 gap-2 py-1.5 text-[11px]">
            <span className={step > 0 ? "text-[#ef4444]" : "text-[#00d084]"}>
              {price.toFixed(decimals)}
            </span>
            <span>{(0.12 + index * 0.073).toFixed(4)}</span>
            <span className="text-right">
              {(price * (0.12 + index * 0.073)).toFixed(2)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function TradingWorkspace({
  demo = false,
  futures = false,
}: {
  demo?: boolean;
  futures?: boolean;
}) {
  const [selectedPair, setPair] = useState(PAIRS[0]);
  const livePrice =
    useLivePrices().prices[coinGeckoIdBySymbol[selectedPair.base]];
  const pair = livePrice
    ? {
        ...selectedPair,
        price: livePrice.price,
        change: livePrice.change24h ?? selectedPair.change,
        volume:
          livePrice.volume24h == null
            ? selectedPair.volume
            : formatCompactUsd(livePrice.volume24h),
      }
    : selectedPair;
  const [side, setSide] = useState("Buy");
  const [orderType, setOrderType] = useState("Limit");
  const [amount, setAmount] = useState("0.10");
  const [price, setPrice] = useState("");
  const [leverage, setLeverage] = useState("5x");
  const [balance, setBalance] = useState(100000);
  const [message, setMessage] = useState("");
  const [orders, setOrders] = useState<
    Array<{
      pair: string;
      type: string;
      side: string;
      price: number;
      amount: number;
      status: string;
    }>
  >([
    {
      pair: "BTC/USDT",
      type: "Limit",
      side: "Buy",
      price: 68200,
      amount: 0.01,
      status: "Open",
    },
    {
      pair: "ETH/USDT",
      type: "Market",
      side: "Sell",
      price: 3520,
      amount: 0.5,
      status: "Filled",
    },
  ]);

  const selectPair = (next: Pair) => {
    setPair(next);
    setPrice("");
    setMessage("");
  };

  const numericAmount = Number(amount) || 0;
  const numericPrice =
    orderType === "Market" ? pair.price : Number(price) || pair.price;
  const orderTotal = numericAmount * numericPrice;

  const placeOrder = () => {
    if (numericAmount <= 0 || numericPrice <= 0) {
      setMessage("Enter a valid price and amount before placing the order.");
      return;
    }
    if (demo && orderTotal > balance) {
      setMessage("This order is larger than your available virtual balance.");
      return;
    }
    const status = orderType === "Market" ? "Filled" : "Open";
    setOrders((current) => [
      {
        pair: pair.symbol,
        type: orderType,
        side,
        price: numericPrice,
        amount: numericAmount,
        status,
      },
      ...current,
    ]);
    if (demo && side === "Buy")
      setBalance((current) => Math.max(0, current - orderTotal));
    setMessage(
      `${demo ? "Demo" : futures ? "Futures" : "Spot"} ${side.toLowerCase()} order placed for ${numericAmount} ${pair.base}.`,
    );
  };

  const cancelOrder = (index: number) =>
    setOrders((current) =>
      current.filter((_, orderIndex) => orderIndex !== index),
    );

  return (
    <>
      <PageHeading
        title={
          demo ? "Demo Trading" : futures ? "Futures Trading" : "Spot Trading"
        }
        subtitle={
          demo
            ? "Practice a complete multi-pair trading flow with virtual funds."
            : futures
              ? "Trade perpetual contracts across major pairs with configurable leverage."
              : "Select a pair, study the live workspace, and place a simulated order."
        }
        action={
          demo ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setBalance(100000);
                  setOrders([]);
                  setMessage("Virtual balance reset to $100,000.");
                }}
                className="dash-button"
              >
                <IconRefresh size={16} />
                Reset balance
              </button>
              <Link href="/dashboard/trade" className="gold-button">
                Switch to live
              </Link>
            </div>
          ) : (
            <PairSelector selected={pair} onSelect={selectPair} />
          )
        }
      />

      {demo ? (
        <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Virtual Balance"
            value={money(balance)}
            change="Practice funds"
            colour="#8b5cf6"
          />
          <MetricCard label="Today’s P&L" value="+$2,450.75" change="+2.45%" />
          <MetricCard label="Win Rate" value="68.42%" change="24 / 35 trades" />
          <MetricCard
            label="Trading Score"
            value="87 / 100"
            change="Excellent"
            colour="#8b5cf6"
          />
        </div>
      ) : null}
      {demo ? (
        <div className="mb-4 flex justify-end">
          <PairSelector selected={pair} onSelect={selectPair} />
        </div>
      ) : null}
      {message ? (
        <div
          className={clsx(
            "mb-4 flex items-center justify-between rounded-xl border px-4 py-3 text-xs",
            message.includes("valid") || message.includes("larger")
              ? "border-[#ef444455] bg-[#ef444410] text-[#ef4444]"
              : "border-[#00d08455] bg-[#00d08410] text-[#00d084]",
          )}
        >
          <span>{message}</span>
          <button type="button" onClick={() => setMessage("")}>
            <IconX size={15} />
          </button>
        </div>
      ) : null}

      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-4 lg:gap-7">
          <Coin symbol={pair.base} colour={pair.colour} size="lg" />
          <div>
            <b>{pair.symbol}</b>
            <p className="text-xs text-[var(--dash-muted)]">{pair.name}</p>
          </div>
          <strong
            className={clsx(
              "metric-value text-2xl sm:text-3xl",
              pair.change >= 0 ? "text-[#00d084]" : "text-[#ef4444]",
            )}
          >
            {pair.price.toLocaleString(undefined, {
              maximumFractionDigits: pair.price < 1 ? 4 : 2,
            })}
          </strong>
          {[
            ["24h Change", `${pair.change >= 0 ? "+" : ""}${pair.change}%`],
            ["Current Price", pair.price.toLocaleString()],
            ["Data Source", livePrice ? "CoinGecko" : "Cached"],
            ["24h Volume", pair.volume],
          ].map(([label, value]) => (
            <div key={label} className="min-w-[105px] lg:ml-auto">
              <small className="text-[var(--dash-muted)]">{label}</small>
              <b
                className={clsx(
                  "mt-1 block text-xs",
                  label === "24h Change" &&
                    (pair.change >= 0 ? "text-[#00d084]" : "text-[#ef4444]"),
                )}
              >
                {value}
              </b>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.55fr_.65fr]">
        <div className="space-y-4">
          <Card
            title={`${pair.symbol} Price Chart`}
            action={
              <span className="flex items-center gap-2 text-[10px] text-[#00d084]">
                <i className="size-1.5 rounded-full bg-[#00d084]" />
                Market open
              </span>
            }
          >
            <LightweightMarketChart
              asset={coinGeckoIdBySymbol[pair.base]}
              days={7}
              height={350}
            />
          </Card>
          <div className="grid gap-4 md:grid-cols-2">
            <Card title="Order Book">
              <div className="mb-2 grid grid-cols-3 text-[10px] text-[var(--dash-muted)]">
                <span>Price</span>
                <span>Amount</span>
                <span className="text-right">Total</span>
              </div>
              <OrderBook pair={pair} />
            </Card>
            <Card title="Pair Watch">
              <PairWatch selected={pair} onSelect={selectPair} />
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
            <div className="mt-5 flex gap-4 border-b border-[var(--dash-line)] pb-3 text-xs">
              {["Limit", "Market", "Stop Limit"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setOrderType(type)}
                  className={
                    orderType === type
                      ? "font-semibold text-[#ffc400]"
                      : "text-[var(--dash-muted)]"
                  }
                >
                  {type}
                </button>
              ))}
            </div>
            {futures ? (
              <label className="mt-4 block text-xs text-[var(--dash-muted)]">
                Leverage
                <select
                  className="dash-input mt-2"
                  value={leverage}
                  onChange={(event) => setLeverage(event.target.value)}
                >
                  {["2x", "5x", "10x", "20x"].map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </label>
            ) : null}
            <label className="mt-4 block text-xs text-[var(--dash-muted)]">
              Price (USDT)
              <input
                className="dash-input mt-2"
                inputMode="decimal"
                value={price}
                placeholder={pair.price.toString()}
                onChange={(event) => setPrice(event.target.value)}
                disabled={orderType === "Market"}
              />
            </label>
            <label className="mt-4 block text-xs text-[var(--dash-muted)]">
              Amount ({pair.base})
              <input
                className="dash-input mt-2"
                inputMode="decimal"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </label>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {[25, 50, 75, 100].map((percent) => (
                <button
                  key={percent}
                  type="button"
                  onClick={() =>
                    setAmount(
                      String(
                        (
                          ((demo ? balance : 25000) * percent) /
                          100 /
                          pair.price
                        ).toFixed(pair.price < 1 ? 0 : 4),
                      ),
                    )
                  }
                  className="dash-button min-h-8 px-2"
                >
                  {percent}%
                </button>
              ))}
            </div>
            <label className="mt-4 block text-xs text-[var(--dash-muted)]">
              Total (USDT)
              <input
                className="dash-input mt-2"
                value={orderTotal.toFixed(2)}
                readOnly
              />
            </label>
            <div className="mt-4 flex justify-between text-[11px]">
              <span className="text-[var(--dash-muted)]">Available</span>
              <b>{money(demo ? balance : 25000)}</b>
            </div>
            <button
              type="button"
              onClick={placeOrder}
              className={clsx(
                "mt-5 min-h-12 w-full rounded-lg font-semibold",
                side === "Buy"
                  ? "bg-[#00d084] text-black"
                  : "bg-[#ef4444] text-white",
              )}
            >
              {futures
                ? side === "Buy"
                  ? `Open Long · ${leverage}`
                  : `Open Short · ${leverage}`
                : `${side} ${pair.base}`}
            </button>
          </Card>
          <Card title="Market Details">
            {[
              ["Selected pair", pair.symbol],
              [
                "Trading mode",
                demo ? "Demo" : futures ? "Perpetual Futures" : "Spot",
              ],
              ["Maker / taker", "0.10% / 0.10%"],
              ["Settlement", "USDT"],
              ["Order type", orderType],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex justify-between border-b border-[var(--dash-line)] py-3 text-xs last:border-0"
              >
                <span className="text-[var(--dash-muted)]">{label}</span>
                <b>{value}</b>
              </div>
            ))}
          </Card>
        </div>
      </div>

      <Card
        className="mt-4"
        title={demo ? "Demo Orders & Trades" : "Open Orders"}
        action={
          <span className="text-xs text-[var(--dash-muted)]">
            {orders.length} records
          </span>
        }
      >
        {orders.length ? (
          <DataTable
            headers={[
              "Pair",
              "Type",
              "Side",
              "Price",
              "Amount",
              futures ? "Leverage" : "Filled",
              "Status",
              "Action",
            ]}
            rows={orders.map((order, index) => [
              order.pair,
              order.type,
              <span
                key="side"
                className={
                  order.side === "Buy" ? "text-[#00d084]" : "text-[#ef4444]"
                }
              >
                {order.side}
              </span>,
              order.price.toLocaleString(),
              order.amount.toLocaleString(),
              futures ? leverage : order.status === "Filled" ? "100%" : "0%",
              <Status
                key="status"
                tone={order.status === "Filled" ? "green" : "yellow"}
              >
                {order.status}
              </Status>,
              order.status === "Open" ? (
                <button
                  key="cancel"
                  type="button"
                  onClick={() => cancelOrder(index)}
                  className="text-[#ffc400]"
                >
                  Cancel
                </button>
              ) : (
                <span key="done" className="text-[var(--dash-muted)]">
                  Completed
                </span>
              ),
            ])}
          />
        ) : (
          <div className="py-10 text-center">
            <IconHistory
              size={28}
              className="mx-auto text-[var(--dash-muted)]"
            />
            <p className="mt-3 text-sm font-semibold">No orders yet</p>
            <p className="mt-1 text-xs text-[var(--dash-muted)]">
              Choose a pair and place your first {demo ? "practice" : "live"}{" "}
              order.
            </p>
          </div>
        )}
      </Card>
    </>
  );
}

export function EnhancedTradePage({ futures = false }: { futures?: boolean }) {
  return <TradingWorkspace futures={futures} />;
}

export function EnhancedDemoTradingPage() {
  return <TradingWorkspace demo />;
}

export function EnhancedEarnPage() {
  const livePrices = useLivePrices().prices;
  const [tab, setTab] = useState("Active Stakes");
  const [selected, setSelected] = useState<StakeOpportunity | null>(null);
  const [amount, setAmount] = useState("1");
  const [positions, setPositions] = useState(INITIAL_STAKES);
  const [message, setMessage] = useState("");

  const activePositions = positions.filter(
    (position) => position.status === "Active",
  );
  const totalRewards = positions.reduce(
    (total, position) =>
      total +
      position.reward *
        (livePrices[coinGeckoIdBySymbol[position.symbol]]?.price ?? 0),
    0,
  );
  const selectedAmount = Number(amount) || 0;
  const estimatedAnnual = selected ? (selectedAmount * selected.apy) / 100 : 0;

  const startStake = (opportunity: StakeOpportunity) => {
    setSelected(opportunity);
    setAmount(String(opportunity.minimum));
  };

  const confirmStake = () => {
    if (!selected) return;
    if (selectedAmount < selected.minimum) {
      setMessage(`Minimum stake is ${selected.minimum} ${selected.symbol}.`);
      return;
    }
    setPositions((current) => [
      {
        asset: selected.name,
        symbol: selected.symbol,
        amount: selectedAmount,
        apy: selected.apy,
        reward: 0,
        started: new Date().toLocaleDateString(undefined, {
          month: "short",
          day: "2-digit",
          year: "numeric",
        }),
        nextPayout: "7d",
        status: "Active",
        colour: selected.colour,
      },
      ...current,
    ]);
    setSelected(null);
    setTab("Active Stakes");
    setMessage(`${selectedAmount} ${selected.symbol} is now staked.`);
  };

  const unstake = (index: number) =>
    setPositions((current) =>
      current.map((position, positionIndex) =>
        positionIndex === index
          ? { ...position, status: "Completed" }
          : position,
      ),
    );

  const exportStaking = () => {
    downloadCsv("korvesta-staking-report.csv", [
      ["Asset", "Amount", "APY", "Rewards", "Started", "Next payout", "Status"],
      ...positions.map((position) => [
        position.symbol,
        position.amount,
        `${position.apy}%`,
        position.reward,
        position.started,
        position.nextPayout,
        position.status,
      ]),
    ]);
    setMessage("Staking report downloaded.");
  };

  const reportRows = useMemo(
    () => [
      ["May 2024", "ETH + SOL", "$1,250.80", "+18.09%", "Paid"],
      ["April 2024", "ETH + BNB", "$985.40", "+14.25%", "Paid"],
      ["March 2024", "SOL + BNB", "$820.25", "+12.60%", "Paid"],
      ["February 2024", "ETH", "$614.30", "+9.82%", "Paid"],
    ],
    [],
  );

  return (
    <>
      <PageHeading
        title="Staking & Earn"
        subtitle="Stake supported assets, monitor rewards, and download your staking report."
        action={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() =>
                document
                  .getElementById("staking-opportunities")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="gold-button"
            >
              <IconCoins size={17} />
              Stake assets
            </button>
            <button
              type="button"
              onClick={exportStaking}
              className="dash-button"
            >
              <IconDownload size={17} />
              Export report
            </button>
          </div>
        }
      />
      {message ? (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-[#00d08455] bg-[#00d08410] px-4 py-3 text-xs text-[#00d084]">
          <span>{message}</span>
          <button type="button" onClick={() => setMessage("")}>
            <IconX size={15} />
          </button>
        </div>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Total Staked Value"
          value="$78,540.30"
          change="+12.45% all time"
          colour="#8b5cf6"
          icon={IconWallet}
        />
        <MetricCard
          label="Total Rewards"
          value={money(totalRewards)}
          change="Across all assets"
          icon={IconCoins}
        />
        <MetricCard
          label="Average APY"
          value="7.62%"
          change="+0.35% this month"
          colour="#f97316"
        />
        <MetricCard
          label="Active Stakes"
          value={String(activePositions.length)}
          change="Across 3 assets"
          icon={IconTarget}
          colour="#20c7c7"
        />
        <MetricCard
          label="Next Payout"
          value="$125.40"
          change="In 2d 14h"
          icon={IconCalendar}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.5fr_.7fr]">
        <Card
          title="Reward Performance"
          action={
            <button
              type="button"
              onClick={exportStaking}
              className="text-xs text-[#ffc400]"
            >
              Download report →
            </button>
          }
        >
          <InteractiveChart
            data={REWARD_SERIES}
            colour="#00d084"
            symbol="Staking rewards"
            height={290}
            defaultTimeframe="1Y"
          />
        </Card>
        <Card title="Reward Summary">
          {[
            ["ETH staking", "$2,450.20", "57.6%"],
            ["SOL staking", "$1,320.10", "31.1%"],
            ["BNB staking", "$320.00", "7.5%"],
            ["Referral bonus", "$160.00", "3.8%"],
          ].map(([label, value, share]) => (
            <div
              key={label}
              className="border-b border-[var(--dash-line)] py-4 last:border-0"
            >
              <div className="flex justify-between text-xs">
                <span>{label}</span>
                <b>{value}</b>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--dash-card-2)]">
                <i
                  className="block h-full rounded-full bg-[#00d084]"
                  style={{ width: share }}
                />
              </div>
              <p className="mt-1 text-right text-[9px] text-[var(--dash-muted)]">
                {share} of earnings
              </p>
            </div>
          ))}
        </Card>
      </div>

      <section id="staking-opportunities" className="mt-5 scroll-mt-24">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-lg font-semibold">Staking Opportunities</h2>
            <p className="mt-1 text-xs text-[var(--dash-muted)]">
              Choose an asset and start earning rewards.
            </p>
          </div>
          <span className="text-xs text-[#00d084]">5 assets available</span>
        </div>
        <Card>
          <DataTable
            headers={["Asset", "APY", "Minimum", "Duration", "Risk", "Action"]}
            rows={STAKING_OPPORTUNITIES.map((opportunity) => [
              <span key="asset" className="flex items-center gap-2">
                <Coin
                  symbol={opportunity.symbol}
                  colour={opportunity.colour}
                  size="sm"
                />
                <span>
                  <b>{opportunity.name}</b>{" "}
                  <small className="text-[var(--dash-muted)]">
                    {opportunity.symbol}
                  </small>
                </span>
              </span>,
              <span key="apy" className="font-semibold text-[#00d084]">
                {opportunity.apy}%
              </span>,
              `${opportunity.minimum} ${opportunity.symbol}`,
              opportunity.duration,
              <Status
                key="risk"
                tone={opportunity.risk === "Low" ? "green" : "yellow"}
              >
                {opportunity.risk}
              </Status>,
              <button
                key="stake"
                type="button"
                onClick={() => startStake(opportunity)}
                className="rounded-md border border-[#6c5600] px-3 py-2 font-semibold text-[#ffc400] hover:bg-[#ffc40012]"
              >
                Stake now
              </button>,
            ])}
          />
        </Card>
      </section>

      <Card className="mt-4">
        <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-[15px] font-semibold">Staking Activity</h2>
            <p className="mt-1 text-xs text-[var(--dash-muted)]">
              Review active positions, completed stakes, and monthly returns.
            </p>
          </div>
          <Segmented
            options={["Active Stakes", "Staking History", "Rewards Report"]}
            value={tab}
            onChange={setTab}
          />
        </div>
        {tab === "Active Stakes" ? (
          <DataTable
            headers={[
              "Asset",
              "Amount Staked",
              "APY",
              "Rewards Earned",
              "Started",
              "Next Payout",
              "Status",
              "Action",
            ]}
            rows={positions.map((position, index) => [
              <span key="asset" className="flex items-center gap-2">
                <Coin
                  symbol={position.symbol}
                  colour={position.colour}
                  size="sm"
                />
                <b>
                  {position.asset} {position.symbol}
                </b>
              </span>,
              `${position.amount.toLocaleString()} ${position.symbol}`,
              <span key="apy" className="text-[#00d084]">
                {position.apy}%
              </span>,
              `+${position.reward} ${position.symbol}`,
              position.started,
              position.nextPayout,
              <Status
                key="status"
                tone={position.status === "Active" ? "green" : "purple"}
              >
                {position.status}
              </Status>,
              position.status === "Active" ? (
                <button
                  key="unstake"
                  type="button"
                  onClick={() => unstake(index)}
                  className="text-[#ffc400]"
                >
                  Unstake
                </button>
              ) : (
                <span key="done" className="text-[var(--dash-muted)]">
                  Closed
                </span>
              ),
            ])}
          />
        ) : null}
        {tab === "Staking History" ? (
          <DataTable
            headers={[
              "Date",
              "Activity",
              "Asset",
              "Amount",
              "Reward",
              "Status",
            ]}
            rows={[
              [
                "May 24, 2024",
                "Reward credited",
                "ETH",
                "+0.0254 ETH",
                "+$89.22",
              ],
              ["May 18, 2024", "Stake created", "SOL", "25.00 SOL", "Pending"],
              [
                "May 02, 2024",
                "Reward credited",
                "BNB",
                "+0.12 BNB",
                "+$71.81",
              ],
              [
                "Apr 24, 2024",
                "Stake completed",
                "ADA",
                "250 ADA",
                "+18.5 ADA",
              ],
            ].map((row) => [...row, <Status key="status">Completed</Status>])}
          />
        ) : null}
        {tab === "Rewards Report" ? (
          <>
            <div className="mb-4 flex justify-end">
              <button
                type="button"
                onClick={exportStaking}
                className="dash-button"
              >
                <IconFileAnalytics size={16} />
                Download CSV
              </button>
            </div>
            <DataTable
              headers={["Period", "Assets", "Rewards", "Return", "Status"]}
              rows={reportRows.map((row) => [
                ...row.slice(0, 4),
                <Status key="status">{row[4]}</Status>,
              ])}
            />
          </>
        ) : null}
      </Card>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <Card>
          <span className="grid size-11 place-items-center rounded-full bg-[#8b5cf618] text-[#a855f7]">
            <IconRefresh size={22} />
          </span>
          <h3 className="mt-4 text-sm font-semibold">Auto-compound rewards</h3>
          <p className="mt-2 text-xs leading-5 text-[var(--dash-muted)]">
            Reinvest eligible rewards automatically to grow future earnings.
          </p>
          <button type="button" className="dash-button mt-4 w-full">
            Manage compounding
          </button>
        </Card>
        <Card>
          <span className="grid size-11 place-items-center rounded-full bg-[#00d08418] text-[#00d084]">
            <IconReportAnalytics size={22} />
          </span>
          <h3 className="mt-4 text-sm font-semibold">Staking statements</h3>
          <p className="mt-2 text-xs leading-5 text-[var(--dash-muted)]">
            Download a complete record for reporting and reconciliation.
          </p>
          <button
            type="button"
            onClick={exportStaking}
            className="dash-button mt-4 w-full"
          >
            Download statement
          </button>
        </Card>
        <Card>
          <span className="grid size-11 place-items-center rounded-full bg-[#ffc40018] text-[#ffc400]">
            <IconInfoCircle size={22} />
          </span>
          <h3 className="mt-4 text-sm font-semibold">How staking works</h3>
          <p className="mt-2 text-xs leading-5 text-[var(--dash-muted)]">
            Learn about lock periods, reward schedules, and unstaking rules.
          </p>
          <button type="button" className="dash-button mt-4 w-full">
            View staking guide
          </button>
        </Card>
      </div>

      {selected ? (
        <Modal
          title={`Stake ${selected.name}`}
          copy="Choose your amount and review the estimated reward."
          close={() => setSelected(null)}
        >
          <div className="flex items-center gap-3 rounded-xl border border-[var(--dash-line)] bg-[var(--dash-card-2)] p-4">
            <Coin symbol={selected.symbol} colour={selected.colour} />
            <div>
              <b className="text-sm">{selected.name}</b>
              <p className="mt-1 text-xs text-[var(--dash-muted)]">
                {selected.duration} · {selected.apy}% APY
              </p>
            </div>
            <Status tone={selected.risk === "Low" ? "green" : "yellow"}>
              {selected.risk} risk
            </Status>
          </div>
          <label className="mt-5 block text-xs text-[var(--dash-muted)]">
            Amount ({selected.symbol})
            <input
              className="dash-input mt-2"
              value={amount}
              inputMode="decimal"
              onChange={(event) => setAmount(event.target.value)}
            />
          </label>
          <div className="mt-3 flex gap-2">
            {[
              selected.minimum,
              selected.minimum * 5,
              selected.minimum * 10,
            ].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setAmount(String(value))}
                className="dash-button min-h-8 flex-1 px-2"
              >
                {value} {selected.symbol}
              </button>
            ))}
          </div>
          <div className="mt-5 rounded-xl border border-[var(--dash-line)] p-4 text-xs">
            <div className="flex justify-between">
              <span className="text-[var(--dash-muted)]">
                Estimated annual reward
              </span>
              <b className="text-[#00d084]">
                +{estimatedAnnual.toFixed(4)} {selected.symbol}
              </b>
            </div>
            <div className="mt-3 flex justify-between">
              <span className="text-[var(--dash-muted)]">First payout</span>
              <b>Within 7 days</b>
            </div>
            <div className="mt-3 flex justify-between">
              <span className="text-[var(--dash-muted)]">Unstaking period</span>
              <b>{selected.duration === "Flexible" ? "Instant" : "3 days"}</b>
            </div>
          </div>
          <button
            type="button"
            onClick={confirmStake}
            className="gold-button mt-5 w-full"
          >
            Confirm stake
          </button>
        </Modal>
      ) : null}
    </>
  );
}
