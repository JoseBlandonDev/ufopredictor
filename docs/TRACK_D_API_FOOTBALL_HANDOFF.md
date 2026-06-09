# Track D API-Football Handoff

_Last updated after D05F ingest tracking and D05G controlled single-friendly ingest validation._

## Scope of Track D

Track D covers API-Football integration for UFO Predictor:

- Provider read spikes.
- Fixture planning.
- Controlled ingest.
- Apply guardrails.
- Internal fixture validation.
- Auditability and rollback posture.

Track D does not currently include:

- Provider predictions.
- Odds.
- Public prediction exposure.
- World Cup apply.
- Broad friendlies apply.
- Automated cron/workers.

## Current Track D status

Completed:

- API-Football read spike foundation.
- D05A ingestion/persistence blueprint.
- D05B migration enablement.
- D05C controlled Colombia apply.
- D05F ingest run tracking.
- D05G controlled single-friendly ingest.

Validated:

- Colombia controlled apply with idempotency.
- Single-friendly exact apply for Peru vs Spain.
- Real Fixture Lab internal prediction persistence on an ingested friendly.

## D05F — ingest run tracking

### Migration

`supabase/migrations/0018_ingest_run_tracking.sql`

Adds:

- `public.ingest_runs`.
- `public.ingest_run_items`.

### `ingest_runs`

Durable run header for real apply executions.

Important fields:

- `provider`.
- `competition_key`.
- `provider_league_id`.
- `from_date`.
- `to_date`.
- `limit_value`.
- `apply_mode`.
- `run_tag`.
- `source_note`.
- `status`.
- `started_at` / `finished_at`.
- `fetched_fixtures_count`.
- `planned_fixtures_count`.
- `counts_summary`.
- `warnings_summary`.
- `errors_summary`.
- `cli_args`.

### `ingest_run_items`

Row-level audit/snapshot table.

Important fields:

- `run_id`.
- `entity_table`.
- `entity_id`.
- `entity_external_id`.
- `entity_natural_key`.
- `action`.
- `before_snapshot`.
- `after_snapshot`.
- `skip_reason`.
- `error_message`.

Actions:

- `created`.
- `updated`.
- `skipped`.
- `error`.

Policy:

- `updated` items require `before_snapshot`.
- `created` items do not need `before_snapshot`.
- `after_snapshot` is used where available.

### Current rollback posture

Rollback remains manual/script-reviewed.

D05F provides:

- Which run touched which rows.
- Which rows were created.
- Before-state for updated rows.
- Enough metadata to design rollback tooling later.

D05F does not yet provide:

- One-click rollback.
- UI rollback.
- Automated transaction-level reversal.
- Full plan-level skipped fixture item coverage.

## D05G — controlled single-friendly ingest

D05G adds a narrow lane for ingesting exactly one selected friendly fixture.

### Why D05G was needed

Real Fixture Lab needs real future fixtures persisted as `admin_only` before internal predictions can be saved.

A league/date `limit=1` dry-run was not enough because it depended on provider ordering. D05G added exact `fixtureId` support so a chosen fixture can be fetched and planned directly.

### Supported command shape

Dry-run:

```bash
npm run spike:api-football -- --mode ingest-dry-run --competition friendlies --fixtureId <providerFixtureId> --from <YYYY-MM-DD> --to <YYYY-MM-DD> --limit 1 --report true
```

Apply, only after manual approval:

```bash
npm run spike:api-football -- --mode ingest-dry-run --competition friendlies --fixtureId <providerFixtureId> --from <YYYY-MM-DD> --to <YYYY-MM-DD> --limit 1 --apply true --report true
```

### D05G guardrails

Friendlies apply is allowed only when all are true:

- `competition=friendlies`.
- `fixtureId` is explicitly provided.
- `limit=1`.
- `from` is provided.
- `to` is provided.
- Exact fixture fetch returns one fixture.
- Fixture belongs to the API-Football Friendlies target.
- Fixture kickoff is inside the requested date window.
- Planned match count is exactly one.
- Planned fixture id matches the requested `fixtureId`.
- Planned match status is `scheduled`.
- `matchResultPlans.length=0`.
- Planned match `accessScope=admin_only`.
- Planned match `intakeSource=api_football`.

Still blocked:

- Friendlies without `fixtureId`.
- Friendlies with `limit > 1`.
- Broad friendlies date-window apply.
- `competition=all` apply.
- World Cup apply.
- Copa Colombia apply/defaults.
- Provider predictions.
- Odds.
- Public views.

## Validated friendly: Peru vs Spain

### Candidate selection

Read-only shortlist command:

```bash
npm run spike:api-football -- --mode beta-candidates --competition friendlies --from 2026-06-08 --to 2026-06-18 --limit 20 --prioritize true --report true
```

Selected candidate:

- Provider fixture id: `1540356`.
- External id: `api-football:fixture:1540356`.
- Teams: Peru vs Spain.
- League: Friendlies (`10`).
- Kickoff: `2026-06-09T02:00:00+00:00`.
- Status before ingest: scheduled.

Exact fixture read:

```bash
npm run spike:api-football -- --mode fixture --fixtureId 1540356
```

### D05G exact dry-run

```bash
npm run spike:api-football -- --mode ingest-dry-run --competition friendlies --fixtureId 1540356 --from 2026-06-09 --to 2026-06-09 --limit 1 --report true
```

Validated expected output:

- `fixtures_scanned=1`.
- `fixtures_planned=1`.
- `competitions=1`.
- `seasons=1`.
- `teams=2`.
- `matches=1`.
- `match_results=0`.
- Match status: `scheduled`.
- Access scope: `admin_only`.
- Intake source: `api_football`.
- Venue id: `null`.
- No DB reads/writes in dry-run.

### D05G apply

Manually approved apply:

```bash
npm run spike:api-football -- --mode ingest-dry-run --competition friendlies --fixtureId 1540356 --from 2026-06-09 --to 2026-06-09 --limit 1 --apply true --report true
```

Observed apply result:

- `ingest_run_id` emitted.
- `competition_key=friendlies`.
- `fetched_fixtures=1`.
- `planned_fixtures=1`.
- `competitions created=1`.
- `seasons created=1`.
- `teams created=2`.
- `matches created=1`.
- `match_results created=0`.

Validated SQL outcomes:

- `ingest_runs.status='completed'`.
- `errors_summary is null`.
- `ingest_run_items` contained:
  - `competitions created=1`.
  - `seasons created=1`.
  - `teams created=2`.
  - `matches created=1`.
- `matches.external_id='api-football:fixture:1540356'` exists.
- `matches.access_scope='admin_only'`.
- `matches.intake_source='api_football'`.
- `public_match_details` returns `0 rows` for the friendly.
- No `match_results` row exists for the scheduled fixture.

## Interaction with Real Fixture Lab

After ingest, the fixture is available at:

```txt
/admin/real-fixture-lab?externalId=api-football:fixture:1540356
```

The Lab can:

- Read the fixture.
- Show fixture metadata.
- Show current result state as empty/unavailable.
- Generate an in-memory prediction preview.
- Save one internal prediction.

The Lab cannot yet:

- Evaluate the prediction after the result.
- Persist `prediction_results`.
- Publish the prediction.
- Use provider predictions or odds.

## Next Track D work

Recommended next Track D adjacent phase:

1. Wait for a result for the validated friendly.
2. Decide how result review/verification should work.
3. Design internal evaluation persistence into `prediction_results`.
4. Keep evaluation admin-only/internal.

Do not proceed directly to broad friendlies or World Cup apply.
