drop policy if exists "Public may read public product competitions"
on public.competitions;

drop policy if exists "Public may read public product matches"
on public.matches;

drop policy if exists "Public may read teams used in public product matches"
on public.teams;

drop policy if exists "Public may read venues used in public product matches"
on public.venues;

drop policy if exists "Public may read public product prediction versions"
on public.prediction_versions;

revoke all privileges on public.competitions from anon;
revoke all privileges on public.matches from anon;
revoke all privileges on public.teams from anon;
revoke all privileges on public.venues from anon;
revoke all privileges on public.prediction_versions from anon;

revoke all privileges on public.prediction_markets from anon;
revoke all privileges on public.prediction_narratives from anon;
revoke all privileges on public.prediction_results from anon;

-- Authenticated base-table grants are retained for the existing RLS-protected
-- admin Lab workflow. Without the public policies above, non-admin viewers
-- cannot read public product rows from those tables directly.
-- The views below intentionally become the public read boundary: their
-- explicit select lists and scope filters must not be expanded casually.

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
  venues.city as venue_city
from public.matches
join public.competitions
  on competitions.id = matches.competition_id
join public.teams as home_teams
  on home_teams.id = matches.home_team_id
join public.teams as away_teams
  on away_teams.id = matches.away_team_id
left join public.venues
  on venues.id = matches.venue_id
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
  prediction_versions.risk_level
from public.matches
join public.competitions
  on competitions.id = matches.competition_id
join public.teams as home_teams
  on home_teams.id = matches.home_team_id
join public.teams as away_teams
  on away_teams.id = matches.away_team_id
left join public.venues
  on venues.id = matches.venue_id
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
