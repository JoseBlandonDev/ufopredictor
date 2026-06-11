create or replace function public.can_admin_access_real_fixture_lab_match(target_match_id uuid)
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
      join public.competitions
        on competitions.id = matches.competition_id
      where matches.id = target_match_id
        and matches.intake_source = 'api_football'
        and (
          matches.access_scope = 'admin_only'
          or (
            matches.access_scope = 'public'
            and matches.status = 'scheduled'
            and competitions.usage_scope = 'public_product'
          )
        )
    );
$$;

create or replace function public.can_admin_access_real_fixture_lab_prediction_version(target_prediction_version_id uuid)
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
      from public.prediction_versions
      where prediction_versions.id = target_prediction_version_id
        and prediction_versions.run_scope = 'internal_lab'
        and prediction_versions.prediction_type = 'pre_match_24h'
        and public.can_admin_access_real_fixture_lab_match(prediction_versions.match_id)
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
      join public.competitions
        on competitions.id = matches.competition_id
      where matches.competition_id = target_competition_id
        and matches.intake_source = 'api_football'
        and (
          matches.access_scope = 'admin_only'
          or (
            matches.access_scope = 'public'
            and matches.status = 'scheduled'
            and competitions.usage_scope = 'public_product'
          )
        )
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
      join public.competitions
        on competitions.id = matches.competition_id
      where matches.intake_source = 'api_football'
        and (
          matches.access_scope = 'admin_only'
          or (
            matches.access_scope = 'public'
            and matches.status = 'scheduled'
            and competitions.usage_scope = 'public_product'
          )
        )
        and (matches.home_team_id = target_team_id or matches.away_team_id = target_team_id)
    );
$$;

create or replace function public.can_admin_publish_real_fixture_prediction(target_match_id uuid)
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
      join public.competitions
        on competitions.id = matches.competition_id
      where matches.id = target_match_id
        and matches.intake_source = 'api_football'
        and matches.status = 'scheduled'
        and competitions.usage_scope = 'public_product'
        and matches.access_scope in ('admin_only', 'public')
    );
$$;

revoke all on function public.can_admin_access_real_fixture_lab_match(uuid) from public;
revoke execute on function public.can_admin_access_real_fixture_lab_match(uuid) from anon;
revoke execute on function public.can_admin_access_real_fixture_lab_match(uuid) from service_role;

revoke all on function public.can_admin_access_real_fixture_lab_prediction_version(uuid) from public;
revoke execute on function public.can_admin_access_real_fixture_lab_prediction_version(uuid) from anon;
revoke execute on function public.can_admin_access_real_fixture_lab_prediction_version(uuid) from service_role;

revoke all on function public.can_admin_read_real_fixture_lab_competition(uuid) from public;
revoke execute on function public.can_admin_read_real_fixture_lab_competition(uuid) from anon;
revoke execute on function public.can_admin_read_real_fixture_lab_competition(uuid) from service_role;

revoke all on function public.can_admin_read_real_fixture_lab_team(uuid) from public;
revoke execute on function public.can_admin_read_real_fixture_lab_team(uuid) from anon;
revoke execute on function public.can_admin_read_real_fixture_lab_team(uuid) from service_role;

revoke all on function public.can_admin_publish_real_fixture_prediction(uuid) from public;
revoke execute on function public.can_admin_publish_real_fixture_prediction(uuid) from anon;
revoke execute on function public.can_admin_publish_real_fixture_prediction(uuid) from service_role;

grant execute on function public.can_admin_access_real_fixture_lab_match(uuid) to authenticated;
grant execute on function public.can_admin_access_real_fixture_lab_prediction_version(uuid) to authenticated;
grant execute on function public.can_admin_read_real_fixture_lab_competition(uuid) to authenticated;
grant execute on function public.can_admin_read_real_fixture_lab_team(uuid) to authenticated;
grant execute on function public.can_admin_publish_real_fixture_prediction(uuid) to authenticated;

drop policy if exists "Admins may read admin-only api-football matches"
on public.matches;

drop policy if exists "Admins may read real fixture lab api-football matches"
on public.matches;

create policy "Admins may read real fixture lab api-football matches"
on public.matches
for select
to authenticated
using (
  public.can_admin_access_real_fixture_lab_match(matches.id)
);
