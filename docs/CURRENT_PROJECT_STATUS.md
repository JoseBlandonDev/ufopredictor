# Current Project Status — UFO Predictor

_Last updated: after D05F ingest tracking, D05G controlled single-friendly ingest, and Real Fixture Lab Phase 3A validation._

## Current branch baseline

- Active working branch: `feature/d05f-ingest-run-tracking-clean`.
- Working tree was confirmed clean before the documentation refresh.
- The branch is ahead of `origin/main` with the D05F, Real Fixture Lab, RLS, and D05G commits.
- This branch should not be pushed or opened as a PR until the documentation refresh is reviewed and committed.

## Current validated state

UFO Predictor now has a full internal real-fixture trial path:

```txt
API-Football exact fixture read
-> controlled single-fixture ingest
-> admin_only match persistence
-> Real Fixture Lab read surface
-> in-memory prediction preview
-> internal prediction_versions + prediction_markets persistence
```

This path was validated using the friendly fixture:

- Provider fixture id: `1540356`.
- UFO external id: `api-football:fixture:1540356`.
- Fixture: Peru vs Spain.
- Competition: API-Football Friendlies, league id `10`.
- Kickoff: `2026-06-09T02:00:00+00:00`.
- Match state at ingest: `scheduled`.
- Persisted match scope: `admin_only`.
- Persisted intake source: `api_football`.
- `public_match_details` exposure: `0 rows`.
- `match_results` created at ingest: `0 rows`.
- Internal prediction saved: yes.
- `prediction_versions`: one internal row for `run_scope='internal_lab'` and `prediction_type='pre_match_24h'`.
- `prediction_markets`: internal market rows persisted with `is_premium=false`.
- `prediction_results`: still empty for this fixture.

## Completed in this block

### D05F — ingest run tracking

D05F is functionally complete for the current controlled apply flow.

Implemented:

- Migration `0018_ingest_run_tracking.sql`.
- `ingest_runs` durable run header table.
- `ingest_run_items` row-level audit/snapshot table.
- Writer integration for real apply runs.
- Per-entity item tracking for created/updated/skipped/error outcomes.
- `before_snapshot` for updated rows.
- `after_snapshot` where available.
- Run status transitions: `started`, `completed`, `failed`.
- CLI output includes `ingest_run_id`.

Validated:

- First tiny Colombia apply and idempotency rerun.
- Single-friendly apply for Peru vs Spain.
- `ingest_runs` rows created and completed.
- `ingest_run_items` rows created as expected.

Known limitation:

- Rollback remains manual/script-reviewed, not automatic.
- Plan-level skipped fixtures are not yet persisted as first-class `ingest_run_items` rows.

### Real Fixture Lab Phase 1/2/3A

Implemented:

- New admin route: `/admin/real-fixture-lab`.
- Reads real API-Football fixtures from the app using session-scoped Supabase client and RLS.
- Requires admin app auth.
- Only reads fixtures where:
  - `matches.access_scope = 'admin_only'`.
  - `matches.intake_source = 'api_football'`.
- No service-role usage inside app routes.
- Selection by URL query param:
  - `/admin/real-fixture-lab?externalId=api-football:fixture:<id>`.
- Removed stale hardcoded fallback to the old Colombia final fixture.
- Real-fixture adapter to `MatchPredictionInput`.
- In-memory preview using the existing prediction engine.
- Server action to persist one internal prediction.
- Duplicate-create blocking.
- Active model version selection.
- Persistence into:
  - `prediction_versions`.
  - `prediction_markets`.
- No `prediction_results` persistence in Phase 3A.

RLS migrations:

- `0019_real_fixture_lab_admin_read_policies.sql`.
- `0020_fix_real_fixture_lab_rls_recursion.sql`.
- `0021_real_fixture_lab_prediction_persistence_policies.sql`.
- `0022_fix_real_fixture_lab_prediction_persistence_rls_recursion.sql`.

### D05G — controlled single-friendly ingest

Implemented:

- `--mode ingest-dry-run` now accepts `--fixtureId`.
- If `--fixtureId` is provided, the script fetches the exact fixture directly.
- It no longer depends on API-Football league/date ordering plus `limit=1`.
- Narrow apply lane for `friendlies` only when all required guardrails are satisfied.

Validated dry-run:

```bash
npm run spike:api-football -- --mode ingest-dry-run --competition friendlies --fixtureId 1540356 --from 2026-06-09 --to 2026-06-09 --limit 1 --report true
```

Validated apply:

```bash
npm run spike:api-football -- --mode ingest-dry-run --competition friendlies --fixtureId 1540356 --from 2026-06-09 --to 2026-06-09 --limit 1 --apply true --report true
```

Expected and observed apply behavior:

- `fixtures_scanned=1`.
- `fixtures_planned=1`.
- `competitions created=1`.
- `seasons created=1`.
- `teams created=2`.
- `matches created=1`.
- `match_results created=0`.
- `ingest_run_id` emitted.
- `public_match_details` remains closed.

## Still blocked / no-go

These remain explicitly out of scope:

- No broad friendlies apply.
- No World Cup apply.
- No Copa Colombia apply/defaults.
- No `all` apply.
- No provider predictions.
- No odds.
- No public exposure of Real Fixture Lab predictions.
- No `prediction_results` until result review/evaluation is explicitly designed.
- No service-role client in app routes.
- No cron/workers.
- No payments/premium expansion from this Lab path.

## Next recommended phase

Next: Real Fixture Lab post-match evaluation phase.

Objective:

1. Wait until the Peru vs Spain result is available and trustworthy.
2. Design a result-review rule.
3. Only after result review, evaluate the persisted prediction.
4. Persist `prediction_results` internally.
5. Keep all outputs admin/internal.

Do not start World Cup apply or broad friendlies expansion before the post-match evaluation path is designed.
