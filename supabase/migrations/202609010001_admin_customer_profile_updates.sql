create or replace function public.update_customer_profile(
  customer_id uuid,
  requested_name text,
  requested_country text,
  note text
)
returns void language plpgsql security definer set search_path='' as $$
declare previous_profile public.profiles;
begin
  if not exists(select 1 from public.profiles where id=auth.uid() and role='admin') then
    raise exception 'administrator access required';
  end if;
  if length(trim(coalesce(requested_name, '')))<2 or length(trim(requested_name))>100 then
    raise exception 'full name must be between 2 and 100 characters';
  end if;
  if length(trim(coalesce(requested_country, '')))<2 or length(trim(requested_country))>80 then
    raise exception 'country must be between 2 and 80 characters';
  end if;
  if coalesce(trim(note),'')='' then raise exception 'an audit reason is required'; end if;

  select * into previous_profile from public.profiles where id=customer_id and role='customer' for update;
  if previous_profile.id is null then raise exception 'customer not found'; end if;

  update public.profiles
  set full_name=trim(requested_name), country=trim(requested_country), updated_at=now()
  where id=customer_id;

  insert into public.audit_events(actor_id,action,entity_type,entity_id,before_state,after_state)
  values(
    auth.uid(),
    'update_customer_profile',
    'profile',
    customer_id::text,
    jsonb_build_object('full_name',previous_profile.full_name,'country',previous_profile.country),
    jsonb_build_object('full_name',trim(requested_name),'country',trim(requested_country),'note',trim(note))
  );
end $$;

revoke all on function public.update_customer_profile(uuid,text,text,text) from public;
grant execute on function public.update_customer_profile(uuid,text,text,text) to authenticated;

create or replace function public.adjust_customer_balance(
  customer_id uuid,
  requested_amount numeric,
  adjustment_kind text,
  note text
)
returns void language plpgsql security definer set search_path='' as $$
declare asset uuid; customer_account uuid; clearing_account uuid; tx uuid; current_balance numeric; signed_amount numeric;
begin
  if not exists(select 1 from public.profiles where id=auth.uid() and role='admin') then raise exception 'administrator access required'; end if;
  if not exists(select 1 from public.profiles where id=customer_id and role='customer') then raise exception 'customer not found'; end if;
  if requested_amount is null or requested_amount<=0 then raise exception 'amount must be greater than zero'; end if;
  if adjustment_kind not in ('credit','debit') then raise exception 'invalid adjustment type'; end if;
  if coalesce(trim(note),'')='' then raise exception 'an audit reason is required'; end if;
  select id into asset from public.assets where symbol='USDT' and enabled;
  if asset is null then raise exception 'USDT asset is unavailable'; end if;
  insert into public.ledger_accounts(owner_id,asset_id,purpose) values(customer_id,asset,'customer_available') on conflict(owner_id,asset_id,purpose) do update set purpose=excluded.purpose returning id into customer_account;
  insert into public.ledger_accounts(owner_id,asset_id,purpose) values(null,asset,'platform_clearing') on conflict(owner_id,asset_id,purpose) do update set purpose=excluded.purpose returning id into clearing_account;
  perform pg_advisory_xact_lock(hashtextextended(customer_account::text,0));
  select coalesce(sum(amount),0) into current_balance from public.ledger_entries where account_id=customer_account;
  if adjustment_kind='debit' and current_balance<requested_amount then raise exception 'insufficient available USDT balance'; end if;
  signed_amount := case when adjustment_kind='credit' then requested_amount else -requested_amount end;
  insert into public.ledger_transactions(reference,kind,idempotency_key,created_by,metadata)
  values('ADM-'||gen_random_uuid(),'admin_balance_adjustment','admin-adjustment:'||gen_random_uuid(),auth.uid(),jsonb_build_object('customer_id',customer_id,'kind',adjustment_kind,'note',trim(note))) returning id into tx;
  insert into public.ledger_entries(transaction_id,account_id,amount) values(tx,customer_account,signed_amount),(tx,clearing_account,-signed_amount);
  insert into public.audit_events(actor_id,action,entity_type,entity_id,before_state,after_state)
  values(auth.uid(),'adjust_customer_balance','profile',customer_id::text,jsonb_build_object('usdt_balance',current_balance),jsonb_build_object('usdt_balance',current_balance+signed_amount,'amount',requested_amount,'kind',adjustment_kind,'note',trim(note)));
end $$;

revoke all on function public.adjust_customer_balance(uuid,numeric,text,text) from public;
grant execute on function public.adjust_customer_balance(uuid,numeric,text,text) to authenticated;
