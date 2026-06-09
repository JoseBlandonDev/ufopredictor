# ChatGPT Project Source — UFO Predictor Current

This is the compact current source of truth for ChatGPT conversations about UFO Predictor.

## Project summary

UFO Predictor is a football prediction platform with an internal Lab and controlled API-Football ingest pipeline.

The current product strategy is conservative:

- Ingest real fixtures carefully.
- Keep experimental fixtures/predictions internal.
- Validate model outputs in admin-only surfaces first.
- Do not expose predictions publicly until a separate product decision.
- Do not use odds or provider predictions in the current model/Lab pipeline.

## Working language rule

- The user often works in Spanish.
- ChatGPT may discuss strategy in Spanish.
- All prompts intended for Codex must be written in English.

Reason:

- Codex works better with English technical instructions.
- It reduces ambiguity around commands, file paths, migrations, and no-go boundaries.

## Current branch and state

Current active branch used for recent work:

```txt
feature/d05f-ingest-run-tracking-clean
```

Recent branch contains:

- D05F ingest tracking.
- Real Fixture Lab read/preview/internal persistence.
- RLS migrations `0019` through `0022`.
- D05G controlled single-friendly ingest.

Before new work, verify:

```bash
git branch --show-current
git status --short
git log --oneline origin/main..HEAD
```

## Database and migrations

Recent migrations:

### `0018_ingest_run_tracking.sql`

Adds:

- `ingest_runs`.
- `ingest_run_items`.

Purpose:

- durable apply run tracking.
- row-level audit metadata.
- snapshot support for updates.

### `0019_real_fixture_lab_admin_read_policies.sql`

Adds admin SELECT policies for Real Fixture Lab reads:

- `matches`.
- `competitions`.
- `teams`.
- `match_results`.

Scope:

- authenticated admin.
- `admin_only + api_football` fixtures.

### `0020_fix_real_fixture_lab_rls_recursion.sql`

Fixes RLS recursion introduced by related-table policies using `security definer` boolean helpers.

### `0021_real_fixture_lab_prediction_persistence_policies.sql`

Adds narrow admin read/insert path for:

- active `model_versions`.
- internal `prediction_versions`.
- internal `prediction_markets`.

Scope:

- `run_scope='internal_lab'`.
- `prediction_type='pre_match_24h'`.
- fixture is `admin_only + api_football`.
- `prediction_markets.is_premium=false`.

### `0022_fix_real_fixture_lab_prediction_persistence_rls_recursion.sql`

Fixes RLS recursion between `model_versions` and `prediction_versions`.

## D05F — ingest run tracking

Implemented.

Writer now:

- creates `ingest_runs` header for apply runs.
- records `ingest_run_items` for entity outcomes.
- captures `before_snapshot` for updates.
- captures `after_snapshot` where possible.
- marks run status.
- reports `ingest_run_id` in CLI.

Rollback remains manual/script-reviewed.

## D05G — controlled single-friendly ingest

Implemented.

`ingest-dry-run` supports exact `--fixtureId`.

D05G friendlies apply is only allowed when:

- `competition=friendlies`.
- `fixtureId` is explicit.
- `limit=1`.
- `from` and `to` are explicit.
- exactly one fixture is selected/planned.
- fixture status is `scheduled`.
- no `match_results` are planned.
- match remains `admin_only`.
- intake source remains `api_football`.

Broad friendlies apply is still blocked.

Validated fixture:

- `api-football:fixture:1540356`.
- Peru vs Spain.
- Scheduled friendly.
- Ingested as `admin_only`.
- No result row at ingest time.

## Real Fixture Lab

Implemented admin route:

```txt
/admin/real-fixture-lab
```

Usage:

```txt
/admin/real-fixture-lab?externalId=api-football:fixture:<id>
```

Behavior:

- requires admin auth.
- uses session Supabase client; respects RLS.
- no service-role app route.
- reads only `admin_only + api_football` matches.
- shows fixture metadata.
- shows current result state.
- generates in-memory prediction preview.
- can save one internal prediction.

Internal persistence:

- `prediction_versions`.
- `prediction_markets`.

Not persisted yet:

- `prediction_results`.

Validated with:

- `api-football:fixture:1540356`.
- internal prediction saved with model `v0.1`.
- markets saved.
- `prediction_results` remains empty.
- public view remains closed.

## Model status

Current model version used in Real Fixture Lab validation:

- `v0.1`.

Important caveat:

- Current predictions may rely on default/neutral signals.
- The Peru vs Spain prediction validates the pipeline, not model performance.

## No-go boundaries

Current hard no-go:

- No broad friendlies apply.
- No World Cup apply.
- No Copa Colombia apply/defaults.
- No `all` apply.
- No provider predictions.
- No odds.
- No public exposure of Real Fixture Lab predictions.
- No `prediction_results` before result review/evaluation design.
- No service-role client in app routes.
- No cron/workers.
- No push/PR without approval.

## Next recommended work

Next phase:

```txt
Real Fixture Lab post-match evaluation
```

Steps:

1. Read/verify result for the friendly.
2. Decide result trust policy.
3. Design evaluation persistence.
4. Persist `prediction_results` internally.
5. Keep everything admin-only.

Do not jump to World Cup apply.
