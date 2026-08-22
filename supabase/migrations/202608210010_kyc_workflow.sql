create table public.kyc_submissions(
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles on delete cascade,
 legal_name text not null, date_of_birth date not null, country text not null, address text not null,
 document_type text not null check(document_type in ('passport','national_id','drivers_license')),
 document_front_path text not null, document_back_path text, selfie_path text not null,
 status text not null default 'pending' check(status in ('pending','approved','rejected','resubmission')),
 review_note text, reviewed_by uuid references public.profiles, reviewed_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index one_open_kyc_submission on public.kyc_submissions(user_id) where status='pending';
alter table public.kyc_submissions enable row level security;
create policy own_kyc_read on public.kyc_submissions for select using(user_id=auth.uid() or public.is_staff());
create policy own_kyc_create on public.kyc_submissions for insert with check(user_id=auth.uid() and status='pending');
create or replace function public.mark_kyc_pending() returns trigger language plpgsql security definer set search_path='' as $$
begin update public.profiles set kyc_status='pending' where id=new.user_id; return new; end $$;
create trigger on_kyc_submission_created after insert on public.kyc_submissions for each row execute function public.mark_kyc_pending();

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('kyc-documents','kyc-documents',false,10485760,array['image/png','image/jpeg','application/pdf'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy kyc_document_upload on storage.objects for insert to authenticated
with check(bucket_id='kyc-documents' and (storage.foldername(name))[1]=auth.uid()::text);
create policy kyc_document_read on storage.objects for select to authenticated
using(bucket_id='kyc-documents' and ((storage.foldername(name))[1]=auth.uid()::text or public.is_staff()));

create or replace function public.decide_kyc(submission_id uuid,decision text,note text default null)
returns void language plpgsql security definer set search_path='' as $$
declare submission public.kyc_submissions;
begin
 if not public.is_staff() then raise exception 'not authorised'; end if;
 if decision not in ('approved','rejected','resubmission') then raise exception 'invalid decision'; end if;
 if decision<>'approved' and coalesce(trim(note),'')='' then raise exception 'a review note is required'; end if;
 select * into submission from public.kyc_submissions where id=submission_id for update;
 if submission.id is null or submission.status<>'pending' then raise exception 'pending submission not found'; end if;
 update public.kyc_submissions set status=decision,review_note=note,reviewed_by=auth.uid(),reviewed_at=now(),updated_at=now() where id=submission.id;
 update public.profiles set kyc_status=case decision when 'approved' then 'verified' when 'rejected' then 'rejected' else 'unverified' end where id=submission.user_id;
 insert into public.audit_events(actor_id,action,entity_type,entity_id,after_state) values(auth.uid(),'kyc_'||decision,'kyc_submission',submission.id::text,jsonb_build_object('decision',decision,'note',note));
 insert into public.security_events(user_id,event_type,metadata) values(submission.user_id,'kyc_'||decision,jsonb_build_object('submission_id',submission.id));
end $$;
revoke all on function public.decide_kyc(uuid,text,text) from public;
grant execute on function public.decide_kyc(uuid,text,text) to authenticated;
