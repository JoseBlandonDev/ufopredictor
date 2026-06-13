create or replace function public.can_admin_refresh_public_real_fixture_prediction(target_match_id uuid)
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
        and matches.access_scope = 'public'
        and matches.intake_source = 'api_football'
        and matches.status in ('scheduled', 'finished')
        and competitions.usage_scope = 'public_product'
    );
$$;

revoke all on function public.can_admin_refresh_public_real_fixture_prediction(uuid) from public;
revoke execute on function public.can_admin_refresh_public_real_fixture_prediction(uuid) from anon;
revoke execute on function public.can_admin_refresh_public_real_fixture_prediction(uuid) from service_role;

grant execute on function public.can_admin_refresh_public_real_fixture_prediction(uuid) to authenticated;

drop policy if exists "Admins may read manual publication prediction versions"
on public.prediction_versions;

create policy "Admins may read manual publication prediction versions"
on public.prediction_versions
for select
to authenticated
using (
  run_scope = 'public_product'
  and prediction_type = 'pre_match_24h'
  and (
    public.can_admin_publish_real_fixture_prediction(prediction_versions.match_id)
    or public.can_admin_refresh_public_real_fixture_prediction(prediction_versions.match_id)
  )
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
  and (
    public.can_admin_publish_real_fixture_prediction(prediction_versions.match_id)
    or public.can_admin_refresh_public_real_fixture_prediction(prediction_versions.match_id)
  )
);
