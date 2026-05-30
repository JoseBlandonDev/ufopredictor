create table if not exists public.user_saved_matches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  match_id uuid not null references public.matches(id) on delete cascade,
  saved_at timestamptz not null default now(),
  unique (user_id, match_id)
);

create index if not exists user_saved_matches_user_id_idx
  on public.user_saved_matches (user_id);

create index if not exists user_saved_matches_match_id_idx
  on public.user_saved_matches (match_id);

alter table public.user_saved_matches enable row level security;

revoke all privileges on table public.user_saved_matches from authenticated;
revoke all privileges on table public.user_saved_matches from anon;

grant select, insert, delete on table public.user_saved_matches to authenticated;

drop policy if exists "Users may read their own saved matches"
on public.user_saved_matches;

create policy "Users may read their own saved matches"
on public.user_saved_matches
for select
to authenticated
using (
  user_id = (select auth.uid())
);

drop policy if exists "Users may insert their own saved matches"
on public.user_saved_matches;

create policy "Users may insert their own saved matches"
on public.user_saved_matches
for insert
to authenticated
with check (
  user_id = (select auth.uid())
);

drop policy if exists "Users may delete their own saved matches"
on public.user_saved_matches;

create policy "Users may delete their own saved matches"
on public.user_saved_matches
for delete
to authenticated
using (
  user_id = (select auth.uid())
);

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
  matches.id as match_id
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