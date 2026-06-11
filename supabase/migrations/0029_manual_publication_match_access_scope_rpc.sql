create or replace function public.publish_real_fixture_match_access_scope(
  target_match_id uuid,
  target_match_slug text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_match_id uuid;
begin
  if not public.is_real_fixture_lab_admin() then
    return null;
  end if;

  update public.matches
  set access_scope = 'public'
  where matches.id = target_match_id
    and matches.slug = target_match_slug
    and matches.access_scope = 'admin_only'
    and matches.status = 'scheduled'
    and matches.intake_source = 'api_football'
    and exists (
      select 1
      from public.competitions
      where competitions.id = matches.competition_id
        and competitions.usage_scope = 'public_product'
    )
  returning matches.id into updated_match_id;

  return updated_match_id;
end;
$$;

revoke all on function public.publish_real_fixture_match_access_scope(uuid, text) from public;
revoke execute on function public.publish_real_fixture_match_access_scope(uuid, text) from anon;
revoke execute on function public.publish_real_fixture_match_access_scope(uuid, text) from service_role;

grant execute on function public.publish_real_fixture_match_access_scope(uuid, text) to authenticated;
