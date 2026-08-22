create type public.trading_mode as enum ('paper','live');

create table public.trading_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade,
  mode public.trading_mode not null,
  quote_symbol text not null default 'USDT',
  cash_balance numeric(38,18) not null default 100000 check(cash_balance >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id,mode)
);

create table public.trading_positions (
  account_id uuid not null references public.trading_accounts on delete cascade,
  asset_id uuid not null references public.assets,
  quantity numeric(38,18) not null default 0 check(quantity >= 0),
  average_cost numeric(38,18) not null default 0 check(average_cost >= 0),
  realised_pnl numeric(38,18) not null default 0,
  updated_at timestamptz not null default now(),
  primary key(account_id,asset_id)
);

create table public.trading_orders (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.trading_accounts on delete cascade,
  asset_id uuid not null references public.assets,
  pair text not null,
  side public.order_side not null,
  order_type text not null check(order_type in ('market','limit')),
  quantity numeric(38,18) not null check(quantity > 0),
  limit_price numeric(38,18) check(limit_price > 0),
  fill_price numeric(38,18),
  fee numeric(38,18) not null default 0 check(fee >= 0),
  status public.order_status not null default 'open',
  idempotency_key text not null,
  provider text not null default 'paper',
  external_order_id text,
  rejection_reason text,
  created_at timestamptz not null default now(),
  filled_at timestamptz,
  cancelled_at timestamptz,
  unique(account_id,idempotency_key)
);
create index trading_orders_open_idx on public.trading_orders(status,provider,created_at) where status='open';

alter table public.trading_accounts enable row level security;
alter table public.trading_positions enable row level security;
alter table public.trading_orders enable row level security;
create policy own_trading_accounts on public.trading_accounts for select using(user_id=auth.uid() or public.is_staff());
create policy own_trading_positions on public.trading_positions for select using(exists(select 1 from public.trading_accounts a where a.id=account_id and (a.user_id=auth.uid() or public.is_staff())));
create policy own_trading_orders on public.trading_orders for select using(exists(select 1 from public.trading_accounts a where a.id=account_id and (a.user_id=auth.uid() or public.is_staff())));

create or replace function public.ensure_trading_account(requested_mode public.trading_mode)
returns public.trading_accounts language plpgsql security definer set search_path='' as $$
declare result public.trading_accounts;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  insert into public.trading_accounts(user_id,mode,cash_balance)
  values(auth.uid(),requested_mode,case when requested_mode='paper' then 100000 else 0 end)
  on conflict(user_id,mode) do update set updated_at=public.trading_accounts.updated_at
  returning * into result;
  return result;
end $$;

create or replace function public.place_paper_order(
  asset uuid, requested_side public.order_side, requested_type text,
  requested_quantity numeric, requested_limit numeric, market_price numeric,
  request_key text, fee_rate numeric default 0.001
) returns public.trading_orders language plpgsql security definer set search_path='' as $$
declare acct public.trading_accounts; existing public.trading_orders; result public.trading_orders;
declare symbol text; execution numeric; notional numeric; trade_fee numeric; should_fill boolean;
declare pos public.trading_positions; reserved_cash numeric; reserved_asset numeric;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if requested_quantity<=0 or market_price<=0 or requested_type not in ('market','limit') then raise exception 'invalid order'; end if;
  if requested_type='limit' and (requested_limit is null or requested_limit<=0) then raise exception 'positive limit price required'; end if;
  select * into acct from public.ensure_trading_account('paper');
  perform pg_advisory_xact_lock(hashtextextended(acct.id::text,0));
  select * into existing from public.trading_orders where account_id=acct.id and idempotency_key=request_key;
  if found then return existing; end if;
  select a.symbol into symbol from public.assets a where a.id=asset and a.enabled;
  if symbol is null or symbol='USDT' then raise exception 'unsupported asset'; end if;
  execution=case when requested_type='market' then market_price else requested_limit end;
  should_fill=requested_type='market' or (requested_side='buy' and requested_limit>=market_price) or (requested_side='sell' and requested_limit<=market_price);
  notional=round(requested_quantity*execution,18); trade_fee=round(notional*fee_rate,18);
  select coalesce(sum(quantity*limit_price*(1+fee_rate)),0) into reserved_cash from public.trading_orders where account_id=acct.id and side='buy' and status='open';
  select coalesce(sum(quantity),0) into reserved_asset from public.trading_orders where account_id=acct.id and asset_id=asset and side='sell' and status='open';
  select * into pos from public.trading_positions where account_id=acct.id and asset_id=asset;
  if requested_side='buy' and notional+trade_fee>acct.cash_balance-reserved_cash then raise exception 'insufficient virtual cash'; end if;
  if requested_side='sell' and requested_quantity>coalesce(pos.quantity,0)-reserved_asset then raise exception 'insufficient virtual asset balance'; end if;
  insert into public.trading_orders(account_id,asset_id,pair,side,order_type,quantity,limit_price,fill_price,fee,status,idempotency_key,filled_at)
  values(acct.id,asset,symbol||'/USDT',requested_side,requested_type,requested_quantity,requested_limit,case when should_fill then execution end,case when should_fill then trade_fee else 0 end,(case when should_fill then 'filled' else 'open' end)::public.order_status,request_key,case when should_fill then now() end)
  returning * into result;
  if should_fill then
    insert into public.trading_positions(account_id,asset_id,quantity,average_cost,realised_pnl)
    values(acct.id,asset,case when requested_side='buy' then requested_quantity else 0 end,case when requested_side='buy' then execution else 0 end,case when requested_side='sell' then (execution-coalesce(pos.average_cost,0))*requested_quantity-trade_fee else 0 end)
    on conflict(account_id,asset_id) do update set
      average_cost=case when requested_side='buy' then ((public.trading_positions.quantity*public.trading_positions.average_cost)+(requested_quantity*execution))/(public.trading_positions.quantity+requested_quantity) else public.trading_positions.average_cost end,
      quantity=public.trading_positions.quantity+case when requested_side='buy' then requested_quantity else -requested_quantity end,
      realised_pnl=public.trading_positions.realised_pnl+case when requested_side='sell' then (execution-public.trading_positions.average_cost)*requested_quantity-trade_fee else 0 end,
      updated_at=now();
    update public.trading_accounts set cash_balance=cash_balance+case when requested_side='buy' then -(notional+trade_fee) else notional-trade_fee end,updated_at=now() where id=acct.id;
  end if;
  insert into public.audit_events(actor_id,action,entity_type,entity_id,after_state) values(auth.uid(),'place_'||requested_side,'trading_order',result.id::text,to_jsonb(result));
  return result;
end $$;

create or replace function public.cancel_paper_order(order_id uuid) returns public.trading_orders language plpgsql security definer set search_path='' as $$
declare result public.trading_orders;
begin
 update public.trading_orders o set status='cancelled',cancelled_at=now() from public.trading_accounts a
 where o.id=order_id and o.account_id=a.id and a.user_id=auth.uid() and o.provider='paper' and o.status='open' returning o.* into result;
 if result.id is null then raise exception 'open order not found'; end if; return result;
end $$;

grant execute on function public.ensure_trading_account(public.trading_mode) to authenticated;
grant execute on function public.place_paper_order(uuid,public.order_side,text,numeric,numeric,numeric,text,numeric) to authenticated;
grant execute on function public.cancel_paper_order(uuid) to authenticated;

create or replace function public.record_live_order(asset uuid, requested_side public.order_side, requested_type text, requested_quantity numeric, requested_limit numeric, request_key text, provider_order_id text, provider_status text, provider_fill numeric, provider_fee numeric default 0)
returns public.trading_orders language plpgsql security definer set search_path='' as $$
declare acct public.trading_accounts; symbol text; result public.trading_orders;
begin
 select * into acct from public.ensure_trading_account('live'); select a.symbol into symbol from public.assets a where a.id=asset;
 insert into public.trading_orders(account_id,asset_id,pair,side,order_type,quantity,limit_price,fill_price,fee,status,idempotency_key,provider,external_order_id,filled_at)
 values(acct.id,asset,symbol||'/USDT',requested_side,requested_type,requested_quantity,requested_limit,provider_fill,provider_fee,(case when provider_status='FILLED' then 'filled' when provider_status in ('REJECTED','EXPIRED') then 'rejected' else 'open' end)::public.order_status,request_key,'binance',provider_order_id,case when provider_status='FILLED' then now() end)
 on conflict(account_id,idempotency_key) do update set external_order_id=excluded.external_order_id returning * into result; return result;
end $$;
grant execute on function public.record_live_order(uuid,public.order_side,text,numeric,numeric,text,text,text,numeric,numeric) to authenticated;

create or replace function public.fill_paper_limit_order(order_id uuid, market_price numeric, fee_rate numeric default 0.001)
returns public.trading_orders language plpgsql security definer set search_path='' as $$
declare o public.trading_orders; acct public.trading_accounts; pos public.trading_positions; execution numeric; notional numeric; trade_fee numeric;
begin
 if auth.role()<>'service_role' then raise exception 'service role required'; end if;
 select * into o from public.trading_orders where id=order_id and provider='paper' and status='open' for update;
 if o.id is null then raise exception 'open paper order not found'; end if;
 if not ((o.side='buy' and o.limit_price>=market_price) or (o.side='sell' and o.limit_price<=market_price)) then return o; end if;
 select * into acct from public.trading_accounts where id=o.account_id for update; select * into pos from public.trading_positions where account_id=o.account_id and asset_id=o.asset_id;
 execution=o.limit_price; notional=round(o.quantity*execution,18); trade_fee=round(notional*fee_rate,18);
 if o.side='buy' and notional+trade_fee>acct.cash_balance then update public.trading_orders set status='rejected',rejection_reason='insufficient balance at fill' where id=o.id returning * into o; return o; end if;
 if o.side='sell' and o.quantity>coalesce(pos.quantity,0) then update public.trading_orders set status='rejected',rejection_reason='insufficient position at fill' where id=o.id returning * into o; return o; end if;
 insert into public.trading_positions(account_id,asset_id,quantity,average_cost,realised_pnl) values(o.account_id,o.asset_id,case when o.side='buy' then o.quantity else 0 end,case when o.side='buy' then execution else 0 end,case when o.side='sell' then (execution-coalesce(pos.average_cost,0))*o.quantity-trade_fee else 0 end)
 on conflict(account_id,asset_id) do update set average_cost=case when o.side='buy' then ((public.trading_positions.quantity*public.trading_positions.average_cost)+(o.quantity*execution))/(public.trading_positions.quantity+o.quantity) else public.trading_positions.average_cost end,quantity=public.trading_positions.quantity+case when o.side='buy' then o.quantity else -o.quantity end,realised_pnl=public.trading_positions.realised_pnl+case when o.side='sell' then (execution-public.trading_positions.average_cost)*o.quantity-trade_fee else 0 end,updated_at=now();
 update public.trading_accounts set cash_balance=cash_balance+case when o.side='buy' then -(notional+trade_fee) else notional-trade_fee end,updated_at=now() where id=o.account_id;
 update public.trading_orders set status='filled',fill_price=execution,fee=trade_fee,filled_at=now() where id=o.id returning * into o; return o;
end $$;
revoke all on function public.fill_paper_limit_order(uuid,numeric,numeric) from public;
grant execute on function public.fill_paper_limit_order(uuid,numeric,numeric) to service_role;
