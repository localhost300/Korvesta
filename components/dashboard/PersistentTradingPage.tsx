"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, DataTable, PageHeading, Status } from "./DashboardUI";
import { LightweightMarketChart } from "@/components/LightweightMarketChart";
import { tradingMarketGroups } from "@/lib/trading";

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
    assetId?: string;
    margin?: number;
    leverage?: number;
    liquidationPrice?: number;
    stopLoss?: number | null;
    takeProfit?: number | null;
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
  const [transferAmount, setTransferAmount] = useState("");
  const [transferDirection, setTransferDirection] = useState("wallet_to_spot");
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
  async function submit(orderSide: "buy" | "sell" = side as "buy" | "sell") {
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
        side: orderSide,
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
  async function transfer() {
    setPending(true); const response=await fetch("/api/trading/transfers",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({direction:transferDirection,amount:Number(transferAmount),idempotencyKey:crypto.randomUUID()})});const result=await response.json().catch(()=>({}));setPending(false);setMessage(response.ok?"Transfer completed.":result.error??"Transfer failed.");if(response.ok){setTransferAmount("");void refresh();}
  }
  async function closePosition(position: AccountData["positions"][number]) {
    setPending(true);const response=await fetch("/api/trading/orders",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({product:"futures",symbol:position.symbol,side:position.quantity>0?"sell":"buy",type:"market",quantity:Math.abs(position.quantity),leverage:position.leverage??1,idempotencyKey:crypto.randomUUID()})});const result=await response.json().catch(()=>({}));setPending(false);setMessage(response.ok?`${position.symbol} position closed.`:result.error??"Close failed.");if(response.ok)void refresh();
  }
  async function setRisk(position: AccountData["positions"][number]) {
    if(!position.assetId)return;const stop=window.prompt("Stop-loss price",position.stopLoss?.toString()??"");if(stop===null)return;const take=window.prompt("Take-profit price",position.takeProfit?.toString()??"");if(take===null)return;const response=await fetch("/api/trading/futures/risk",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({assetId:position.assetId,stopLoss:stop?Number(stop):null,takeProfit:take?Number(take):null})});const result=await response.json().catch(()=>({}));setMessage(response.ok?"Risk controls saved.":result.error??"Could not save risk controls.");if(response.ok)void refresh();
  }
  return (
    <>
      <section className="mb-2 flex flex-wrap items-center gap-3 rounded-xl border border-[#202a31] bg-[#0a1014] px-4 py-3">
        <div><h1 className="text-lg font-semibold">{product === "demo" ? "Demo Trading" : product === "futures" ? "Futures Trading" : "Spot Trading"}</h1><p className="text-[10px] text-[#849099]">{symbol}/USDT · Korvesta terminal</p></div>
        <Status tone={product === "demo" ? "yellow" : "green"}>{product === "demo" ? "Simulation" : "Korvesta engine"}</Status>
        <span className="ml-auto rounded-lg border border-[#263038] px-3 py-2 text-xs">
          Cash <b className="ml-1">${Number(account?.account.cash_balance ?? 0).toLocaleString()}</b>
        </span>
        <span className="rounded-lg border border-[#263038] px-3 py-2 text-xs">
          Equity <b className="ml-1">${(account?.equity ?? 0).toLocaleString()}</b>
        </span>
      </section>
      {product !== "demo" ? <section className="mb-2 flex flex-wrap items-end gap-2 rounded-xl border border-[#202a31] bg-[#0a1014] p-3">
        <label className="text-[11px] text-[#849099]">Transfer<select className="dash-input mt-1 min-w-44" value={transferDirection} onChange={e=>setTransferDirection(e.target.value)}>{product==="spot"?<><option value="wallet_to_spot">Wallet → Spot</option><option value="spot_to_wallet">Spot → Wallet</option></>:<><option value="spot_to_futures">Spot → Futures</option><option value="futures_to_spot">Futures → Spot</option></>}</select></label>
        <label className="text-[11px] text-[#849099]">Amount<input className="dash-input mt-1 max-w-48" inputMode="decimal" value={transferAmount} onChange={e=>setTransferAmount(e.target.value)} placeholder="USDT"/></label>
        <button type="button" disabled={pending||!Number(transferAmount)} onClick={()=>void transfer()} className="gold-button min-h-10 disabled:opacity-50">Transfer funds</button>
      </section>:null}
      <div className="grid items-start gap-2 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <div className="rounded-xl border border-[#202a31] bg-[#0a1014] p-3">
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
            <LightweightMarketChart asset={symbol} days={chartDays} height={620} />
          </div>
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
                product === "futures" ? "Margin / Leverage" : "Value",
                "Unrealised P&L",
                ...(product === "futures" ? ["Liquidation", "Risk", "Action"] : []),
              ]}
              rows={(account?.positions ?? []).map((p) => [
                p.symbol,
                p.quantity,
                p.averageCost.toFixed(2),
                p.price.toFixed(2),
                product === "futures" ? `${(p.margin??0).toFixed(2)} / ${p.leverage??1}×` : p.value.toFixed(2),
                <span
                  key="pnl"
                  className={
                    p.unrealisedPnl >= 0 ? "text-[#00d084]" : "text-[#ef4444]"
                  }
                >
                  {p.unrealisedPnl.toFixed(2)}
                </span>,
                ...(product === "futures" ? [
                  p.liquidationPrice?.toFixed(2)??"—",
                  <button key="risk" onClick={()=>void setRisk(p)} className="text-[#ffc400]">{p.stopLoss||p.takeProfit?"Edit SL/TP":"Add SL/TP"}</button>,
                  <button key="close" disabled={pending} onClick={()=>void closePosition(p)} className="rounded bg-[#ef4444] px-2 py-1 text-white disabled:opacity-50">Close</button>,
                ] : []),
              ])}
            />
          </Card>
        </div>
        <Card className="xl:sticky xl:top-[76px]" title="Order ticket">
          <label className="text-xs">
            Market
            <select
              className="dash-input mt-2"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
            >
              {Object.entries(tradingMarketGroups).filter(([group]) => product !== "futures" || group === "Crypto").map(([group, symbols]) => (
                <optgroup key={group} label={group}>
                  {symbols.map((marketSymbol) => <option key={marketSymbol} value={marketSymbol}>{marketSymbol}/USDT</option>)}
                </optgroup>
              ))}
            </select>
          </label>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {["market", "limit", "stop_market", "stop_limit"].map((orderType) => (
              <button key={orderType} type="button" onClick={() => setType(orderType)} className={`rounded-lg border px-2 py-2 text-[11px] capitalize ${type === orderType ? "border-[#ffc400] bg-[#ffc40018] text-[#ffc400]" : "border-[#263038] text-[#849099]"}`}>{orderType.replace("_", " ")}</button>
            ))}
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
          <div className="mt-5 grid grid-cols-2 gap-2">
            <button disabled={pending || (product !== "demo" && !canLive)} onClick={() => { setSide("buy"); void submit("buy"); }} className="min-h-14 rounded-lg bg-[#20bf63] font-bold text-white shadow-[0_0_22px_#20bf6330] disabled:opacity-50">{pending ? "WAIT…" : `↑ BUY ${symbol}`}</button>
            <button disabled={pending || (product !== "demo" && !canLive)} onClick={() => { setSide("sell"); void submit("sell"); }} className="min-h-14 rounded-lg bg-[#f04444] font-bold text-white shadow-[0_0_22px_#f0444430] disabled:opacity-50">{pending ? "WAIT…" : `↓ SELL ${symbol}`}</button>
          </div>
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
