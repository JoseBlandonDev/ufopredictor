# Roadmap and Backlog — UFO Predictor

_Last updated after Real Fixture Lab and D05G validation._

## Completed recently

### D05F — ingest run tracking

Completed:

- `ingest_runs` table.
- `ingest_run_items` table.
- Writer integration.
- Snapshot metadata.
- Run status tracking.
- CLI `ingest_run_id` reporting.

Outcome:

- Broader controlled writes now have durable audit records.
- Rollback remains manual/script-reviewed.

### Real Fixture Lab Phase 1/2/3A

Completed:

- Admin-only real fixture route.
- Query path for `admin_only + api_football` matches.
- In-memory prediction preview.
- Internal prediction persistence.
- Duplicate-create blocking.
- Active model version selection.
- Removed stale hardcoded fixture fallback.

Validated:

- Peru vs Spain fixture rendered.
- Internal prediction saved.
- Prediction markets saved.
- `prediction_results` untouched.
- Public views remain closed.

### D05G — controlled single-friendly ingest

Completed:

- Exact `--fixtureId` support in `ingest-dry-run`.
- Direct exact fixture fetch.
- Narrow friendlies apply lane.
- Guardrails preventing broad friendlies apply.

Validated:

- `api-football:fixture:1540356` Peru vs Spain was ingested as `admin_only`.
- No `match_results` were created for the scheduled fixture.
- `ingest_runs` and `ingest_run_items` tracked the run.

## Current top priority

### Next: post-match result review and internal evaluation

Goal:

- After the friendly has a result, review whether it is trustworthy enough for internal evaluation.
- Evaluate the saved prediction.
- Persist evaluation to `prediction_results` only after explicit design.

Proposed subtasks:

1. Recognize current result ingestion/review options.
2. Decide result trust policy:
   - Provider result pending review?
   - Manual verification?
   - Required `verification_status='verified'`?
3. Design `prediction_results` persistence for Real Fixture Lab predictions.
4. Add tests for evaluation guardrails.
5. Validate on Peru vs Spain.

No public exposure in this phase.

## Near-term backlog

### B1 — Real Fixture Lab result review

Status: pending.

Needs:

- Read actual result for an ingested real fixture.
- Decide when result is trusted.
- Preserve admin/internal-only scope.

### B2 — Real Fixture Lab prediction evaluation

Status: pending.

Needs:

- Load saved `prediction_versions` and `prediction_markets`.
- Run evaluation logic.
- Persist `prediction_results` internally.
- Prevent evaluation without verified/trusted result.

### B3 — Repeat with one or two more friendlies

Status: optional pending.

Guardrails:

- Use D05G exact `fixtureId` only.
- One fixture at a time.
- No broad friendly apply.
- No public exposure.

### B4 — Improve model signal quality

Status: pending.

Current Real Fixture Lab prediction may rely on default/neutral signals. Future work should improve:

- Team strength/rating inputs.
- Recent form.
- Context signals.
- Lineup/injury handling only if reliable and allowed.

No odds/provider predictions.

## Later backlog

### World Cup controlled ingest design

Status: blocked/pending.

Do not enable until:

- Post-match evaluation is validated internally.
- D05G lessons are documented.
- World Cup target competition policy is explicitly designed.

### Public prediction surface

Status: blocked.

Requires separate product decision:

- Which predictions become public.
- When they become public.
- Whether premium gating applies.
- How to handle confidence/risk disclosures.

### Rollback helper

Status: future.

D05F enables audit data but does not provide automated rollback. Future helper could:

- Reverse created rows in dependency order.
- Restore updated rows from `before_snapshot`.
- Report conflicts and later-run overlap.

## Explicitly blocked

- Broad friendlies apply.
- World Cup apply.
- Copa Colombia apply/defaults.
- Provider predictions.
- Odds.
- Public exposure from Real Fixture Lab.
- `prediction_results` before result review.
- Service-role usage in app routes.
- Cron/workers.
- Push/PR without approval.
