export type DemoOrder = { id: string; symbol: string; side: "buy" | "sell"; type: "market" | "limit"; quantity: number; requestedPrice?: number; fillPrice?: number; fee: number; status: "open" | "filled" | "cancelled"; createdAt: string };
export type DemoState = { cash: number; reservedCash: number; holdings: Record<string, number>; orders: DemoOrder[] };
export type OrderRequest = Pick<DemoOrder, "symbol" | "side" | "type" | "quantity"> & { limitPrice?: number; idempotencyKey: string };
const round = (value: number) => Math.round((value + Number.EPSILON) * 1e8) / 1e8;

export function placeDemoOrder(state: DemoState, request: OrderRequest, marketPrice: number, now = new Date().toISOString(), feeRate = .001): DemoState {
  if (!Number.isFinite(request.quantity) || request.quantity <= 0 || marketPrice <= 0) throw new Error("Invalid order quantity or price.");
  if (state.orders.some((order) => order.id === request.idempotencyKey)) return state;
  const executionPrice = request.type === "market" ? marketPrice : request.limitPrice;
  if (!executionPrice || executionPrice <= 0) throw new Error("A positive limit price is required.");
  const fills = request.type === "market" || (request.side === "buy" ? executionPrice >= marketPrice : executionPrice <= marketPrice);
  const notional = round(request.quantity * executionPrice); const fee = round(notional * feeRate);
  if (request.side === "buy" && notional + fee > state.cash - state.reservedCash) throw new Error("Insufficient virtual cash.");
  if (request.side === "sell" && request.quantity > (state.holdings[request.symbol] ?? 0)) throw new Error("Insufficient virtual asset balance.");
  const order: DemoOrder = { id: request.idempotencyKey, symbol: request.symbol, side: request.side, type: request.type, quantity: request.quantity, requestedPrice: request.limitPrice, fillPrice: fills ? executionPrice : undefined, fee, status: fills ? "filled" : "open", createdAt: now };
  if (!fills) return { ...state, reservedCash: request.side === "buy" ? round(state.reservedCash + notional + fee) : state.reservedCash, orders: [order, ...state.orders] };
  const holdings = { ...state.holdings, [request.symbol]: round((state.holdings[request.symbol] ?? 0) + (request.side === "buy" ? request.quantity : -request.quantity)) };
  const cash = round(state.cash + (request.side === "buy" ? -(notional + fee) : notional - fee));
  return { ...state, cash, holdings, orders: [order, ...state.orders] };
}

export function cancelDemoOrder(state: DemoState, id: string): DemoState { const order = state.orders.find((item) => item.id === id); if (!order || order.status !== "open") return state; const reserved = order.side === "buy" ? order.quantity * (order.requestedPrice ?? 0) + order.fee : 0; return { ...state, reservedCash: round(Math.max(0, state.reservedCash - reserved)), orders: state.orders.map((item) => item.id === id ? { ...item, status: "cancelled" } : item) }; }

export function markToMarket(state: DemoState, prices: Record<string, number>) { const assetValue = Object.entries(state.holdings).reduce((total, [symbol, quantity]) => total + quantity * (prices[symbol] ?? 0), 0); return round(state.cash + assetValue); }
