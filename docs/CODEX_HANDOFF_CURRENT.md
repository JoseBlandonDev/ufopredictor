# Codex Handoff — UFO Predictor Current Branch

_Last updated after D05F, Real Fixture Lab Phase 3A, and D05G controlled single-friendly validation._

## Operating rules for Codex

All Codex prompts for this project must be written in English, even when the user and ChatGPT discuss strategy in Spanish.

Default Codex posture:

- Inspect first.
- Make the smallest safe change.
- Do not push.
- Do not open PRs.
- Do not run SQL unless explicitly instructed.
- Do not perform DB writes unless explicitly instructed.
- Do not run `--apply true` unless explicitly instructed.
- Do not write broad documentation unless asked; ChatGPT owns broad documentation refresh.

## Current branch and repo state

- Branch: `feature/d05f-ingest-run-tracking-clean`.
- Working tree was confirmed clean before documentation refresh.
- Branch is ahead of `origin/main` with commits covering:
  - D05F ingest tracking.
  - Real Fixture Lab read/preview/persistence.
  - RLS policies and recursion fixes.
  - D05G controlled single-friendly ingest.

## Current commits ahead of `origin/main`

```txt
315bbb6 feat: add controlled single-friendly ingest
a3f9546 fix: reduce real fixture lab persistence logging
82ca236 fix: remove stale real fixture lab default
00d9566 fix: resolve real fixture lab prediction rls recursion
422350c feat: persist real fixture lab internal predictions
5973503 feat: allow real fixture lab internal prediction persistence
d71e2bc fix: resolve real fixture lab read access
5c4b30b feat: add real fixture lab admin read policies
c8157de feat: add real fixture lab prediction preview
9f1652e feat: add real fixture lab read surface
8eb8dc7 fix: update ingest rollback warning copy
39935ac fix: align ingest run count checks
151828a feat: track api football ingest runs in writer
8fc0863 feat: add ingest run tracking migration draft
```

## Changed files versus `origin/main`

```txt
app/admin/real-fixture-lab/actions.test.ts
app/admin/real-fixture-lab/actions.ts
app/admin/real-fixture-lab/page.tsx
lib/football-api/ingest/apply.test.ts
lib/football-api/ingest/apply.ts
lib/football-api/ingest/writer.test.ts
lib/football-api/ingest/writer.ts
lib/prediction-engine/real-fixture-adapter.test.ts
lib/prediction-engine/real-fixture-adapter.ts
lib/prediction-engine/real-fixture-persistence.test.ts
lib/prediction-engine/real-fixture-persistence.ts
lib/supabase/real-fixture-lab-queries.test.ts
lib/supabase/real-fixture-lab-queries.ts
scripts/api-football-read-spike.ts
supabase/migrations/0018_ingest_run_tracking.sql
supabase/migrations/0019_real_fixture_lab_admin_read_policies.sql
supabase/migrations/0020_fix_real_fixture_lab_rls_recursion.sql
supabase/migrations/0021_real_fixture_lab_prediction_persistence_policies.sql
supabase/migrations/0022_fix_real_fixture_lab_prediction_persistence_rls_recursion.sql
```

## New migrations

### `0018_ingest_run_tracking.sql`

Adds:

- `public.ingest_runs`.
- `public.ingest_run_items`.
- Indexes.
- RLS enabled.
- Updated-at trigger for `ingest_runs`.

Purpose:

- Durable tracking for real apply runs.
- Row-level audit/snapshot trail.
- Supports manual/script-reviewed rollback posture.

### `0019_real_fixture_lab_admin_read_policies.sql`

Adds admin SELECT policies for Real Fixture Lab reads:

- `matches`.
- `competitions`.
- `teams`.
- `match_results`.

Scope:

- Authenticated admins only.
- Fixtures where `access_scope='admin_only'` and `intake_source='api_football'`.

### `0020_fix_real_fixture_lab_rls_recursion.sql`

Fixes RLS recursion from `0019` related-table policies using narrow `security definer` boolean helpers.

### `0021_real_fixture_lab_prediction_persistence_policies.sql`

Adds narrow admin read/insert permissions for internal prediction persistence:

- active `model_versions` read.
- `prediction_versions` SELECT/INSERT.
- `prediction_markets` SELECT/INSERT.

Scope:

- `run_scope='internal_lab'`.
- `prediction_type='pre_match_24h'`.
- real fixture must be `admin_only + api_football`.
- `prediction_markets.is_premium=false`.

### `0022_fix_real_fixture_lab_prediction_persistence_rls_recursion.sql`

Fixes RLS recursion between `model_versions` and `prediction_versions` by replacing an older inline policy pattern with a `security definer` helper:

- `public.can_admin_read_internal_lab_model_version(target_model_version_id uuid)`.

## D05F status

D05F is complete for the current controlled apply flow.

Implemented in:

- `lib/football-api/ingest/writer.ts`.
- `supabase/migrations/0018_ingest_run_tracking.sql`.

Behavior:

- Creates `ingest_runs` header rows for real apply runs.
- Records `ingest_run_items` for created/updated/skipped/error writer outcomes.
- Captures `before_snapshot` for updates.
- Captures `after_snapshot` when available.
- Marks runs `completed` or `failed`.
- CLI reports `ingest_run_id`.

Known gaps:

- Rollback is not automatic.
- Plan-level skipped fixtures are not fully persisted as item rows.

## D05G status

D05G is implemented and validated.

Implemented in:

- `scripts/api-football-read-spike.ts`.
- `lib/football-api/ingest/apply.ts`.
- `lib/football-api/ingest/writer.ts`.

Behavior:

- `ingest-dry-run` accepts `--fixtureId`.
- Exact fixture fetch is used when `fixtureId` is present.
- Friendlies apply remains blocked except for one narrow lane:
  - `competition=friendlies`.
  - explicit `fixtureId`.
  - `limit=1`.
  - explicit `from` and `to`.
  - exactly one selected/planned fixture.
  - fixture must be `scheduled`.
  - `matchResultPlans.length=0`.
  - planned match remains `admin_only` and `api_football`.

Validated fixture:

- `api-football:fixture:1540356`.
- Peru vs Spain.
- Friendly.
- Scheduled.
- Ingested as `admin_only`.
- No `match_results` created.

## Real Fixture Lab status

Implemented files:

- `app/admin/real-fixture-lab/page.tsx`.
- `app/admin/real-fixture-lab/actions.ts`.
- `lib/supabase/real-fixture-lab-queries.ts`.
- `lib/prediction-engine/real-fixture-adapter.ts`.
- `lib/prediction-engine/real-fixture-persistence.ts`.

Behavior:

- Admin-only route.
- Reads only real fixtures where:
  - `access_scope='admin_only'`.
  - `intake_source='api_football'`.
- Fixture selected by `externalId` query param.
- No hardcoded default fixture.
- In-memory prediction preview.
- Save action persists exactly one internal prediction per:
  - match.
  - model version.
  - `prediction_type='pre_match_24h'`.
  - `run_scope='internal_lab'`.
- Duplicate create is blocked.
- Uses active `model_versions` row.
- Persists:
  - `prediction_versions`.
  - `prediction_markets`.
- Does not persist:
  - `prediction_results`.

Validated with:

- `api-football:fixture:1540356`.
- Internal prediction saved.
- Markets saved.
- `prediction_results` remains empty.
- `public_match_details` remains closed.

## Canonical commands used in validation

### Exact friendly read

```bash
npm run spike:api-football -- --mode fixture --fixtureId 1540356
```

### Exact friendly dry-run

```bash
npm run spike:api-football -- --mode ingest-dry-run --competition friendlies --fixtureId 1540356 --from 2026-06-09 --to 2026-06-09 --limit 1 --report true
```

### Manually approved exact friendly apply

```bash
npm run spike:api-football -- --mode ingest-dry-run --competition friendlies --fixtureId 1540356 --from 2026-06-09 --to 2026-06-09 --limit 1 --apply true --report true
```

## Current no-go boundaries

Do not do any of the following without a new explicit design/approval step:

- No broad friendlies apply.
- No World Cup apply.
- No Copa Colombia apply/defaults.
- No `all` apply.
- No provider predictions.
- No odds.
- No public exposure of Lab fixtures or predictions.
- No `prediction_results` persistence until result verification/evaluation is designed.
- No service-role client in app routes.
- No cron/workers.
- No push/PR without approval.

## Next recommended technical phase

Real Fixture Lab post-match evaluation phase:

1. Wait for the persisted friendly to have a result.
2. Review/verify the result source.
3. Design evaluation persistence into `prediction_results`.
4. Keep everything internal/admin-only.
5. Do not expose public predictions.

## Validation before committing docs

Run:

```bash
git status --short
git diff --check
npm run test
npm run lint
npm run build
git status --short
```

If `next-env.d.ts` is modified only by build:

```bash
git restore next-env.d.ts
git status --short
```
