# Korvesta backend activation

The application is buildable without external credentials. Supabase-backed accounts, balances and payment workflows activate after the following setup.

## 1. Configure Supabase

Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to `.env.local`. Keep `SUPABASE_SERVICE_ROLE_KEY` server-only and do not prefix it with `NEXT_PUBLIC_`.

Apply `supabase/migrations/202608200001_initial_financial_core.sql` with the Supabase CLI or SQL editor. The migration creates Auth-linked profiles, assets, networks, append-only double-entry ledger records, price snapshots, manual payments, demo orders, audit records, RLS policies and the private `payment-proofs` bucket.

Promote staff only through a trusted SQL/admin environment:

```sql
update public.profiles set role = 'admin' where id = '<auth-user-id>';
```

Enroll and verify a TOTP factor for every staff user. Staff sign-in rejects accounts without a verified factor.

## 2. Assign deposit addresses

Seeded networks deliberately have no deposit address. Set an address only after ownership and monitoring procedures are documented:

```sql
update public.networks
set deposit_address = '<verified-address>'
where id = '<network-id>';
```

Deposits remain pending until a staff member supplies a transaction hash and calls the approval RPC. Withdrawals reserve available funds immediately and require two different staff approvals.

## 3. Market data

CoinGecko's public API works for development. Add `COINGECKO_API_KEY` and set `COINGECKO_API_TIER` to `demo` or `pro` for keyed usage. Prices are cached for 30 seconds and OHLC candles for 60 seconds.

## 4. Live providers

Binance execution and Fireblocks custody adapters are fail-closed. `ENABLE_LIVE_EXECUTION` must remain `false` until regulatory approval, provider contracts, credential isolation, webhook verification, reconciliation and incident procedures are complete.

## Verification

```bash
npm run test:unit
npm run typecheck
npm run lint
npm run build
npm run test:smoke
```
