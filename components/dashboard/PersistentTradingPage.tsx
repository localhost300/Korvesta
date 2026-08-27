"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, DataTable, PageHeading, Segmented, Status } from "./DashboardUI";
import { LightweightMarketChart } from "@/components/LightweightMarketChart";
import { tradingAssets } from "@/lib/trading";

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
  product = "spot",
}: {
  product?: "spot" | "futures" | "demo";
}) {
  const mode = product === "demo" ? "paper" : "live";
  const [side, setSide] = useState("buy");
  const [type, setType] = useState("market");
  const [symbol, setSymbol] = useState("BTC");
  const [quantity, setQuantity] = useState("0.001");
  const [limitPrice, setLimitPrice] = useState("");
  const [stopPrice, setStopPrice] = useState("");
  const [leverage, setLeverage] = useState("2");
  const [chartDays, setChartDays] = useState(7);
  const [account, setAccount] = useState<AccountData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [book, setBook] = useState<{
    bids: string[][];
    asks: string[][];
  } | null>(null);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const refresh = useCallback(async () => {
    await fetch(`/api/trading/sync?product=${product}`, { method: "POST" }).catch(() => null);
    const [a, o, b] = await Promise.all([
      fetch(`/api/trading/account?product=${product}`),
      fetch(`/api/trading/orders?product=${product}`),
      fetch(`/api/market/order-book?symbol=${symbol}`),
    ]);
    if (a.ok) setAccount(await a.json());
    if (o.ok) setOrders((await o.json()).data ?? []);
    if (b.ok) setBook(await b.json());
  }, [product, symbol]);
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
              const response = await fetch(`/api/trading/orders/${o.id}`, { method: "DELETE" });
              const result = await response.json().catch(() => ({}));
              setMessage(response.ok ? "Order cancelled." : (result.error ?? "Cancellation failed."));
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
        product,
        leverage: product === "futures" ? Number(leverage) : undefined,
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
        ? `${product === "demo" ? "Demo" : product === "futures" ? "Futures" : "Spot"} order accepted.`
        : (result.error ?? "Order failed."),
    );
    if (response.ok) void refresh();
  }
  return (
    <>
      <PageHeading
        title={product === "demo" ? "Demo Trading" : product === "futures" ? "Futures Trading" : "Spot Trading"}
        subtitle={product === "demo" ? "Practice with a separate simulated balance and Korvesta order engine." : product === "futures" ? "Trade perpetual contracts through the Korvesta margin and risk engine." : "Buy and sell assets through the Korvesta spot order engine."}
      />
      <div className="mb-4 flex flex-wrap gap-3">
        <Status tone={product === "demo" ? "yellow" : "green"}>{product === "demo" ? "Simulation" : "Korvesta engine"}</Status>
        <span className="rounded-lg border border-[#263038] px-3 py-2 text-xs">
          Cash: ${Number(account?.account.cash_balance ?? 0).toLocaleString()}
        </span>
        <span className="rounded-lg border border-[#263038] px-3 py-2 text-xs">
          Equity: ${(account?.equity ?? 0).toLocaleString()}
        </span>
      </div>
      <div className="grid items-start gap-3 xl:grid-cols-[minmax(0,1fr)_330px]">
        <div className="space-y-4">
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold">{symbol}/USDT</h2>
                  <Status tone="green">Market</Status>
                </div>
                <p className="mt-1 text-[11px] text-[#849099]">Independent market candles · drag to pan · scroll to zoom</p>
              </div>
              <div className="flex rounded-lg border border-[#263038] bg-[#090e11] p-1">
                {[[1, "1D"], [7, "1W"], [30, "1M"], [90, "3M"], [365, "1Y"]].map(([days, label]) => (
                  <button key={days} type="button" onClick={() => setChartDays(Number(days))} className={`rounded-md px-3 py-1.5 text-[11px] font-semibold ${chartDays === days ? "bg-[#ffc400] text-black" : "text-[#849099] hover:text-white"}`}>{label}</button>
                ))}
              </div>
            </div>
            <LightweightMarketChart asset={tradingAssets[symbol as keyof typeof tradingAssets]} days={chartDays} height={560} />
          </Card>
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
          {product === "futures" ? (
            <label className="mt-4 block text-xs">
              Leverage
              <select className="dash-input mt-2" value={leverage} onChange={(event) => setLeverage(event.target.value)}>
                {[1, 2, 3, 5, 10, 20].map((value) => <option key={value} value={value}>{value}×</option>)}
              </select>
            </label>
          ) : null}
          <button
            disabled={pending || (product !== "demo" && !canLive)}
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
