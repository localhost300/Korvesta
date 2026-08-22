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

grant execute on function public.place_paper_order(
  uuid,public.order_side,text,numeric,numeric,numeric,text,numeric
) to authenticated;
