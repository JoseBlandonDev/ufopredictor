# Project Status for Meeting — UFO Predictor

_Last updated after D05G / Real Fixture Lab validation._

## Executive summary

UFO Predictor now has a validated internal path for testing predictions on real API-Football fixtures without exposing anything publicly.

The team can now:

1. Discover a real fixture from API-Football.
2. Ingest exactly one selected friendly under strict guardrails.
3. Store it as `admin_only`.
4. Open it in Real Fixture Lab.
5. Generate an internal prediction preview.
6. Save an internal prediction and markets.

The first validated real-friendly trial was:

- Peru vs Spain.
- `api-football:fixture:1540356`.
- Stored as `admin_only`.
- Prediction saved internally with model `v0.1`.
- Markets saved internally.
- No result/evaluation persisted yet.
- No public exposure.

## What was completed

### Ingest tracking

- Added durable apply tracking.
- Every real apply creates `ingest_runs` and `ingest_run_items`.
- Supports audit and future rollback design.

### Real Fixture Lab

- New admin-only surface for real fixtures.
- Supports prediction preview.
- Supports internal prediction save.
- Does not publish predictions.

### Controlled friendly ingest

- Added exact `fixtureId` ingest path.
- Avoids broad friendly ingestion.
- Validated on one selected friendly.

## Current risk controls

Still blocked:

- Broad friendlies apply.
- World Cup apply.
- Odds.
- Provider predictions.
- Public exposure.
- `prediction_results` until result is verified/reviewed.

## Current limitations

- Model input signals may still be default/neutral in some areas.
- The saved Peru vs Spain prediction validates the pipeline, not full model performance.
- Result/evaluation workflow is not implemented yet.
- Rollback is manual/script-reviewed, not automatic.

## Recommended next milestone

Post-match evaluation:

- Wait for result.
- Verify/review result.
- Evaluate saved prediction internally.
- Persist `prediction_results` internally.
- Keep everything admin-only.

## Meeting talking point

The project moved from “can we ingest real fixtures safely?” to “can we evaluate internal predictions against real outcomes?”

That is the next milestone.
