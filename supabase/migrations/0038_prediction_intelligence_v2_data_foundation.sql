create table if not exists public.source_snapshots (
  id uuid primary key default gen_random_uuid(),
  source_key text not null,
  snapshot_id text not null unique,
  data_kind text not null,
  source_url text,
  local_fallback_path text,
  normalized_snapshot_path text,
  effective_at timestamptz,
  captured_at timestamptz,
  payload_hash text not null,
  row_count integer not null default 0 check (row_count >= 0),
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (source_key, payload_hash)
);

create table if not exists public.canonical_team_aliases (
  id uuid primary key default gen_random_uuid(),
  canonical_team_key text not null,
  alias_raw text not null,
  alias_normalized text not null,
  source_scope text not null,
  resolution_status text not null
    check (resolution_status in ('resolved', 'pending', 'blocked')),
  source_snapshot_id text references public.source_snapshots(snapshot_id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (alias_normalized, source_scope)
);

create table if not exists public.canonical_team_localizations (
  id uuid primary key default gen_random_uuid(),
  canonical_team_key text not null,
  locale text not null,
  display_name text not null,
  fifa_code text,
  iso_alpha3 text,
  source_snapshot_id text references public.source_snapshots(snapshot_id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (canonical_team_key, locale)
);

create table if not exists public.canonical_team_links (
  id uuid primary key default gen_random_uuid(),
  canonical_team_key text not null unique,
  team_id uuid references public.teams(id) on delete set null,
  api_football_team_id integer,
  runtime_team_slug text,
  link_status text not null default 'linked'
    check (link_status in ('linked', 'candidate', 'unresolved')),
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.team_rating_snapshots (
  id uuid primary key default gen_random_uuid(),
  source_key text not null check (source_key in ('elo', 'fifa', 'ufo')),
  effective_at timestamptz not null,
  captured_at timestamptz,
  canonical_team_key text not null,
  rank integer,
  rating_or_points numeric(10, 4),
  source_snapshot_id text not null references public.source_snapshots(snapshot_id) on delete cascade,
  raw_values jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (source_key, effective_at, canonical_team_key)
);

create table if not exists public.historical_match_facts (
  id uuid primary key default gen_random_uuid(),
  natural_match_key text not null,
  match_date date not null,
  team_1_key text not null,
  team_2_key text not null,
  competition_key text not null,
  venue_context_key text,
  neutral boolean,
  score_1 integer not null check (score_1 >= 0),
  score_2 integer not null check (score_2 >= 0),
  pre_match_elo_1 numeric(10, 4),
  pre_match_elo_2 numeric(10, 4),
  post_match_elo_1 numeric(10, 4),
  post_match_elo_2 numeric(10, 4),
  source_snapshot_id text not null references public.source_snapshots(snapshot_id) on delete cascade,
  correction_of_id uuid references public.historical_match_facts(id) on delete set null,
  raw_values jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (source_snapshot_id, natural_match_key)
);

create table if not exists public.historical_match_fact_links (
  id uuid primary key default gen_random_uuid(),
  historical_match_fact_id uuid not null references public.historical_match_facts(id) on delete cascade,
  match_id uuid references public.matches(id) on delete set null,
  api_football_fixture_id integer,
  link_status text not null default 'candidate'
    check (link_status in ('linked', 'candidate', 'unresolved')),
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (historical_match_fact_id)
);

create table if not exists public.schedule_snapshots (
  id uuid primary key default gen_random_uuid(),
  tournament_key text not null,
  snapshot_id text not null unique,
  source_snapshot_id text references public.source_snapshots(snapshot_id) on delete set null,
  version_label text,
  published_timezone text,
  created_at timestamptz not null default now()
);

create table if not exists public.world_cup_venue_catalog (
  id uuid primary key default gen_random_uuid(),
  venue_key text not null unique,
  venue_id uuid references public.venues(id) on delete set null,
  host_city_key text not null,
  host_city_name_es text not null,
  host_city_name_en text not null,
  common_name text not null,
  fifa_tournament_name text not null,
  actual_city text not null,
  country_code text not null,
  timezone text not null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.official_schedule_matches (
  id uuid primary key default gen_random_uuid(),
  schedule_snapshot_id uuid not null references public.schedule_snapshots(id) on delete cascade,
  tournament_key text not null,
  official_match_number integer not null,
  stage_key text not null,
  group_key text,
  home_slot text not null,
  away_slot text not null,
  home_team_key text,
  away_team_key text,
  scheduled_at_utc timestamptz not null,
  published_time text not null,
  published_timezone text not null,
  venue_key text not null references public.world_cup_venue_catalog(venue_key) on delete restrict,
  source_snapshot_id text not null references public.source_snapshots(snapshot_id) on delete cascade,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tournament_key, official_match_number)
);

create table if not exists public.official_schedule_match_links (
  id uuid primary key default gen_random_uuid(),
  official_schedule_match_id uuid not null references public.official_schedule_matches(id) on delete cascade,
  match_id uuid references public.matches(id) on delete set null,
  api_football_fixture_id integer,
  link_status text not null default 'candidate'
    check (link_status in ('linked', 'candidate', 'unresolved')),
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (official_schedule_match_id)
);

create table if not exists public.signal_snapshots (
  id uuid primary key default gen_random_uuid(),
  signal_version text not null,
  cutoff_at timestamptz not null,
  canonical_team_key text not null,
  sample_sizes jsonb not null default '{}'::jsonb,
  structural_strength jsonb not null default '{}'::jsonb,
  recent_form jsonb not null default '{}'::jsonb,
  opponent_adjusted_form jsonb not null default '{}'::jsonb,
  tournament_form jsonb not null default '{}'::jsonb,
  attack jsonb not null default '{}'::jsonb,
  defense jsonb not null default '{}'::jsonb,
  performance_vs_expectation jsonb not null default '{}'::jsonb,
  reliability jsonb not null default '{}'::jsonb,
  source_snapshot_ids jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (signal_version, cutoff_at, canonical_team_key)
);

alter table public.source_snapshots enable row level security;
alter table public.canonical_team_aliases enable row level security;
alter table public.canonical_team_localizations enable row level security;
alter table public.canonical_team_links enable row level security;
alter table public.team_rating_snapshots enable row level security;
alter table public.historical_match_facts enable row level security;
alter table public.historical_match_fact_links enable row level security;
alter table public.schedule_snapshots enable row level security;
alter table public.world_cup_venue_catalog enable row level security;
alter table public.official_schedule_matches enable row level security;
alter table public.official_schedule_match_links enable row level security;
alter table public.signal_snapshots enable row level security;

drop policy if exists "No direct reads for source snapshots" on public.source_snapshots;
create policy "No direct reads for source snapshots"
  on public.source_snapshots for select
  using (false);

drop policy if exists "No direct reads for canonical team aliases" on public.canonical_team_aliases;
create policy "No direct reads for canonical team aliases"
  on public.canonical_team_aliases for select
  using (false);

drop policy if exists "No direct reads for canonical team localizations" on public.canonical_team_localizations;
create policy "No direct reads for canonical team localizations"
  on public.canonical_team_localizations for select
  using (false);

drop policy if exists "No direct reads for canonical team links" on public.canonical_team_links;
create policy "No direct reads for canonical team links"
  on public.canonical_team_links for select
  using (false);

drop policy if exists "No direct reads for team rating snapshots" on public.team_rating_snapshots;
create policy "No direct reads for team rating snapshots"
  on public.team_rating_snapshots for select
  using (false);

drop policy if exists "No direct reads for historical match facts" on public.historical_match_facts;
create policy "No direct reads for historical match facts"
  on public.historical_match_facts for select
  using (false);

drop policy if exists "No direct reads for historical match fact links" on public.historical_match_fact_links;
create policy "No direct reads for historical match fact links"
  on public.historical_match_fact_links for select
  using (false);

drop policy if exists "No direct reads for schedule snapshots" on public.schedule_snapshots;
create policy "No direct reads for schedule snapshots"
  on public.schedule_snapshots for select
  using (false);

drop policy if exists "No direct reads for world cup venue catalog" on public.world_cup_venue_catalog;
create policy "No direct reads for world cup venue catalog"
  on public.world_cup_venue_catalog for select
  using (false);

drop policy if exists "No direct reads for official schedule matches" on public.official_schedule_matches;
create policy "No direct reads for official schedule matches"
  on public.official_schedule_matches for select
  using (false);

drop policy if exists "No direct reads for official schedule match links" on public.official_schedule_match_links;
create policy "No direct reads for official schedule match links"
  on public.official_schedule_match_links for select
  using (false);

drop policy if exists "No direct reads for signal snapshots" on public.signal_snapshots;
create policy "No direct reads for signal snapshots"
  on public.signal_snapshots for select
  using (false);

create index if not exists historical_match_facts_identity_idx
  on public.historical_match_facts (match_date, team_1_key, team_2_key, competition_key);

create index if not exists official_schedule_matches_kickoff_idx
  on public.official_schedule_matches (scheduled_at_utc, official_match_number);

create index if not exists team_rating_snapshots_lookup_idx
  on public.team_rating_snapshots (canonical_team_key, source_key, effective_at desc);
