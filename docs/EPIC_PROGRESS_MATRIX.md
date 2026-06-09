# Epic Progress Matrix — UFO Predictor

_Last updated after D05F, D05G, and Real Fixture Lab Phase 3A validation._

## Status legend

- `Done`: implemented and validated enough for current scope.
- `Partial`: implemented but intentionally incomplete or not fully validated.
- `Pending`: not implemented yet.
- `Blocked`: explicitly not allowed without a future design/approval step.

## Current progress matrix

| Area | Status | Notes |
|---|---:|---|
| C01-C08 prototype/product foundation | Done | Previously closed functional baseline. |
| D05A fixture ingestion/persistence blueprint | Done | Blueprint closed before D05C/D05F work. |
| D05B migration enablement | Done | Remote/manual migration path validated. |
| D05C.1 dry-run planner | Done | Controlled API-Football dry-run planning exists. |
| D05C.2A controlled Colombia write mode | Done | Colombia apply validated with idempotency. |
| D05F ingest run tracking | Done | `ingest_runs` / `ingest_run_items` integrated and validated. |
| Real Fixture Lab Phase 1 read surface | Done | Admin-only route reads `admin_only + api_football` fixtures. |
| Real Fixture Lab Phase 2 prediction preview | Done | In-memory prediction preview works. |
| Real Fixture Lab Phase 3A internal prediction persistence | Done | Saves `prediction_versions` + `prediction_markets`, not `prediction_results`. |
| D05G controlled single-friendly ingest | Done | Exact `--fixtureId` support and narrow friendlies apply lane validated. |
| Post-match result review | Pending | Needed before evaluation persistence. |
| Prediction evaluation persistence | Pending | `prediction_results` intentionally untouched so far. |
| Broad friendlies apply | Blocked | Only exact single-fixture lane is allowed. |
| World Cup apply | Blocked | Must not be enabled without new design/review. |
| Provider predictions | Blocked | Out of scope. |
| Odds | Blocked | Out of scope. |
| Public prediction exposure from Real Fixture Lab | Blocked | Lab remains internal/admin-only. |
| Cron/workers | Blocked | No automation yet. |

## Recently completed block

### D05F

Delivered durable ingest auditability:

- `0018_ingest_run_tracking.sql`.
- Writer integration.
- Run header and item tracking.
- Snapshots for updates.
- `ingest_run_id` in CLI output.

### Real Fixture Lab

Delivered internal real-fixture trial capability:

- `/admin/real-fixture-lab`.
- Read real API-Football fixtures as admin-only.
- Preview model output.
- Persist internal prediction version and markets.
- Duplicate blocking.
- Active model version selection.

### D05G

Delivered exact single-friendly ingest:

- `--fixtureId` for `ingest-dry-run`.
- Direct exact fixture fetch.
- Narrow friendlies apply lane.
- Peru vs Spain validation.

## Validated real fixture pipeline

Validated fixture:

- `api-football:fixture:1540356`.
- Peru vs Spain.
- Friendly.
- Scheduled at ingest time.

Validated pipeline:

```txt
API-Football exact read
-> D05G exact dry-run
-> D05G manually approved apply
-> ingest_runs + ingest_run_items
-> admin_only match
-> Real Fixture Lab preview
-> prediction_versions
-> prediction_markets
```

Not validated yet:

```txt
match result review
-> evaluation
-> prediction_results
```

## Next recommended epic/task

Recommended next phase:

```txt
Real Fixture Lab Post-Match Evaluation
```

Goal:

- Consume/review the result for a previously saved internal prediction.
- Only after trusted result review, evaluate the prediction.
- Persist evaluation internally in `prediction_results`.
- Do not expose it publicly.

## Do not start yet

Do not start these without an explicit design pass:

- World Cup apply.
- Broad friendlies apply.
- Friendlies batch ingest.
- Public prediction publication.
- Provider predictions.
- Odds.
- Premium/payment exposure.
