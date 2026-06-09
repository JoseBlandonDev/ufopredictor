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
      join public.matches
        on matches.id = match_results.match_id
      where match_results.id = target_match_result_id
        and matches.access_scope = 'admin_only'
        and matches.intake_source = 'api_football'
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
      join public.matches
        on matches.id = match_results.match_id
      where match_results.id = target_match_result_id
        and match_results.match_id = target_match_id
        and match_results.home_goals = target_home_goals
        and match_results.away_goals = target_away_goals
        and match_results.intake_source = target_intake_source
        and match_results.source_note is not distinct from target_source_note
        and match_results.recorded_at is not distinct from target_recorded_at
        and match_results.verification_status = 'pending_review'
        and matches.access_scope = 'admin_only'
        and matches.intake_source = 'api_football'
    );
$$;

revoke all on function public.can_admin_access_real_fixture_lab_match_result_review(uuid) from public;
revoke execute on function public.can_admin_access_real_fixture_lab_match_result_review(uuid) from anon;
revoke execute on function public.can_admin_access_real_fixture_lab_match_result_review(uuid) from service_role;
revoke all on function public.can_admin_verify_real_fixture_lab_match_result(uuid, uuid, integer, integer, text, text, text, timestamptz, timestamptz, uuid) from public;
revoke execute on function public.can_admin_verify_real_fixture_lab_match_result(uuid, uuid, integer, integer, text, text, text, timestamptz, timestamptz, uuid) from anon;
revoke execute on function public.can_admin_verify_real_fixture_lab_match_result(uuid, uuid, integer, integer, text, text, text, timestamptz, timestamptz, uuid) from service_role;

grant execute on function public.can_admin_access_real_fixture_lab_match_result_review(uuid) to authenticated;
grant execute on function public.can_admin_verify_real_fixture_lab_match_result(uuid, uuid, integer, integer, text, text, text, timestamptz, timestamptz, uuid) to authenticated;

revoke all on public.match_results from anon;
revoke all on public.match_results from public;
revoke truncate, trigger, references on public.match_results from authenticated;

grant update (
  verification_status,
  reviewed_at,
  reviewed_by
)
on public.match_results
to authenticated;

drop policy if exists "Admins may review real fixture lab match results"
on public.match_results;

create policy "Admins may review real fixture lab match results"
on public.match_results
for update
to authenticated
using (
  public.can_admin_access_real_fixture_lab_match_result_review(match_results.id)
)
with check (
  public.can_admin_verify_real_fixture_lab_match_result(
    match_results.id,
    match_results.match_id,
    match_results.home_goals,
    match_results.away_goals,
    match_results.verification_status,
    match_results.intake_source,
    match_results.source_note,
    match_results.recorded_at,
    match_results.reviewed_at,
    match_results.reviewed_by
  )
);
