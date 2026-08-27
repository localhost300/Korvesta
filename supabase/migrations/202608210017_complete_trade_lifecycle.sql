create table if not exists public.futures_wallets(
 user_id uuid primary key references public.profiles on delete cascade,
 cash_balance numeric(38,18) not null default 0 check(cash_balance>=0),
 updated_at timestamptz not null default now()
);
alter table public.futures_wallets enable row level security;
create policy own_futures_wallet on public.futures_wallets for select using(user_id=auth.uid() or public.is_staff());

alter table public.futures_positions add column if not exists stop_loss numeric(38,18) check(stop_loss>0);
alter table public.futures_positions add column if not exists take_profit numeric(38,18) check(take_profit>0);

create table if not exists public.futures_funding_payments(
 id bigint generated always as identity primary key,
 account_id uuid not null references public.trading_accounts on delete cascade,
 asset_id uuid not null references public.assets,
 position_quantity numeric(38,18) not null,
 mark_price numeric(38,18) not null,
 rate_bps numeric(18,8) not null,
 amount numeric(38,18) not null,
 funded_at timestamptz not null default now()
);
alter table public.futures_funding_payments enable row level security;
create policy own_futures_funding on public.futures_funding_payments for select using(exists(select 1 from public.trading_accounts a where a.id=account_id and (a.user_id=auth.uid() or public.is_staff())));

create or replace function public.ensure_futures_wallet() returns public.futures_wallets language plpgsql security definer set search_path='' as $$
declare result public.futures_wallets;
begin
 if auth.uid() is null then raise exception 'authentication required'; end if;
 insert into public.futures_wallets(user_id) values(auth.uid()) on conflict(user_id) do update set updated_at=public.futures_wallets.updated_at returning * into result;
 return result;
end $$;
grant execute on function public.ensure_futures_wallet() to authenticated;

create or replace function public.place_korvesta_futures_order(
  asset uuid, requested_side public.order_side, requested_quantity numeric,
  market_price numeric, requested_leverage smallint, request_key text,
  fee_rate numeric default 0.0005
) returns public.trading_orders language plpgsql security definer set search_path='' as $$
declare acct public.trading_accounts; wallet public.futures_wallets; existing public.trading_orders; result public.trading_orders; pos public.futures_positions;
declare symbol text; signed_qty numeric; notional numeric; required_margin numeric; trade_fee numeric; new_qty numeric; new_entry numeric; release_margin numeric; realised numeric;
begin
 if auth.uid() is null then raise exception 'authentication required'; end if;
 if requested_quantity<=0 or market_price<=0 or requested_leverage not between 1 and 20 then raise exception 'invalid futures order'; end if;
 select * into acct from public.ensure_trading_account('live'); select * into wallet from public.ensure_futures_wallet(); perform pg_advisory_xact_lock(hashtextextended(acct.id::text,0));
 select * into existing from public.trading_orders where account_id=acct.id and idempotency_key=request_key; if found then return existing; end if;
 select a.symbol into symbol from public.assets a where a.id=asset and a.enabled; if symbol is null or symbol='USDT' then raise exception 'unsupported asset'; end if;
 signed_qty=case when requested_side='buy' then requested_quantity else -requested_quantity end; notional=requested_quantity*market_price; required_margin=notional/requested_leverage; trade_fee=notional*fee_rate;
 select * into pos from public.futures_positions where account_id=acct.id and asset_id=asset for update;
 if pos.account_id is null or pos.quantity=0 or sign(pos.quantity)=sign(signed_qty) then
   if wallet.cash_balance < required_margin+trade_fee then raise exception 'insufficient futures collateral'; end if;
   new_qty=coalesce(pos.quantity,0)+signed_qty; new_entry=case when coalesce(pos.quantity,0)=0 then market_price else ((abs(pos.quantity)*pos.entry_price)+(requested_quantity*market_price))/abs(new_qty) end;
   update public.futures_wallets set cash_balance=cash_balance-required_margin-trade_fee,updated_at=now() where user_id=auth.uid();
   insert into public.futures_positions(account_id,asset_id,quantity,entry_price,leverage,margin,liquidation_price)
   values(acct.id,asset,new_qty,new_entry,requested_leverage,required_margin,case when new_qty>0 then new_entry*(1-0.9/requested_leverage) else new_entry*(1+0.9/requested_leverage) end)
   on conflict(account_id,asset_id) do update set quantity=new_qty,entry_price=new_entry,leverage=requested_leverage,margin=public.futures_positions.margin+required_margin,liquidation_price=case when new_qty>0 then new_entry*(1-0.9/requested_leverage) else new_entry*(1+0.9/requested_leverage) end,updated_at=now();
 else
   if requested_quantity>abs(pos.quantity) then raise exception 'close the current position before reversing direction'; end if;
   release_margin=pos.margin*(requested_quantity/abs(pos.quantity)); new_qty=pos.quantity+signed_qty; realised=case when pos.quantity>0 then (market_price-pos.entry_price)*requested_quantity else (pos.entry_price-market_price)*requested_quantity end;
   update public.futures_wallets set cash_balance=greatest(cash_balance+release_margin+realised-trade_fee,0),updated_at=now() where user_id=auth.uid();
   update public.futures_positions set quantity=new_qty,margin=margin-release_margin,realised_pnl=realised_pnl+realised-trade_fee,entry_price=case when new_qty=0 then 0 else entry_price end,liquidation_price=case when new_qty=0 then null else liquidation_price end,stop_loss=case when new_qty=0 then null else stop_loss end,take_profit=case when new_qty=0 then null else take_profit end,updated_at=now() where account_id=acct.id and asset_id=asset;
 end if;
 insert into public.trading_orders(account_id,asset_id,pair,side,order_type,quantity,fill_price,executed_quantity,fee,status,idempotency_key,provider,product,filled_at)
 values(acct.id,asset,symbol||'/USDT',requested_side,'market',requested_quantity,market_price,requested_quantity,trade_fee,'filled',request_key,'korvesta','futures',now()) returning * into result;
 return result;
end $$;

create or replace function public.transfer_wallet_spot(requested_direction text, requested_amount numeric, request_key text) returns numeric language plpgsql security definer set search_path='' as $$
declare acct public.trading_accounts; usdt uuid; available uuid; clearing uuid; ledger_balance numeric; tx uuid;
begin
 if auth.uid() is null then raise exception 'authentication required'; end if;
 if requested_direction not in ('wallet_to_spot','spot_to_wallet') or requested_amount<=0 then raise exception 'invalid transfer'; end if;
 if exists(select 1 from public.ledger_transactions where idempotency_key=request_key) then select * into acct from public.ensure_trading_account('live'); return acct.cash_balance; end if;
 select id into usdt from public.assets where symbol='USDT' and enabled;
 insert into public.ledger_accounts(owner_id,asset_id,purpose) values(auth.uid(),usdt,'customer_available') on conflict(owner_id,asset_id,purpose) do update set purpose=excluded.purpose returning id into available;
 insert into public.ledger_accounts(owner_id,asset_id,purpose) values(null,usdt,'platform_clearing') on conflict(owner_id,asset_id,purpose) do update set purpose=excluded.purpose returning id into clearing;
 select coalesce(sum(amount),0) into ledger_balance from public.ledger_entries where account_id=available;
 select * into acct from public.ensure_trading_account('live'); perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 if requested_direction='wallet_to_spot' and ledger_balance<requested_amount then raise exception 'insufficient wallet balance'; end if;
 if requested_direction='spot_to_wallet' and acct.cash_balance<requested_amount then raise exception 'insufficient spot balance'; end if;
 insert into public.ledger_transactions(reference,kind,idempotency_key,created_by,metadata) values('TRF-'||gen_random_uuid(),requested_direction,request_key,auth.uid(),jsonb_build_object('amount',requested_amount)) returning id into tx;
 insert into public.ledger_entries(transaction_id,account_id,amount) values(tx,available,case when requested_direction='wallet_to_spot' then -requested_amount else requested_amount end),(tx,clearing,case when requested_direction='wallet_to_spot' then requested_amount else -requested_amount end);
 update public.trading_accounts set cash_balance=cash_balance+case when requested_direction='wallet_to_spot' then requested_amount else -requested_amount end,updated_at=now() where id=acct.id returning cash_balance into ledger_balance;
 return ledger_balance;
end $$;
grant execute on function public.transfer_wallet_spot(text,numeric,text) to authenticated;

create or replace function public.transfer_spot_futures(requested_direction text, requested_amount numeric) returns numeric language plpgsql security definer set search_path='' as $$
declare acct public.trading_accounts; wallet public.futures_wallets;
begin
 if auth.uid() is null then raise exception 'authentication required'; end if;
 if requested_direction not in ('spot_to_futures','futures_to_spot') or requested_amount<=0 then raise exception 'invalid transfer'; end if;
 select * into acct from public.ensure_trading_account('live'); select * into wallet from public.ensure_futures_wallet(); perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 if requested_direction='spot_to_futures' and acct.cash_balance<requested_amount then raise exception 'insufficient spot balance'; end if;
 if requested_direction='futures_to_spot' and wallet.cash_balance<requested_amount then raise exception 'insufficient futures balance'; end if;
 update public.trading_accounts set cash_balance=cash_balance+case when requested_direction='spot_to_futures' then -requested_amount else requested_amount end,updated_at=now() where id=acct.id;
 update public.futures_wallets set cash_balance=cash_balance+case when requested_direction='spot_to_futures' then requested_amount else -requested_amount end,updated_at=now() where user_id=auth.uid() returning cash_balance into wallet.cash_balance;
 insert into public.audit_events(actor_id,action,entity_type,entity_id,after_state) values(auth.uid(),requested_direction,'futures_wallet',auth.uid()::text,jsonb_build_object('amount',requested_amount));
 return wallet.cash_balance;
end $$;
grant execute on function public.transfer_spot_futures(text,numeric) to authenticated;

create or replace function public.set_futures_risk(asset uuid, requested_stop numeric, requested_take numeric) returns public.futures_positions language plpgsql security definer set search_path='' as $$
declare result public.futures_positions;
begin
 update public.futures_positions p set stop_loss=requested_stop,take_profit=requested_take,updated_at=now() from public.trading_accounts a where p.account_id=a.id and p.asset_id=asset and a.user_id=auth.uid() and p.quantity<>0 returning p.* into result;
 if result.account_id is null then raise exception 'open futures position not found'; end if;
 if result.quantity>0 and ((requested_stop is not null and requested_stop>=result.entry_price) or (requested_take is not null and requested_take<=result.entry_price)) then raise exception 'invalid long stop or take-profit'; end if;
 if result.quantity<0 and ((requested_stop is not null and requested_stop<=result.entry_price) or (requested_take is not null and requested_take>=result.entry_price)) then raise exception 'invalid short stop or take-profit'; end if;
 return result;
end $$;
grant execute on function public.set_futures_risk(uuid,numeric,numeric) to authenticated;

create or replace function public.settle_futures_position(requested_account uuid, requested_asset uuid, mark_price numeric, close_reason text, fee_rate numeric default 0.0005) returns numeric language plpgsql security definer set search_path='' as $$
declare pos public.futures_positions; acct public.trading_accounts; pnl numeric; fee numeric; credit numeric;
begin
 select * into acct from public.trading_accounts where id=requested_account;
 if not (auth.role()='service_role' or acct.user_id=auth.uid()) then raise exception 'not authorised'; end if;
 select * into pos from public.futures_positions where account_id=requested_account and asset_id=requested_asset and quantity<>0 for update;
 if pos.account_id is null then raise exception 'open futures position not found'; end if;
 pnl=case when pos.quantity>0 then (mark_price-pos.entry_price)*abs(pos.quantity) else (pos.entry_price-mark_price)*abs(pos.quantity) end;
 fee=abs(pos.quantity)*mark_price*fee_rate; credit=greatest(pos.margin+pnl-fee,0);
 insert into public.futures_wallets(user_id,cash_balance) values(acct.user_id,credit) on conflict(user_id) do update set cash_balance=public.futures_wallets.cash_balance+credit,updated_at=now();
 update public.futures_positions set quantity=0,entry_price=0,margin=0,realised_pnl=realised_pnl+pnl-fee,liquidation_price=null,stop_loss=null,take_profit=null,updated_at=now() where account_id=requested_account and asset_id=requested_asset;
 insert into public.audit_events(actor_id,action,entity_type,entity_id,after_state) values(acct.user_id,'futures_'||close_reason,'futures_position',requested_account::text,jsonb_build_object('asset',requested_asset,'mark',mark_price,'pnl',pnl,'fee',fee));
 return pnl-fee;
end $$;
grant execute on function public.settle_futures_position(uuid,uuid,numeric,text,numeric) to authenticated,service_role;

create or replace function public.process_korvesta_limit_order(order_id uuid, market_price numeric, fee_rate numeric default 0.001) returns public.trading_orders language plpgsql security definer set search_path='' as $$
declare o public.trading_orders; acct public.trading_accounts; pos public.trading_positions; execution numeric; notional numeric; trade_fee numeric;
begin
 if auth.role()<>'service_role' then raise exception 'service role required'; end if;
 select * into o from public.trading_orders where id=order_id and provider='korvesta' and product in ('spot','demo') and status='open' for update;
 if o.id is null then raise exception 'open Korvesta order not found'; end if;
 if not ((o.side='buy' and o.limit_price>=market_price) or (o.side='sell' and o.limit_price<=market_price)) then return o; end if;
 select * into acct from public.trading_accounts where id=o.account_id for update; select * into pos from public.trading_positions where account_id=o.account_id and asset_id=o.asset_id;
 execution=o.limit_price; notional=o.quantity*execution; trade_fee=notional*fee_rate;
 if o.side='buy' and notional+trade_fee>acct.cash_balance then update public.trading_orders set status='rejected',rejection_reason='insufficient balance at fill' where id=o.id returning * into o; return o; end if;
 if o.side='sell' and o.quantity>coalesce(pos.quantity,0) then update public.trading_orders set status='rejected',rejection_reason='insufficient position at fill' where id=o.id returning * into o; return o; end if;
 insert into public.trading_positions(account_id,asset_id,quantity,average_cost,realised_pnl) values(o.account_id,o.asset_id,case when o.side='buy' then o.quantity else 0 end,case when o.side='buy' then execution else 0 end,case when o.side='sell' then (execution-coalesce(pos.average_cost,0))*o.quantity-trade_fee else 0 end)
 on conflict(account_id,asset_id) do update set average_cost=case when o.side='buy' then ((public.trading_positions.quantity*public.trading_positions.average_cost)+(o.quantity*execution))/(public.trading_positions.quantity+o.quantity) else public.trading_positions.average_cost end,quantity=public.trading_positions.quantity+case when o.side='buy' then o.quantity else -o.quantity end,realised_pnl=public.trading_positions.realised_pnl+case when o.side='sell' then (execution-public.trading_positions.average_cost)*o.quantity-trade_fee else 0 end,updated_at=now();
 update public.trading_accounts set cash_balance=cash_balance+case when o.side='buy' then -(notional+trade_fee) else notional-trade_fee end,updated_at=now() where id=o.account_id;
 update public.trading_orders set status='filled',fill_price=execution,executed_quantity=quantity,fee=trade_fee,filled_at=now() where id=o.id returning * into o; return o;
end $$;
revoke all on function public.process_korvesta_limit_order(uuid,numeric,numeric) from public;
grant execute on function public.process_korvesta_limit_order(uuid,numeric,numeric) to service_role;

create or replace function public.process_futures_funding(requested_asset uuid, mark_price numeric, rate_bps numeric) returns integer language plpgsql security definer set search_path='' as $$
declare pos record; payment numeric; processed integer:=0;
begin
 if auth.role()<>'service_role' then raise exception 'service role required'; end if;
 for pos in select p.*,a.user_id from public.futures_positions p join public.trading_accounts a on a.id=p.account_id where p.asset_id=requested_asset and p.quantity<>0 for update skip locked loop
   payment=round(abs(pos.quantity)*mark_price*rate_bps/10000*case when pos.quantity>0 then -1 else 1 end,18);
   update public.futures_wallets set cash_balance=greatest(cash_balance+payment,0),updated_at=now() where user_id=pos.user_id;
   insert into public.futures_funding_payments(account_id,asset_id,position_quantity,mark_price,rate_bps,amount) values(pos.account_id,requested_asset,pos.quantity,mark_price,rate_bps,payment);
   processed=processed+1;
 end loop;
 return processed;
end $$;
revoke all on function public.process_futures_funding(uuid,numeric,numeric) from public;
grant execute on function public.process_futures_funding(uuid,numeric,numeric) to service_role;
