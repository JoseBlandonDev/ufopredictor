# Model Calibration Closeout - PR #94

_Last refreshed: post PR #94 model closeout / Wompi production premium baseline / 28-fixture evaluation closeout (2026-06-19)._

## Executive conclusion

The model was updated and the update is merged in `main` through PR #94.

Final accepted state:

- SIGNAL04 retained;
- DRAW01 retained;
- `expected-goals.ts` unchanged;
- Cabo Verde alias fixed;
- fixture-level sanity gating retained.

The update produced a modest improvement in 1X2/draw handling. It did not improve exact-score quality and did not solve structural blowout/scoreline-compression limitations.

## What SIGNAL04 changed

SIGNAL04 refreshed the 48 World Cup teams with reviewed safe fields from a local ignored FIFA/Elo/results source package in the `codex-inputs/signal-refresh/` audit workspace:

- FIFA rank and points;
- Elo rank and rating;
- historical aggregate match/goals statistics;
- reviewed aggregate recent-form metadata;
- canonical runtime mapping;
- source/snapshot metadata.

The normalized package covered all 48 teams, but raw recent arrays were rejected because they contained invalid/future dates, unresolved aliases, incomplete lists, and leakage risk. The package is audit evidence and regeneration input, not a runtime dependency or required tracked repository asset.

## What DRAW01 changed

DRAW01 reconciles aggregate 1X2 probabilities when the score matrix strongly supports a draw but home/away narrowly leads.

Eligibility requires:

- modal scoreline is a draw;
- meaningful modal-draw lead;
- small xG gap;
- bounded expected total goals;
- draw already near the 1X2 leader;
- required probability shift within cap.

Implementation rule: move only the minimum needed to make draw strictly top; otherwise no-op.

It does not alter xG, scoreline probabilities, BTTS, or O/U.

## Fair stored evaluation scope

Scope: latest evaluated `internal_lab` + `pre_match_24h` prediction per unique launch-safe World Cup fixture.

Deduplication order:

1. `prediction_results.validated_at desc`;
2. `prediction_versions.created_at desc`;
3. `prediction_results.id desc`.

Counts:

- raw evaluation rows: 31;
- unique fixtures: 28;
- fixtures with multiple internal versions: Mexico vs South Africa, South Korea vs Czech Republic, Canada vs Bosnia & Herzegovina.

## Final fair stored metrics

| Metric | Result |
|---|---:|
| 1X2 direction | 16/28 (57.1%) |
| Exact score | 7/28 (25.0%) |
| BTTS | 16/27 (59.3%) |
| O/U 2.5 | 16/28 (57.1%) |
| Avg home-goal error | 1.179 |
| Avg away-goal error | 0.643 |
| Avg total-goal error | 1.821 |
| Actual draws | 10 |
| Stored top-draw predictions | 0 |
| False stored top draws | 0 |

1X2 confusion matrix:

| Predicted | Actual home | Actual draw | Actual away |
|---|---:|---:|---:|
| Home | 15 | 7 | 2 |
| Draw | 0 | 0 | 0 |
| Away | 0 | 3 | 1 |

Important: this fair stored sample mostly predates SIGNAL04/DRAW01 and therefore is not a direct retrospective validation of the new model.

## DRAW01 fair overlay

Over 26 stored fixtures:

- before: 14/26 1X2;
- after: 15/26 1X2;
- additional actual draws captured: 1;
- false top draws introduced: 0.

The newly captured draw was Canada vs Bosnia & Herzegovina.

This is the clearest directly attributable improvement.

## Current-model diagnostic

A current-model shadow recompute over the prior 26-fixture set produced approximately:

- 1X2: 16/26;
- exact: 6/26;
- BTTS: 14/26;
- O/U: 16/26;
- average total-goal error: 1.808;
- top draws: 2;
- false top draws: 0.

This is diagnostic only because refreshed signals contain later information.

## Latest two fixtures

### Canada 6-0 Qatar

Stored public prediction:

- 1X2: 41.50 / 29.08 / 29.43;
- top: home;
- most likely score: 1-0;
- xG: 1.2056 / 0.9665;
- BTTS: No;
- O/U: Under 2.5.

Evaluation:

- 1X2 correct;
- exact incorrect;
- BTTS correct;
- O/U incorrect;
- total-goal error contribution: 5.

Interpretation: correct direction and clean-sheet read, severe blowout underestimation.

### Mexico 1-0 South Korea

Stored public prediction:

- 1X2: 37.48 / 27.60 / 34.92;
- top: home;
- most likely score: 1-1;
- xG: 1.2299 / 1.1770;
- BTTS: No;
- O/U: Under 2.5.

Evaluation:

- 1X2 correct;
- exact incorrect;
- BTTS correct;
- O/U correct;
- total-goal error contribution: 1.

## Delta from prior 26-fixture fair baseline

- sample: 26 -> 28;
- 1X2: 14/26 -> 16/28;
- exact: 7/26 -> 7/28;
- BTTS: 14/25 -> 16/27;
- O/U: 15/26 -> 16/28;
- avg total-goal error: 1.731 -> 1.821.

The two latest fixtures improved 1X2 and BTTS counts but did not improve exact score and worsened average total-goal error because of the 6-0 blowout.

## Rejected experiments

### SIGNAL04B - selective team overrides

Targeted manual adjustments for a small suspicious team set.

Rejected because:

- fixture-specific/manual overfitting;
- poor maintainability;
- weak generalization evidence.

### SIGNAL04C - global `anchor ± 18`

Applied a broad attack/defense band.

Rejected because:

- changed too many teams;
- broke xG/DRAW guardrails;
- harmed Canada vs Bosnia and Saudi Arabia vs Uruguay behavior.

### SIGNAL04D - old attack/defense hybrid

Kept refreshed FIFA/Elo/form but restored prior attack/defense.

Rejected because:

- effectively a behavioral no-op;
- did not solve suspicious fixtures;
- no metric improvement.

### SIGNAL04E - field-level causal ablation

Tested old rating, old form, old attack/defense, and combinations.

Conclusion:

- suspicious outputs mostly predated SIGNAL04;
- rollback did not safely improve the overall diagnostic;
- SIGNAL04 was not the root cause of the structural pattern.

### XG01A candidate 1 - reduced metadata influence

Rejected for 1X2 and draw-support regressions.

### XG01A candidate 2 - reliability-aware historical GF/GA

Safest candidate but rejected because improvement was insufficient and BTTS degraded.

### XG01A candidate 3 - stronger power-gap translation

Rejected because it broke accepted DRAW01 behavior and degraded diagnostics.

## Final causal conclusion

- The broad suspicious-fixture pattern predated SIGNAL04.
- Reverting signal subsets did not safely solve it.
- No expected-goals candidate passed all guardrails.
- New verified results do not justify rollback.

## Known limitations

- xG compression toward close scorelines;
- modal `1-1` in some favorite profiles;
- underestimation of large wins/blowouts;
- sensitivity to extreme attack/defense values;
- exact-score performance remains limited;
- refreshed-signal retrospective recomputes are not fair backtests;
- fixture-level sanity gating remains necessary.

## Operational policy

- Exact-fixture operations only.
- Verify result in Result Review Queue.
- Persist evaluation in Evaluation Queue.
- Keep `prediction_results` internal.
- Do not broad-apply or republish using known results.
- Do not alter the model inside fixture publication/result slices.

## Reopen criteria

Do not reopen model calibration unless at least one is true:

- larger clean fair sample shows material regression;
- repeated failure pattern is documented across multiple independent fixtures;
- a new source package passes quality gates and materially changes evidence;
- an isolated candidate improves primary metrics without breaking draw/BTTS/O-U/goal-error guardrails.

## Final decision

Retain SIGNAL04 + DRAW01 and proceed with operations/documentation. Deeper xG work is a future project, not a launch-week blocker.
