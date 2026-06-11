# UFO Predictor — Model Notes

Last refreshed: post-E05 / first public World Cup fixture publication.

## Current status

`v0.1` is now a historical baseline model contract. The active MVP 1 model is:

- `v0.2-prelaunch`

The `v0.2-prelaunch` model was activated after the D07 sanity work because v0.1 collapsed too often into default/baseline signals for national-team fixtures in Real Fixture Lab.

## v0.1 historical role

v0.1 remains useful as:

- a baseline historical row for comparison;
- the original model contract reference;
- a reminder not to overtrust default-signal output.

It should not be treated as the active World Cup launch model.

## v0.2-prelaunch current role

`v0.2-prelaunch` is the current MVP 1 model version.

It introduced local/static national-team fallback signals so Real Fixture Lab fixtures have more useful non-default context when richer provider data is unavailable.

Current use:

- internal Real Fixture Lab predictions;
- first public World Cup prediction copy;
- MVP 1 selected fixture publication.

First public fixture using v0.2-prelaunch:

- Mexico vs South Africa
- `api-football:fixture:1489369`
- public prediction version id `5787306d-ee3a-4167-88ab-ce669f1ed644`

## D06/D07 evidence

Final v0.2-prelaunch pilot metrics from 5 friendly fixtures:

- winner: 4/5;
- BTTS: 2/5;
- over 2.5: 3/5;
- exact score: 0/5;
- total goal error: 8;
- average goal error: 1.6.

Interpretation:

- Winner signal was acceptable for MVP 1 sanity.
- BTTS and over/under still need future calibration.
- Exact score should be de-emphasized publicly.
- The sample is too small for strong performance claims.

## Current model boundary

The model is frozen for MVP 1 launch unless a future planned calibration epic is explicitly opened.

Do not:

- rewrite model weights during launch QA;
- add betting odds as hidden input;
- add provider predictions;
- present pilot metrics as statistically conclusive;
- over-market exact score.

Future model work belongs in a planned later epic, likely MVP 1.5 or MVP 2.
