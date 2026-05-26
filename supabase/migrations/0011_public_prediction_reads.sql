drop policy if exists "Public may read public product competitions"
on public.competitions;

grant select on public.competitions to anon, authenticated;

create policy "Public may read public product competitions"
on public.competitions
for select
to anon, authenticated
using (
  usage_scope = 'public_product'
);

drop policy if exists "Public may read public product matches"
on public.matches;

grant select on public.matches to anon, authenticated;

create policy "Public may read public product matches"
on public.matches
for select
to anon, authenticated
using (
  access_scope = 'public'
  and exists (
    select 1
    from public.competitions
    where competitions.id = matches.competition_id
      and competitions.usage_scope = 'public_product'
  )
);

drop policy if exists "Public may read teams used in public product matches"
on public.teams;

grant select on public.teams to anon, authenticated;

create policy "Public may read teams used in public product matches"
on public.teams
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.matches
    join public.competitions
      on competitions.id = matches.competition_id
    where matches.access_scope = 'public'
      and competitions.usage_scope = 'public_product'
      and (matches.home_team_id = teams.id or matches.away_team_id = teams.id)
  )
);

drop policy if exists "Public may read venues used in public product matches"
on public.venues;

grant select on public.venues to anon, authenticated;

create policy "Public may read venues used in public product matches"
on public.venues
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.matches
    join public.competitions
      on competitions.id = matches.competition_id
    where matches.access_scope = 'public'
      and competitions.usage_scope = 'public_product'
      and matches.venue_id = venues.id
  )
);

drop policy if exists "Public may read public product prediction versions"
on public.prediction_versions;

grant select on public.prediction_versions to anon, authenticated;

create policy "Public may read public product prediction versions"
on public.prediction_versions
for select
to anon, authenticated
using (
  run_scope = 'public_product'
  and exists (
    select 1
    from public.matches
    join public.competitions
      on competitions.id = matches.competition_id
    where matches.id = prediction_versions.match_id
      and matches.access_scope = 'public'
      and competitions.usage_scope = 'public_product'
  )
);
