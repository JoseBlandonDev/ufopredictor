# Model V0.1 — UFO Predictor

_Last updated after Real Fixture Lab Phase 3A validation._

## Current role of model v0.1

Model `v0.1` is the active internal model version used by the Real Fixture Lab validation flow.

It was used to generate and persist an internal prediction for:

- `api-football:fixture:1540356`.
- Peru vs Spain.
- Friendly.
- `run_scope='internal_lab'`.
- `prediction_type='pre_match_24h'`.

## What was validated

The validation confirms the pipeline:

```txt
real fixture
-> MatchPredictionInput
-> generatePrediction(...)
-> prediction_versions
-> prediction_markets
```

It does not prove strong model performance.

## Important caveat

Current Real Fixture Lab inputs may rely on default/neutral signals when richer signals are unavailable.

That means:

- prediction persistence is working;
- market projection persistence is working;
- model evaluation is not yet complete;
- model quality claims should remain conservative.

## Current output categories

The engine currently produces internal markets such as:

- match winner;
- BTTS;
- over/under 2.5;
- exact score candidates.

In Real Fixture Lab Phase 3A, persisted markets use:

- `is_premium=false`.
- internal-only context.

## Not used in current model flow

Current Real Fixture Lab does not use:

- provider predictions;
- odds;
- public/premium prediction exposure;
- post-match evaluation results.

## Next model-adjacent work

After result review/evaluation is implemented, model v0.1 can be evaluated against saved internal predictions.

Future model improvements may include:

- better team strength signals;
- recent form signals;
- context inputs;
- confidence calibration.

Do not add odds/provider predictions as shortcuts.
