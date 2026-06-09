# Implementation Plan — UFO Predictor

_Last updated after D05G and Real Fixture Lab Phase 3A validation._

## Completed implementation path

### D05F — ingest run tracking

Delivered:

- Migration `0018_ingest_run_tracking.sql`.
- `ingest_runs` and `ingest_run_items`.
- Writer run header integration.
- Row-level tracking.
- Snapshots for updates.
- CLI `ingest_run_id` output.

Validation:

- Tiny controlled apply.
- Idempotency rerun.
- Single-friendly apply with run tracking.

### Real Fixture Lab Phase 1 — read surface

Delivered:

- `/admin/real-fixture-lab`.
- Admin-only route.
- Reads `admin_only + api_football` fixtures.
- RLS read policies with recursion fix.

Migrations:

- `0019`.
- `0020`.

### Real Fixture Lab Phase 2 — preview

Delivered:

- Real fixture to prediction input adapter.
- In-memory prediction preview.
- Explicit internal-only/no odds/no provider predictions copy.

### Real Fixture Lab Phase 3A — persistence

Delivered:

- Server action to save internal prediction.
- Active model version selection.
- Duplicate blocking.
- Persistence helpers.
- `prediction_versions` insert.
- `prediction_markets` insert.
- No `prediction_results`.

Migrations:

- `0021`.
- `0022`.

### D05G — controlled single-friendly ingest

Delivered:

- `--fixtureId` support in `ingest-dry-run`.
- Direct exact fixture fetch.
- Narrow apply lane for one selected friendly.
- Broad friendlies apply remains blocked.

Validated with:

- Peru vs Spain.
- `api-football:fixture:1540356`.

## Current next implementation phase

### Phase 3B / D05H candidate — post-match evaluation

Goal:

- Evaluate saved Real Fixture Lab prediction after result is available and trusted.

Proposed steps:

1. Recognition-only pass:
   - inspect existing `match_results` state.
   - inspect existing evaluation helpers.
   - inspect `/admin/beta-lab` evaluation patterns.
2. Design result trust rule:
   - require `verification_status='verified'`?
   - allow provider pending-review only with warning?
   - require manual admin review?
3. Implement minimal internal evaluation action.
4. Persist `prediction_results` only after guard passes.
5. Validate no public exposure.

## Must not implement next without new design

- Broad friendlies apply.
- World Cup apply.
- Public prediction publication.
- Provider predictions.
- Odds.
- Prediction/result automation via cron/workers.

## Recommended Codex workflow for next implementation

All Codex prompts must be in English.

Pattern:

1. Recognition only.
2. Report branch/status and current code paths.
3. Design minimal slice.
4. Implement only after approval.
5. Run validation.
6. No push/PR.

## Required validation for code changes

```bash
git diff --check
npm run test
npm run lint
npm run build
git status --short
```

Restore `next-env.d.ts` if build rewrites it.
