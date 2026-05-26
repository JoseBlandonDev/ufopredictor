drop policy if exists "Admins may read internal lab prediction markets"
on public.prediction_markets;

grant select on public.prediction_markets to authenticated;

create policy "Admins may read internal lab prediction markets"
on public.prediction_markets
for select
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
    from public.prediction_versions
    join public.matches
      on matches.id = prediction_versions.match_id
    join public.competitions
      on competitions.id = matches.competition_id
    where prediction_versions.id = prediction_markets.prediction_version_id
      and prediction_versions.run_scope = 'internal_lab'
      and matches.access_scope = 'lab_only'
      and competitions.usage_scope = 'internal_lab'
  )
);

drop policy if exists "Admins may insert prediction results"
on public.prediction_results;

drop policy if exists "Admins may update prediction results"
on public.prediction_results;

drop policy if exists "Admins may delete prediction results"
on public.prediction_results;

drop policy if exists "Admins may insert internal lab prediction results"
on public.prediction_results;

drop policy if exists "Admins may update internal lab prediction results"
on public.prediction_results;

revoke insert, update, delete on public.prediction_results from anon;
revoke insert, update, delete on public.prediction_results from authenticated;

grant insert (
  prediction_version_id,
  actual_home_goals,
  actual_away_goals,
  winner_correct,
  btts_correct,
  over_2_5_correct,
  exact_score_correct,
  goal_error,
  error_summary,
  validated_at
)
on public.prediction_results
to authenticated;

grant update (
  actual_home_goals,
  actual_away_goals,
  winner_correct,
  btts_correct,
  over_2_5_correct,
  exact_score_correct,
  goal_error,
  error_summary,
  validated_at
)
on public.prediction_results
to authenticated;

create policy "Admins may insert internal lab prediction results"
on public.prediction_results
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
    from public.prediction_versions pv
    join public.matches m
      on m.id = pv.match_id
    join public.competitions c
      on c.id = m.competition_id
    join public.match_results mr
      on mr.match_id = m.id
    where pv.id = prediction_results.prediction_version_id
      and pv.run_scope = 'internal_lab'
      and m.access_scope = 'lab_only'
      and c.usage_scope = 'internal_lab'
      and mr.verification_status = 'verified'
      and mr.home_goals = prediction_results.actual_home_goals
      and mr.away_goals = prediction_results.actual_away_goals
      and exists (
        select 1
        from public.prediction_markets pm
        where pm.prediction_version_id = pv.id
          and pm.market = 'btts'
          and pm.selection = 'yes'
      )
      and exists (
        select 1
        from public.prediction_markets pm
        where pm.prediction_version_id = pv.id
          and pm.market = 'btts'
          and pm.selection = 'no'
      )
      and exists (
        select 1
        from public.prediction_markets pm
        where pm.prediction_version_id = pv.id
          and pm.market = 'over_2_5'
          and pm.selection = 'over'
      )
      and exists (
        select 1
        from public.prediction_markets pm
        where pm.prediction_version_id = pv.id
          and pm.market = 'over_2_5'
          and pm.selection = 'under'
      )
  )
);

create policy "Admins may update internal lab prediction results"
on public.prediction_results
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
    from public.prediction_versions pv
    join public.matches m
      on m.id = pv.match_id
    join public.competitions c
      on c.id = m.competition_id
    join public.match_results mr
      on mr.match_id = m.id
    where pv.id = prediction_results.prediction_version_id
      and pv.run_scope = 'internal_lab'
      and m.access_scope = 'lab_only'
      and c.usage_scope = 'internal_lab'
      and mr.verification_status = 'verified'
      and exists (
        select 1
        from public.prediction_markets pm
        where pm.prediction_version_id = pv.id
          and pm.market = 'btts'
          and pm.selection = 'yes'
      )
      and exists (
        select 1
        from public.prediction_markets pm
        where pm.prediction_version_id = pv.id
          and pm.market = 'btts'
          and pm.selection = 'no'
      )
      and exists (
        select 1
        from public.prediction_markets pm
        where pm.prediction_version_id = pv.id
          and pm.market = 'over_2_5'
          and pm.selection = 'over'
      )
      and exists (
        select 1
        from public.prediction_markets pm
        where pm.prediction_version_id = pv.id
          and pm.market = 'over_2_5'
          and pm.selection = 'under'
      )
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
    from public.prediction_versions pv
    join public.matches m
      on m.id = pv.match_id
    join public.competitions c
      on c.id = m.competition_id
    join public.match_results mr
      on mr.match_id = m.id
    where pv.id = prediction_results.prediction_version_id
      and pv.run_scope = 'internal_lab'
      and m.access_scope = 'lab_only'
      and c.usage_scope = 'internal_lab'
      and mr.verification_status = 'verified'
      and mr.home_goals = prediction_results.actual_home_goals
      and mr.away_goals = prediction_results.actual_away_goals
      and exists (
        select 1
        from public.prediction_markets pm
        where pm.prediction_version_id = pv.id
          and pm.market = 'btts'
          and pm.selection = 'yes'
      )
      and exists (
        select 1
        from public.prediction_markets pm
        where pm.prediction_version_id = pv.id
          and pm.market = 'btts'
          and pm.selection = 'no'
      )
      and exists (
        select 1
        from public.prediction_markets pm
        where pm.prediction_version_id = pv.id
          and pm.market = 'over_2_5'
          and pm.selection = 'over'
      )
      and exists (
        select 1
        from public.prediction_markets pm
        where pm.prediction_version_id = pv.id
          and pm.market = 'over_2_5'
          and pm.selection = 'under'
      )
  )
);
