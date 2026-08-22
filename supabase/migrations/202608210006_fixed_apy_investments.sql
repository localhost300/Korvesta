alter table public.ledger_accounts drop constraint if exists ledger_accounts_purpose_check;
alter table public.ledger_accounts add constraint ledger_accounts_purpose_check check(purpose in ('customer_available','customer_hold','customer_investment','platform_clearing','platform_fees','platform_investment_liability','demo'));

create table public.investment_plans(
 id uuid primary key default gen_random_uuid(), name text unique not null, description text not null default '',
 apy_bps integer not null check(apy_bps between 1 and 10000), duration_days integer not null check(duration_days between 1 and 3650),
 minimum_amount numeric(38,18) not null check(minimum_amount>0), maximum_amount numeric(38,18) check(maximum_amount>=minimum_amount),
 active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.investment_positions(
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles, plan_id uuid not null references public.investment_plans,
 asset_id uuid not null references public.assets, principal numeric(38,18) not null check(principal>0), apy_bps integer not null,
 accrued_return numeric(38,18) not null default 0 check(accrued_return>=0), status text not null default 'active' check(status in ('active','matured','redeemed')),
 started_on date not null default current_date, maturity_on date not null, last_accrual_date date not null default current_date,
 idempotency_key text not null, redeemed_at timestamptz, created_at timestamptz not null default now(), unique(user_id,idempotency_key)
);
create table public.investment_accruals(
 id bigint generated always as identity primary key, position_id uuid not null references public.investment_positions,
 accrual_date date not null, principal numeric(38,18) not null, apy_bps integer not null, amount numeric(38,18) not null check(amount>=0),
 created_at timestamptz not null default now(), unique(position_id,accrual_date)
);
alter table public.investment_plans enable row level security; alter table public.investment_positions enable row level security; alter table public.investment_accruals enable row level security;
create policy investment_plans_read on public.investment_plans for select using(active or public.is_staff());
create policy own_investment_positions on public.investment_positions for select using(user_id=auth.uid() or public.is_staff());
create policy own_investment_accruals on public.investment_accruals for select using(exists(select 1 from public.investment_positions p where p.id=position_id and (p.user_id=auth.uid() or public.is_staff())));

insert into public.investment_plans(name,description,apy_bps,duration_days,minimum_amount,maximum_amount) values
 ('Starter Fixed','Simple fixed APY accrued daily for 30 days.',550,30,100,10000),
 ('Growth Fixed','Simple fixed APY accrued daily for 90 days.',1080,90,1000,50000),
 ('Balanced Fixed','Simple fixed APY accrued daily for 180 days.',1540,180,2500,100000),
 ('Long-Term Fixed','Simple fixed APY accrued daily for 365 days.',2250,365,10000,250000)
on conflict(name) do nothing;

create or replace function public.subscribe_fixed_investment(requested_plan uuid,requested_amount numeric,request_key text)
returns public.investment_positions language plpgsql security definer set search_path='' as $$
declare plan public.investment_plans; usdt uuid; available uuid; invested uuid; balance numeric; tx uuid; result public.investment_positions;
begin
 if auth.uid() is null then raise exception 'authentication required'; end if;
 select * into result from public.investment_positions where user_id=auth.uid() and idempotency_key=request_key; if found then return result; end if;
 select * into plan from public.investment_plans where id=requested_plan and active for share; if plan.id is null then raise exception 'investment plan unavailable'; end if;
 if requested_amount<plan.minimum_amount or (plan.maximum_amount is not null and requested_amount>plan.maximum_amount) then raise exception 'amount outside plan limits'; end if;
 select id into usdt from public.assets where symbol='USDT' and enabled; select id into available from public.ledger_accounts where owner_id=auth.uid() and asset_id=usdt and purpose='customer_available' for update;
 select coalesce(sum(amount),0) into balance from public.ledger_entries where account_id=available; if balance<requested_amount then raise exception 'insufficient available USDT balance'; end if;
 insert into public.ledger_accounts(owner_id,asset_id,purpose) values(auth.uid(),usdt,'customer_investment') on conflict(owner_id,asset_id,purpose) do update set purpose=excluded.purpose returning id into invested;
 insert into public.investment_positions(user_id,plan_id,asset_id,principal,apy_bps,maturity_on,idempotency_key) values(auth.uid(),plan.id,usdt,requested_amount,plan.apy_bps,current_date+plan.duration_days,request_key) returning * into result;
 insert into public.ledger_transactions(reference,kind,idempotency_key,created_by,metadata) values('INV-'||result.id,'investment_subscription','investment:'||result.id,auth.uid(),jsonb_build_object('position_id',result.id)) returning id into tx;
 insert into public.ledger_entries(transaction_id,account_id,amount) values(tx,available,-requested_amount),(tx,invested,requested_amount); return result;
end $$;

create or replace function public.accrue_fixed_investments(run_date date default current_date)
returns table(positions_processed integer,total_accrued numeric) language plpgsql security definer set search_path='' as $$
declare p public.investment_positions; accrual numeric; days_count integer; usdt uuid; customer_account uuid; liability uuid; tx uuid; processed integer:=0; total numeric:=0;
begin
 if auth.role()<>'service_role' then raise exception 'service role required'; end if;
 for p in select * from public.investment_positions where status='active' and last_accrual_date<least(run_date,maturity_on) for update skip locked loop
   days_count=least(run_date,p.maturity_on)-p.last_accrual_date; accrual=round(p.principal*p.apy_bps/10000/365*days_count,18);
   insert into public.investment_accruals(position_id,accrual_date,principal,apy_bps,amount)
   select p.id,d,p.principal,p.apy_bps,round(p.principal*p.apy_bps/10000/365,18) from generate_series(p.last_accrual_date+1,least(run_date,p.maturity_on),interval '1 day') d on conflict do nothing;
   select id into customer_account from public.ledger_accounts where owner_id=p.user_id and asset_id=p.asset_id and purpose='customer_investment';
   insert into public.ledger_accounts(owner_id,asset_id,purpose) values(null,p.asset_id,'platform_investment_liability') on conflict(owner_id,asset_id,purpose) do update set purpose=excluded.purpose returning id into liability;
   insert into public.ledger_transactions(reference,kind,idempotency_key,metadata) values('ROI-'||p.id||'-'||least(run_date,p.maturity_on),'investment_accrual','investment-accrual:'||p.id||':'||least(run_date,p.maturity_on),jsonb_build_object('position_id',p.id,'days',days_count)) returning id into tx;
   insert into public.ledger_entries(transaction_id,account_id,amount) values(tx,customer_account,accrual),(tx,liability,-accrual);
   update public.investment_positions set accrued_return=accrued_return+accrual,last_accrual_date=least(run_date,maturity_on),status=case when run_date>=maturity_on then 'matured' else status end where id=p.id;
   processed=processed+1; total=total+accrual;
 end loop; return query select processed,total;
end $$;

create or replace function public.redeem_fixed_investment(position_id uuid,request_key text)
returns void language plpgsql security definer set search_path='' as $$
declare p public.investment_positions; available uuid; invested uuid; tx uuid; amount numeric;
begin
 select * into p from public.investment_positions where id=position_id and user_id=auth.uid() for update; if p.id is null then raise exception 'position not found'; end if;
 if p.status<>'matured' then raise exception 'investment has not matured'; end if; amount=p.principal+p.accrued_return;
 select id into available from public.ledger_accounts where owner_id=auth.uid() and asset_id=p.asset_id and purpose='customer_available'; select id into invested from public.ledger_accounts where owner_id=auth.uid() and asset_id=p.asset_id and purpose='customer_investment';
 insert into public.ledger_transactions(reference,kind,idempotency_key,created_by,metadata) values('RED-'||p.id,'investment_redemption',request_key,auth.uid(),jsonb_build_object('position_id',p.id)) returning id into tx;
 insert into public.ledger_entries(transaction_id,account_id,amount) values(tx,invested,-amount),(tx,available,amount); update public.investment_positions set status='redeemed',redeemed_at=now() where id=p.id;
end $$;
grant execute on function public.subscribe_fixed_investment(uuid,numeric,text) to authenticated;
revoke all on function public.accrue_fixed_investments(date) from public; grant execute on function public.accrue_fixed_investments(date) to service_role;
grant execute on function public.redeem_fixed_investment(uuid,text) to authenticated;
