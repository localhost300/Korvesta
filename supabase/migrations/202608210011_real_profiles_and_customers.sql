create or replace function public.update_own_profile(requested_name text,requested_country text)
returns public.profiles language plpgsql security definer set search_path='' as $$
declare result public.profiles;
begin
 if auth.uid() is null then raise exception 'authentication required'; end if;
 if length(trim(requested_name))<2 or length(trim(requested_name))>100 then raise exception 'invalid full name'; end if;
 if length(trim(requested_country))<2 or length(trim(requested_country))>80 then raise exception 'invalid country'; end if;
 update public.profiles set full_name=trim(requested_name),country=trim(requested_country),updated_at=now() where id=auth.uid() returning * into result;
 insert into public.security_events(user_id,event_type) values(auth.uid(),'profile_updated');
 return result;
end $$;
revoke all on function public.update_own_profile(text,text) from public;
grant execute on function public.update_own_profile(text,text) to authenticated;

create or replace function public.set_customer_account_status(customer_id uuid,next_status text,note text)
returns void language plpgsql security definer set search_path='' as $$
declare previous_status text;
begin
 if not exists(select 1 from public.profiles where id=auth.uid() and role='admin') then raise exception 'administrator access required'; end if;
 if next_status not in ('active','restricted','suspended') then raise exception 'invalid account status'; end if;
 if coalesce(trim(note),'')='' then raise exception 'an audit reason is required'; end if;
 select account_status into previous_status from public.profiles where id=customer_id and role='customer' for update;
 if previous_status is null then raise exception 'customer not found'; end if;
 update public.profiles set account_status=next_status,updated_at=now() where id=customer_id;
 insert into public.audit_events(actor_id,action,entity_type,entity_id,before_state,after_state)
 values(auth.uid(),'set_account_status','profile',customer_id::text,jsonb_build_object('account_status',previous_status),jsonb_build_object('account_status',next_status,'note',note));
 insert into public.security_events(user_id,event_type,metadata) values(customer_id,'account_status_changed',jsonb_build_object('from',previous_status,'to',next_status));
end $$;
revoke all on function public.set_customer_account_status(uuid,text,text) from public;
grant execute on function public.set_customer_account_status(uuid,text,text) to authenticated;
