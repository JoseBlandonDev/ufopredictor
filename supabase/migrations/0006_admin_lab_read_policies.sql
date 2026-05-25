drop policy if exists "Admins may read internal lab competitions"
on public.competitions;

create policy "Admins may read internal lab competitions"
on public.competitions
for select
to authenticated
using (
  usage_scope = 'internal_lab'
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
);

drop policy if exists "Admins may read internal lab matches"
on public.matches;

create policy "Admins may read internal lab matches"
on public.matches
for select
to authenticated
using (
  access_scope = 'lab_only'
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
  and exists (
    select 1
    from public.competitions
    where competitions.id = matches.competition_id
      and competitions.usage_scope = 'internal_lab'
  )
);

drop policy if exists "Admins may read teams used in internal lab matches"
on public.teams;

create policy "Admins may read teams used in internal lab matches"
on public.teams
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
  and exists (
    select 1
    from public.matches
    join public.competitions
      on competitions.id = matches.competition_id
    where matches.access_scope = 'lab_only'
      and competitions.usage_scope = 'internal_lab'
      and (matches.home_team_id = teams.id or matches.away_team_id = teams.id)
  )
);

drop policy if exists "Admins may read all match results"
on public.match_results;

drop policy if exists "Admins may read internal lab match results"
on public.match_results;

create policy "Admins may read internal lab match results"
on public.match_results
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
  and exists (
    select 1
    from public.matches
    join public.competitions
      on competitions.id = matches.competition_id
    where matches.id = match_results.match_id
      and matches.access_scope = 'lab_only'
      and competitions.usage_scope = 'internal_lab'
  )
);

drop policy if exists "Admins may read internal lab prediction versions"
on public.prediction_versions;

create policy "Admins may read internal lab prediction versions"
on public.prediction_versions
for select
to authenticated
using (
  run_scope = 'internal_lab'
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
  and exists (
    select 1
    from public.matches
    join public.competitions
      on competitions.id = matches.competition_id
    where matches.id = prediction_versions.match_id
      and matches.access_scope = 'lab_only'
      and competitions.usage_scope = 'internal_lab'
  )
);

drop policy if exists "Admins may read model versions used in internal lab predictions"
on public.model_versions;

create policy "Admins may read model versions used in internal lab predictions"
on public.model_versions
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
  and exists (
    select 1
    from public.prediction_versions
    join public.matches
      on matches.id = prediction_versions.match_id
    join public.competitions
      on competitions.id = matches.competition_id
    where prediction_versions.model_version_id = model_versions.id
      and prediction_versions.run_scope = 'internal_lab'
      and matches.access_scope = 'lab_only'
      and competitions.usage_scope = 'internal_lab'
  )
);

drop policy if exists "Admins may read internal lab prediction results"
on public.prediction_results;

create policy "Admins may read internal lab prediction results"
on public.prediction_results
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
  and exists (
    select 1
    from public.prediction_versions
    join public.matches
      on matches.id = prediction_versions.match_id
    join public.competitions
      on competitions.id = matches.competition_id
    where prediction_versions.id = prediction_results.prediction_version_id
      and prediction_versions.run_scope = 'internal_lab'
      and matches.access_scope = 'lab_only'
      and competitions.usage_scope = 'internal_lab'
  )
);
