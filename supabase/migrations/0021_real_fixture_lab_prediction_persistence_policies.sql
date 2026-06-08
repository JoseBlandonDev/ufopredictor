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
      where matches.id = target_match_id
        and matches.access_scope = 'admin_only'
        and matches.intake_source = 'api_football'
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
      join public.matches
        on matches.id = prediction_versions.match_id
      where prediction_versions.id = target_prediction_version_id
        and prediction_versions.run_scope = 'internal_lab'
        and prediction_versions.prediction_type = 'pre_match_24h'
        and matches.access_scope = 'admin_only'
        and matches.intake_source = 'api_football'
    );
$$;

revoke all on function public.can_admin_access_real_fixture_lab_match(uuid) from public;
revoke all on function public.can_admin_access_real_fixture_lab_prediction_version(uuid) from public;

grant execute on function public.can_admin_access_real_fixture_lab_match(uuid) to authenticated;
grant execute on function public.can_admin_access_real_fixture_lab_prediction_version(uuid) to authenticated;

grant select on public.model_versions to authenticated;

drop policy if exists "Admins may read active model versions for real fixture lab predictions"
on public.model_versions;

create policy "Admins may read active model versions for real fixture lab predictions"
on public.model_versions
for select
to authenticated
using (
  is_active = true
  and public.is_real_fixture_lab_admin()
);

grant insert (
  match_id,
  model_version_id,
  prediction_type,
  home_win_prob,
  draw_prob,
  away_win_prob,
  expected_home_goals,
  expected_away_goals,
  most_likely_score,
  top_scores_json,
  confidence_score,
  risk_level,
  run_scope
)
on public.prediction_versions
to authenticated;

drop policy if exists "Admins may read real fixture lab prediction versions"
on public.prediction_versions;

create policy "Admins may read real fixture lab prediction versions"
on public.prediction_versions
for select
to authenticated
using (
  run_scope = 'internal_lab'
  and prediction_type = 'pre_match_24h'
  and public.can_admin_access_real_fixture_lab_match(prediction_versions.match_id)
);

drop policy if exists "Admins may insert real fixture lab prediction versions"
on public.prediction_versions;

create policy "Admins may insert real fixture lab prediction versions"
on public.prediction_versions
for insert
to authenticated
with check (
  run_scope = 'internal_lab'
  and prediction_type = 'pre_match_24h'
  and public.can_admin_access_real_fixture_lab_match(prediction_versions.match_id)
  and exists (
    select 1
    from public.model_versions
    where model_versions.id = prediction_versions.model_version_id
      and model_versions.is_active = true
  )
);

grant insert (
  prediction_version_id,
  market,
  selection,
  probability,
  confidence,
  is_premium
)
on public.prediction_markets
to authenticated;

drop policy if exists "Admins may read real fixture lab prediction markets"
on public.prediction_markets;

create policy "Admins may read real fixture lab prediction markets"
on public.prediction_markets
for select
to authenticated
using (
  public.can_admin_access_real_fixture_lab_prediction_version(prediction_markets.prediction_version_id)
);

drop policy if exists "Admins may insert real fixture lab prediction markets"
on public.prediction_markets;

create policy "Admins may insert real fixture lab prediction markets"
on public.prediction_markets
for insert
to authenticated
with check (
  is_premium = false
  and public.can_admin_access_real_fixture_lab_prediction_version(prediction_markets.prediction_version_id)
);
