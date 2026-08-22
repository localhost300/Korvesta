alter table public.profiles
  add column if not exists account_status text not null default 'active'
    check(account_status in ('active','restricted','suspended')),
  add column if not exists kyc_status text not null default 'unverified'
    check(kyc_status in ('unverified','pending','verified','rejected'));

create table if not exists public.security_rate_limits(
  scope text not null,
  key_hash text not null,
  window_started_at timestamptz not null,
  request_count integer not null default 0 check(request_count>=0),
  primary key(scope,key_hash)
);
alter table public.security_rate_limits enable row level security;

create table if not exists public.security_events(
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles on delete set null,
  event_type text not null,
  ip_hash text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);
alter table public.security_events enable row level security;
create policy security_events_own_read on public.security_events for select
using(user_id=auth.uid() or public.is_staff());

create or replace function public.consume_rate_limit(
  requested_scope text, requested_key_hash text, maximum_requests integer, window_seconds integer
) returns boolean language plpgsql security definer set search_path='' as $$
declare current_count integer;
begin
  if auth.role()<>'service_role' then raise exception 'service role required'; end if;
  if maximum_requests<1 or window_seconds<1 then raise exception 'invalid rate limit'; end if;
  insert into public.security_rate_limits(scope,key_hash,window_started_at,request_count)
  values(requested_scope,requested_key_hash,now(),1)
  on conflict(scope,key_hash) do update set
    window_started_at=case when public.security_rate_limits.window_started_at<=now()-make_interval(secs=>window_seconds) then now() else public.security_rate_limits.window_started_at end,
    request_count=case when public.security_rate_limits.window_started_at<=now()-make_interval(secs=>window_seconds) then 1 else public.security_rate_limits.request_count+1 end
  returning request_count into current_count;
  return current_count<=maximum_requests;
end $$;
revoke all on function public.consume_rate_limit(text,text,integer,integer) from public;
grant execute on function public.consume_rate_limit(text,text,integer,integer) to service_role;

create or replace function public.create_withdrawal(asset uuid,network uuid,amount numeric,fee numeric,destination text,request_key text)
returns uuid language plpgsql security definer set search_path='' as $$
declare available uuid; hold uuid; clearing uuid; balance numeric; tx uuid; request_id uuid; profile public.profiles;
begin
 if auth.uid() is null then raise exception 'authentication required'; end if;
 select * into profile from public.profiles where id=auth.uid();
 if profile.account_status<>'active' then raise exception 'account is not permitted to withdraw'; end if;
 if profile.kyc_status<>'verified' then raise exception 'identity verification is required before withdrawal'; end if;
 if amount<=0 or fee<0 then raise exception 'invalid amount'; end if;
 if not exists(select 1 from public.networks n where n.id=network and n.asset_id=asset and n.enabled) then raise exception 'invalid asset network'; end if;
 select id into available from public.ledger_accounts where owner_id=auth.uid() and asset_id=asset and purpose='customer_available';
 select coalesce(sum(e.amount),0) into balance from public.ledger_entries e where e.account_id=available;
 if balance<amount+fee then raise exception 'insufficient available balance'; end if;
 insert into public.ledger_accounts(owner_id,asset_id,purpose) values(auth.uid(),asset,'customer_hold') on conflict(owner_id,asset_id,purpose) do update set purpose=excluded.purpose returning id into hold;
 insert into public.ledger_accounts(owner_id,asset_id,purpose) values(null,asset,'platform_clearing') on conflict(owner_id,asset_id,purpose) do update set purpose=excluded.purpose returning id into clearing;
 insert into public.withdrawal_requests(user_id,asset_id,network_id,amount,fee,destination) values(auth.uid(),asset,network,amount,fee,destination) returning id into request_id;
 insert into public.ledger_transactions(reference,kind,idempotency_key,created_by,metadata) values('HOLD-'||request_id,'withdrawal_hold',request_key,auth.uid(),jsonb_build_object('request_id',request_id)) returning id into tx;
 insert into public.ledger_entries(transaction_id,account_id,amount) values(tx,available,-(amount+fee)),(tx,hold,amount+fee);
 insert into public.security_events(user_id,event_type,metadata) values(auth.uid(),'withdrawal_requested',jsonb_build_object('request_id',request_id,'asset_id',asset,'amount',amount));
 return request_id;
end $$;
grant execute on function public.create_withdrawal(uuid,uuid,numeric,numeric,text,text) to authenticated;
