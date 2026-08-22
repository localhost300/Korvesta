import "server-only";
import { createHmac } from "node:crypto";
import {
  validateBinanceOrder,
  type BinanceSymbolFilter,
  type TradingOrderInput,
} from "@/lib/trading";

const liveEnabled = () => process.env.ENABLE_LIVE_EXECUTION === "true";
const testnet = () => process.env.BINANCE_TESTNET !== "false";
const base = () =>
  testnet() ? "https://testnet.binance.vision" : "https://api.binance.com";

export function executionStatus() {
  return {
    enabled: liveEnabled(),
    testnet: testnet(),
    configured: Boolean(
      process.env.BINANCE_API_KEY && process.env.BINANCE_API_SECRET,
    ),
    provider: "binance",
    emergencyStop: process.env.TRADING_EMERGENCY_STOP === "true",
    custodyConfigured: Boolean(
      process.env.FIREBLOCKS_API_KEY && process.env.FIREBLOCKS_SECRET_KEY,
    ),
  };
}

async function signedRequest(
  path: string,
  method = "GET",
  values: Record<string, string> = {},
) {
  const status = executionStatus();
  if (!status.configured) throw new Error("Binance credentials are missing.");
  const params = new URLSearchParams({
    ...values,
    recvWindow: "5000",
    timestamp: String(Date.now()),
  });
  params.set(
    "signature",
    createHmac("sha256", process.env.BINANCE_API_SECRET!)
      .update(params.toString())
      .digest("hex"),
  );
  const response = await fetch(`${base()}${path}?${params}`, {
    method,
    headers: { "X-MBX-APIKEY": process.env.BINANCE_API_KEY! },
    cache: "no-store",
  });
  const result = (await response.json()) as Record<string, unknown>;
  if (!response.ok)
    throw new Error(
      typeof result.msg === "string"
        ? result.msg
        : `Binance request failed (${response.status}).`,
    );
  return result;
}

export async function getBinanceAccount() {
  return signedRequest("/api/v3/account");
}
export async function getBinanceOrder(symbol: string, orderId: string) {
  return signedRequest("/api/v3/order", "GET", { symbol, orderId });
}
export async function cancelBinanceOrder(symbol: string, orderId: string) {
  return signedRequest("/api/v3/order", "DELETE", { symbol, orderId });
}

export async function placeBinanceOrder(order: TradingOrderInput) {
  const status = executionStatus();
  if (!status.enabled || !status.configured)
    throw new Error(
      "Live execution is disabled or Binance credentials are missing.",
    );
  if (status.emergencyStop)
    throw new Error("Trading is paused by the emergency stop.");
  if (
    !status.testnet &&
    process.env.ALLOW_BINANCE_MAINNET !== "I_UNDERSTAND_REAL_FUNDS_ARE_AT_RISK"
  )
    throw new Error(
      "Binance mainnet requires the explicit mainnet acknowledgement.",
    );
  const symbol = `${order.symbol}USDT`;
  const [exchangeResponse, tickerResponse] = await Promise.all([
    fetch(`${base()}/api/v3/exchangeInfo?symbol=${symbol}`, {
      cache: "no-store",
    }),
    fetch(`${base()}/api/v3/ticker/price?symbol=${symbol}`, {
      cache: "no-store",
    }),
  ]);
  if (!exchangeResponse.ok || !tickerResponse.ok)
    throw new Error("Binance trading rules or market price are unavailable.");
  const exchange = (await exchangeResponse.json()) as {
    symbols?: Array<{ filters?: BinanceSymbolFilter[] }>;
  };
  const ticker = (await tickerResponse.json()) as { price?: string };
  const marketPrice = Number(ticker.price);
  if (!Number.isFinite(marketPrice) || marketPrice <= 0)
    throw new Error("Binance returned an invalid market price.");
  validateBinanceOrder(
    order,
    exchange.symbols?.[0]?.filters ?? [],
    marketPrice,
  );
  const maxNotional = Number(process.env.MAX_LIVE_ORDER_NOTIONAL_USDT ?? 1000);
  const referencePrice = ["limit", "stop_limit"].includes(order.type)
    ? order.limitPrice!
    : marketPrice;
  if (order.quantity * referencePrice > maxNotional)
    throw new Error(`Order exceeds the ${maxNotional} USDT live-order limit.`);

  const binanceType =
    order.type === "stop_market"
      ? "STOP_LOSS"
      : order.type === "stop_limit"
        ? "STOP_LOSS_LIMIT"
        : order.type.toUpperCase();
  const params = new URLSearchParams({
    symbol,
    side: order.side.toUpperCase(),
    type: binanceType,
    quantity: String(order.quantity),
    newClientOrderId: order.idempotencyKey.slice(0, 36),
    recvWindow: "5000",
    timestamp: String(Date.now()),
  });
  if (["limit", "stop_limit"].includes(order.type)) {
    params.set("timeInForce", "GTC");
    params.set("price", String(order.limitPrice));
  }
  if (order.type.startsWith("stop_"))
    params.set("stopPrice", String(order.stopPrice));
  const signature = createHmac("sha256", process.env.BINANCE_API_SECRET!)
    .update(params.toString())
    .digest("hex");
  params.set("signature", signature);
  const response = await fetch(`${base()}/api/v3/order?${params}`, {
    method: "POST",
    headers: { "X-MBX-APIKEY": process.env.BINANCE_API_KEY! },
    cache: "no-store",
  });
  const result = (await response.json()) as Record<string, unknown>;
  if (!response.ok) {
    if (
      typeof result.msg === "string" &&
      /filter failure:\s*(NOTIONAL|MIN_NOTIONAL)/i.test(result.msg)
    )
      throw new Error(
        "Order value is below Binance's minimum for this market. Increase the quantity and try again.",
      );
    throw new Error(
      typeof result.msg === "string"
        ? result.msg
        : `Binance rejected the order (${response.status}).`,
    );
  }
  return result;
}
