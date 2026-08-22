-- Payment methods are controlled exclusively by staff. Hide the demo networks
-- without deleting historical rows that payment requests may reference.
alter table public.networks
add column if not exists deposit_address_encrypted text;
alter table public.networks
add column if not exists qr_code_path text;
alter table public.assets
add column if not exists logo_color text not null default '#64748b';

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('deposit-qr-codes','deposit-qr-codes',false,2097152,array['image/png','image/jpeg','image/webp'])
on conflict(id) do update set file_size_limit=excluded.file_size_limit, allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists deposit_qr_staff_manage on storage.objects;
drop policy if exists deposit_qr_authenticated_read on storage.objects;
create policy deposit_qr_staff_manage on storage.objects for all to authenticated
using(bucket_id='deposit-qr-codes' and public.is_staff())
with check(bucket_id='deposit-qr-codes' and public.is_staff());
create policy deposit_qr_authenticated_read on storage.objects for select to authenticated
using(bucket_id='deposit-qr-codes');

-- Remove all previously configured methods and plaintext addresses. Historical
-- network rows remain available for existing request foreign keys.
update public.networks
set enabled = false,
    deposit_address = null,
    deposit_address_encrypted = null,
    qr_code_path = null;

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.profiles where id=auth.uid() and role='admin')
$$;

drop policy if exists staff_assets_manage on public.assets;
drop policy if exists staff_networks_manage on public.networks;
create policy staff_assets_manage on public.assets for all
using (public.is_staff()) with check (public.is_staff());
create policy staff_networks_manage on public.networks for all
using (public.is_staff()) with check (public.is_staff());

create or replace function public.approve_withdrawal(request_id uuid, note text default null)
returns text language plpgsql security definer set search_path='' as $$
declare r public.withdrawal_requests; hold uuid; clearing uuid; fee_account uuid; tx uuid;
begin
  if not public.is_staff() then raise exception 'not authorised'; end if;
  select * into r from public.withdrawal_requests where id=request_id for update;
  if r.status <> 'pending' then raise exception 'request is not pending'; end if;
  select id into hold from public.ledger_accounts where owner_id=r.user_id and asset_id=r.asset_id and purpose='customer_hold';
  insert into public.ledger_accounts(owner_id,asset_id,purpose) values(null,r.asset_id,'platform_clearing') on conflict(owner_id,asset_id,purpose) do update set purpose=excluded.purpose returning id into clearing;
  insert into public.ledger_accounts(owner_id,asset_id,purpose) values(null,r.asset_id,'platform_fees') on conflict(owner_id,asset_id,purpose) do update set purpose=excluded.purpose returning id into fee_account;
  insert into public.ledger_transactions(reference,kind,idempotency_key,created_by,metadata) values('WDR-'||r.id,'withdrawal','withdrawal:'||r.id,auth.uid(),jsonb_build_object('request_id',r.id)) returning id into tx;
  insert into public.ledger_entries(transaction_id,account_id,amount) values(tx,hold,-(r.amount+r.fee)),(tx,clearing,r.amount),(tx,fee_account,r.fee);
  update public.withdrawal_requests set status='approved',first_approved_by=auth.uid(),second_approved_by=null,review_note=note,reviewed_at=now() where id=r.id;
  insert into public.audit_events(actor_id,action,entity_type,entity_id,after_state) values(auth.uid(),'approve','withdrawal',r.id::text,jsonb_build_object('amount',r.amount));
  return 'approved';
end $$;

create or replace function public.reject_payment(request_id uuid, payment_type text, note text)
returns void language plpgsql security definer set search_path='' as $$
declare r public.withdrawal_requests; available uuid; hold uuid; tx uuid;
begin
  if not public.is_staff() then raise exception 'not authorised'; end if;
  if length(trim(coalesce(note,''))) < 3 then raise exception 'rejection note is required'; end if;
  if payment_type = 'deposit' then
    update public.deposit_requests set status='rejected',review_note=note,reviewed_by=auth.uid(),reviewed_at=now() where id=request_id and status='pending';
    if not found then raise exception 'request is not pending'; end if;
  elsif payment_type = 'withdrawal' then
    select * into r from public.withdrawal_requests where id=request_id and status='pending' for update;
    if not found then raise exception 'request is not pending'; end if;
    select id into hold from public.ledger_accounts where owner_id=r.user_id and asset_id=r.asset_id and purpose='customer_hold';
    insert into public.ledger_accounts(owner_id,asset_id,purpose) values(r.user_id,r.asset_id,'customer_available') on conflict(owner_id,asset_id,purpose) do update set purpose=excluded.purpose returning id into available;
    insert into public.ledger_transactions(reference,kind,idempotency_key,created_by,metadata) values('REJ-'||r.id,'withdrawal_release','withdrawal-reject:'||r.id,auth.uid(),jsonb_build_object('request_id',r.id)) returning id into tx;
    insert into public.ledger_entries(transaction_id,account_id,amount) values(tx,hold,-(r.amount+r.fee)),(tx,available,r.amount+r.fee);
    update public.withdrawal_requests set status='rejected',review_note=note,first_approved_by=auth.uid(),reviewed_at=now() where id=r.id;
  else raise exception 'invalid payment type';
  end if;
  insert into public.audit_events(actor_id,action,entity_type,entity_id,after_state) values(auth.uid(),'reject',payment_type,request_id::text,jsonb_build_object('note',note));
end $$;

revoke all on function public.reject_payment(uuid,text,text) from public;
grant execute on function public.reject_payment(uuid,text,text) to authenticated;
