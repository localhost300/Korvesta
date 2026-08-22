import test from "node:test";
import assert from "node:assert/strict";
import { calculatePortfolio } from "../lib/portfolio";
import {
  cancelDemoOrder,
  markToMarket,
  placeDemoOrder,
  type DemoState,
} from "../lib/demo-engine";
import { parseOrderInput, validateBinanceOrder } from "../lib/trading";
import { calculateSimpleDailyAccrual } from "../lib/investments";

test("portfolio calculations retain decimal precision", () => {
  const result = calculatePortfolio(
    [
      {
        assetId: "bitcoin",
        symbol: "BTC",
        quantity: "0.125",
        costBasis: "7000",
      },
      { assetId: "tether", symbol: "USDT", quantity: "1000" },
    ],
    { bitcoin: "68000.25", tether: "1" },
  );
  assert.equal(result.totalValue, "9500.03125");
  assert.equal(result.positions[0].unrealisedPnl, "1500.03125");
  assert.equal(
    result.positions.reduce((sum, item) => sum + item.allocation, 0),
    100,
  );
});

test("demo market buy charges fees and is idempotent", () => {
  const initial: DemoState = {
    cash: 100000,
    reservedCash: 0,
    holdings: {},
    orders: [],
  };
  const next = placeDemoOrder(
    initial,
    {
      symbol: "BTC",
      side: "buy",
      type: "market",
      quantity: 1,
      idempotencyKey: "one",
    },
    50000,
  );
  assert.equal(next.cash, 49950);
  assert.equal(next.holdings.BTC, 1);
  assert.equal(
    placeDemoOrder(
      next,
      {
        symbol: "BTC",
        side: "buy",
        type: "market",
        quantity: 1,
        idempotencyKey: "one",
      },
      50000,
    ),
    next,
  );
  assert.equal(markToMarket(next, { BTC: 51000 }), 100950);
});

test("open limit orders reserve and release virtual cash", () => {
  const initial: DemoState = {
    cash: 10000,
    reservedCash: 0,
    holdings: {},
    orders: [],
  };
  const open = placeDemoOrder(
    initial,
    {
      symbol: "ETH",
      side: "buy",
      type: "limit",
      quantity: 1,
      limitPrice: 2000,
      idempotencyKey: "limit",
    },
    2100,
  );
  assert.equal(open.orders[0].status, "open");
  assert.equal(open.reservedCash, 2002);
  assert.equal(cancelDemoOrder(open, "limit").reservedCash, 0);
});

test("Binance minimum notional is explained before submission", () => {
  assert.throws(
    () =>
      validateBinanceOrder(
        { symbol: "XRP", type: "market", quantity: 0.001 },
        [
          { filterType: "NOTIONAL", minNotional: "5" },
          { filterType: "MARKET_LOT_SIZE", minQty: "0.001", maxQty: "100000" },
        ],
        2,
      ),
    /at least 5 USDT.*2.5 XRP/,
  );
});

test("stop-limit orders require both stop and limit prices", () => {
  const order = parseOrderInput({
    symbol: "BTC",
    side: "sell",
    type: "stop_limit",
    quantity: 0.01,
    stopPrice: 60000,
    limitPrice: 59900,
    idempotencyKey: "stop-order-1",
    mode: "paper",
  });
  assert.equal(order.stopPrice, 60000);
  assert.throws(
    () => parseOrderInput({ ...order, stopPrice: undefined }),
    /Invalid order request/,
  );
});

test("Binance lot and tick increments are validated", () => {
  assert.throws(
    () =>
      validateBinanceOrder(
        {
          symbol: "BTC",
          type: "limit",
          quantity: 0.0015,
          limitPrice: 60000.005,
        },
        [
          {
            filterType: "LOT_SIZE",
            minQty: ".001",
            maxQty: "10",
            stepSize: ".001",
          },
          { filterType: "PRICE_FILTER", tickSize: ".01" },
        ],
        60000,
      ),
    /quantity must use increments/,
  );
});

test("fixed APY uses non-compounding simple interest", () => {
  assert.equal(calculateSimpleDailyAccrual(10000, 550, 365), 550);
  assert.equal(
    Number(calculateSimpleDailyAccrual(10000, 550).toFixed(8)),
    1.50684932,
  );
});
