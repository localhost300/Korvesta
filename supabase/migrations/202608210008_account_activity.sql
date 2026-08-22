create or replace function public.get_account_activity(activity_limit integer default 200)
returns table(id text,activity_type text,asset_symbol text,amount numeric,status text,reference text,occurred_at timestamptz)
language sql stable security definer set search_path='' as $$
  with posted as (
    select
      t.id::text as id,
      t.kind as activity_type,
      a.symbol as asset_symbol,
      e.amount as amount,
      t.status as status,
      t.reference as reference,
      t.created_at as occurred_at
    from public.ledger_transactions t
    join public.ledger_entries e on e.transaction_id=t.id
    join public.ledger_accounts la on la.id=e.account_id and la.owner_id=auth.uid()
    join public.assets a on a.id=la.asset_id
    where (t.kind='deposit' and la.purpose='customer_available')
       or (t.kind in ('investment_subscription','investment_accrual') and la.purpose='customer_investment')
       or (t.kind='investment_redemption' and la.purpose='customer_available')
       or (t.kind not in ('deposit','investment_subscription','investment_accrual','investment_redemption','withdrawal_hold','withdrawal','withdrawal_release') and la.purpose='customer_available')
  ), requests as (
    select
      d.id::text as id,
      'deposit'::text as activity_type,
      a.symbol as asset_symbol,
      d.amount as amount,
      d.status::text as status,
      'DEP-'||d.id as reference,
      d.created_at as occurred_at
    from public.deposit_requests d join public.assets a on a.id=d.asset_id
    where d.user_id=auth.uid() and d.status<>'approved'
    union all
    select
      w.id::text as id,
      'withdrawal'::text as activity_type,
      a.symbol as asset_symbol,
      -w.amount as amount,
      w.status::text as status,
      'WDR-'||w.id as reference,
      w.created_at as occurred_at
    from public.withdrawal_requests w join public.assets a on a.id=w.asset_id
    where w.user_id=auth.uid()
  )
  select * from (select * from posted union all select * from requests) activity
  order by activity.occurred_at desc limit greatest(1,least(activity_limit,500))
$$;
revoke all on function public.get_account_activity(integer) from public;
grant execute on function public.get_account_activity(integer) to authenticated;
