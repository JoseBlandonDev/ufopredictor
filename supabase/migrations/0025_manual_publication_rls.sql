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
        and matches.access_scope = 'admin_only'
        and matches.intake_source = 'api_football'
        and matches.status = 'scheduled'
        and competitions.usage_scope = 'public_product'
    );
$$;

create or replace function public.can_admin_publish_real_fixture_match_access_scope(
  target_match_id uuid,
  target_competition_id uuid,
  target_status text,
  target_access_scope text,
  target_intake_source text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_real_fixture_lab_admin()
    and target_access_scope = 'public'
    and target_status = 'scheduled'
    and target_intake_source = 'api_football'
    and exists (
      select 1
      from public.matches
      join public.competitions
        on competitions.id = matches.competition_id
      where matches.id = target_match_id
        and matches.competition_id = target_competition_id
        and matches.access_scope = 'admin_only'
        and matches.intake_source = 'api_football'
        and matches.status = 'scheduled'
        and competitions.usage_scope = 'public_product'
    );
$$;

revoke all on function public.can_admin_publish_real_fixture_prediction(uuid) from public;
revoke execute on function public.can_admin_publish_real_fixture_prediction(uuid) from anon;
revoke execute on function public.can_admin_publish_real_fixture_prediction(uuid) from service_role;

revoke all on function public.can_admin_publish_real_fixture_match_access_scope(uuid, uuid, text, text, text) from public;
revoke execute on function public.can_admin_publish_real_fixture_match_access_scope(uuid, uuid, text, text, text) from anon;
revoke execute on function public.can_admin_publish_real_fixture_match_access_scope(uuid, uuid, text, text, text) from service_role;

grant execute on function public.can_admin_publish_real_fixture_prediction(uuid) to authenticated;
grant execute on function public.can_admin_publish_real_fixture_match_access_scope(uuid, uuid, text, text, text) to authenticated;

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

drop policy if exists "Admins may read manual publication prediction versions"
on public.prediction_versions;

create policy "Admins may read manual publication prediction versions"
on public.prediction_versions
for select
to authenticated
using (
  run_scope = 'public_product'
  and prediction_type = 'pre_match_24h'
  and public.can_admin_publish_real_fixture_prediction(prediction_versions.match_id)
);

drop policy if exists "Admins may insert manual publication prediction versions"
on public.prediction_versions;

create policy "Admins may insert manual publication prediction versions"
on public.prediction_versions
for insert
to authenticated
with check (
  run_scope = 'public_product'
  and prediction_type = 'pre_match_24h'
  and public.can_admin_publish_real_fixture_prediction(prediction_versions.match_id)
);

grant update (access_scope)
on public.matches
to authenticated;

drop policy if exists "Admins may publish real fixture matches"
on public.matches;

create policy "Admins may publish real fixture matches"
on public.matches
for update
to authenticated
using (
  public.can_admin_publish_real_fixture_prediction(matches.id)
)
with check (
  public.can_admin_publish_real_fixture_match_access_scope(
    matches.id,
    matches.competition_id,
    matches.status,
    matches.access_scope,
    matches.intake_source
  )
);
