# Trading engine

Korvesta currently supports persistent spot paper trading and guarded Binance spot execution. Apply `supabase/migrations/202608210001_persistent_trading_engine.sql` before opening the trading pages.

## Paper trading

Each authenticated user receives a persistent USDT paper account with 100,000 virtual USDT. Market, limit, stop-market and stop-limit orders are persisted. Fills update balances and positions atomically; open orders reserve buying power or asset quantity and can be cancelled.

Call `POST /api/trading/process-limits` on a schedule (for example every minute) with `Authorization: Bearer <TRADING_CRON_SECRET>`. The endpoint reads current prices and atomically fills eligible paper limits using the service-role client.

Call `POST /api/trading/reconcile` with the same authorization every minute. It queries Binance for every open or partially-filled live order and persists executed quantity, weighted fill price and final status. Both jobs must run in production; configure them in the scheduler supplied by the deployment platform.

## Binance execution

Credentials are server-only. Start with Spot Testnet:

```env
BINANCE_API_KEY=
BINANCE_API_SECRET=
BINANCE_TESTNET=true
ENABLE_LIVE_EXECUTION=true
```

Mainnet remains blocked even when live execution is enabled. Enabling real-money orders additionally requires:

```env
BINANCE_TESTNET=false
ALLOW_BINANCE_MAINNET=I_UNDERSTAND_REAL_FUNDS_ARE_AT_RISK
```

Use a Binance key restricted to trading, disable withdrawals on that key, and apply IP restrictions. Fireblocks is custody/transfer infrastructure and is deliberately not called during exchange order placement.

`TRADING_EMERGENCY_STOP=true` immediately rejects new Binance orders. `MAX_LIVE_ORDER_NOTIONAL_USDT` caps each live order. Mainnet is additionally restricted to an authenticated admin because the configured Binance key is shared platform infrastructure; customer mainnet execution requires per-user exchange subaccounts or an approved omnibus custody design.

## Deliberately unavailable

Futures, automated bots and copy trading are disabled instead of presenting fabricated balances or performance. They require separate margin/liquidation, strategy/risk, allocation/reconciliation, compliance and kill-switch systems.
