# UFO Predictor — Model Notes

Last refreshed: post-E07 / MVP 1 public fixture expansion and refresh.

## Current status

`v0.1` is now a historical baseline model contract. The active MVP 1 model is:

- `v0.2-prelaunch`

The `v0.2-prelaunch` model was activated after the D07 sanity work because v0.1 collapsed too often into default/baseline signals for national-team fixtures in Real Fixture Lab.

Post-E07, the model still remains `v0.2-prelaunch`, but the static national-team fallback catalog was expanded for the immediate World Cup launch window.

## v0.1 historical role

v0.1 remains useful as:

- a baseline historical row for comparison;
- the original model contract reference;
- a reminder not to overtrust default-signal output.

It should not be treated as the active World Cup launch model.

## v0.2-prelaunch current role

`v0.2-prelaunch` is the current MVP 1 model version.

It uses local/static national-team fallback signals so Real Fixture Lab fixtures have more useful non-default context when richer provider data is unavailable.

Current use:

- internal Real Fixture Lab predictions;
- selected public World Cup prediction copies;
- exact public refresh for already-public fixtures.

Public fixtures using v0.2-prelaunch after PR #61:

- Mexico vs South Africa;
- South Korea vs Czech Republic;
- Canada vs Bosnia & Herzegovina;
- USA vs Paraguay.

## MVP 1 fallback catalog expansion

PR #61 added immediate World Cup fallback coverage for:

- Mexico;
- South Africa;
- South Korea;
- Korea Republic;
- Czech Republic;
- Czechia;
- Canada;
- Bosnia & Herzegovina;
- Bosnia and Herzegovina;
- USA;
- United States;
- Paraguay.

Purpose:

- avoid full default-signal collapse;
- differentiate early public World Cup fixtures;
- keep launch predictions deterministic and reviewable;
- avoid depending on provider predictions or betting odds.

This is a pragmatic MVP 1 bridge, not a full real-time data model. Calling it “fully data-driven” would be a little too optimistic, like naming a paper boat Titanic II.

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

## Post-E07 public behavior

After fallback expansion and refresh:

- Mexico vs South Africa moved away from default-like 1X2 output;
- South Korea vs Czech Republic remains naturally close, but no longer uses zero-signal/default context;
- Canada and USA fixtures were published with fallback active;
- confidence/risk now reflects non-default signal completeness for covered teams.

## Known model limitations

### Scoreline conservatism

The model still tends too often toward `1-1` as the top scoreline.

This likely means:

- 1X2 probabilities can move meaningfully;
- expected goals / scoreline distribution remains too compressed;
- favorite edge does not influence scoreline outcomes strongly enough.

Future task:

- E10 — Scoreline Calibration + Real Signal Enrichment Plan.

### Static fallback limitations

The current fallback is repo-local and static.

Future enrichment should consider:

- FIFA ranking snapshots;
- Elo-style ratings;
- recent form;
- attack/defense features;
- source/provenance dates;
- DB-backed team strength snapshots.

## Current model boundary

The model is frozen for MVP 1 launch unless a future planned calibration epic is explicitly opened.

Do not:

- rewrite model weights during access-tier work;
- add betting odds as hidden input;
- add provider predictions;
- present pilot metrics as statistically conclusive;
- over-market exact score;
- manually edit scores as if that were modeling. It is not. It is costume design.

Future model work belongs in a planned later epic, likely E10/MVP 1.5 or MVP 2.
