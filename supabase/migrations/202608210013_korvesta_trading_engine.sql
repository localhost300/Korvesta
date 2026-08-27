-- Korvesta-owned spot and futures execution. No exchange credential or
-- exchange-side account is involved in order placement.
alter table public.trading_orders add column if not exists product text not null default 'spot'
  check (product in ('spot','futures','demo'));

create table public.futures_positions (
  account_id uuid not null references public.trading_accounts on delete cascade,
  asset_id uuid not null references public.assets,
  quantity numeric(38,18) not null default 0,
  entry_price numeric(38,18) not null default 0 check(entry_price >= 0),
  leverage smallint not null default 1 check(leverage between 1 and 20),
  margin numeric(38,18) not null default 0 check(margin >= 0),
  realised_pnl numeric(38,18) not null default 0,
  liquidation_price numeric(38,18),
  updated_at timestamptz not null default now(),
  primary key(account_id,asset_id)
);
alter table public.futures_positions enable row level security;
create policy own_futures_positions on public.futures_positions for select using(
  exists(select 1 from public.trading_accounts a where a.id=account_id and (a.user_id=auth.uid() or public.is_staff()))
);

create or replace function public.place_korvesta_spot_order(
  asset uuid, requested_side public.order_side, requested_type text,
  requested_quantity numeric, requested_limit numeric, market_price numeric,
  request_key text, is_demo boolean default false, fee_rate numeric default 0.001
) returns public.trading_orders language plpgsql security definer set search_path='' as $$
declare acct public.trading_accounts; existing public.trading_orders; result public.trading_orders;
declare symbol text; execution numeric; notional numeric; trade_fee numeric; should_fill boolean;
declare pos public.trading_positions; reserved_cash numeric; reserved_asset numeric; selected_mode public.trading_mode;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if requested_quantity<=0 or market_price<=0 or requested_type not in ('market','limit') then raise exception 'invalid order'; end if;
  if requested_type='limit' and (requested_limit is null or requested_limit<=0) then raise exception 'positive limit price required'; end if;
  selected_mode=case when is_demo then 'paper'::public.trading_mode else 'live'::public.trading_mode end;
  select * into acct from public.ensure_trading_account(selected_mode);
  perform pg_advisory_xact_lock(hashtextextended(acct.id::text,0));
  select * into existing from public.trading_orders where account_id=acct.id and idempotency_key=request_key;
  if found then return existing; end if;
  select a.symbol into symbol from public.assets a where a.id=asset and a.enabled;
  if symbol is null or symbol='USDT' then raise exception 'unsupported asset'; end if;
  execution=case when requested_type='market' then market_price else requested_limit end;
  should_fill=requested_type='market' or (requested_side='buy' and requested_limit>=market_price) or (requested_side='sell' and requested_limit<=market_price);
  notional=round(requested_quantity*execution,18); trade_fee=round(notional*fee_rate,18);
  select coalesce(sum(quantity*limit_price*(1+fee_rate)),0) into reserved_cash from public.trading_orders where account_id=acct.id and side='buy' and status='open' and product=case when is_demo then 'demo' else 'spot' end;
  select coalesce(sum(quantity),0) into reserved_asset from public.trading_orders where account_id=acct.id and asset_id=asset and side='sell' and status='open' and product=case when is_demo then 'demo' else 'spot' end;
  select * into pos from public.trading_positions where account_id=acct.id and asset_id=asset;
  if requested_side='buy' and notional+trade_fee>acct.cash_balance-reserved_cash then raise exception 'insufficient available cash'; end if;
  if requested_side='sell' and requested_quantity>coalesce(pos.quantity,0)-reserved_asset then raise exception 'insufficient available asset'; end if;
  insert into public.trading_orders(account_id,asset_id,pair,side,order_type,quantity,limit_price,fill_price,executed_quantity,fee,status,idempotency_key,provider,product,filled_at)
  values(acct.id,asset,symbol||'/USDT',requested_side,requested_type,requested_quantity,requested_limit,case when should_fill then execution end,case when should_fill then requested_quantity else 0 end,case when should_fill then trade_fee else 0 end,(case when should_fill then 'filled' else 'open' end)::public.order_status,request_key,'korvesta',case when is_demo then 'demo' else 'spot' end,case when should_fill then now() end)
  returning * into result;
  if should_fill then
    insert into public.trading_positions(account_id,asset_id,quantity,average_cost,realised_pnl)
    values(acct.id,asset,case when requested_side='buy' then requested_quantity else 0 end,case when requested_side='buy' then execution else 0 end,case when requested_side='sell' then (execution-coalesce(pos.average_cost,0))*requested_quantity-trade_fee else 0 end)
    on conflict(account_id,asset_id) do update set
      average_cost=case when requested_side='buy' then ((public.trading_positions.quantity*public.trading_positions.average_cost)+(requested_quantity*execution))/(public.trading_positions.quantity+requested_quantity) else public.trading_positions.average_cost end,
      quantity=public.trading_positions.quantity+case when requested_side='buy' then requested_quantity else -requested_quantity end,
      realised_pnl=public.trading_positions.realised_pnl+case when requested_side='sell' then (execution-public.trading_positions.average_cost)*requested_quantity-trade_fee else 0 end,updated_at=now();
    update public.trading_accounts set cash_balance=cash_balance+case when requested_side='buy' then -(notional+trade_fee) else notional-trade_fee end,updated_at=now() where id=acct.id;
  end if;
  insert into public.audit_events(actor_id,action,entity_type,entity_id,after_state) values(auth.uid(),'korvesta_spot_order','trading_order',result.id::text,to_jsonb(result));
  return result;
end $$;
grant execute on function public.place_korvesta_spot_order(uuid,public.order_side,text,numeric,numeric,numeric,text,boolean,numeric) to authenticated;

create or replace function public.place_korvesta_futures_order(
  asset uuid, requested_side public.order_side, requested_quantity numeric,
  market_price numeric, requested_leverage smallint, request_key text,
  fee_rate numeric default 0.0005
) returns public.trading_orders language plpgsql security definer set search_path='' as $$
declare acct public.trading_accounts; existing public.trading_orders; result public.trading_orders; pos public.futures_positions;
declare symbol text; signed_qty numeric; notional numeric; required_margin numeric; trade_fee numeric; new_qty numeric; new_entry numeric; release_margin numeric;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if requested_quantity<=0 or market_price<=0 or requested_leverage not between 1 and 20 then raise exception 'invalid futures order'; end if;
  select * into acct from public.ensure_trading_account('live'); perform pg_advisory_xact_lock(hashtextextended(acct.id::text,0));
  select * into existing from public.trading_orders where account_id=acct.id and idempotency_key=request_key; if found then return existing; end if;
  select a.symbol into symbol from public.assets a where a.id=asset and a.enabled; if symbol is null or symbol='USDT' then raise exception 'unsupported asset'; end if;
  signed_qty=case when requested_side='buy' then requested_quantity else -requested_quantity end; notional=requested_quantity*market_price; required_margin=notional/requested_leverage; trade_fee=notional*fee_rate;
  select * into pos from public.futures_positions where account_id=acct.id and asset_id=asset for update;
  if pos.account_id is null or pos.quantity=0 or sign(pos.quantity)=sign(signed_qty) then
    if acct.cash_balance < required_margin+trade_fee then raise exception 'insufficient futures collateral'; end if;
    new_qty=coalesce(pos.quantity,0)+signed_qty;
    new_entry=case when coalesce(pos.quantity,0)=0 then market_price else ((abs(pos.quantity)*pos.entry_price)+(requested_quantity*market_price))/abs(new_qty) end;
    update public.trading_accounts set cash_balance=cash_balance-required_margin-trade_fee,updated_at=now() where id=acct.id;
    insert into public.futures_positions(account_id,asset_id,quantity,entry_price,leverage,margin,liquidation_price)
    values(acct.id,asset,new_qty,new_entry,requested_leverage,required_margin,case when new_qty>0 then new_entry*(1-0.9/requested_leverage) else new_entry*(1+0.9/requested_leverage) end)
    on conflict(account_id,asset_id) do update set quantity=new_qty,entry_price=new_entry,leverage=requested_leverage,margin=public.futures_positions.margin+required_margin,liquidation_price=case when new_qty>0 then new_entry*(1-0.9/requested_leverage) else new_entry*(1+0.9/requested_leverage) end,updated_at=now();
  else
    if requested_quantity>abs(pos.quantity) then raise exception 'close the current position before reversing direction'; end if;
    release_margin=pos.margin*(requested_quantity/abs(pos.quantity)); new_qty=pos.quantity+signed_qty;
    update public.trading_accounts set cash_balance=cash_balance+release_margin+case when pos.quantity>0 then (market_price-pos.entry_price)*requested_quantity else (pos.entry_price-market_price)*requested_quantity end-trade_fee,updated_at=now() where id=acct.id;
    update public.futures_positions set quantity=new_qty,margin=margin-release_margin,realised_pnl=realised_pnl+case when pos.quantity>0 then (market_price-pos.entry_price)*requested_quantity else (pos.entry_price-market_price)*requested_quantity end,entry_price=case when new_qty=0 then 0 else entry_price end,liquidation_price=case when new_qty=0 then null else liquidation_price end,updated_at=now() where account_id=acct.id and asset_id=asset;
  end if;
  insert into public.trading_orders(account_id,asset_id,pair,side,order_type,quantity,fill_price,executed_quantity,fee,status,idempotency_key,provider,product,filled_at)
  values(acct.id,asset,symbol||'/USDT',requested_side,'market',requested_quantity,market_price,requested_quantity,trade_fee,'filled',request_key,'korvesta','futures',now()) returning * into result;
  return result;
end $$;
grant execute on function public.place_korvesta_futures_order(uuid,public.order_side,numeric,numeric,smallint,text,numeric) to authenticated;

create or replace function public.cancel_korvesta_order(order_id uuid) returns public.trading_orders language plpgsql security definer set search_path='' as $$
declare result public.trading_orders;
begin
 update public.trading_orders o set status='cancelled',cancelled_at=now() from public.trading_accounts a
 where o.id=order_id and o.account_id=a.id and a.user_id=auth.uid() and o.provider='korvesta' and o.status='open' returning o.* into result;
 if result.id is null then raise exception 'open order not found'; end if;
 return result;
end $$;
grant execute on function public.cancel_korvesta_order(uuid) to authenticated;

insert into public.assets(symbol,name,coingecko_id,decimals) values
 ('BND','Vanguard Total Bond Market ETF',null,4),('AGG','iShares Core US Aggregate Bond ETF',null,4),
 ('SPY','SPDR S&P 500 ETF Trust',null,4),('QQQ','Invesco QQQ Trust',null,4),
 ('AAPL','Apple',null,4),('MSFT','Microsoft',null,4),('NVDA','NVIDIA',null,4),('TSLA','Tesla',null,4)
on conflict(symbol) do nothing;
