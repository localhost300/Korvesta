-- Add optional administrator-uploaded QR images without changing existing
-- deposit methods or wallet addresses.
alter table public.networks
add column if not exists qr_code_path text;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('deposit-qr-codes','deposit-qr-codes',false,2097152,array['image/png','image/jpeg','image/webp'])
on conflict(id) do update
set file_size_limit=excluded.file_size_limit,
    allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists deposit_qr_staff_manage on storage.objects;
drop policy if exists deposit_qr_authenticated_read on storage.objects;

create policy deposit_qr_staff_manage on storage.objects for all to authenticated
using(bucket_id='deposit-qr-codes' and public.is_staff())
with check(bucket_id='deposit-qr-codes' and public.is_staff());

create policy deposit_qr_authenticated_read on storage.objects for select to authenticated
using(bucket_id='deposit-qr-codes');
