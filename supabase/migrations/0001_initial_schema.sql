create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  country text,
  preferred_language text not null default 'es',
  role text not null default 'free_user'
    check (role in ('free_user', 'premium_user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  price numeric(12, 2) not null default 0 check (price >= 0),
  currency text not null default 'USD' check (currency in ('USD', 'COP', 'EUR')),
  billing_type text not null
    check (billing_type in ('free', 'one_time', 'monthly', 'custom_pack')),
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create table public.plan_features (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans(id) on delete cascade,
  feature_key text not null,
  feature_value jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (plan_id, feature_key)
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.plans(id),
  status text not null default 'pending'
    check (status in ('active', 'expired', 'cancelled', 'pending')),
  starts_at timestamptz,
  ends_at timestamptz,
  payment_provider text,
  provider_customer_id text,
  provider_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create table public.competitions (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  name text not null,
  slug text not null unique,
  country text,
  type text not null check (type in ('international', 'league', 'cup')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.seasons (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions(id) on delete cascade,
  name text not null,
  year integer not null,
  starts_at date not null,
  ends_at date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, competition_id),
  unique (competition_id, year),
  check (ends_at >= starts_at)
);

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  name text not null,
  slug text not null unique,
  country text,
  logo_url text,
  flag_url text,
  fifa_rank integer check (fifa_rank is null or fifa_rank > 0),
  elo_rating numeric(8, 2) check (elo_rating is null or elo_rating >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.players (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  team_id uuid references public.teams(id) on delete set null,
  name text not null,
  position text,
  is_key_player boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.venues (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  name text not null,
  city text,
  country text,
  capacity integer check (capacity is null or capacity >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  slug text not null unique,
  competition_id uuid not null references public.competitions(id),
  season_id uuid not null,
  home_team_id uuid not null references public.teams(id),
  away_team_id uuid not null references public.teams(id),
  venue_id uuid references public.venues(id) on delete set null,
  kickoff_at timestamptz not null,
  stage text,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'live', 'finished', 'postponed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (season_id, competition_id) references public.seasons(id, competition_id),
  check (home_team_id <> away_team_id)
);

create table public.user_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entitlement_type text not null,
  resource_type text not null
    check (resource_type in ('competition', 'match', 'stage', 'team', 'global')),
  resource_id text not null,
  quantity integer check (quantity is null or quantity >= 0),
  starts_at timestamptz,
  ends_at timestamptz,
  source_plan_id uuid references public.plans(id) on delete set null,
  created_at timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create table public.user_match_unlocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  match_id uuid not null references public.matches(id) on delete cascade,
  source_plan_id uuid references public.plans(id) on delete set null,
  unlocked_at timestamptz not null default now(),
  expires_at timestamptz,
  unique (user_id, match_id, source_plan_id),
  check (expires_at is null or expires_at > unlocked_at)
);

create table public.team_form_snapshots (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  snapshot_date date not null,
  last_matches_count integer not null check (last_matches_count >= 0),
  wins integer not null default 0 check (wins >= 0),
  draws integer not null default 0 check (draws >= 0),
  losses integer not null default 0 check (losses >= 0),
  goals_for integer not null default 0 check (goals_for >= 0),
  goals_against integer not null default 0 check (goals_against >= 0),
  form_score numeric(6, 4) check (form_score is null or form_score between 0 and 1),
  created_at timestamptz not null default now(),
  unique (team_id, snapshot_date)
);

create table public.lineups (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  is_confirmed boolean not null default false,
  formation text,
  players_json jsonb not null default '[]'::jsonb,
  captured_at timestamptz not null default now(),
  source text,
  created_at timestamptz not null default now()
);

create table public.odds_snapshots (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  bookmaker text not null,
  market text not null,
  selection text not null,
  odds_decimal numeric(10, 4) not null check (odds_decimal > 0),
  implied_probability numeric(7, 4) not null check (implied_probability between 0 and 100),
  captured_at timestamptz not null default now(),
  source text,
  created_at timestamptz not null default now()
);

create table public.model_versions (
  id uuid primary key default gen_random_uuid(),
  version text not null unique,
  description text,
  weights_json jsonb not null default '{}'::jsonb,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.prediction_versions (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  model_version_id uuid not null references public.model_versions(id),
  prediction_type text not null
    check (prediction_type in ('pre_match_24h', 'pre_match_6h', 'post_lineup', 'pre_kickoff')),
  home_win_prob numeric(7, 4) not null check (home_win_prob between 0 and 100),
  draw_prob numeric(7, 4) not null check (draw_prob between 0 and 100),
  away_win_prob numeric(7, 4) not null check (away_win_prob between 0 and 100),
  expected_home_goals numeric(7, 4) not null check (expected_home_goals >= 0),
  expected_away_goals numeric(7, 4) not null check (expected_away_goals >= 0),
  most_likely_score text not null,
  top_scores_json jsonb not null default '[]'::jsonb,
  confidence_score numeric(7, 4) not null check (confidence_score between 0 and 100),
  risk_level text not null check (risk_level in ('low', 'medium', 'high')),
  created_at timestamptz not null default now(),
  check (home_win_prob + draw_prob + away_win_prob between 99.5 and 100.5)
);

create table public.prediction_markets (
  id uuid primary key default gen_random_uuid(),
  prediction_version_id uuid not null references public.prediction_versions(id) on delete cascade,
  market text not null check (market in ('match_winner', 'over_2_5', 'btts', 'exact_score')),
  selection text not null,
  probability numeric(7, 4) not null check (probability between 0 and 100),
  confidence numeric(7, 4) check (confidence is null or confidence between 0 and 100),
  is_premium boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.prediction_narratives (
  id uuid primary key default gen_random_uuid(),
  prediction_version_id uuid not null references public.prediction_versions(id) on delete cascade,
  locale text not null check (locale in ('es', 'en')),
  free_summary text not null,
  premium_analysis text,
  why_it_changed text,
  risk_notes text,
  created_at timestamptz not null default now(),
  unique (prediction_version_id, locale)
);

create table public.prediction_results (
  id uuid primary key default gen_random_uuid(),
  prediction_version_id uuid not null unique references public.prediction_versions(id) on delete cascade,
  actual_home_goals integer not null check (actual_home_goals >= 0),
  actual_away_goals integer not null check (actual_away_goals >= 0),
  winner_correct boolean,
  btts_correct boolean,
  over_2_5_correct boolean,
  exact_score_correct boolean,
  goal_error numeric(8, 4) check (goal_error is null or goal_error >= 0),
  error_summary text,
  validated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.worker_runs (
  id uuid primary key default gen_random_uuid(),
  worker_name text not null,
  status text not null check (status in ('queued', 'running', 'success', 'failed')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  records_processed integer not null default 0 check (records_processed >= 0),
  error_message text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (finished_at is null or finished_at >= started_at)
);

create table public.email_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  type text not null,
  status text not null default 'queued' check (status in ('queued', 'sent', 'failed')),
  provider_message_id text,
  metadata_json jsonb not null default '{}'::jsonb,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  error_message text
);

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger plans_set_updated_at before update on public.plans
for each row execute function public.set_updated_at();
create trigger subscriptions_set_updated_at before update on public.subscriptions
for each row execute function public.set_updated_at();
create trigger competitions_set_updated_at before update on public.competitions
for each row execute function public.set_updated_at();
create trigger seasons_set_updated_at before update on public.seasons
for each row execute function public.set_updated_at();
create trigger teams_set_updated_at before update on public.teams
for each row execute function public.set_updated_at();
create trigger players_set_updated_at before update on public.players
for each row execute function public.set_updated_at();
create trigger venues_set_updated_at before update on public.venues
for each row execute function public.set_updated_at();
create trigger matches_set_updated_at before update on public.matches
for each row execute function public.set_updated_at();
create trigger model_versions_set_updated_at before update on public.model_versions
for each row execute function public.set_updated_at();

create index plan_features_plan_id_idx on public.plan_features (plan_id);
create index subscriptions_user_id_idx on public.subscriptions (user_id);
create index subscriptions_status_idx on public.subscriptions (status);
create index seasons_competition_id_idx on public.seasons (competition_id);
create index players_team_id_idx on public.players (team_id);
create index matches_competition_id_idx on public.matches (competition_id);
create index matches_season_id_idx on public.matches (season_id);
create index matches_home_team_id_idx on public.matches (home_team_id);
create index matches_away_team_id_idx on public.matches (away_team_id);
create index matches_kickoff_at_idx on public.matches (kickoff_at);
create index matches_status_idx on public.matches (status);
create index user_entitlements_user_id_idx on public.user_entitlements (user_id);
create index user_entitlements_created_at_idx on public.user_entitlements (created_at);
create index user_match_unlocks_user_id_idx on public.user_match_unlocks (user_id);
create index user_match_unlocks_match_id_idx on public.user_match_unlocks (match_id);
create index team_form_snapshots_team_id_idx on public.team_form_snapshots (team_id);
create index lineups_match_id_idx on public.lineups (match_id);
create index lineups_team_id_idx on public.lineups (team_id);
create index lineups_captured_at_idx on public.lineups (captured_at);
create index odds_snapshots_match_id_idx on public.odds_snapshots (match_id);
create index odds_snapshots_captured_at_idx on public.odds_snapshots (captured_at);
create index prediction_versions_match_id_idx on public.prediction_versions (match_id);
create index prediction_versions_created_at_idx on public.prediction_versions (created_at);
create index prediction_markets_prediction_version_id_idx on public.prediction_markets (prediction_version_id);
create index prediction_narratives_prediction_version_id_idx on public.prediction_narratives (prediction_version_id);
create index worker_runs_status_idx on public.worker_runs (status);
create index worker_runs_created_at_idx on public.worker_runs (created_at);
create index email_events_user_id_idx on public.email_events (user_id);
create index email_events_status_idx on public.email_events (status);
create index email_events_created_at_idx on public.email_events (created_at);

alter table public.profiles enable row level security;
alter table public.plans enable row level security;
alter table public.plan_features enable row level security;
alter table public.subscriptions enable row level security;
alter table public.user_entitlements enable row level security;
alter table public.user_match_unlocks enable row level security;
alter table public.competitions enable row level security;
alter table public.seasons enable row level security;
alter table public.teams enable row level security;
alter table public.players enable row level security;
alter table public.venues enable row level security;
alter table public.matches enable row level security;
alter table public.team_form_snapshots enable row level security;
alter table public.lineups enable row level security;
alter table public.odds_snapshots enable row level security;
alter table public.model_versions enable row level security;
alter table public.prediction_versions enable row level security;
alter table public.prediction_markets enable row level security;
alter table public.prediction_narratives enable row level security;
alter table public.prediction_results enable row level security;
alter table public.worker_runs enable row level security;
alter table public.email_events enable row level security;

create policy "Users may read their own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

-- TODO(auth/paywall): add controlled profile updates without permitting role escalation.
-- TODO(auth/paywall): define server-managed policies for subscriptions and entitlements.
-- TODO(api/paywall): expose only the approved free projection of predictions.
-- TODO(api): define read access for public football and plan catalog data.
-- TODO(email): define service-side access patterns for email_events before app integration.
