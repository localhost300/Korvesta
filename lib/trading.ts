export const tradingAssets = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  BNB: "binancecoin",
  XRP: "ripple",
} as const;
export type TradingSymbol = keyof typeof tradingAssets;
export type TradingProduct = "spot" | "futures" | "demo";
export type TradingMode = "paper" | "live";
export type TradingOrderInput = {
  symbol: TradingSymbol;
  side: "buy" | "sell";
  type: "market" | "limit" | "stop_market" | "stop_limit";
  quantity: number;
  limitPrice?: number;
  stopPrice?: number;
  idempotencyKey: string;
  mode: TradingMode;
  product: TradingProduct;
  leverage?: number;
};

export type BinanceSymbolFilter = {
  filterType: string;
  minQty?: string;
  maxQty?: string;
  stepSize?: string;
  minNotional?: string;
  maxNotional?: string;
  minPrice?: string;
  maxPrice?: string;
  tickSize?: string;
};

export function validateBinanceOrder(
  order: Pick<
    TradingOrderInput,
    "quantity" | "type" | "limitPrice" | "stopPrice" | "symbol"
  >,
  filters: BinanceSymbolFilter[],
  marketPrice: number,
) {
  const lot =
    filters.find((filter) =>
      order.type === "market"
        ? filter.filterType === "MARKET_LOT_SIZE"
        : filter.filterType === "LOT_SIZE",
    ) ?? filters.find((filter) => filter.filterType === "LOT_SIZE");
  const notional = filters.find((filter) =>
    ["NOTIONAL", "MIN_NOTIONAL"].includes(filter.filterType),
  );
  const priceFilter = filters.find(
    (filter) => filter.filterType === "PRICE_FILTER",
  );
  const price = ["limit", "stop_limit"].includes(order.type)
    ? order.limitPrice!
    : marketPrice;
  const value = order.quantity * price;
  const minQty = Number(lot?.minQty ?? 0);
  const maxQty = Number(lot?.maxQty ?? Number.POSITIVE_INFINITY);
  const minNotional = Number(notional?.minNotional ?? 0);
  const maxNotional = Number(notional?.maxNotional ?? Number.POSITIVE_INFINITY);
  if (order.quantity < minQty)
    throw new Error(`Minimum ${order.symbol} quantity is ${minQty}.`);
  if (order.quantity > maxQty)
    throw new Error(`Maximum ${order.symbol} quantity is ${maxQty}.`);
  const step = Number(lot?.stepSize ?? 0);
  if (
    step > 0 &&
    Math.abs(order.quantity / step - Math.round(order.quantity / step)) > 1e-8
  )
    throw new Error(`${order.symbol} quantity must use increments of ${step}.`);
  const tick = Number(priceFilter?.tickSize ?? 0);
  for (const candidate of [order.limitPrice, order.stopPrice])
    if (
      candidate &&
      tick > 0 &&
      Math.abs(candidate / tick - Math.round(candidate / tick)) > 1e-8
    )
      throw new Error(`Price must use increments of ${tick}.`);
  if (value < minNotional) {
    const minimumQuantity = Math.ceil((minNotional / price) * 1e8) / 1e8;
    throw new Error(
      `Order value must be at least ${minNotional} USDT. At the current price, use at least ${minimumQuantity} ${order.symbol}.`,
    );
  }
  if (value > maxNotional)
    throw new Error(`Order value cannot exceed ${maxNotional} USDT.`);
}

export function parseOrderInput(value: unknown): TradingOrderInput {
  const body = (value ?? {}) as Record<string, unknown>;
  const symbol = String(body.symbol ?? "").toUpperCase() as TradingSymbol;
  const side =
    body.side === "sell" ? "sell" : body.side === "buy" ? "buy" : null;
  const type = ["market", "limit", "stop_market", "stop_limit"].includes(
    String(body.type),
  )
    ? (body.type as TradingOrderInput["type"])
    : null;
  const quantity = Number(body.quantity);
  const limitPrice =
    body.limitPrice == null ? undefined : Number(body.limitPrice);
  const stopPrice = body.stopPrice == null ? undefined : Number(body.stopPrice);
  const product = ["spot", "futures", "demo"].includes(String(body.product))
    ? (body.product as TradingProduct)
    : body.mode === "paper" ? "demo" : "spot";
  const mode: TradingMode = product === "demo" ? "paper" : "live";
  const leverage = product === "futures" ? Number(body.leverage ?? 1) : undefined;
  const idempotencyKey = String(body.idempotencyKey ?? "").trim();
  if (
    !(symbol in tradingAssets) ||
    !side ||
    !type ||
    !Number.isFinite(quantity) ||
    quantity <= 0 ||
    quantity > 1_000_000 ||
    (["limit", "stop_limit"].includes(type) &&
      (!limitPrice || limitPrice <= 0)) ||
    (type.startsWith("stop_") && (!stopPrice || stopPrice <= 0)) ||
    idempotencyKey.length < 8 ||
    idempotencyKey.length > 100 ||
    (product === "futures" &&
      (!Number.isInteger(leverage) || leverage! < 1 || leverage! > 20))
  )
    throw new Error("Invalid order request.");
  return {
    symbol,
    side,
    type,
    quantity,
    limitPrice,
    stopPrice,
    idempotencyKey,
    mode,
    product,
    leverage,
  };
}
