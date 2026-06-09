# Start Here for New Conversations — UFO Predictor

Use this file at the start of any new ChatGPT or Codex-assisted conversation about UFO Predictor.

## Language / workflow rule

The user may discuss strategy in Spanish.

All prompts intended to be pasted into Codex must be written in English.

Codex should be treated as:

- repo inspector;
- focused implementer;
- validator;
- not owner of broad project documentation.

ChatGPT should own broad documentation updates unless there is a mechanical repo reason to ask Codex.

## Current branch context

Recent work happened on:

```txt
feature/d05f-ingest-run-tracking-clean
```

Before any new work, ask Codex to confirm:

```bash
git branch --show-current
git status --short
git log --oneline origin/main..HEAD
```

Do not assume branch cleanliness from memory.

## Current implemented state

### D05F — ingest run tracking

Implemented and validated:

- `0018_ingest_run_tracking.sql`.
- `ingest_runs`.
- `ingest_run_items`.
- writer tracking integration.
- `before_snapshot` / `after_snapshot` metadata.
- `ingest_run_id` in CLI report.

Rollback remains manual/script-reviewed, not automatic.

### Real Fixture Lab

Implemented and validated:

- `/admin/real-fixture-lab` admin route.
- Reads real API-Football fixtures where:
  - `matches.access_scope='admin_only'`.
  - `matches.intake_source='api_football'`.
- Uses `externalId` query param.
- No stale default fixture.
- In-memory prediction preview.
- Internal prediction persistence:
  - `prediction_versions`.
  - `prediction_markets`.
- Duplicate blocking.
- Active model version selection.
- No `prediction_results` in Phase 3A.

### RLS migrations for Real Fixture Lab

Applied/created in this branch:

- `0019_real_fixture_lab_admin_read_policies.sql`.
- `0020_fix_real_fixture_lab_rls_recursion.sql`.
- `0021_real_fixture_lab_prediction_persistence_policies.sql`.
- `0022_fix_real_fixture_lab_prediction_persistence_rls_recursion.sql`.

These are important. Do not remove or casually rewrite them.

### D05G — controlled single-friendly ingest

Implemented and validated:

- `--fixtureId` support in `ingest-dry-run`.
- exact fixture fetch.
- narrow apply lane for one selected friendly.

Validated fixture:

- `api-football:fixture:1540356`.
- Peru vs Spain.
- Ingested as `admin_only`.
- No `match_results` created at ingest.
- No public view exposure.
- Prediction saved internally.

## Validated pipeline

```txt
API-Football exact fixture read
-> D05G exact fixture dry-run
-> manually approved single-friendly apply
-> ingest_runs / ingest_run_items
-> admin_only match
-> Real Fixture Lab preview
-> prediction_versions / prediction_markets
```

Not implemented yet:

```txt
result review
-> evaluation
-> prediction_results
```

## Critical no-go boundaries

Do not do these without explicit design and approval:

- No broad friendlies apply.
- No World Cup apply.
- No Copa Colombia apply/defaults.
- No `all` apply.
- No provider predictions.
- No odds.
- No public exposure of Real Fixture Lab fixtures/predictions.
- No `prediction_results` until result review/evaluation is designed.
- No service-role client in app routes.
- No cron/workers.
- No push/PR without approval.

## Recommended next phase

Next phase should be:

```txt
Real Fixture Lab post-match evaluation
```

Goal:

1. Check whether the friendly result exists.
2. Decide result trust/verification rule.
3. Design internal evaluation persistence.
4. Persist `prediction_results` only after the result is trusted.
5. Keep evaluation internal/admin-only.

Do not jump to World Cup apply or broad friendlies expansion.

## Initial Codex recognition prompt

Use this prompt in English:

```text
We are working on UFO Predictor.

Do not edit files.
Do not commit.
Do not push.
Do not open a PR.
Do not run SQL.
Do not perform DB writes.
Do not run `--apply true`.

Please recognize the current repository state.

Return:
1. Current branch and `git status --short`.
2. Commits ahead of `origin/main`.
3. Changed files versus `origin/main`.
4. Whether D05F ingest run tracking is present.
5. Whether D05G controlled single-friendly ingest is present.
6. Whether Real Fixture Lab read/preview/internal persistence is present.
7. Whether migrations 0018 through 0022 are present.
8. Current tests/lint/build recommendation.
9. Any gaps or risks before continuing.
10. Recommended next safe task.

Respect current no-go boundaries:
- no broad friendlies apply
- no World Cup apply
- no provider predictions
- no odds
- no public exposure
- no prediction_results until verified result/evaluation design
```

## Validation commands before any closeout

```bash
git status --short
git diff --check
npm run test
npm run lint
npm run build
git status --short
```

If `next-env.d.ts` is changed only by build:

```bash
git restore next-env.d.ts
git status --short
```
