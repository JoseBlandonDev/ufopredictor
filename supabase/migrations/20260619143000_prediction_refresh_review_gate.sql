create table if not exists public.prediction_review_cases (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  current_prediction_version_id uuid references public.prediction_versions(id) on delete set null,
  source_snapshot_id text not null,
  provider_status text,
  provider_status_short text,
  provider_kickoff_at timestamptz,
  home_team_name_en text not null,
  away_team_name_en text not null,
  home_team_display_name_es text not null,
  away_team_display_name_es text not null,
  model_version_id uuid references public.model_versions(id) on delete set null,
  refresh_alerts_json jsonb not null default '[]'::jsonb,
  coherence_alerts_json jsonb not null default '[]'::jsonb,
  retained_fixture_override boolean not null default false,
  status text not null default 'pending'
    check (status in ('pending', 'kept_current', 'published_refreshed', 'held')),
  latest_shadow_snapshot_id uuid,
  latest_reviewed_xg_snapshot_id uuid,
  latest_ai_execution_id uuid,
  latest_decision_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.prediction_review_snapshots (
  id uuid primary key default gen_random_uuid(),
  review_case_id uuid not null references public.prediction_review_cases(id) on delete cascade,
  source_prediction_version_id uuid references public.prediction_versions(id) on delete set null,
  snapshot_kind text not null
    check (snapshot_kind in ('current_reference', 'shadow_refresh', 'reviewed_xg_preview', 'published_output')),
  source_snapshot_id text not null,
  model_version_id uuid references public.model_versions(id) on delete set null,
  prediction_type text not null
    check (prediction_type in ('pre_match_24h', 'pre_match_6h', 'post_lineup', 'pre_kickoff')),
  review_run_scope text not null
    check (review_run_scope in ('current_reference', 'shadow_review', 'review_preview', 'published_output')),
  home_win_prob numeric(7, 4) not null check (home_win_prob between 0 and 100),
  draw_prob numeric(7, 4) not null check (draw_prob between 0 and 100),
  away_win_prob numeric(7, 4) not null check (away_win_prob between 0 and 100),
  expected_home_goals numeric(7, 4) not null check (expected_home_goals >= 0),
  expected_away_goals numeric(7, 4) not null check (expected_away_goals >= 0),
  most_likely_score text not null,
  top_scores_json jsonb not null default '[]'::jsonb,
  btts_yes_prob numeric(7, 4) not null check (btts_yes_prob between 0 and 100),
  btts_no_prob numeric(7, 4) not null check (btts_no_prob between 0 and 100),
  over_2_5_over_prob numeric(7, 4) not null check (over_2_5_over_prob between 0 and 100),
  over_2_5_under_prob numeric(7, 4) not null check (over_2_5_under_prob between 0 and 100),
  confidence_score numeric(7, 4) not null check (confidence_score between 0 and 100),
  risk_level text not null check (risk_level in ('low', 'medium', 'high')),
  bundle_json jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (home_win_prob + draw_prob + away_win_prob between 99.5 and 100.5)
);

create table if not exists public.prediction_review_ai_executions (
  id uuid primary key default gen_random_uuid(),
  review_case_id uuid not null references public.prediction_review_cases(id) on delete cascade,
  provider text not null,
  model text,
  status text not null check (status in ('succeeded', 'failed', 'unavailable')),
  request_json jsonb not null default '{}'::jsonb,
  response_json jsonb,
  error_message text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.prediction_review_decisions (
  id uuid primary key default gen_random_uuid(),
  review_case_id uuid not null references public.prediction_review_cases(id) on delete cascade,
  ai_execution_id uuid references public.prediction_review_ai_executions(id) on delete set null,
  selected_snapshot_id uuid references public.prediction_review_snapshots(id) on delete set null,
  published_prediction_version_id uuid references public.prediction_versions(id) on delete set null,
  decision text not null
    check (decision in ('KEEP_CURRENT', 'PUBLISH_REFRESHED', 'PROPOSE_REVIEWED_XG', 'HOLD')),
  reason text not null,
  rationale text,
  evidence_used_json jsonb not null default '[]'::jsonb,
  contradictions_json jsonb not null default '[]'::jsonb,
  confidence_label text check (confidence_label in ('low', 'medium', 'high')),
  proposed_home_xg numeric(7, 4) check (proposed_home_xg is null or proposed_home_xg >= 0),
  proposed_away_xg numeric(7, 4) check (proposed_away_xg is null or proposed_away_xg >= 0),
  warnings_json jsonb not null default '[]'::jsonb,
  human_approval_required boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.prediction_review_cases
  add constraint prediction_review_cases_latest_shadow_snapshot_id_fkey
  foreign key (latest_shadow_snapshot_id) references public.prediction_review_snapshots(id) on delete set null;

alter table public.prediction_review_cases
  add constraint prediction_review_cases_latest_reviewed_xg_snapshot_id_fkey
  foreign key (latest_reviewed_xg_snapshot_id) references public.prediction_review_snapshots(id) on delete set null;

alter table public.prediction_review_cases
  add constraint prediction_review_cases_latest_ai_execution_id_fkey
  foreign key (latest_ai_execution_id) references public.prediction_review_ai_executions(id) on delete set null;

alter table public.prediction_review_cases
  add constraint prediction_review_cases_latest_decision_id_fkey
  foreign key (latest_decision_id) references public.prediction_review_decisions(id) on delete set null;

create trigger prediction_review_cases_set_updated_at before update on public.prediction_review_cases
for each row execute function public.set_updated_at();

create index if not exists prediction_review_cases_match_id_idx on public.prediction_review_cases (match_id);
create unique index if not exists prediction_review_cases_match_id_unique on public.prediction_review_cases (match_id);
create index if not exists prediction_review_cases_created_at_idx on public.prediction_review_cases (created_at desc);
create index if not exists prediction_review_snapshots_review_case_id_idx on public.prediction_review_snapshots (review_case_id, created_at desc);
create index if not exists prediction_review_snapshots_review_case_kind_idx on public.prediction_review_snapshots (review_case_id, snapshot_kind, created_at desc);
create index if not exists prediction_review_ai_executions_review_case_id_idx on public.prediction_review_ai_executions (review_case_id, created_at desc);
create index if not exists prediction_review_decisions_review_case_id_idx on public.prediction_review_decisions (review_case_id, created_at desc);
create unique index if not exists prediction_review_decisions_single_publish_idx
  on public.prediction_review_decisions (review_case_id)
  where decision = 'PUBLISH_REFRESHED';
create unique index if not exists prediction_review_decisions_published_version_idx
  on public.prediction_review_decisions (published_prediction_version_id)
  where published_prediction_version_id is not null;

alter table public.prediction_review_cases enable row level security;
alter table public.prediction_review_snapshots enable row level security;
alter table public.prediction_review_ai_executions enable row level security;
alter table public.prediction_review_decisions enable row level security;

grant select, insert, update on public.prediction_review_cases to authenticated;
grant select, insert on public.prediction_review_snapshots to authenticated;
grant select, insert on public.prediction_review_ai_executions to authenticated;
grant select, insert on public.prediction_review_decisions to authenticated;

drop policy if exists "Admins may read prediction review cases" on public.prediction_review_cases;
create policy "Admins may read prediction review cases"
on public.prediction_review_cases
for select
to authenticated
using (
  public.is_real_fixture_lab_admin()
  and public.can_admin_access_real_fixture_lab_match(prediction_review_cases.match_id)
);

drop policy if exists "Admins may insert prediction review cases" on public.prediction_review_cases;
create policy "Admins may insert prediction review cases"
on public.prediction_review_cases
for insert
to authenticated
with check (
  public.is_real_fixture_lab_admin()
  and public.can_admin_access_real_fixture_lab_match(prediction_review_cases.match_id)
);

drop policy if exists "Admins may update prediction review cases" on public.prediction_review_cases;
create policy "Admins may update prediction review cases"
on public.prediction_review_cases
for update
to authenticated
using (
  public.is_real_fixture_lab_admin()
  and public.can_admin_access_real_fixture_lab_match(prediction_review_cases.match_id)
)
with check (
  public.is_real_fixture_lab_admin()
  and public.can_admin_access_real_fixture_lab_match(prediction_review_cases.match_id)
);

drop policy if exists "Admins may read prediction review snapshots" on public.prediction_review_snapshots;
create policy "Admins may read prediction review snapshots"
on public.prediction_review_snapshots
for select
to authenticated
using (
  public.is_real_fixture_lab_admin()
  and exists (
    select 1
    from public.prediction_review_cases
    where prediction_review_cases.id = prediction_review_snapshots.review_case_id
      and public.can_admin_access_real_fixture_lab_match(prediction_review_cases.match_id)
  )
);

drop policy if exists "Admins may insert prediction review snapshots" on public.prediction_review_snapshots;
create policy "Admins may insert prediction review snapshots"
on public.prediction_review_snapshots
for insert
to authenticated
with check (
  public.is_real_fixture_lab_admin()
  and exists (
    select 1
    from public.prediction_review_cases
    where prediction_review_cases.id = prediction_review_snapshots.review_case_id
      and public.can_admin_access_real_fixture_lab_match(prediction_review_cases.match_id)
  )
);

drop policy if exists "Admins may read prediction review ai executions" on public.prediction_review_ai_executions;
create policy "Admins may read prediction review ai executions"
on public.prediction_review_ai_executions
for select
to authenticated
using (
  public.is_real_fixture_lab_admin()
  and exists (
    select 1
    from public.prediction_review_cases
    where prediction_review_cases.id = prediction_review_ai_executions.review_case_id
      and public.can_admin_access_real_fixture_lab_match(prediction_review_cases.match_id)
  )
);

drop policy if exists "Admins may insert prediction review ai executions" on public.prediction_review_ai_executions;
create policy "Admins may insert prediction review ai executions"
on public.prediction_review_ai_executions
for insert
to authenticated
with check (
  public.is_real_fixture_lab_admin()
  and exists (
    select 1
    from public.prediction_review_cases
    where prediction_review_cases.id = prediction_review_ai_executions.review_case_id
      and public.can_admin_access_real_fixture_lab_match(prediction_review_cases.match_id)
  )
);

drop policy if exists "Admins may read prediction review decisions" on public.prediction_review_decisions;
create policy "Admins may read prediction review decisions"
on public.prediction_review_decisions
for select
to authenticated
using (
  public.is_real_fixture_lab_admin()
  and exists (
    select 1
    from public.prediction_review_cases
    where prediction_review_cases.id = prediction_review_decisions.review_case_id
      and public.can_admin_access_real_fixture_lab_match(prediction_review_cases.match_id)
  )
);

drop policy if exists "Admins may insert prediction review decisions" on public.prediction_review_decisions;
create policy "Admins may insert prediction review decisions"
on public.prediction_review_decisions
for insert
to authenticated
with check (
  public.is_real_fixture_lab_admin()
  and exists (
    select 1
    from public.prediction_review_cases
    where prediction_review_cases.id = prediction_review_decisions.review_case_id
      and public.can_admin_access_real_fixture_lab_match(prediction_review_cases.match_id)
  )
);
