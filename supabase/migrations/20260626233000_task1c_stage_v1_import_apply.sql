create or replace function public.apply_task1c_stage_v1_import(p_plan jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_requested_state text;
  v_model_inserted_count integer := 0;
  v_prediction_inserted_count integer := 0;
  v_market_inserted_count integer := 0;
  v_model_activated_count integer := 0;
  v_match_published_count integer := 0;
  v_already_present_model_count integer := 0;
  v_already_present_prediction_count integer := 0;
  v_already_present_market_count integer := 0;
  v_already_public_match_count integer := 0;
  v_target_model_id uuid;
  v_relevant_prediction_count integer;
begin
  if jsonb_typeof(p_plan) is distinct from 'object' then
    raise exception 'Task 1C import payload must be a JSON object.';
  end if;

  if (p_plan ->> 'schemaName') is distinct from 'ufo-task1c-stage-v1-import-v1' then
    raise exception 'Task 1C import payload schemaName mismatch.';
  end if;

  if coalesce((p_plan -> 'sourceArtifacts' ->> 'packageSha256')::text, '') is distinct from 'bdb8a3bc57734f97f826a6988c009c646a62e3a0036f6f10fb214e113dbc8416' then
    raise exception 'Task 1C import payload package checksum mismatch.';
  end if;

  v_requested_state := p_plan ->> 'expectedPriorState';
  if v_requested_state not in ('fresh', 'exact_complete') then
    raise exception 'Task 1C import payload expectedPriorState must be fresh or exact_complete.';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('task1c-stage-v1-import-v1', 0));

  create temporary table task1c_stage_v1_import_predictions (
    match_id uuid not null,
    model_version text not null,
    canonical_slug text not null,
    source_prediction_ref text not null,
    prediction_type text not null,
    home_win_prob numeric(7,4) not null,
    draw_prob numeric(7,4) not null,
    away_win_prob numeric(7,4) not null,
    expected_home_goals numeric(7,4) not null,
    expected_away_goals numeric(7,4) not null,
    most_likely_score text not null,
    top_scores_json jsonb not null,
    confidence_score numeric(7,4) not null,
    risk_level text not null,
    run_scope text not null,
    created_at timestamptz not null,
    primary key (match_id, created_at)
  ) on commit drop;

  create temporary table task1c_stage_v1_import_markets (
    match_id uuid not null,
    model_version text not null,
    prediction_type text not null,
    run_scope text not null,
    prediction_created_at timestamptz not null,
    canonical_slug text not null,
    source_market_ref text not null,
    market text not null,
    selection text not null,
    probability numeric(7,4) not null,
    confidence numeric(7,4),
    is_premium boolean not null,
    created_at timestamptz not null,
    primary key (match_id, prediction_created_at, market, selection)
  ) on commit drop;

  create temporary table task1c_stage_v1_import_publications (
    match_id uuid primary key,
    slug text not null,
    current_access_scope text not null,
    next_access_scope text not null
  ) on commit drop;

  create temporary table task1c_stage_v1_import_publication_payload (
    ordinal integer primary key,
    match_id text,
    slug text,
    current_access_scope text,
    next_access_scope text
  ) on commit drop;

  insert into task1c_stage_v1_import_predictions (
    match_id,
    model_version,
    canonical_slug,
    source_prediction_ref,
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
    run_scope,
    created_at
  )
  select
    match_id,
    model_version,
    canonical_slug,
    source_prediction_ref,
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
    run_scope,
    created_at
  from jsonb_to_recordset(p_plan -> 'predictionPayloads') as input(
    match_id uuid,
    model_version text,
    canonical_slug text,
    source_prediction_ref text,
    prediction_type text,
    home_win_prob numeric(7,4),
    draw_prob numeric(7,4),
    away_win_prob numeric(7,4),
    expected_home_goals numeric(7,4),
    expected_away_goals numeric(7,4),
    most_likely_score text,
    top_scores_json jsonb,
    confidence_score numeric(7,4),
    risk_level text,
    run_scope text,
    created_at timestamptz
  );

  if (select count(*) from task1c_stage_v1_import_predictions) <> 24 then
    raise exception 'Task 1C import payload must contain exactly 24 prediction rows.';
  end if;

  insert into task1c_stage_v1_import_markets (
    match_id,
    model_version,
    prediction_type,
    run_scope,
    prediction_created_at,
    canonical_slug,
    source_market_ref,
    market,
    selection,
    probability,
    confidence,
    is_premium,
    created_at
  )
  select
    match_id,
    model_version,
    prediction_type,
    run_scope,
    prediction_created_at,
    canonical_slug,
    source_market_ref,
    market,
    selection,
    probability,
    confidence,
    is_premium,
    created_at
  from jsonb_to_recordset(p_plan -> 'marketPayloads') as input(
    match_id uuid,
    model_version text,
    prediction_type text,
    run_scope text,
    prediction_created_at timestamptz,
    canonical_slug text,
    source_market_ref text,
    market text,
    selection text,
    probability numeric(7,4),
    confidence numeric(7,4),
    is_premium boolean,
    created_at timestamptz
  );

  if (select count(*) from task1c_stage_v1_import_markets) <> 240 then
    raise exception 'Task 1C import payload must contain exactly 240 market rows.';
  end if;

  if exists (
    select 1
    from task1c_stage_v1_import_markets
    where is_premium is distinct from false
  ) then
    raise exception 'Task 1C import payload may not elevate immutable V1 markets to premium.';
  end if;

  insert into task1c_stage_v1_import_publication_payload (
    ordinal,
    match_id,
    slug,
    current_access_scope,
    next_access_scope
  )
  select
    entry.ordinality::integer,
    entry.value ->> 'match_id',
    entry.value ->> 'slug',
    entry.value ->> 'current_access_scope',
    entry.value ->> 'next_access_scope'
  from jsonb_array_elements(coalesce(p_plan -> 'accessScopePublications', '[]'::jsonb)) with ordinality as entry(value, ordinality);

  if exists (
    select 1
    from task1c_stage_v1_import_publication_payload
    where match_id is null
       or slug is null
       or current_access_scope is null
       or next_access_scope is null
  ) then
    raise exception 'Task 1C import publication payload must use non-null snake_case keys match_id, slug, current_access_scope, and next_access_scope.';
  end if;

  if exists (
    select 1
    from task1c_stage_v1_import_publication_payload
    group by match_id
    having count(*) > 1
  ) then
    raise exception 'Task 1C import publication payload contained duplicate match_id values.';
  end if;

  insert into task1c_stage_v1_import_publications (match_id, slug, current_access_scope, next_access_scope)
  select
    match_id::uuid,
    slug,
    current_access_scope,
    next_access_scope
  from task1c_stage_v1_import_publication_payload;

  if exists (
    select 1
    from task1c_stage_v1_import_publications
    where current_access_scope is distinct from 'admin_only'
       or next_access_scope is distinct from 'public'
  ) then
    raise exception 'Task 1C import publication payload was invalid.';
  end if;

  if exists (
    select 1
    from task1c_stage_v1_import_predictions as plan
    left join public.matches as matches
      on matches.id = plan.match_id
    left join public.competitions as competitions
      on competitions.id = matches.competition_id
    where matches.id is null
       or matches.external_id !~ '^api-football:fixture:[0-9]+$'
       or matches.slug is distinct from plan.canonical_slug
       or matches.intake_source is distinct from 'api_football'
       or competitions.slug is distinct from 'world-cup-2026'
       or competitions.usage_scope is distinct from 'public_product'
  ) then
    raise exception 'Task 1C import payload referenced an invalid or non-public-product stage match.';
  end if;

  if exists (
    select 1
    from task1c_stage_v1_import_publications as plan
    left join task1c_stage_v1_import_predictions as predictions
      on predictions.match_id = plan.match_id
    where predictions.match_id is null
  ) then
    raise exception 'Task 1C import publication payload referenced an unknown or out-of-scope stage match.';
  end if;

  if exists (
    with expected_publications as (
      select
        matches.id as match_id,
        matches.slug
      from public.matches as matches
      join public.competitions as competitions
        on competitions.id = matches.competition_id
      where matches.id in (select match_id from task1c_stage_v1_import_predictions)
        and matches.access_scope = 'admin_only'
        and matches.status = 'scheduled'
        and matches.intake_source = 'api_football'
        and matches.external_id ~ '^api-football:fixture:[0-9]+$'
        and competitions.slug = 'world-cup-2026'
        and competitions.usage_scope = 'public_product'
    )
    select 1
    from expected_publications as expected
    full outer join task1c_stage_v1_import_publications as actual
      on actual.match_id = expected.match_id
     and actual.slug = expected.slug
    where expected.match_id is null
       or actual.match_id is null
  ) then
    raise exception 'Task 1C import publication payload did not exactly match the required admin_only publication set.';
  end if;

  if exists (
    select 1
    from task1c_stage_v1_import_publications as plan
    join public.matches as matches
      on matches.id = plan.match_id
    where matches.slug is distinct from plan.slug
       or matches.access_scope is distinct from 'admin_only'
       or matches.status is distinct from 'scheduled'
       or matches.intake_source is distinct from 'api_football'
  ) then
    raise exception 'Task 1C import publication payload did not match the current safe stage state.';
  end if;

  select count(*)
  into v_relevant_prediction_count
  from public.prediction_versions as predictions
  where predictions.match_id in (select match_id from task1c_stage_v1_import_predictions)
    and predictions.prediction_type = 'pre_match_24h'
    and predictions.run_scope = 'public_product';

  if v_requested_state = 'fresh' then
    if exists (
      select 1
      from public.model_versions
      where version = 'v0.2-prelaunch'
    ) then
      raise exception 'Task 1C import fresh apply blocked because the V1 model already exists.';
    end if;

    if exists (
      select 1
      from public.model_versions
      where is_active = true
    ) then
      raise exception 'Task 1C import fresh apply blocked because another active model already exists.';
    end if;

    if v_relevant_prediction_count <> 0 then
      raise exception 'Task 1C import fresh apply blocked because relevant public predictions already exist.';
    end if;

    insert into public.model_versions (
      version,
      description,
      weights_json,
      is_active,
      created_at,
      updated_at
    )
    select
      p_plan -> 'modelPayload' ->> 'version',
      nullif(p_plan -> 'modelPayload' ->> 'description', ''),
      coalesce(p_plan -> 'modelPayload' -> 'weights_json', '{}'::jsonb),
      coalesce((p_plan -> 'modelPayload' ->> 'is_active')::boolean, false),
      (p_plan -> 'modelPayload' ->> 'created_at')::timestamptz,
      (p_plan -> 'modelPayload' ->> 'updated_at')::timestamptz
    returning id into v_target_model_id;

    get diagnostics v_model_inserted_count = row_count;
    v_model_activated_count := v_model_inserted_count;

    create temporary table task1c_stage_v1_inserted_predictions (
      id uuid primary key,
      match_id uuid not null,
      created_at timestamptz not null
    ) on commit drop;

    with inserted as (
      insert into public.prediction_versions (
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
        run_scope,
        created_at
      )
      select
        plan.match_id,
        v_target_model_id,
        plan.prediction_type,
        plan.home_win_prob,
        plan.draw_prob,
        plan.away_win_prob,
        plan.expected_home_goals,
        plan.expected_away_goals,
        plan.most_likely_score,
        plan.top_scores_json,
        plan.confidence_score,
        plan.risk_level,
        plan.run_scope,
        plan.created_at
      from task1c_stage_v1_import_predictions as plan
      returning id, match_id, created_at
    )
    insert into task1c_stage_v1_inserted_predictions (id, match_id, created_at)
    select id, match_id, created_at
    from inserted;

    get diagnostics v_prediction_inserted_count = row_count;
    if v_prediction_inserted_count <> 24 then
      raise exception 'Task 1C import inserted % prediction rows instead of 24.', v_prediction_inserted_count;
    end if;

    insert into public.prediction_markets (
      prediction_version_id,
      market,
      selection,
      probability,
      confidence,
      is_premium,
      created_at
    )
    select
      inserted.id,
      plan.market,
      plan.selection,
      plan.probability,
      plan.confidence,
      plan.is_premium,
      plan.created_at
    from task1c_stage_v1_import_markets as plan
    join task1c_stage_v1_inserted_predictions as inserted
      on inserted.match_id = plan.match_id
     and inserted.created_at = plan.prediction_created_at;

    get diagnostics v_market_inserted_count = row_count;
    if v_market_inserted_count <> 240 then
      raise exception 'Task 1C import inserted % market rows instead of 240.', v_market_inserted_count;
    end if;

    update public.matches as matches
    set access_scope = 'public'
    from task1c_stage_v1_import_publications as publications
    where matches.id = publications.match_id
      and matches.access_scope = 'admin_only';

    get diagnostics v_match_published_count = row_count;
    v_already_public_match_count := 24;
  else
    select id
    into v_target_model_id
    from public.model_versions
    where version = 'v0.2-prelaunch'
      and description is not distinct from nullif(p_plan -> 'modelPayload' ->> 'description', '')
      and weights_json = coalesce(p_plan -> 'modelPayload' -> 'weights_json', '{}'::jsonb)
      and is_active = true
      and created_at = (p_plan -> 'modelPayload' ->> 'created_at')::timestamptz
      and updated_at = (p_plan -> 'modelPayload' ->> 'updated_at')::timestamptz
    limit 1;

    if v_target_model_id is null then
      raise exception 'Task 1C import rerun validation blocked because the active V1 model was not exact.';
    end if;

    if exists (
      select 1
      from public.model_versions
      where is_active = true
        and id <> v_target_model_id
    ) then
      raise exception 'Task 1C import rerun validation blocked because another active model exists.';
    end if;

    if v_relevant_prediction_count <> 24 then
      raise exception 'Task 1C import rerun validation blocked because relevant prediction count was % instead of 24.', v_relevant_prediction_count;
    end if;

    if exists (
      select 1
      from task1c_stage_v1_import_predictions as plan
      left join public.prediction_versions as predictions
        on predictions.match_id = plan.match_id
       and predictions.model_version_id = v_target_model_id
       and predictions.prediction_type = plan.prediction_type
       and predictions.run_scope = plan.run_scope
       and predictions.created_at = plan.created_at
      where predictions.id is null
         or predictions.home_win_prob is distinct from plan.home_win_prob
         or predictions.draw_prob is distinct from plan.draw_prob
         or predictions.away_win_prob is distinct from plan.away_win_prob
         or predictions.expected_home_goals is distinct from plan.expected_home_goals
         or predictions.expected_away_goals is distinct from plan.expected_away_goals
         or predictions.most_likely_score is distinct from plan.most_likely_score
         or predictions.top_scores_json is distinct from plan.top_scores_json
         or predictions.confidence_score is distinct from plan.confidence_score
         or predictions.risk_level::text is distinct from plan.risk_level
    ) then
      raise exception 'Task 1C import rerun validation blocked because an immutable prediction differed from the frozen source.';
    end if;

    if exists (
      select 1
      from public.prediction_versions as predictions
      where predictions.match_id in (select match_id from task1c_stage_v1_import_predictions)
        and predictions.prediction_type = 'pre_match_24h'
        and predictions.run_scope = 'public_product'
        and not exists (
          select 1
          from task1c_stage_v1_import_predictions as plan
          where plan.match_id = predictions.match_id
            and plan.created_at = predictions.created_at
        )
    ) then
      raise exception 'Task 1C import rerun validation blocked because out-of-contract public predictions existed in scope.';
    end if;

    if exists (
      select 1
      from task1c_stage_v1_import_markets as plan
      left join public.prediction_versions as predictions
        on predictions.match_id = plan.match_id
       and predictions.model_version_id = v_target_model_id
       and predictions.prediction_type = plan.prediction_type
       and predictions.run_scope = plan.run_scope
       and predictions.created_at = plan.prediction_created_at
      left join public.prediction_markets as markets
        on markets.prediction_version_id = predictions.id
       and markets.market = plan.market
       and markets.selection = plan.selection
      where markets.id is null
         or markets.probability is distinct from plan.probability
         or markets.confidence is distinct from plan.confidence
         or markets.is_premium is distinct from plan.is_premium
         or markets.created_at is distinct from plan.created_at
    ) then
      raise exception 'Task 1C import rerun validation blocked because an immutable market differed from the frozen source.';
    end if;

    if exists (
      select 1
      from public.prediction_narratives as narratives
      join public.prediction_versions as predictions
        on predictions.id = narratives.prediction_version_id
      where predictions.match_id in (select match_id from task1c_stage_v1_import_predictions)
        and predictions.prediction_type = 'pre_match_24h'
        and predictions.run_scope = 'public_product'
    ) then
      raise exception 'Task 1C import rerun validation blocked because narratives existed for imported predictions.';
    end if;

    if exists (
      select 1
      from public.matches
      where id in (select match_id from task1c_stage_v1_import_predictions)
        and access_scope is distinct from 'public'
    ) then
      raise exception 'Task 1C import rerun validation blocked because not all imported matches remained public.';
    end if;

    v_already_present_model_count := 1;
    v_already_present_prediction_count := 24;
    v_already_present_market_count := 240;
    v_already_public_match_count := 24;
  end if;

  return jsonb_build_object(
    'requestedState', v_requested_state,
    'modelInsertedCount', v_model_inserted_count,
    'predictionInsertedCount', v_prediction_inserted_count,
    'marketInsertedCount', v_market_inserted_count,
    'narrativeInsertedCount', 0,
    'modelActivatedCount', v_model_activated_count,
    'matchPublishedCount', v_match_published_count,
    'alreadyPresentModelCount', v_already_present_model_count,
    'alreadyPresentPredictionCount', v_already_present_prediction_count,
    'alreadyPresentMarketCount', v_already_present_market_count,
    'alreadyPublicMatchCount', v_already_public_match_count
  );
end;
$$;

revoke execute on function public.apply_task1c_stage_v1_import(jsonb) from public;
revoke execute on function public.apply_task1c_stage_v1_import(jsonb) from anon;
revoke execute on function public.apply_task1c_stage_v1_import(jsonb) from authenticated;
grant execute on function public.apply_task1c_stage_v1_import(jsonb) to service_role;
