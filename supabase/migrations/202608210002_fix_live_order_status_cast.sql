create or replace function public.record_live_order(
  asset uuid,
  requested_side public.order_side,
  requested_type text,
  requested_quantity numeric,
  requested_limit numeric,
  request_key text,
  provider_order_id text,
  provider_status text,
  provider_fill numeric,
  provider_fee numeric default 0
)
returns public.trading_orders
language plpgsql
security definer
set search_path=''
as $$
declare
  acct public.trading_accounts;
  symbol text;
  result public.trading_orders;
begin
  select * into acct from public.ensure_trading_account('live');
  select a.symbol into symbol from public.assets a where a.id=asset;

  insert into public.trading_orders(
    account_id, asset_id, pair, side, order_type, quantity, limit_price,
    fill_price, fee, status, idempotency_key, provider, external_order_id,
    filled_at
  )
  values(
    acct.id,
    asset,
    symbol||'/USDT',
    requested_side,
    requested_type,
    requested_quantity,
    requested_limit,
    provider_fill,
    provider_fee,
    (case
      when provider_status='FILLED' then 'filled'
      when provider_status in ('REJECTED','EXPIRED') then 'rejected'
      else 'open'
    end)::public.order_status,
    request_key,
    'binance',
    provider_order_id,
    case when provider_status='FILLED' then now() end
  )
  on conflict(account_id,idempotency_key)
  do update set external_order_id=excluded.external_order_id
  returning * into result;

  return result;
end $$;

grant execute on function public.record_live_order(
  uuid,public.order_side,text,numeric,numeric,text,text,text,numeric,numeric
) to authenticated;
