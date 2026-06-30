create table if not exists public.team_tournament_standing_snapshots (
  id uuid primary key default gen_random_uuid(),
  source_snapshot_id text not null references public.source_snapshots(snapshot_id) on delete cascade,
  competition_id uuid not null references public.competitions(id) on delete restrict,
  season_id uuid not null references public.seasons(id) on delete restrict,
  stage_key text not null,
  group_key text not null,
  canonical_team_key text not null,
  position integer not null check (position > 0),
  matches_played integer not null check (matches_played >= 0),
  wins integer not null check (wins >= 0),
  draws integer not null check (draws >= 0),
  losses integer not null check (losses >= 0),
  goals_for integer not null check (goals_for >= 0),
  goals_against integer not null check (goals_against >= 0),
  goal_difference integer not null,
  points integer not null check (points >= 0),
  source_reported_qualification_status text
    check (source_reported_qualification_status in ('qualified', 'eliminated')),
  effective_at timestamptz not null,
  captured_at timestamptz not null,
  cutoff_at timestamptz not null,
  reliability_json jsonb not null default '{}'::jsonb,
  missing_data_json jsonb not null default '{}'::jsonb,
  disagreement_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint team_tournament_standing_snapshots_natural_key
    unique (source_snapshot_id, competition_id, season_id, stage_key, group_key, canonical_team_key),
  constraint team_tournament_standing_snapshots_matches_played_check
    check (matches_played = wins + draws + losses),
  constraint team_tournament_standing_snapshots_goal_difference_check
    check (goal_difference = goals_for - goals_against),
  constraint team_tournament_standing_snapshots_timestamp_order_check
    check (effective_at <= captured_at and captured_at <= cutoff_at)
);

alter table public.team_tournament_standing_snapshots enable row level security;

drop policy if exists "No direct reads for team tournament standing snapshots" on public.team_tournament_standing_snapshots;
create policy "No direct reads for team tournament standing snapshots"
  on public.team_tournament_standing_snapshots for select
  using (false);

create index if not exists team_tournament_standing_snapshots_lookup_idx
  on public.team_tournament_standing_snapshots (competition_id, season_id, stage_key, group_key, effective_at desc, position);

create index if not exists team_tournament_standing_snapshots_team_idx
  on public.team_tournament_standing_snapshots (canonical_team_key, effective_at desc);

create index if not exists team_tournament_standing_snapshots_source_snapshot_idx
  on public.team_tournament_standing_snapshots (source_snapshot_id);
