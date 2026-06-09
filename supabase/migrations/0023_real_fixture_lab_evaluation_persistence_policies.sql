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
      join public.matches
        on matches.id = prediction_versions.match_id
      where prediction_versions.id = target_prediction_version_id
        and prediction_versions.run_scope = 'internal_lab'
        and prediction_versions.prediction_type = 'pre_match_24h'
        and matches.access_scope = 'admin_only'
        and matches.intake_source = 'api_football'
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
      join public.matches
        on matches.id = prediction_versions.match_id
      join public.match_results
        on match_results.match_id = matches.id
      where prediction_versions.id = target_prediction_version_id
        and prediction_versions.run_scope = 'internal_lab'
        and prediction_versions.prediction_type = 'pre_match_24h'
        and matches.access_scope = 'admin_only'
        and matches.intake_source = 'api_football'
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

revoke all on function public.can_admin_access_real_fixture_lab_evaluation_prediction_version(uuid) from public;
revoke execute on function public.can_admin_access_real_fixture_lab_evaluation_prediction_version(uuid) from anon;
revoke execute on function public.can_admin_access_real_fixture_lab_evaluation_prediction_version(uuid) from service_role;
revoke all on function public.can_admin_insert_real_fixture_lab_prediction_result(uuid, integer, integer) from public;
revoke execute on function public.can_admin_insert_real_fixture_lab_prediction_result(uuid, integer, integer) from anon;
revoke execute on function public.can_admin_insert_real_fixture_lab_prediction_result(uuid, integer, integer) from service_role;

grant execute on function public.can_admin_access_real_fixture_lab_evaluation_prediction_version(uuid) to authenticated;
grant execute on function public.can_admin_insert_real_fixture_lab_prediction_result(uuid, integer, integer) to authenticated;

revoke all on public.prediction_results from anon;
revoke all on public.prediction_results from public;
revoke truncate, trigger, references on public.prediction_results from authenticated;

grant select on public.prediction_results to authenticated;

grant insert (
  prediction_version_id,
  actual_home_goals,
  actual_away_goals,
  winner_correct,
  btts_correct,
  over_2_5_correct,
  exact_score_correct,
  goal_error,
  error_summary,
  validated_at
)
on public.prediction_results
to authenticated;

grant update (
  actual_home_goals,
  actual_away_goals,
  winner_correct,
  btts_correct,
  over_2_5_correct,
  exact_score_correct,
  goal_error,
  error_summary,
  validated_at
)
on public.prediction_results
to authenticated;

drop policy if exists "Admins may read real fixture lab prediction results"
on public.prediction_results;

create policy "Admins may read real fixture lab prediction results"
on public.prediction_results
for select
to authenticated
using (
  public.can_admin_access_real_fixture_lab_evaluation_prediction_version(prediction_results.prediction_version_id)
);

drop policy if exists "Admins may insert real fixture lab prediction results"
on public.prediction_results;

create policy "Admins may insert real fixture lab prediction results"
on public.prediction_results
for insert
to authenticated
with check (
  public.can_admin_insert_real_fixture_lab_prediction_result(
    prediction_results.prediction_version_id,
    prediction_results.actual_home_goals,
    prediction_results.actual_away_goals
  )
);

drop policy if exists "Admins may update real fixture lab prediction results"
on public.prediction_results;

create policy "Admins may update real fixture lab prediction results"
on public.prediction_results
for update
to authenticated
using (
  public.can_admin_access_real_fixture_lab_evaluation_prediction_version(prediction_results.prediction_version_id)
)
with check (
  public.can_admin_insert_real_fixture_lab_prediction_result(
    prediction_results.prediction_version_id,
    prediction_results.actual_home_goals,
    prediction_results.actual_away_goals
  )
);
