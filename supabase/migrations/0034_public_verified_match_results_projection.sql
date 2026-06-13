-- Public-safe verified result projection for already-public matches.
-- This exposes only the final verified score alongside existing public match
-- and prediction views. It does not expose prediction_results, review notes,
-- admin metadata, or any internal evaluation payload.

create or replace view public.public_match_details
with (security_barrier = true)
as
select
  matches.slug as match_slug,
  matches.kickoff_at,
  matches.stage,
  matches.status,
  competitions.name as competition_name,
  competitions.slug as competition_slug,
  home_teams.name as home_team_name,
  home_teams.slug as home_team_slug,
  home_teams.logo_url as home_team_logo_url,
  home_teams.flag_url as home_team_flag_url,
  away_teams.name as away_team_name,
  away_teams.slug as away_team_slug,
  away_teams.logo_url as away_team_logo_url,
  away_teams.flag_url as away_team_flag_url,
  venues.name as venue_name,
  venues.city as venue_city,
  matches.id as match_id,
  competitions.id as competition_id,
  case
    when competitions.slug = 'world-cup-2026' then 'world_cup_2026'
    else replace(lower(competitions.slug), '-', '_')
  end as competition_access_key,
  home_teams.id as home_team_id,
  away_teams.id as away_team_id,
  verified_result.home_goals as verified_home_goals,
  verified_result.away_goals as verified_away_goals,
  verified_result.verification_status as result_verification_status
from public.matches
join public.competitions
  on competitions.id = matches.competition_id
join public.teams as home_teams
  on home_teams.id = matches.home_team_id
join public.teams as away_teams
  on away_teams.id = matches.away_team_id
left join public.venues
  on venues.id = matches.venue_id
left join lateral (
  select
    match_results.home_goals,
    match_results.away_goals,
    match_results.verification_status
  from public.match_results
  where match_results.match_id = matches.id
    and match_results.verification_status = 'verified'
  order by
    match_results.reviewed_at desc nulls last,
    match_results.recorded_at desc,
    match_results.id desc
  limit 1
) as verified_result
  on true
where matches.access_scope = 'public'
  and competitions.usage_scope = 'public_product';

create or replace view public.public_prediction_summaries
with (security_barrier = true)
as
select distinct on (matches.slug)
  matches.slug as match_slug,
  matches.kickoff_at,
  matches.stage,
  matches.status,
  competitions.name as competition_name,
  competitions.slug as competition_slug,
  home_teams.name as home_team_name,
  home_teams.slug as home_team_slug,
  home_teams.logo_url as home_team_logo_url,
  home_teams.flag_url as home_team_flag_url,
  away_teams.name as away_team_name,
  away_teams.slug as away_team_slug,
  away_teams.logo_url as away_team_logo_url,
  away_teams.flag_url as away_team_flag_url,
  venues.name as venue_name,
  venues.city as venue_city,
  prediction_versions.created_at as prediction_created_at,
  prediction_versions.home_win_prob,
  prediction_versions.draw_prob,
  prediction_versions.away_win_prob,
  prediction_versions.confidence_score,
  prediction_versions.risk_level,
  verified_result.home_goals as verified_home_goals,
  verified_result.away_goals as verified_away_goals,
  verified_result.verification_status as result_verification_status
from public.matches
join public.competitions
  on competitions.id = matches.competition_id
join public.teams as home_teams
  on home_teams.id = matches.home_team_id
join public.teams as away_teams
  on away_teams.id = matches.away_team_id
left join public.venues
  on venues.id = matches.venue_id
left join lateral (
  select
    match_results.home_goals,
    match_results.away_goals,
    match_results.verification_status
  from public.match_results
  where match_results.match_id = matches.id
    and match_results.verification_status = 'verified'
  order by
    match_results.reviewed_at desc nulls last,
    match_results.recorded_at desc,
    match_results.id desc
  limit 1
) as verified_result
  on true
join public.prediction_versions
  on prediction_versions.match_id = matches.id
where matches.access_scope = 'public'
  and competitions.usage_scope = 'public_product'
  and prediction_versions.run_scope = 'public_product'
order by matches.slug, prediction_versions.created_at desc, prediction_versions.id desc;

revoke all on public.public_match_details from public;
revoke all on public.public_prediction_summaries from public;
revoke all privileges on public.public_match_details from anon, authenticated;
revoke all privileges on public.public_prediction_summaries from anon, authenticated;

grant select on public.public_match_details to anon, authenticated;
grant select on public.public_prediction_summaries to anon, authenticated;
