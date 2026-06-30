create or replace function public.apply_task2b_stage_result_core(
  p_match_id uuid,
  p_expected_external_id text,
  p_expected_match_status text,
  p_expected_result_kind text,
  p_expected_result_verification_status text,
  p_expected_result_home_goals integer,
  p_expected_result_away_goals integer,
  p_home_goals integer,
  p_away_goals integer,
  p_source_note text,
  p_reviewed_at timestamptz,
  p_reviewed_by uuid,
  p_recorded_at timestamptz
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_match public.matches%rowtype;
  v_result public.match_results%rowtype;
  v_result_writes_applied integer := 0;
begin
  if p_expected_external_id !~ '^api-football:fixture:[0-9]+$' then
    raise exception 'Task 2B.2 expected external id must be an exact API-Football fixture reference.';
  end if;

  if p_expected_result_kind not in ('missing', 'existing') then
    raise exception 'Task 2B.2 expected result kind must be missing or existing.';
  end if;

  if p_expected_result_kind = 'missing' then
    if p_expected_result_verification_status is not null
       or p_expected_result_home_goals is not null
       or p_expected_result_away_goals is not null then
      raise exception 'Task 2B.2 missing expected result state cannot include stored result fields.';
    end if;
  elsif p_expected_result_verification_status is null
     or p_expected_result_home_goals is null
     or p_expected_result_away_goals is null then
    raise exception 'Task 2B.2 existing expected result state must include exact stored result fields.';
  end if;

  if p_home_goals < 0 or p_away_goals < 0 then
    raise exception 'Task 2B.2 verified result goals must be non-negative.';
  end if;

  select *
  into v_match
  from public.matches
  where id = p_match_id
  for update;

  if not found then
    return jsonb_build_object(
      'outcome', 'missing_match',
      'resultWritesApplied', 0
    );
  end if;

  if v_match.external_id is distinct from p_expected_external_id
     or v_match.status is distinct from p_expected_match_status then
    return jsonb_build_object(
      'outcome', 'stale_prior_state',
      'resultWritesApplied', 0
    );
  end if;

  select *
  into v_result
  from public.match_results
  where match_id = p_match_id
  for update;

  if p_expected_result_kind = 'missing' then
    if found then
      if v_result.verification_status = 'verified'
         and v_result.home_goals = p_home_goals
         and v_result.away_goals = p_away_goals
         and v_result.intake_source = 'api_football'
         and v_match.status = 'finished' then
        return jsonb_build_object(
          'outcome', 'already_satisfied',
          'resultWritesApplied', 0,
          'matchResultId', v_result.id
        );
      end if;

      if v_result.verification_status = 'verified'
         and (v_result.home_goals <> p_home_goals or v_result.away_goals <> p_away_goals) then
        return jsonb_build_object(
          'outcome', 'verified_result_conflict',
          'resultWritesApplied', 0,
          'matchResultId', v_result.id
        );
      end if;

      return jsonb_build_object(
        'outcome', 'stale_prior_state',
        'resultWritesApplied', 0,
        'matchResultId', v_result.id
      );
    end if;
  else
    if not found then
      return jsonb_build_object(
        'outcome', 'stale_prior_state',
        'resultWritesApplied', 0
      );
    end if;

    if v_result.verification_status <> p_expected_result_verification_status
       or v_result.home_goals <> p_expected_result_home_goals
       or v_result.away_goals <> p_expected_result_away_goals then
      if v_result.verification_status = 'verified'
         and v_result.home_goals = p_home_goals
         and v_result.away_goals = p_away_goals
         and v_result.intake_source = 'api_football'
         and v_match.status = 'finished' then
        return jsonb_build_object(
          'outcome', 'already_satisfied',
          'resultWritesApplied', 0,
          'matchResultId', v_result.id
        );
      end if;

      if v_result.verification_status = 'verified'
         and (v_result.home_goals <> p_home_goals or v_result.away_goals <> p_away_goals) then
        return jsonb_build_object(
          'outcome', 'verified_result_conflict',
          'resultWritesApplied', 0,
          'matchResultId', v_result.id
        );
      end if;

      return jsonb_build_object(
        'outcome', 'stale_prior_state',
        'resultWritesApplied', 0,
        'matchResultId', v_result.id
      );
    end if;
  end if;

  if found then
    if v_result.verification_status <> 'verified'
       or v_result.home_goals <> p_home_goals
       or v_result.away_goals <> p_away_goals
       or v_result.intake_source <> 'api_football'
       or v_result.source_note is distinct from p_source_note
       or v_result.reviewed_at is distinct from p_reviewed_at
       or v_result.reviewed_by is distinct from p_reviewed_by
       or v_result.recorded_at is distinct from p_recorded_at then
      update public.match_results
      set
        home_goals = p_home_goals,
        away_goals = p_away_goals,
        verification_status = 'verified',
        intake_source = 'api_football',
        source_note = p_source_note,
        reviewed_at = p_reviewed_at,
        reviewed_by = p_reviewed_by,
        recorded_at = p_recorded_at
      where id = v_result.id;

      v_result_writes_applied := v_result_writes_applied + 1;
    end if;
  else
    insert into public.match_results (
      match_id,
      home_goals,
      away_goals,
      verification_status,
      intake_source,
      source_note,
      reviewed_at,
      reviewed_by,
      recorded_at
    )
    values (
      p_match_id,
      p_home_goals,
      p_away_goals,
      'verified',
      'api_football',
      p_source_note,
      p_reviewed_at,
      p_reviewed_by,
      p_recorded_at
    )
    returning * into v_result;

    v_result_writes_applied := v_result_writes_applied + 1;
  end if;

  if v_match.status <> 'finished' then
    update public.matches
    set status = 'finished'
    where id = p_match_id;

    v_result_writes_applied := v_result_writes_applied + 1;
  end if;

  if v_result.verification_status = 'verified'
     and v_result.home_goals = p_home_goals
     and v_result.away_goals = p_away_goals
     and v_match.status = 'finished'
     and v_result_writes_applied = 0 then
    return jsonb_build_object(
      'outcome', 'already_satisfied',
      'resultWritesApplied', 0,
      'matchResultId', v_result.id
    );
  end if;

  return jsonb_build_object(
    'outcome', 'applied',
    'resultWritesApplied', v_result_writes_applied,
    'matchResultId', v_result.id
  );
end;
$$;

revoke execute on function public.apply_task2b_stage_result_core(
  uuid, text, text, text, text, integer, integer, integer, integer, text, timestamptz, uuid, timestamptz
) from public;
revoke execute on function public.apply_task2b_stage_result_core(
  uuid, text, text, text, text, integer, integer, integer, integer, text, timestamptz, uuid, timestamptz
) from anon;
revoke execute on function public.apply_task2b_stage_result_core(
  uuid, text, text, text, text, integer, integer, integer, integer, text, timestamptz, uuid, timestamptz
) from authenticated;
grant execute on function public.apply_task2b_stage_result_core(
  uuid, text, text, text, text, integer, integer, integer, integer, text, timestamptz, uuid, timestamptz
) to service_role;
