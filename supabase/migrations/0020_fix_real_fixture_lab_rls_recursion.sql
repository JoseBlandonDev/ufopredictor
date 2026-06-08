create or replace function public.is_real_fixture_lab_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  );
$$;

create or replace function public.can_admin_read_real_fixture_lab_competition(target_competition_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_real_fixture_lab_admin()
    and exists (
      select 1
      from public.matches
      where matches.competition_id = target_competition_id
        and matches.access_scope = 'admin_only'
        and matches.intake_source = 'api_football'
    );
$$;

create or replace function public.can_admin_read_real_fixture_lab_team(target_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_real_fixture_lab_admin()
    and exists (
      select 1
      from public.matches
      where matches.access_scope = 'admin_only'
        and matches.intake_source = 'api_football'
        and (matches.home_team_id = target_team_id or matches.away_team_id = target_team_id)
    );
$$;

create or replace function public.can_admin_read_real_fixture_lab_match_result(target_match_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_real_fixture_lab_admin()
    and exists (
      select 1
      from public.matches
      where matches.id = target_match_id
        and matches.access_scope = 'admin_only'
        and matches.intake_source = 'api_football'
    );
$$;

revoke all on function public.is_real_fixture_lab_admin() from public;
revoke all on function public.can_admin_read_real_fixture_lab_competition(uuid) from public;
revoke all on function public.can_admin_read_real_fixture_lab_team(uuid) from public;
revoke all on function public.can_admin_read_real_fixture_lab_match_result(uuid) from public;

grant execute on function public.is_real_fixture_lab_admin() to authenticated;
grant execute on function public.can_admin_read_real_fixture_lab_competition(uuid) to authenticated;
grant execute on function public.can_admin_read_real_fixture_lab_team(uuid) to authenticated;
grant execute on function public.can_admin_read_real_fixture_lab_match_result(uuid) to authenticated;

drop policy if exists "Admins may read competitions used by admin-only api-football matches"
on public.competitions;

create policy "Admins may read competitions used by admin-only api-football matches"
on public.competitions
for select
to authenticated
using (
  public.can_admin_read_real_fixture_lab_competition(competitions.id)
);

drop policy if exists "Admins may read teams used in admin-only api-football matches"
on public.teams;

create policy "Admins may read teams used in admin-only api-football matches"
on public.teams
for select
to authenticated
using (
  public.can_admin_read_real_fixture_lab_team(teams.id)
);

drop policy if exists "Admins may read match results for admin-only api-football matches"
on public.match_results;

create policy "Admins may read match results for admin-only api-football matches"
on public.match_results
for select
to authenticated
using (
  public.can_admin_read_real_fixture_lab_match_result(match_results.match_id)
);
