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
  public.is_real_fixture_lab_admin()
  and matches.access_scope = 'public'
  and matches.status = 'scheduled'
  and matches.intake_source = 'api_football'
  and exists (
    select 1
    from public.competitions
    where competitions.id = matches.competition_id
      and competitions.usage_scope = 'public_product'
  )
);
