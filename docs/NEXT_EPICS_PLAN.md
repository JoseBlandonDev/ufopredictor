# Next Epics Plan — UFO Predictor

_Last updated after Real Fixture Lab Phase 3A and D05G validation._

## Immediate next epic: Real Fixture Lab Post-Match Evaluation

### Objective

Close the internal trial loop by evaluating a saved internal prediction after the real match result is available and trusted.

Current validated input:

- Fixture: `api-football:fixture:1540356`.
- Match: Peru vs Spain.
- Saved internal prediction exists.
- Prediction markets exist.
- `prediction_results` remains empty.

### Scope

In scope:

- Read actual result for the ingested match.
- Decide result trust/verification policy.
- Evaluate prediction internally.
- Persist `prediction_results` internally.
- Keep all outputs admin-only.

Out of scope:

- Public prediction exposure.
- Premium exposure.
- Odds.
- Provider predictions.
- Batch friendlies.
- World Cup apply.

### Proposed phases

#### E01 — result recognition

- Inspect whether result exists.
- Inspect `match_results.verification_status`.
- Inspect current evaluation helpers and Beta Lab patterns.
- No writes.

#### E02 — result trust design

Decide whether evaluation requires:

- `verification_status='verified'`.
- manual admin review.
- provider result with pending review.

Recommended default:

- block evaluation unless result is trusted/verified.

#### E03 — internal evaluation persistence

Implement minimal admin-only action:

- load saved `prediction_version`.
- load markets if needed.
- load trusted result.
- run evaluation.
- persist `prediction_results`.

#### E04 — validation

Validate:

- one result row.
- one evaluation row.
- no public exposure.
- duplicate evaluation blocked.

## Later epic: controlled World Cup ingest design

Do not start until Real Fixture Lab evaluation is validated.

Likely work:

- World Cup target recognition.
- Controlled dry-run only.
- Exact-fixture or narrow round-based guardrails.
- No public exposure until product decision.

## Later epic: model signal quality

Current v0.1 pipeline may rely on neutral/default inputs.

Future work:

- Add stronger team strength inputs.
- Add recent form.
- Add context signals.
- Keep odds/provider predictions out of scope.

## Blocked epics

- Broad friendlies apply.
- Public prediction product launch from Lab outputs.
- Premium/payments surface changes.
- Cron/worker automation.
- Provider predictions.
- Odds.
