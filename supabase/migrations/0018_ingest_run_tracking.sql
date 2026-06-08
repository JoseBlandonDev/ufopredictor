begin;

create table public.ingest_runs (
  id uuid primary key default gen_random_uuid(),
  provider text not null
    check (provider in ('api_football')),
  competition_key text not null,
  provider_league_id integer not null,
  from_date date not null,
  to_date date not null,
  limit_value integer not null
    check (limit_value > 0),
  apply_mode boolean not null
    check (apply_mode = true),
  run_tag text not null,
  source_note text not null,
  status text not null
    check (status in ('started', 'completed', 'failed', 'rolled_back_partial', 'rolled_back_full')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  fetched_fixtures_count integer not null default 0,
  planned_fixtures_count integer not null default 0,
  counts_summary jsonb not null default '{}'::jsonb,
  warnings_summary jsonb,
  errors_summary jsonb,
  cli_args jsonb not null default '{}'::jsonb,
  execution_context text not null default 'local_cli_script',
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (fetched_fixtures_count >= 0),
  check (planned_fixtures_count >= 0),
  check (to_date >= from_date),
  check (finished_at is null or finished_at >= started_at)
);

create table public.ingest_run_items (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.ingest_runs(id) on delete cascade,
  entity_table text not null
    check (entity_table in ('competitions', 'seasons', 'teams', 'matches', 'match_results')),
  entity_id uuid,
  entity_external_id text,
  entity_natural_key jsonb,
  action text not null
    check (action in ('created', 'updated', 'skipped', 'error')),
  before_snapshot jsonb,
  after_snapshot jsonb,
  skip_reason text,
  error_message text,
  recorded_at timestamptz not null default now(),
  check (action <> 'updated' or before_snapshot is not null),
  check (action <> 'skipped' or skip_reason is not null),
  check (action <> 'error' or error_message is not null)
);

create trigger ingest_runs_set_updated_at before update on public.ingest_runs
for each row execute function public.set_updated_at();

create index ingest_runs_provider_competition_started_at_idx
  on public.ingest_runs (provider, competition_key, started_at desc);

create index ingest_runs_run_tag_idx
  on public.ingest_runs (run_tag);

create index ingest_run_items_run_id_idx
  on public.ingest_run_items (run_id);

create index ingest_run_items_entity_table_entity_id_idx
  on public.ingest_run_items (entity_table, entity_id);

create index ingest_run_items_entity_table_entity_external_id_idx
  on public.ingest_run_items (entity_table, entity_external_id);

create index ingest_run_items_action_idx
  on public.ingest_run_items (action);

alter table public.ingest_runs enable row level security;
alter table public.ingest_run_items enable row level security;

commit;
