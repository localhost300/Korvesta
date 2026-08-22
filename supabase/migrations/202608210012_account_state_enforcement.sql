create or replace function public.require_active_customer_write()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 if auth.role()='authenticated' and not exists(
   select 1 from public.profiles where id=auth.uid() and role='customer' and account_status='active'
 ) then raise exception 'account is not permitted to perform this action'; end if;
 return new;
end $$;

create trigger active_customer_deposit before insert on public.deposit_requests
for each row execute function public.require_active_customer_write();
create trigger active_customer_trading_order before insert on public.trading_orders
for each row execute function public.require_active_customer_write();
create trigger active_customer_investment before insert on public.investment_positions
for each row execute function public.require_active_customer_write();

create or replace function public.update_own_profile(requested_name text,requested_country text)
returns public.profiles language plpgsql security definer set search_path='' as $$
declare result public.profiles;
begin
 if auth.uid() is null then raise exception 'authentication required'; end if;
 if not exists(select 1 from public.profiles where id=auth.uid() and role='customer' and account_status='active') then raise exception 'account is not permitted to update its profile'; end if;
 if length(trim(requested_name))<2 or length(trim(requested_name))>100 then raise exception 'invalid full name'; end if;
 if length(trim(requested_country))<2 or length(trim(requested_country))>80 then raise exception 'invalid country'; end if;
 update public.profiles set full_name=trim(requested_name),country=trim(requested_country),updated_at=now() where id=auth.uid() returning * into result;
 insert into public.security_events(user_id,event_type) values(auth.uid(),'profile_updated');
 return result;
end $$;
revoke all on function public.update_own_profile(text,text) from public;
grant execute on function public.update_own_profile(text,text) to authenticated;

create or replace function public.redeem_fixed_investment(position_id uuid,request_key text)
returns void language plpgsql security definer set search_path='' as $$
declare p public.investment_positions; available uuid; invested uuid; tx uuid; amount numeric;
begin
 if not exists(select 1 from public.profiles where id=auth.uid() and role='customer' and account_status='active') then raise exception 'account is not permitted to redeem investments'; end if;
 select * into p from public.investment_positions where id=position_id and user_id=auth.uid() for update;
 if p.id is null then raise exception 'position not found'; end if;
 if p.status<>'matured' then raise exception 'investment has not matured'; end if;
 amount=p.principal+p.accrued_return;
 select id into available from public.ledger_accounts where owner_id=auth.uid() and asset_id=p.asset_id and purpose='customer_available';
 select id into invested from public.ledger_accounts where owner_id=auth.uid() and asset_id=p.asset_id and purpose='customer_investment';
 insert into public.ledger_transactions(reference,kind,idempotency_key,created_by,metadata) values('RED-'||p.id,'investment_redemption',request_key,auth.uid(),jsonb_build_object('position_id',p.id)) returning id into tx;
 insert into public.ledger_entries(transaction_id,account_id,amount) values(tx,invested,-amount),(tx,available,amount);
 update public.investment_positions set status='redeemed',redeemed_at=now() where id=p.id;
end $$;
grant execute on function public.redeem_fixed_investment(uuid,text) to authenticated;
