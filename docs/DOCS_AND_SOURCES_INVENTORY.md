# Docs and Sources Inventory — UFO Predictor

_Last updated after D05F/D05G/Real Fixture Lab documentation refresh._

## Core operational docs

### `CURRENT_PROJECT_STATUS.md`

Primary status snapshot.

Use for:

- current completion state;
- validated fixture flow;
- active no-go boundaries;
- next recommended task.

### `CODEX_HANDOFF_CURRENT.md`

Primary handoff for Codex.

Use for:

- branch context;
- current commits/diff;
- migration list;
- validation commands;
- current no-go boundaries.

### `START_HERE_FOR_NEW_CONVERSATIONS.md`

Primary onboarding document for new ChatGPT conversations.

Use for:

- preventing repeated rediscovery;
- current workflow rules;
- first Codex recognition prompt.

### `CHATGPT_PROJECT_SOURCE_UFO_PREDICTOR_CURRENT.md`

Compact source of truth for ChatGPT.

Use for:

- project state;
- workflow rules;
- D05F/D05G/Real Fixture Lab summary;
- next recommended phase.

## Track D / ingest docs

### `TRACK_D_API_FOOTBALL_HANDOFF.md`

Primary source for API-Football ingest work.

Covers:

- D05F.
- D05G.
- exact `fixtureId` friendly ingest.
- Peru vs Spain validation.
- ingest no-go boundaries.

## Planning and roadmap docs

### `EPIC_PROGRESS_MATRIX.md`

Use for:

- high-level done/pending/blocked matrix.

### `ROADMAP_AND_BACKLOG.md`

Use for:

- current backlog;
- next milestone;
- blocked work.

### `OPEN_DECISIONS.md`

Use for:

- closed decisions from this block;
- remaining open decisions.

### `NEXT_EPICS_PLAN.md`

Use for:

- next major workstream;
- post-match evaluation plan.

### `IMPLEMENTATION_PLAN.md`

Use for:

- recent implementation sequence;
- next implementation approach.

## Architecture/data docs

### `ARCHITECTURE_SUMMARY.md`

Use for:

- system architecture;
- ingest architecture;
- Real Fixture Lab architecture;
- RLS pattern.

### `DATA_DICTIONARY.md`

Use for:

- table meanings;
- fields touched by D05F/D05G/Lab;
- internal prediction persistence tables.

### `MODEL_V01.md`

Use for:

- model v0.1 status;
- model caveats;
- current default/neutral signal limitations.

## Workflow docs

### `CODEX_WORKFLOW.md`

Use for:

- Codex prompt language rule;
- no-go boundaries;
- repo validation process;
- migration workflow.

## New migrations in this branch

- `0018_ingest_run_tracking.sql`.
- `0019_real_fixture_lab_admin_read_policies.sql`.
- `0020_fix_real_fixture_lab_rls_recursion.sql`.
- `0021_real_fixture_lab_prediction_persistence_policies.sql`.
- `0022_fix_real_fixture_lab_prediction_persistence_rls_recursion.sql`.

## New/important code files in this branch

Real Fixture Lab:

- `app/admin/real-fixture-lab/page.tsx`.
- `app/admin/real-fixture-lab/actions.ts`.
- `lib/supabase/real-fixture-lab-queries.ts`.
- `lib/prediction-engine/real-fixture-adapter.ts`.
- `lib/prediction-engine/real-fixture-persistence.ts`.

Ingest:

- `scripts/api-football-read-spike.ts`.
- `lib/football-api/ingest/apply.ts`.
- `lib/football-api/ingest/writer.ts`.

## Out-of-scope docs

The Flow/video/character/campaign documents are not part of this D05F/D05G technical refresh.

Do not mix Real Fixture Lab backend state into creative/video production docs.
