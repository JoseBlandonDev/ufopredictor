-- C07B.1
-- Public match access context for server-side premium access gate preparation.
-- This migration does NOT expose premium payload tables. It only adds safe IDs/keys
-- to the existing public projection boundary.
--
-- Canonical competition access key rule:
-- - world-cup-2026 -> world_cup_2026 (explicit normalization for World Cup package keys)
-- - all other slugs -> replace(slug, '-', '_') for stable server-side matching

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
  away_teams.id as away_team_id
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

revoke all on public.public_match_details from public;
revoke all privileges on public.public_match_details from anon, authenticated;
grant select on public.public_match_details to anon, authenticated;
