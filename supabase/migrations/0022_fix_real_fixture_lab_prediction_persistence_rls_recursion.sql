create or replace function public.can_admin_read_internal_lab_model_version(target_model_version_id uuid)
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
      join public.competitions
        on competitions.id = matches.competition_id
      where prediction_versions.model_version_id = target_model_version_id
        and prediction_versions.run_scope = 'internal_lab'
        and matches.access_scope = 'lab_only'
        and competitions.usage_scope = 'internal_lab'
    );
$$;

revoke all on function public.can_admin_read_internal_lab_model_version(uuid) from public;
grant execute on function public.can_admin_read_internal_lab_model_version(uuid) to authenticated;

drop policy if exists "Admins may read model versions used in internal lab predictions"
on public.model_versions;

create policy "Admins may read model versions used in internal lab predictions"
on public.model_versions
for select
to authenticated
using (
  public.can_admin_read_internal_lab_model_version(model_versions.id)
);
