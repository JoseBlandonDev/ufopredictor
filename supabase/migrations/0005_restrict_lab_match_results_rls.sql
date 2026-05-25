drop policy if exists "Authenticated users may read verified match results"
on public.match_results;

create policy "Authenticated users may read verified product match results"
on public.match_results
for select
to authenticated
using (
  verification_status = 'verified'
  and exists (
    select 1
    from public.matches
    join public.competitions
      on competitions.id = matches.competition_id
    where matches.id = match_results.match_id
      and matches.access_scope in ('public', 'premium')
      and competitions.usage_scope = 'public_product'
  )
);
