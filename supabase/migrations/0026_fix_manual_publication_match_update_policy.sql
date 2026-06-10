create or replace function public.can_admin_publish_real_fixture_match_access_scope(
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
      from public.competitions
      where competitions.id = target_competition_id
        and competitions.usage_scope = 'public_product'
    );
$$;

revoke all on function public.can_admin_publish_real_fixture_match_access_scope(uuid, text, text, text) from public;
revoke execute on function public.can_admin_publish_real_fixture_match_access_scope(uuid, text, text, text) from anon;
revoke execute on function public.can_admin_publish_real_fixture_match_access_scope(uuid, text, text, text) from service_role;

grant execute on function public.can_admin_publish_real_fixture_match_access_scope(uuid, text, text, text) to authenticated;

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
    matches.competition_id,
    matches.status,
    matches.access_scope,
    matches.intake_source
  )
);
