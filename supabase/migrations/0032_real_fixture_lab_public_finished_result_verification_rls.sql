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
            and matches.status in ('scheduled', 'finished')
            and competitions.usage_scope = 'public_product'
          )
        )
    );
$$;

create or replace function public.can_admin_access_real_fixture_lab_finished_match(target_match_id uuid)
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
            and matches.status = 'finished'
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
            and matches.status in ('scheduled', 'finished')
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
            and matches.status in ('scheduled', 'finished')
            and competitions.usage_scope = 'public_product'
          )
        )
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
  select public.can_admin_access_real_fixture_lab_finished_match(target_match_id);
$$;

create or replace function public.can_admin_access_real_fixture_lab_evaluation_prediction_version(
  target_prediction_version_id uuid
)
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
        and public.can_admin_access_real_fixture_lab_finished_match(prediction_versions.match_id)
    );
$$;

create or replace function public.can_admin_insert_real_fixture_lab_prediction_result(
  target_prediction_version_id uuid,
  target_actual_home_goals integer,
  target_actual_away_goals integer
)
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
      join public.match_results
        on match_results.match_id = prediction_versions.match_id
      where prediction_versions.id = target_prediction_version_id
        and prediction_versions.run_scope = 'internal_lab'
        and prediction_versions.prediction_type = 'pre_match_24h'
        and public.can_admin_access_real_fixture_lab_finished_match(prediction_versions.match_id)
        and match_results.verification_status = 'verified'
        and match_results.home_goals = target_actual_home_goals
        and match_results.away_goals = target_actual_away_goals
        and exists (
          select 1
          from public.prediction_markets
          where prediction_markets.prediction_version_id = prediction_versions.id
            and prediction_markets.market = 'btts'
            and prediction_markets.selection = 'yes'
        )
        and exists (
          select 1
          from public.prediction_markets
          where prediction_markets.prediction_version_id = prediction_versions.id
            and prediction_markets.market = 'btts'
            and prediction_markets.selection = 'no'
        )
        and exists (
          select 1
          from public.prediction_markets
          where prediction_markets.prediction_version_id = prediction_versions.id
            and prediction_markets.market = 'over_2_5'
            and prediction_markets.selection = 'over'
        )
        and exists (
          select 1
          from public.prediction_markets
          where prediction_markets.prediction_version_id = prediction_versions.id
            and prediction_markets.market = 'over_2_5'
            and prediction_markets.selection = 'under'
        )
    );
$$;

create or replace function public.can_admin_access_real_fixture_lab_match_result_review(
  target_match_result_id uuid
)
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
      from public.match_results
      where match_results.id = target_match_result_id
        and public.can_admin_access_real_fixture_lab_finished_match(match_results.match_id)
    );
$$;

create or replace function public.can_admin_verify_real_fixture_lab_match_result(
  target_match_result_id uuid,
  target_match_id uuid,
  target_home_goals integer,
  target_away_goals integer,
  target_verification_status text,
  target_intake_source text,
  target_source_note text,
  target_recorded_at timestamptz,
  target_reviewed_at timestamptz,
  target_reviewed_by uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_real_fixture_lab_admin()
    and target_verification_status = 'verified'
    and target_reviewed_at is not null
    and target_reviewed_by = auth.uid()
    and exists (
      select 1
      from public.match_results
      where match_results.id = target_match_result_id
        and match_results.match_id = target_match_id
        and match_results.home_goals = target_home_goals
        and match_results.away_goals = target_away_goals
        and match_results.intake_source = target_intake_source
        and match_results.source_note is not distinct from target_source_note
        and match_results.recorded_at is not distinct from target_recorded_at
        and match_results.verification_status = 'pending_review'
        and public.can_admin_access_real_fixture_lab_finished_match(match_results.match_id)
    );
$$;

revoke all on function public.can_admin_access_real_fixture_lab_match(uuid) from public;
revoke execute on function public.can_admin_access_real_fixture_lab_match(uuid) from anon;
revoke execute on function public.can_admin_access_real_fixture_lab_match(uuid) from service_role;

revoke all on function public.can_admin_access_real_fixture_lab_finished_match(uuid) from public;
revoke execute on function public.can_admin_access_real_fixture_lab_finished_match(uuid) from anon;
revoke execute on function public.can_admin_access_real_fixture_lab_finished_match(uuid) from service_role;

revoke all on function public.can_admin_access_real_fixture_lab_prediction_version(uuid) from public;
revoke execute on function public.can_admin_access_real_fixture_lab_prediction_version(uuid) from anon;
revoke execute on function public.can_admin_access_real_fixture_lab_prediction_version(uuid) from service_role;

revoke all on function public.can_admin_read_real_fixture_lab_competition(uuid) from public;
revoke execute on function public.can_admin_read_real_fixture_lab_competition(uuid) from anon;
revoke execute on function public.can_admin_read_real_fixture_lab_competition(uuid) from service_role;

revoke all on function public.can_admin_read_real_fixture_lab_team(uuid) from public;
revoke execute on function public.can_admin_read_real_fixture_lab_team(uuid) from anon;
revoke execute on function public.can_admin_read_real_fixture_lab_team(uuid) from service_role;

revoke all on function public.can_admin_read_real_fixture_lab_match_result(uuid) from public;
revoke execute on function public.can_admin_read_real_fixture_lab_match_result(uuid) from anon;
revoke execute on function public.can_admin_read_real_fixture_lab_match_result(uuid) from service_role;

revoke all on function public.can_admin_access_real_fixture_lab_evaluation_prediction_version(uuid) from public;
revoke execute on function public.can_admin_access_real_fixture_lab_evaluation_prediction_version(uuid) from anon;
revoke execute on function public.can_admin_access_real_fixture_lab_evaluation_prediction_version(uuid) from service_role;

revoke all on function public.can_admin_insert_real_fixture_lab_prediction_result(uuid, integer, integer) from public;
revoke execute on function public.can_admin_insert_real_fixture_lab_prediction_result(uuid, integer, integer) from anon;
revoke execute on function public.can_admin_insert_real_fixture_lab_prediction_result(uuid, integer, integer) from service_role;

revoke all on function public.can_admin_access_real_fixture_lab_match_result_review(uuid) from public;
revoke execute on function public.can_admin_access_real_fixture_lab_match_result_review(uuid) from anon;
revoke execute on function public.can_admin_access_real_fixture_lab_match_result_review(uuid) from service_role;

revoke all on function public.can_admin_verify_real_fixture_lab_match_result(uuid, uuid, integer, integer, text, text, text, timestamptz, timestamptz, uuid) from public;
revoke execute on function public.can_admin_verify_real_fixture_lab_match_result(uuid, uuid, integer, integer, text, text, text, timestamptz, timestamptz, uuid) from anon;
revoke execute on function public.can_admin_verify_real_fixture_lab_match_result(uuid, uuid, integer, integer, text, text, text, timestamptz, timestamptz, uuid) from service_role;

grant execute on function public.can_admin_access_real_fixture_lab_match(uuid) to authenticated;
grant execute on function public.can_admin_access_real_fixture_lab_finished_match(uuid) to authenticated;
grant execute on function public.can_admin_access_real_fixture_lab_prediction_version(uuid) to authenticated;
grant execute on function public.can_admin_read_real_fixture_lab_competition(uuid) to authenticated;
grant execute on function public.can_admin_read_real_fixture_lab_team(uuid) to authenticated;
grant execute on function public.can_admin_read_real_fixture_lab_match_result(uuid) to authenticated;
grant execute on function public.can_admin_access_real_fixture_lab_evaluation_prediction_version(uuid) to authenticated;
grant execute on function public.can_admin_insert_real_fixture_lab_prediction_result(uuid, integer, integer) to authenticated;
grant execute on function public.can_admin_access_real_fixture_lab_match_result_review(uuid) to authenticated;
grant execute on function public.can_admin_verify_real_fixture_lab_match_result(uuid, uuid, integer, integer, text, text, text, timestamptz, timestamptz, uuid) to authenticated;
