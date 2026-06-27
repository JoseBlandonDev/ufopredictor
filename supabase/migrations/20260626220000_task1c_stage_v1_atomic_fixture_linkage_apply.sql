create or replace function public.apply_task1c_stage_v1_fixture_linkage(p_rows jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_requested_count integer;
  v_inserted_count integer;
  v_updated_count integer;
begin
  if jsonb_typeof(p_rows) is distinct from 'array' then
    raise exception 'Task 1C linkage batch must be a JSON array.';
  end if;

  v_requested_count := jsonb_array_length(p_rows);

  if v_requested_count <> 24 then
    raise exception 'Task 1C linkage batch must contain exactly 24 reviewed rows. Received: %', v_requested_count;
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_rows) as element(value)
    where jsonb_typeof(value) is distinct from 'object'
       or exists (
         select 1
         from jsonb_object_keys(value) as key_name
         where key_name not in (
           'stage_match_id',
           'expected_external_id',
           'expected_intake_source',
           'next_external_id',
           'next_intake_source'
         )
       )
  ) then
    raise exception 'Task 1C linkage batch contained unexpected keys.';
  end if;

  create temporary table task1c_stage_v1_linkage_batch (
    stage_match_id uuid primary key,
    expected_external_id text,
    expected_intake_source text,
    next_external_id text not null,
    next_intake_source text not null
  ) on commit drop;

  insert into task1c_stage_v1_linkage_batch (
    stage_match_id,
    expected_external_id,
    expected_intake_source,
    next_external_id,
    next_intake_source
  )
  select
    stage_match_id,
    expected_external_id,
    expected_intake_source,
    next_external_id,
    next_intake_source
  from jsonb_to_recordset(p_rows) as input(
    stage_match_id uuid,
    expected_external_id text,
    expected_intake_source text,
    next_external_id text,
    next_intake_source text
  );

  get diagnostics v_inserted_count = row_count;

  if v_inserted_count <> v_requested_count then
    raise exception 'Task 1C linkage batch contained duplicate or invalid match identifiers.';
  end if;

  if exists (
    select 1
    from task1c_stage_v1_linkage_batch
    where expected_external_id is not null
       or expected_intake_source is distinct from 'manual'
  ) then
    raise exception 'Task 1C linkage batch expected prior state must be external_id=null and intake_source=manual for every row.';
  end if;

  if exists (
    select 1
    from task1c_stage_v1_linkage_batch
    where next_external_id !~ '^api-football:fixture:[0-9]+$'
       or next_intake_source is distinct from 'api_football'
  ) then
    raise exception 'Task 1C linkage batch patch payload was invalid.';
  end if;

  if exists (
    select 1
    from task1c_stage_v1_linkage_batch as batch
    left join public.matches as matches
      on matches.id = batch.stage_match_id
    where matches.id is null
  ) then
    raise exception 'Task 1C linkage batch referenced a missing stage row.';
  end if;

  if exists (
    select 1
    from task1c_stage_v1_linkage_batch as batch
    join public.matches as matches
      on matches.id = batch.stage_match_id
    where matches.external_id is distinct from batch.expected_external_id
       or matches.intake_source is distinct from batch.expected_intake_source
  ) then
    raise exception 'Task 1C linkage batch detected stage state drift.';
  end if;

  update public.matches as matches
  set
    external_id = batch.next_external_id,
    intake_source = batch.next_intake_source
  from task1c_stage_v1_linkage_batch as batch
  where matches.id = batch.stage_match_id
    and matches.external_id is not distinct from batch.expected_external_id
    and matches.intake_source is not distinct from batch.expected_intake_source;

  get diagnostics v_updated_count = row_count;

  if v_updated_count <> v_requested_count then
    raise exception 'Task 1C linkage batch update count mismatch. Expected %, updated %.', v_requested_count, v_updated_count;
  end if;

  return jsonb_build_object(
    'requestedCount', v_requested_count,
    'updatedCount', v_updated_count
  );
end;
$$;

revoke execute on function public.apply_task1c_stage_v1_fixture_linkage(jsonb) from public;
revoke execute on function public.apply_task1c_stage_v1_fixture_linkage(jsonb) from anon;
revoke execute on function public.apply_task1c_stage_v1_fixture_linkage(jsonb) from authenticated;
grant execute on function public.apply_task1c_stage_v1_fixture_linkage(jsonb) to service_role;
