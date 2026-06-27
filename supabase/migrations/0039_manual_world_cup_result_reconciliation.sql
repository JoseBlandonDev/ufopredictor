create or replace function public.can_admin_access_real_fixture_lab_reconciliation_match(
  target_match_id uuid
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
      from public.matches
      join public.competitions
        on competitions.id = matches.competition_id
      where matches.id = target_match_id
        and matches.intake_source = 'api_football'
        and matches.access_scope in ('admin_only', 'public')
        and matches.kickoff_at <= now()
        and competitions.slug = 'world-cup-2026'
        and competitions.usage_scope = 'public_product'
    );
$$;

create or replace function public.can_admin_insert_real_fixture_lab_manual_result(
  target_match_id uuid,
  target_home_goals integer,
  target_away_goals integer,
  target_verification_status text,
  target_intake_source text,
  target_source_note text,
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
    and public.can_admin_access_real_fixture_lab_reconciliation_match(target_match_id)
    and target_verification_status = 'pending_review'
    and target_intake_source = 'manual'
    and target_home_goals between 0 and 20
    and target_away_goals between 0 and 20
    and nullif(btrim(coalesce(target_source_note, '')), '') is not null
    and target_reviewed_at is null
    and target_reviewed_by is null
    and not exists (
      select 1
      from public.match_results
      where match_results.match_id = target_match_id
    );
$$;

create or replace function public.can_admin_finalize_real_fixture_lab_public_match_status(
  target_match_id uuid,
  target_status text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_real_fixture_lab_admin()
    and target_status = 'finished'
    and exists (
      select 1
      from public.matches
      where matches.id = target_match_id
        and matches.access_scope = 'public'
        and public.can_admin_access_real_fixture_lab_reconciliation_match(matches.id)
    );
$$;

create or replace function public.can_admin_read_real_fixture_lab_match_result(target_match_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.can_admin_access_real_fixture_lab_finished_match(target_match_id)
    or public.can_admin_access_real_fixture_lab_reconciliation_match(target_match_id);
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
        and (
          public.can_admin_access_real_fixture_lab_finished_match(prediction_versions.match_id)
          or public.can_admin_access_real_fixture_lab_reconciliation_match(prediction_versions.match_id)
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
        and public.can_admin_read_real_fixture_lab_match_result(match_results.match_id)
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
        and public.can_admin_read_real_fixture_lab_match_result(match_results.match_id)
    );
$$;

revoke all on function public.can_admin_access_real_fixture_lab_reconciliation_match(uuid) from public;
revoke execute on function public.can_admin_access_real_fixture_lab_reconciliation_match(uuid) from anon;
revoke execute on function public.can_admin_access_real_fixture_lab_reconciliation_match(uuid) from service_role;

revoke all on function public.can_admin_insert_real_fixture_lab_manual_result(uuid, integer, integer, text, text, text, timestamptz, uuid) from public;
revoke execute on function public.can_admin_insert_real_fixture_lab_manual_result(uuid, integer, integer, text, text, text, timestamptz, uuid) from anon;
revoke execute on function public.can_admin_insert_real_fixture_lab_manual_result(uuid, integer, integer, text, text, text, timestamptz, uuid) from service_role;

revoke all on function public.can_admin_finalize_real_fixture_lab_public_match_status(uuid, text) from public;
revoke execute on function public.can_admin_finalize_real_fixture_lab_public_match_status(uuid, text) from anon;
revoke execute on function public.can_admin_finalize_real_fixture_lab_public_match_status(uuid, text) from service_role;

grant execute on function public.can_admin_access_real_fixture_lab_reconciliation_match(uuid) to authenticated;
grant execute on function public.can_admin_insert_real_fixture_lab_manual_result(uuid, integer, integer, text, text, text, timestamptz, uuid) to authenticated;
grant execute on function public.can_admin_finalize_real_fixture_lab_public_match_status(uuid, text) to authenticated;

grant update (status)
on public.matches
to authenticated;

drop policy if exists "Admins may finalize public World Cup reconciliation match status"
on public.matches;

create policy "Admins may finalize public World Cup reconciliation match status"
on public.matches
for update
to authenticated
using (
  public.can_admin_access_real_fixture_lab_reconciliation_match(matches.id)
)
with check (
  public.can_admin_finalize_real_fixture_lab_public_match_status(
    matches.id,
    matches.status
  )
);

drop policy if exists "Admins may insert real fixture lab manual reconciliation results"
on public.match_results;

create policy "Admins may insert real fixture lab manual reconciliation results"
on public.match_results
for insert
to authenticated
with check (
  public.can_admin_insert_real_fixture_lab_manual_result(
    match_results.match_id,
    match_results.home_goals,
    match_results.away_goals,
    match_results.verification_status,
    match_results.intake_source,
    match_results.source_note,
    match_results.reviewed_at,
    match_results.reviewed_by
  )
);
