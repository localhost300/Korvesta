alter table public.trading_orders add column if not exists executed_quantity numeric(38,18) not null default 0;
alter table public.trading_orders add column if not exists provider_updated_at timestamptz;

create table if not exists public.trading_execution_attempts(
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles,
 idempotency_key text not null, pair text not null, request jsonb not null,
 state text not null check(state in ('prepared','submitting','submitted','recorded','failed','unknown')),
 external_order_id text, error text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(user_id,idempotency_key)
);
alter table public.trading_execution_attempts enable row level security;
create policy own_execution_attempts on public.trading_execution_attempts for select using(user_id=auth.uid() or public.is_staff());

create or replace function public.prepare_live_execution(request_key text,requested_pair text,request_payload jsonb)
returns public.trading_execution_attempts language plpgsql security definer set search_path='' as $$
declare result public.trading_execution_attempts; begin
 insert into public.trading_execution_attempts(user_id,idempotency_key,pair,request,state) values(auth.uid(),request_key,requested_pair,request_payload,'prepared')
 on conflict(user_id,idempotency_key) do update set updated_at=public.trading_execution_attempts.updated_at returning * into result; return result;
end $$;
grant execute on function public.prepare_live_execution(text,text,jsonb) to authenticated;

create or replace function public.claim_live_execution(request_key text) returns boolean language plpgsql security definer set search_path='' as $$ begin
 update public.trading_execution_attempts set state='submitting',updated_at=now() where user_id=auth.uid() and idempotency_key=request_key and state='prepared'; return found;
end $$;
grant execute on function public.claim_live_execution(text) to authenticated;

create or replace function public.mark_live_execution(request_key text,next_state text,provider_order_id text default null,error_message text default null)
returns void language plpgsql security definer set search_path='' as $$ begin
 if next_state not in ('submitted','recorded','failed','unknown') then raise exception 'invalid execution state'; end if;
 update public.trading_execution_attempts set state=next_state,external_order_id=coalesce(provider_order_id,external_order_id),error=error_message,updated_at=now() where user_id=auth.uid() and idempotency_key=request_key;
 if not found then raise exception 'execution attempt not found'; end if;
end $$;
grant execute on function public.mark_live_execution(text,text,text,text) to authenticated;

create or replace function public.set_live_order_cancelled(order_id uuid)
returns void language plpgsql security definer set search_path='' as $$ begin
 update public.trading_orders o set status='cancelled',cancelled_at=now(),provider_updated_at=now() from public.trading_accounts a
 where o.id=order_id and o.account_id=a.id and a.user_id=auth.uid() and o.provider='binance';
 if not found then raise exception 'live order not found'; end if;
end $$;
grant execute on function public.set_live_order_cancelled(uuid) to authenticated;
