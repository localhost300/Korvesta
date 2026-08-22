alter table public.trading_orders drop constraint if exists trading_orders_order_type_check;
alter table public.trading_orders add constraint trading_orders_order_type_check check(order_type in ('market','limit','stop_market','stop_limit'));
alter table public.trading_orders add column if not exists stop_price numeric(38,18) check(stop_price>0);
alter table public.trading_orders add column if not exists triggered_at timestamptz;

create or replace function public.place_paper_stop_order(asset uuid,requested_side public.order_side,requested_type text,requested_quantity numeric,requested_stop numeric,requested_limit numeric,market_price numeric,request_key text)
returns public.trading_orders language plpgsql security definer set search_path='' as $$
declare acct public.trading_accounts; result public.trading_orders; symbol text; pos public.trading_positions; reserved_asset numeric; reserved_cash numeric;
begin
 if auth.uid() is null then raise exception 'authentication required'; end if;
 if requested_type not in ('stop_market','stop_limit') or requested_quantity<=0 or requested_stop<=0 then raise exception 'invalid stop order'; end if;
 if requested_type='stop_limit' and coalesce(requested_limit,0)<=0 then raise exception 'positive limit price required'; end if;
 if requested_side='sell' and requested_stop>=market_price then raise exception 'sell stop must be below current price'; end if;
 if requested_side='buy' and requested_stop<=market_price then raise exception 'buy stop must be above current price'; end if;
 select * into acct from public.ensure_trading_account('paper'); perform pg_advisory_xact_lock(hashtextextended(acct.id::text,0));
 select a.symbol into symbol from public.assets a where a.id=asset and a.enabled; if symbol is null then raise exception 'unsupported asset'; end if;
 select * into pos from public.trading_positions where account_id=acct.id and asset_id=asset;
 select coalesce(sum(quantity),0) into reserved_asset from public.trading_orders where account_id=acct.id and asset_id=asset and side='sell' and status='open';
 select coalesce(sum(quantity*coalesce(limit_price,stop_price)*(1.001)),0) into reserved_cash from public.trading_orders where account_id=acct.id and side='buy' and status='open';
 if requested_side='sell' and requested_quantity>coalesce(pos.quantity,0)-reserved_asset then raise exception 'insufficient virtual asset balance'; end if;
 if requested_side='buy' and requested_quantity*coalesce(requested_limit,requested_stop)*1.001>acct.cash_balance-reserved_cash then raise exception 'insufficient virtual cash'; end if;
 insert into public.trading_orders(account_id,asset_id,pair,side,order_type,quantity,limit_price,stop_price,status,idempotency_key)
 values(acct.id,asset,symbol||'/USDT',requested_side,requested_type,requested_quantity,requested_limit,requested_stop,'open',request_key) returning * into result; return result;
end $$;

create or replace function public.process_paper_order(order_id uuid,market_price numeric,fee_rate numeric default 0.001)
returns public.trading_orders language plpgsql security definer set search_path='' as $$
declare o public.trading_orders; acct public.trading_accounts; pos public.trading_positions; execution numeric; notional numeric; trade_fee numeric; triggered boolean; fillable boolean;
begin
 if auth.role()<>'service_role' then raise exception 'service role required'; end if;
 select * into o from public.trading_orders where id=order_id and provider='paper' and status='open' for update; if o.id is null then raise exception 'open paper order not found'; end if;
 triggered=o.order_type='limit' or o.triggered_at is not null or (o.side='sell' and market_price<=o.stop_price) or (o.side='buy' and market_price>=o.stop_price);
 if not triggered then return o; end if;
 if o.order_type='stop_market' then execution=market_price; fillable=true; else execution=o.limit_price; fillable=(o.side='buy' and o.limit_price>=market_price) or (o.side='sell' and o.limit_price<=market_price); end if;
 if o.order_type like 'stop_%' and o.triggered_at is null then update public.trading_orders set triggered_at=now() where id=o.id returning * into o; end if;
 if not fillable then return o; end if;
 select * into acct from public.trading_accounts where id=o.account_id for update; select * into pos from public.trading_positions where account_id=o.account_id and asset_id=o.asset_id;
 notional=round(o.quantity*execution,18); trade_fee=round(notional*fee_rate,18);
 if o.side='buy' and notional+trade_fee>acct.cash_balance then update public.trading_orders set status='rejected',rejection_reason='insufficient balance at fill' where id=o.id returning * into o; return o; end if;
 if o.side='sell' and o.quantity>coalesce(pos.quantity,0) then update public.trading_orders set status='rejected',rejection_reason='insufficient position at fill' where id=o.id returning * into o; return o; end if;
 insert into public.trading_positions(account_id,asset_id,quantity,average_cost,realised_pnl) values(o.account_id,o.asset_id,case when o.side='buy' then o.quantity else 0 end,case when o.side='buy' then execution else 0 end,case when o.side='sell' then (execution-coalesce(pos.average_cost,0))*o.quantity-trade_fee else 0 end)
 on conflict(account_id,asset_id) do update set average_cost=case when o.side='buy' then ((public.trading_positions.quantity*public.trading_positions.average_cost)+(o.quantity*execution))/(public.trading_positions.quantity+o.quantity) else public.trading_positions.average_cost end,quantity=public.trading_positions.quantity+case when o.side='buy' then o.quantity else -o.quantity end,realised_pnl=public.trading_positions.realised_pnl+case when o.side='sell' then (execution-public.trading_positions.average_cost)*o.quantity-trade_fee else 0 end,updated_at=now();
 update public.trading_accounts set cash_balance=cash_balance+case when o.side='buy' then -(notional+trade_fee) else notional-trade_fee end,updated_at=now() where id=o.account_id;
 update public.trading_orders set status='filled',fill_price=execution,fee=trade_fee,filled_at=now() where id=o.id returning * into o; return o;
end $$;

grant execute on function public.place_paper_stop_order(uuid,public.order_side,text,numeric,numeric,numeric,numeric,text) to authenticated;
revoke all on function public.process_paper_order(uuid,numeric,numeric) from public;
grant execute on function public.process_paper_order(uuid,numeric,numeric) to service_role;

create or replace function public.record_live_order_v2(asset uuid,requested_side public.order_side,requested_type text,requested_quantity numeric,requested_limit numeric,requested_stop numeric,request_key text,provider_order_id text,provider_status text,provider_fill numeric,provider_fee numeric default 0)
returns public.trading_orders language plpgsql security definer set search_path='' as $$
declare acct public.trading_accounts; symbol text; result public.trading_orders;
begin
 select * into acct from public.ensure_trading_account('live'); select a.symbol into symbol from public.assets a where a.id=asset;
 insert into public.trading_orders(account_id,asset_id,pair,side,order_type,quantity,limit_price,stop_price,fill_price,fee,status,idempotency_key,provider,external_order_id,filled_at)
 values(acct.id,asset,symbol||'/USDT',requested_side,requested_type,requested_quantity,requested_limit,requested_stop,provider_fill,provider_fee,(case when provider_status='FILLED' then 'filled' when provider_status in ('REJECTED','EXPIRED') then 'rejected' else 'open' end)::public.order_status,request_key,'binance',provider_order_id,case when provider_status='FILLED' then now() end)
 on conflict(account_id,idempotency_key) do update set external_order_id=excluded.external_order_id returning * into result; return result;
end $$;
grant execute on function public.record_live_order_v2(uuid,public.order_side,text,numeric,numeric,numeric,text,text,text,numeric,numeric) to authenticated;
