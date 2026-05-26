drop policy if exists "Admins may insert match results"
on public.match_results;

drop policy if exists "Admins may update match results"
on public.match_results;

drop policy if exists "Admins may delete match results"
on public.match_results;

drop policy if exists "Admins may insert internal lab match results"
on public.match_results;

drop policy if exists "Admins may update internal lab match results"
on public.match_results;

revoke insert, update, delete on public.match_results from anon;
revoke insert, update, delete on public.match_results from authenticated;

grant insert (
  match_id,
  home_goals,
  away_goals,
  verification_status,
  intake_source,
  source_note,
  reviewed_at,
  reviewed_by
)
on public.match_results
to authenticated;

grant update (
  home_goals,
  away_goals,
  verification_status,
  intake_source,
  source_note,
  reviewed_at,
  reviewed_by
)
on public.match_results
to authenticated;

create policy "Admins may insert internal lab match results"
on public.match_results
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
  and exists (
    select 1
    from public.matches
    join public.competitions
      on competitions.id = matches.competition_id
    where matches.id = match_results.match_id
      and matches.access_scope = 'lab_only'
      and competitions.usage_scope = 'internal_lab'
  )
);

create policy "Admins may update internal lab match results"
on public.match_results
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
  and exists (
    select 1
    from public.matches
    join public.competitions
      on competitions.id = matches.competition_id
    where matches.id = match_results.match_id
      and matches.access_scope = 'lab_only'
      and competitions.usage_scope = 'internal_lab'
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
  and exists (
    select 1
    from public.matches
    join public.competitions
      on competitions.id = matches.competition_id
    where matches.id = match_results.match_id
      and matches.access_scope = 'lab_only'
      and competitions.usage_scope = 'internal_lab'
  )
);
