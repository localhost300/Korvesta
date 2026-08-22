create or replace function public.get_portfolio_balances()
returns table(asset_id uuid,symbol text,coingecko_id text,available_quantity numeric,held_quantity numeric,invested_quantity numeric,total_quantity numeric)
language sql stable security invoker set search_path='' as $$
 select a.id,a.symbol,a.coingecko_id,
 coalesce(sum(e.amount) filter(where la.purpose='customer_available'),0),
 coalesce(sum(e.amount) filter(where la.purpose='customer_hold'),0),
 coalesce(sum(e.amount) filter(where la.purpose='customer_investment'),0),
 coalesce(sum(e.amount) filter(where la.purpose in ('customer_available','customer_hold','customer_investment')),0)
 from public.ledger_accounts la join public.assets a on a.id=la.asset_id left join public.ledger_entries e on e.account_id=la.id
 where la.owner_id=auth.uid() and la.purpose in ('customer_available','customer_hold','customer_investment')
 group by a.id,a.symbol,a.coingecko_id having coalesce(sum(e.amount),0)<>0
$$;
grant execute on function public.get_portfolio_balances() to authenticated;
