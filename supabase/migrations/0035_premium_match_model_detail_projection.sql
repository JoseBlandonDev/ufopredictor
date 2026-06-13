-- Extend the protected premium projection RPC with public-safe model detail.
-- Keeps DB-side authorization and does not expose prediction_results or raw rows.

create or replace function public.get_premium_match_projection(p_match_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid;
  v_competition_slug text;
  v_competition_access_key text;
  v_stage text;
  v_stage_access_key text;
  v_home_team_id uuid;
  v_away_team_id uuid;
  v_prediction_version_id uuid;
  v_is_authorized boolean;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'authentication required'
      using errcode = '42501';
  end if;

  select
    c.slug,
    m.stage,
    m.home_team_id,
    m.away_team_id
  into
    v_competition_slug,
    v_stage,
    v_home_team_id,
    v_away_team_id
  from public.matches m
  join public.competitions c
    on c.id = m.competition_id
  where m.id = p_match_id
    and m.access_scope = 'public'
    and c.usage_scope = 'public_product'
  limit 1;

  if not found then
    return null;
  end if;

  v_competition_access_key := case
    when v_competition_slug = 'world-cup-2026' then 'world_cup_2026'
    else replace(lower(v_competition_slug), '-', '_')
  end;

  v_stage_access_key := null;
  if v_competition_access_key = 'world_cup_2026' and v_stage is not null then
    if lower(v_stage) ~ '(group|grupo)\s*[a-h]' then
      v_stage_access_key :=
        'world_cup_2026:group:' ||
        upper((regexp_match(lower(v_stage), '(?:group|grupo)\s*([a-h])'))[1]);
    elsif lower(v_stage) in ('round_of_16', 'round of 16', 'octavos') then
      v_stage_access_key := 'world_cup_2026:stage:round_of_16';
    elsif lower(v_stage) in ('quarterfinal', 'quarter-final', 'cuartos') then
      v_stage_access_key := 'world_cup_2026:stage:quarterfinal';
    elsif lower(v_stage) in ('semifinal', 'semi-final', 'semifinales') then
      v_stage_access_key := 'world_cup_2026:stage:semifinal';
    elsif lower(v_stage) = 'final' then
      v_stage_access_key := 'world_cup_2026:stage:final';
    end if;
  end if;

  select exists (
    select 1
    from public.profiles p
    where p.id = v_user_id
      and p.role = 'admin'
  )
  or exists (
    select 1
    from public.user_match_unlocks u
    where u.user_id = v_user_id
      and u.match_id = p_match_id
      and (u.expires_at is null or u.expires_at > now())
  )
  or exists (
    select 1
    from public.user_entitlements e
    where e.user_id = v_user_id
      and (e.starts_at is null or e.starts_at <= now())
      and (e.ends_at is null or e.ends_at > now())
      and (e.quantity is null)
      and e.entitlement_type <> 'match_pack'
      and (
        e.resource_type = 'global'
        or (e.resource_type = 'match' and e.resource_id = p_match_id::text)
        or (e.resource_type = 'competition' and e.resource_id = v_competition_access_key)
        or (e.resource_type = 'team' and e.resource_id in (v_home_team_id::text, v_away_team_id::text))
        or (
          e.resource_type = 'stage'
          and v_stage_access_key is not null
          and e.resource_id = v_stage_access_key
        )
      )
  )
  into v_is_authorized;

  if not v_is_authorized then
    return null;
  end if;

  select pv.id
  into v_prediction_version_id
  from public.prediction_versions pv
  join public.matches m
    on m.id = pv.match_id
  join public.competitions c
    on c.id = m.competition_id
  where pv.match_id = p_match_id
    and pv.run_scope = 'public_product'
    and m.access_scope = 'public'
    and c.usage_scope = 'public_product'
  order by pv.created_at desc, pv.id desc
  limit 1;

  if v_prediction_version_id is null then
    return null;
  end if;

  return (
    with selected_prediction as (
      select
        pv.expected_home_goals,
        pv.expected_away_goals,
        pv.top_scores_json,
        pv.confidence_score,
        pv.risk_level
      from public.prediction_versions pv
      where pv.id = v_prediction_version_id
      limit 1
    )
    select jsonb_build_object(
      'markets',
      coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'marketKey', pm.market,
              'label', pm.market,
              'selection', pm.selection,
              'probability', pm.probability,
              'confidence', pm.confidence
            )
            order by pm.market, pm.selection
          )
          from public.prediction_markets pm
          where pm.prediction_version_id = v_prediction_version_id
            and pm.is_premium is true
            and pm.market in ('btts', 'over_2_5', 'exact_score', 'match_winner')
        ),
        '[]'::jsonb
      ),
      'narratives',
      coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'locale', pn.locale,
              'premium_analysis', pn.premium_analysis,
              'why_it_changed', pn.why_it_changed,
              'risk_notes', pn.risk_notes
            )
            order by pn.locale
          )
          from public.prediction_narratives pn
          where pn.prediction_version_id = v_prediction_version_id
            and pn.premium_analysis is not null
        ),
        '[]'::jsonb
      ),
      'model_detail',
      (
        select jsonb_build_object(
          'expected_goals',
          jsonb_build_object(
            'home', sp.expected_home_goals,
            'away', sp.expected_away_goals
          ),
          'top_scorelines',
          coalesce(
            (
              select jsonb_agg(
                jsonb_build_object(
                  'score', scoreline.score,
                  'probability', scoreline.probability
                )
                order by scoreline.ordinality
              )
              from (
                select
                  entry.ordinality,
                  entry.value ->> 'score' as score,
                  case
                    when jsonb_typeof(entry.value -> 'probability') = 'number'
                      then (entry.value ->> 'probability')::numeric
                    when (entry.value ->> 'probability') ~ '^-?[0-9]+(\.[0-9]+)?$'
                      then (entry.value ->> 'probability')::numeric
                    else null
                  end as probability
                from jsonb_array_elements(
                  case
                    when jsonb_typeof(sp.top_scores_json) = 'array' then sp.top_scores_json
                    else '[]'::jsonb
                  end
                ) with ordinality as entry(value, ordinality)
                where jsonb_typeof(entry.value) = 'object'
                  and entry.value ? 'score'
                  and entry.value ? 'probability'
                  and (
                    jsonb_typeof(entry.value -> 'probability') = 'number'
                    or (entry.value ->> 'probability') ~ '^-?[0-9]+(\.[0-9]+)?$'
                  )
                order by entry.ordinality
                limit 3
              ) as scoreline
            ),
            '[]'::jsonb
          ),
          'both_teams_to_score',
          jsonb_build_object(
            'yes_probability',
            (
              select pm.probability
              from public.prediction_markets pm
              where pm.prediction_version_id = v_prediction_version_id
                and pm.market = 'btts'
                and pm.selection = 'yes'
              order by pm.created_at desc, pm.id desc
              limit 1
            ),
            'no_probability',
            (
              select pm.probability
              from public.prediction_markets pm
              where pm.prediction_version_id = v_prediction_version_id
                and pm.market = 'btts'
                and pm.selection = 'no'
              order by pm.created_at desc, pm.id desc
              limit 1
            )
          ),
          'total_goals_2_5',
          jsonb_build_object(
            'over_probability',
            (
              select pm.probability
              from public.prediction_markets pm
              where pm.prediction_version_id = v_prediction_version_id
                and pm.market = 'over_2_5'
                and pm.selection = 'over'
              order by pm.created_at desc, pm.id desc
              limit 1
            ),
            'under_probability',
            (
              select pm.probability
              from public.prediction_markets pm
              where pm.prediction_version_id = v_prediction_version_id
                and pm.market = 'over_2_5'
                and pm.selection = 'under'
              order by pm.created_at desc, pm.id desc
              limit 1
            )
          ),
          'confidence',
          jsonb_build_object(
            'score', sp.confidence_score,
            'risk_level', sp.risk_level
          )
        )
        from selected_prediction sp
      )
    )
    from selected_prediction
  );
end;
$$;

revoke all on function public.get_premium_match_projection(uuid) from public;
revoke all on function public.get_premium_match_projection(uuid) from anon;
revoke all on function public.get_premium_match_projection(uuid) from authenticated;
grant execute on function public.get_premium_match_projection(uuid) to authenticated;

create or replace function public.can_admin_publish_real_fixture_prediction_market(
  target_prediction_version_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    public.is_real_fixture_lab_admin()
    and exists (
      select 1
      from public.prediction_versions
      where prediction_versions.id = target_prediction_version_id
        and prediction_versions.run_scope = 'public_product'
        and prediction_versions.prediction_type = 'pre_match_24h'
        and (
          public.can_admin_publish_real_fixture_prediction(prediction_versions.match_id)
          or public.can_admin_refresh_public_real_fixture_prediction(prediction_versions.match_id)
        )
    );
$$;

revoke all on function public.can_admin_publish_real_fixture_prediction_market(uuid) from public;
revoke execute on function public.can_admin_publish_real_fixture_prediction_market(uuid) from anon;
revoke execute on function public.can_admin_publish_real_fixture_prediction_market(uuid) from service_role;
grant execute on function public.can_admin_publish_real_fixture_prediction_market(uuid) to authenticated;

drop policy if exists "Admins may insert real fixture lab prediction markets"
on public.prediction_markets;

create policy "Admins may insert real fixture lab prediction markets"
on public.prediction_markets
for insert
to authenticated
with check (
  is_premium = false
  and (
    public.can_admin_access_real_fixture_lab_prediction_version(prediction_markets.prediction_version_id)
    or public.can_admin_publish_real_fixture_prediction_market(prediction_markets.prediction_version_id)
  )
);
