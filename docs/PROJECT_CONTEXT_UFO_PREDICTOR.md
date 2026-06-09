# Project Context — UFO Predictor

UFO Predictor is a football prediction platform being built with a conservative internal-validation-first approach.

## Current product philosophy

- Validate internally before publishing.
- Keep real provider-ingested fixtures private by default.
- Use admin-only Lab flows for early testing.
- Avoid provider predictions and odds.
- Avoid broad automated ingest until guardrails are proven.

## Current technical maturity

The project now supports:

- controlled API-Football ingest;
- durable ingest run tracking;
- exact single-friendly ingest;
- admin-only Real Fixture Lab;
- internal prediction preview;
- internal prediction persistence.

## Important distinction: Beta Lab vs Real Fixture Lab

### Beta Lab

`/admin/beta-lab` is for synthetic/internal `lab_only` flows.

### Real Fixture Lab

`/admin/real-fixture-lab` is for real API-Football fixtures ingested as:

- `access_scope='admin_only'`.
- `intake_source='api_football'`.

The two flows should remain conceptually separate unless a future design intentionally merges them.

## Current validated real fixture

Peru vs Spain:

- External id: `api-football:fixture:1540356`.
- Competition: Friendlies.
- Ingested via D05G exact fixture path.
- Persisted as admin-only.
- Internal prediction saved.
- Markets saved.
- Evaluation not yet persisted.

## Current next problem

The next project question is not “can we ingest and predict?”

That is now proven for one internal real-friendly trial.

The next question is:

```txt
Can we review a real result and evaluate the saved prediction safely, internally, and without public leakage?
```

## Hard boundaries

- No broad friendlies apply.
- No World Cup apply.
- No provider predictions.
- No odds.
- No public exposure from Lab.
- No `prediction_results` before result verification/evaluation design.
- No service-role client in app routes.
