-- C07E.2
-- Premium product projection RPC (no prediction_results, no direct table opening).
-- This function is intended to be called only after app-level premium access gate checks.
-- It still enforces DB-side authorization to avoid accidental data leaks.

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

  -- Deterministic stage key derivation:
  -- - World Cup group letters from explicit "group/grupo <A-H>"
  -- - "Fase de grupos" without a group letter is intentionally NOT mapped
  --   (conservative default: no invented group entitlement key)
  -- - Known knockout labels only
  -- - Unknown labels remain null (no invented keys)
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

  return jsonb_build_object(
    'markets',
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'market', pm.market,
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
    )
  );
end;
$$;

revoke all on function public.get_premium_match_projection(uuid) from public;
revoke all on function public.get_premium_match_projection(uuid) from anon;
revoke all on function public.get_premium_match_projection(uuid) from authenticated;
grant execute on function public.get_premium_match_projection(uuid) to authenticated;
