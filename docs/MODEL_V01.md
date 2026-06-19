# Model V0.1 / V0.2 Notes - UFO Predictor

_Last refreshed: post PR #94 model closeout / Wompi production premium baseline / 28-fixture evaluation closeout (2026-06-19)._

## Accepted current model state

PR #94 completed the current model refresh cycle.

- SIGNAL04: retained.
- DRAW01: retained.
- `expected-goals.ts`: unchanged.
- Cabo Verde alias resolution: fixed.

The model improved modestly in 1X2 direction and draw selection. Exact-score accuracy did not improve, and some favorite/blowout profiles remain too compressed.

## SIGNAL04

SIGNAL04 refreshed the 48 World Cup teams using reviewed safe fields from a normalized FIFA/Elo/results package:

- FIFA rank and points;
- Elo rank and rating;
- historical aggregate goals/matches;
- reviewed bounded aggregate recent-form metadata;
- canonical runtime mappings;
- source/snapshot metadata.

Raw `last5` arrays were not imported because the source package contained invalid/future dates, incomplete lists, unresolved aliases, and historical-leakage risk.

## DRAW01

DRAW01 is a conservative post-market reconciliation. It may make draw the top 1X2 outcome only when:

- modal score is a draw;
- the modal draw meaningfully leads other scorelines;
- xG gap is small;
- expected total goals are bounded;
- draw is already close to the 1X2 leader;
- the required shift stays within the cap.

Rule: move only the minimum needed to make draw strictly top, otherwise no-op.

DRAW01 does not change xG, scoreline probabilities, BTTS, or O/U.

## Fair stored evaluation

Scope: latest evaluated `internal_lab` + `pre_match_24h` row per unique launch-safe fixture.

| Metric | Result |
|---|---:|
| Unique fixtures | 28 |
| 1X2 | 16/28 (57.1%) |
| Exact score | 7/28 (25.0%) |
| BTTS | 16/27 (59.3%) |
| O/U 2.5 | 16/28 (57.1%) |
| Avg home-goal error | 1.179 |
| Avg away-goal error | 0.643 |
| Avg total-goal error | 1.821 |
| Actual draws | 10 |
| Stored top-draw predictions | 0 |

Confusion matrix:

- predicted home -> actual home 15, draw 7, away 2;
- predicted draw -> actual home 0, draw 0, away 0;
- predicted away -> actual home 0, draw 3, away 1.

## Improvement evidence

Fair DRAW01 overlay over 26 stored fixtures:

- 1X2 before: 14/26;
- 1X2 after: 15/26;
- additional actual draws captured: 1;
- false top draws introduced: 0.

Current-model diagnostic on 26 fixtures after SIGNAL04 + DRAW01:

- 1X2 16/26;
- exact 6/26;
- BTTS 14/26;
- O/U 16/26;
- average total-goal error about 1.808;
- top draws 2;
- false top draws 0.

This diagnostic is not a fair historical backtest because refreshed signals contain post-period information.

## Latest result impact

Canada 6-0 Qatar:

- correct 1X2;
- correct BTTS No;
- incorrect exact score;
- incorrect Under 2.5;
- major blowout underestimation.

Mexico 1-0 South Korea:

- correct 1X2;
- correct BTTS No;
- correct Under 2.5;
- incorrect exact score.

## Rejected experiments

- SIGNAL04B selective team overrides: rejected as fixture-specific overfitting.
- SIGNAL04C global `anchor ± 18`: rejected for broad changes and broken xG/DRAW guardrails.
- SIGNAL04D old attack/defense hybrid: rejected as effectively a no-op.
- SIGNAL04E field ablation: showed most suspicious outputs predated SIGNAL04; no safe rollback.
- XG01A candidate 1: reduced metadata influence, rejected for 1X2/draw regressions.
- XG01A candidate 2: reliability-aware GF/GA, safe but insufficient.
- XG01A candidate 3: stronger power-gap translation, rejected for DRAW01/BTTS regressions.

## Known limitations

- xG compression toward close scorelines;
- modal `1-1` in some favorite profiles;
- blowout underestimation;
- sensitivity to extreme attack/defense values;
- exact-score quality remains weak;
- refreshed-signal retrospective diagnostics are not fair backtests;
- fixture-level sanity gating remains mandatory.

## Interpretation policy

- 1X2 probabilities are model readings, not promises.
- Most likely score is a scenario, not certainty.
- High confidence does not imply exact-score precision.
- Torneo human picks, provider predictions, and betting odds are not UFO model inputs.
