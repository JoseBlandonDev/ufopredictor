drop policy if exists "Admins may read admin-only api-football matches"
on public.matches;

create policy "Admins may read admin-only api-football matches"
on public.matches
for select
to authenticated
using (
  access_scope = 'admin_only'
  and intake_source = 'api_football'
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

drop policy if exists "Admins may read competitions used by admin-only api-football matches"
on public.competitions;

create policy "Admins may read competitions used by admin-only api-football matches"
on public.competitions
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
  and exists (
    select 1
    from public.matches
    where matches.competition_id = competitions.id
      and matches.access_scope = 'admin_only'
      and matches.intake_source = 'api_football'
  )
);

drop policy if exists "Admins may read teams used in admin-only api-football matches"
on public.teams;

create policy "Admins may read teams used in admin-only api-football matches"
on public.teams
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
  and exists (
    select 1
    from public.matches
    where matches.access_scope = 'admin_only'
      and matches.intake_source = 'api_football'
      and (matches.home_team_id = teams.id or matches.away_team_id = teams.id)
  )
);

drop policy if exists "Admins may read match results for admin-only api-football matches"
on public.match_results;

create policy "Admins may read match results for admin-only api-football matches"
on public.match_results
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
  and exists (
    select 1
    from public.matches
    where matches.id = match_results.match_id
      and matches.access_scope = 'admin_only'
      and matches.intake_source = 'api_football'
  )
);
