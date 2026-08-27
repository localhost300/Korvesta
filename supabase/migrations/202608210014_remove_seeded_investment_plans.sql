-- Remove legacy demonstration plans while preserving plans referenced by a
-- real customer position.
delete from public.investment_plans plan
where plan.name in ('Starter Fixed','Growth Fixed','Balanced Fixed','Long-Term Fixed')
  and not exists (
    select 1 from public.investment_positions position
    where position.plan_id = plan.id
  );
