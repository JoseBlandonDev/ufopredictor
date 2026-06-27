# API-Football Fixture and Result Operations Runbook

_Last refreshed: 2026-06-24._

## Purpose

Maintain World Cup fixture coverage, trusted official results, evaluations, and partner exports with bounded, observable, idempotent operations.

For live status and current completed milestones, read:

```text
docs/00_chatgpt_sources/04_FIXTURE_RESULT_AND_EVALUATION_OPS.md
```

## Fixture registry

Command:

```text
npm run ops:world-cup-group-stage-fixture-registry
```

### Discovery/read

- select by matchday or date range;
- reconcile canonical and API-Football fixture identity;
- report stored/create/update/conflict/eligibility state;
- perform no writes by default.

### Apply

- use an exact allowlist manifest;
- confirm environment and target;
- create/update only the selected stored-fixture metadata;
- never create predictions, results, or evaluations;
- repeat the exact apply to prove idempotency;
- retain external run artifacts outside the repo.

## Prediction publication

After fixture registration:

- recheck kickoff and eligibility;
- save the internal current-model prediction;
- publish the basic public product;
- confirm the exact publish queue clears;
- never generate after kickoff;
- preserve immutable publication history.

## Trusted result refresh

Command:

```text
npm run ops:world-cup-result-refresh
```

### Dry-run

- always start without `--apply`;
- select by exact IDs/manifest and optional date/matchday;
- inspect terminal results, already-identical rows, exceptions, and evaluation actions;
- save the artifact.

### Apply

Apply requires an exact allowlist using:

- match IDs;
- external IDs;
- API-Football fixture IDs;
- or an allowlist manifest.

Do not apply a broad matchday/date selection without an exact allowlist.

### Auto-verification eligibility

Automatically verify only when:

- the stored fixture already exists;
- provider is API-Football;
- fixture identity matches;
- supported terminal state is `FT`;
- both scores exist;
- no duplicate, linkage, identity, or score conflict exists.

### Result/evaluation behavior

- create or recognize an identical verified result;
- update stored status if appropriate;
- persist an eligible evaluation idempotently;
- never create or mutate a prediction;
- never silently overwrite a changed verified score.

### Manual reconciliation fallback

Use manual reconciliation only when all of these are true:

- the stored World Cup fixture is exact and kickoff is already in the past;
- no verified result exists yet;
- provider refresh could not materialize a trusted terminal result;
- an admin has confirmed the official final score from a trusted source.

Operator path:

1. Open `/admin/real-fixture-result-review-queue`.
2. Find the fixture under `Manual result reconciliation`.
3. Enter `home_goals`, `away_goals`, and a required source note describing the official source.
4. Submit to create a `match_results` row with `verification_status = pending_review` and `intake_source = manual`.
5. Verify that pending row through the existing review action. For stale public World Cup fixtures, this step may also finalize the stored match status to `finished`.
6. Persist the internal evaluation only after the result is verified.

Guardrails:

- manual entry never auto-verifies the score;
- manual entry never creates or mutates `prediction_versions`;
- verification never changes the stored score;
- evaluation only persists against the verified result;
- if the score was entered incorrectly, correct it through a new reviewed admin action rather than rewriting prediction history.

## Exception handling

Exception examples:

- `provider_fixture_not_found`;
- incomplete/missing score;
- unsupported state;
- identity mismatch;
- incompatible duplicate;
- changed verified score;
- evaluation persistence failure.

`provider_fixture_not_found` may be transient. Retry later under a bounded recent-fixture scope. Do not delete or downgrade existing verified data.

## Routine target selection

Prefer:

- kickoff recently passed;
- scheduled/started rows without a verified result;
- recent pending exceptions;
- a short correction window.

Avoid routinely querying completed historical batches that are already verified and evaluated.

## Scheduler target

Pending implementation:

- once/twice daily;
- additional runs around dense kickoff windows;
- automatic recent-pending selection;
- retry/backoff;
- concise operator notification;
- run metrics and reconciliation alerts.

## Partner export

Torneo export contract:

```text
torneo-ufo-export-v1
```

- JSON is the approved delivery artifact;
- partner identity uses `fixtureId` or `externalId`;
- no PDF is required;
- export public-safe fields only.

## Required report

- run ID/cutoff/environment;
- exact fixture scope;
- provider response time where available;
- create/update/already-identical/skip counts;
- verification/evaluation counts;
- exception/retry status;
- idempotency evidence;
- no secrets.

## Guardrails

- production target confirmation;
- exact competition/fixture scope;
- dry-run before apply;
- exact allowlist for writes;
- immutable prediction history;
- no post-kickoff generation;
- no silent score correction;
- no broad silent apply.
