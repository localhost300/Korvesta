"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, DataTable, PageHeading, Segmented, Status } from "./DashboardUI";

type Order = {
  id: string;
  pair: string;
  side: "buy" | "sell";
  order_type: string;
  quantity: string;
  executed_quantity: string;
  limit_price: string | null;
  stop_price: string | null;
  triggered_at: string | null;
  fill_price: string | null;
  fee: string;
  status: string;
  provider: string;
  created_at: string;
};
type AccountData = {
  account: { cash_balance: string; mode: "paper" | "live" };
  equity: number;
  positions: Array<{
    symbol: string;
    quantity: number;
    averageCost: number;
    price: number;
    value: number;
    unrealisedPnl: number;
  }>;
  execution: {
    enabled: boolean;
    testnet: boolean;
    configured: boolean;
    provider: string;
  };
  exchangeBalances?: Array<{ asset: string; free: number; locked: number }>;
};

export function PersistentTradingPage({
  initialMode = "paper",
  futures = false,
}: {
  initialMode?: "paper" | "live";
  futures?: boolean;
}) {
  const [mode, setMode] = useState<"paper" | "live">(initialMode);
  const [side, setSide] = useState("buy");
  const [type, setType] = useState("market");
  const [symbol, setSymbol] = useState("BTC");
  const [quantity, setQuantity] = useState("0.001");
  const [limitPrice, setLimitPrice] = useState("");
  const [stopPrice, setStopPrice] = useState("");
  const [account, setAccount] = useState<AccountData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [book, setBook] = useState<{
    bids: string[][];
    asks: string[][];
  } | null>(null);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const refresh = useCallback(async () => {
    const [a, o, b] = await Promise.all([
      fetch(`/api/trading/account?mode=${mode}`),
      fetch(`/api/trading/orders?mode=${mode}`),
      fetch(`/api/market/order-book?symbol=${symbol}`),
    ]);
    if (a.ok) setAccount(await a.json());
    if (o.ok) setOrders((await o.json()).data ?? []);
    if (b.ok) setBook(await b.json());
  }, [mode, symbol]);
  useEffect(() => {
    const initial = window.setTimeout(() => void refresh(), 0);
    const timer = setInterval(() => void refresh(), 15000);
    return () => {
      clearTimeout(initial);
      clearInterval(timer);
    };
  }, [refresh]);
  const canLive = account?.execution.enabled && account.execution.configured;
  const rows = useMemo(
    () =>
      orders.map((o) => [
        o.pair,
        o.order_type,
        <span
          key="side"
          className={o.side === "buy" ? "text-[#00d084]" : "text-[#ef4444]"}
        >
          {o.side.toUpperCase()}
        </span>,
        o.fill_price ?? o.limit_price ?? "Market",
        o.stop_price ?? "—",
        `${o.executed_quantity ?? "0"} / ${o.quantity}`,
        <Status key="status" tone={o.status === "filled" ? "green" : "yellow"}>
          {o.status}
        </Status>,
        ["open", "partially_filled"].includes(o.status) ? (
          <button
            key="cancel"
            className="text-[#ffc400]"
            onClick={async () => {
              await fetch(`/api/trading/orders/${o.id}`, { method: "DELETE" });
              void refresh();
            }}
          >
            Cancel
          </button>
        ) : (
          o.provider
        ),
      ]),
    [orders, refresh],
  );
  async function submit() {
    setPending(true);
    setMessage("");
    const response = await fetch("/api/trading/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode,
        symbol,
        side,
        type,
        quantity: Number(quantity),
        limitPrice: ["limit", "stop_limit"].includes(type)
          ? Number(limitPrice)
          : undefined,
        stopPrice: type.startsWith("stop_") ? Number(stopPrice) : undefined,
        idempotencyKey: crypto.randomUUID(),
      }),
    });
    const result = await response.json().catch(() => ({}));
    setPending(false);
    setMessage(
      response.ok
        ? `${mode === "paper" ? "Paper" : "Binance"} order accepted.`
        : (result.error ?? "Order failed."),
    );
    if (response.ok) void refresh();
  }
  if (futures)
    return (
      <>
        <PageHeading
          title="Futures Trading"
          subtitle="Futures execution is locked until a separate margin, liquidation, leverage and suitability engine is implemented."
        />
        <Card>
          <p className="text-sm text-[#ffc400]">Unavailable by design</p>
          <p className="mt-3 text-xs text-[#849099]">
            The current engine supports spot paper trading and guarded Binance
            spot execution only. It will not simulate leverage with misleading
            balances.
          </p>
        </Card>
      </>
    );
  return (
    <>
      <PageHeading
        title={
          mode === "paper" ? "Persistent Paper Trading" : "Live Spot Trading"
        }
        subtitle={
          mode === "paper"
            ? "Orders, balances and positions are stored in Supabase."
            : "Server-side Binance execution with testnet and mainnet safety gates."
        }
      />
      <div className="mb-4 flex flex-wrap gap-3">
        <Segmented
          options={["paper", "live"]}
          value={mode}
          onChange={(v) => setMode(v as "paper" | "live")}
        />
        <span className="rounded-lg border border-[#263038] px-3 py-2 text-xs">
          Cash: ${Number(account?.account.cash_balance ?? 0).toLocaleString()}
        </span>
        <span className="rounded-lg border border-[#263038] px-3 py-2 text-xs">
          Equity: ${(account?.equity ?? 0).toLocaleString()}
        </span>
        {mode === "live" ? (
          <Status tone={canLive ? "green" : "yellow"}>
            {canLive
              ? account?.execution.testnet
                ? "Binance testnet"
                : "BINANCE MAINNET"
              : "Execution disabled"}
          </Status>
        ) : null}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.5fr_.7fr]">
        <div className="space-y-4">
          <Card title={`${symbol}/USDT Order Book`}>
            <div className="grid grid-cols-2 gap-6 text-xs">
              <div>
                <b className="text-[#00d084]">Bids</b>
                {book?.bids?.slice(0, 10).map(([p, q]) => (
                  <div key={p} className="mt-2 flex justify-between">
                    <span>{Number(p).toFixed(2)}</span>
                    <span>{Number(q).toFixed(5)}</span>
                  </div>
                ))}
              </div>
              <div>
                <b className="text-[#ef4444]">Asks</b>
                {book?.asks?.slice(0, 10).map(([p, q]) => (
                  <div key={p} className="mt-2 flex justify-between">
                    <span>{Number(p).toFixed(2)}</span>
                    <span>{Number(q).toFixed(5)}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
          <Card title="Positions">
            <DataTable
              headers={[
                "Asset",
                "Quantity",
                "Average",
                "Market",
                "Value",
                "Unrealised P&L",
              ]}
              rows={(account?.positions ?? []).map((p) => [
                p.symbol,
                p.quantity,
                p.averageCost.toFixed(2),
                p.price.toFixed(2),
                p.value.toFixed(2),
                <span
                  key="pnl"
                  className={
                    p.unrealisedPnl >= 0 ? "text-[#00d084]" : "text-[#ef4444]"
                  }
                >
                  {p.unrealisedPnl.toFixed(2)}
                </span>,
              ])}
            />
          </Card>
          {mode === "live" ? (
            <Card title="Binance balances">
              <DataTable
                headers={["Asset", "Free", "Locked"]}
                rows={(account?.exchangeBalances ?? []).map((b) => [
                  b.asset,
                  b.free,
                  b.locked,
                ])}
              />
            </Card>
          ) : null}
        </div>
        <Card title="Order ticket">
          <label className="text-xs">
            Market
            <select
              className="dash-input mt-2"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
            >
              {["BTC", "ETH", "SOL", "BNB", "XRP"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <div className="mt-4">
            <Segmented
              options={["buy", "sell"]}
              value={side}
              onChange={setSide}
            />
          </div>
          <div className="mt-4">
            <Segmented
              options={["market", "limit", "stop_market", "stop_limit"]}
              value={type}
              onChange={setType}
            />
          </div>
          <label className="mt-4 block text-xs">
            Quantity
            <input
              className="dash-input mt-2"
              inputMode="decimal"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </label>
          {["limit", "stop_limit"].includes(type) ? (
            <label className="mt-4 block text-xs">
              Limit price
              <input
                className="dash-input mt-2"
                inputMode="decimal"
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
              />
            </label>
          ) : null}
          {type.startsWith("stop_") ? (
            <label className="mt-4 block text-xs">
              Stop trigger price
              <input
                className="dash-input mt-2"
                inputMode="decimal"
                value={stopPrice}
                onChange={(e) => setStopPrice(e.target.value)}
              />
              <small className="mt-1 block text-[#849099]">
                Sell stops trigger at or below this price; buy stops trigger at
                or above it.
              </small>
            </label>
          ) : null}
          <button
            disabled={pending || (mode === "live" && !canLive)}
            onClick={() => void submit()}
            className={`mt-5 min-h-12 w-full rounded-lg font-semibold disabled:opacity-50 ${side === "buy" ? "bg-[#00d084] text-black" : "bg-[#ef4444] text-white"}`}
          >
            {pending ? "Submitting…" : `${side.toUpperCase()} ${symbol}`}
          </button>
          {message ? (
            <p role="status" className="mt-3 text-xs text-[#ffc400]">
              {message}
            </p>
          ) : null}
        </Card>
      </div>
      <Card className="mt-4" title="Orders">
        <DataTable
          headers={[
            "Pair",
            "Type",
            "Side",
            "Price",
            "Stop",
            "Filled / Quantity",
            "Status",
            "Action",
          ]}
          rows={rows}
        />
      </Card>
    </>
  );
}

export function TradingAutomationPage({ kind }: { kind: "bots" | "copy" }) {
  const bots = kind === "bots";
  return (
    <>
      <PageHeading
        title={bots ? "Automated Trading" : "Copy Trading"}
        subtitle="This module is not connected to execution yet."
      />
      <Card>
        <Status tone="yellow">Disabled</Status>
        <h2 className="mt-5 text-lg font-semibold">
          No simulated performance is being shown
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#849099]">
          {bots
            ? "Bot execution needs persistent strategies, backtesting, risk limits, scheduling, reconciliation and an emergency stop before it can submit orders."
            : "Copy trading needs leader consent, allocation rules, proportional fills, slippage controls, suitability checks and jurisdiction-specific compliance before activation."}
        </p>
        <p className="mt-4 text-xs text-[#ffc400]">
          The persistent spot engine is the foundation; activation remains
          intentionally blocked.
        </p>
      </Card>
    </>
  );
}
