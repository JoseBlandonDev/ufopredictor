drop policy if exists "Admins may update internal lab fixture review fields"
on public.matches;

revoke update on public.matches from anon;
revoke update on public.matches from authenticated;

grant update (lab_status, data_quality, source_note, reviewed_at, reviewed_by)
on public.matches
to authenticated;

create policy "Admins may update internal lab fixture review fields"
on public.matches
for update
to authenticated
using (
  access_scope = 'lab_only'
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
  and exists (
    select 1
    from public.competitions
    where competitions.id = matches.competition_id
      and competitions.usage_scope = 'internal_lab'
  )
)
with check (
  access_scope = 'lab_only'
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
  and exists (
    select 1
    from public.competitions
    where competitions.id = matches.competition_id
      and competitions.usage_scope = 'internal_lab'
  )
);
