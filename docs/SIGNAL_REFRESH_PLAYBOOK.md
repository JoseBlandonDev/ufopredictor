# Signal Refresh Playbook - UFO Predictor

_Last refreshed: post PR #97 implementation and PR #99 operational use (2026-06-19)._

## Status

The reproducible national-team signal baseline is implemented.

Snapshot:

```text
2026-06-19
```

Tracked path:

```text
data/prediction-engine/national-team-signals/2026-06-19/
```

## Purpose

Refresh source signals without silently changing model formulas or rewriting historical predictions.

Signal refresh is not model recalibration.

## Source inputs

Validated source categories:

- FIFA ranking metadata;
- Elo rating;
- recent result aggregates;
- fixture Elo coherence;
- Spanish/English display names.

## Runtime scores

The reconstructed SIGNAL04 builder uses:

```text
ratingScore = minmax(eloRating, 1427..2129)
recentFormScore = round2(recentPointsPerMatch / 3 * 100)
attackScore = minmax(historicalGoalsForPerMatch, 1.075..2.345)
defenseScore = inverse_minmax(historicalGoalsAgainstPerMatch, 0.785..1.655)
```

FIFA rank/points are metadata and `fifaScore`; they do not drive the four runtime scores.

## Quality gates

A source package must prove:

- exactly 48 canonical teams for the current World Cup scope;
- no duplicate keys;
- full expected FIFA/Elo coverage;
- no impossible dates;
- no results after snapshot time;
- no unresolved canonical opponent aliases;
- explicit partial-sample metadata;
- valid fixture Elo parsing.

## Generator

```bash
npm run signal:generate:national-team-pack
npm run signal:check:national-team-pack
```

The check is line-ending agnostic and must pass on Windows.

Runtime consumes generated static TypeScript only.

## Change classification

Current operational thresholds:

- `NO_MATERIAL_CHANGE`: max score delta < 2 and total < 5;
- `MINOR_CHANGE`: max >= 2 or total >= 5;
- `MATERIAL_CHANGE`: max >= 7 or total >= 14;
- `CRITICAL_CHANGE`: max >= 15 or total >= 30.

These thresholds support review, not automatic outcome overrides.

## Fixture handling

### Finished/live/kickoff-passed

- freeze;
- do not regenerate;
- do not rewrite;
- preserve original prediction.

### Future scheduled

- revalidate provider;
- generate deterministic shadow or batch prediction;
- compare;
- publish immutable version only through approved flow.

## Elo coherence

Use Elo fixture expectancy as review context only.

Suggested gap levels:

- <=10 percentage points: aligned;
- >10 to 20: WATCH;
- >20 to 30: manual review;
- >30: critical;
- favorite inversion: critical.

Do not replace UFO 1X2 with Elo.

## Review Gate

Use `/admin/prediction-refresh-review` for selected fixture review.

AI is not connected.
Reviewed-xG is preview-only.

## Batch operations

For complete matchdays, prefer a controlled script:

- dry-run default;
- exact round inventory;
- provider revalidation;
- freeze protection;
- immutable writes;
- idempotence proof;
- final public export validation.

Use console for repeated reads and dry-runs instead of consuming Codex context.

## Future cadence

Still open.

Do not refresh after every surprising result. Candidate triggers:

- official ranking release;
- completed matchday;
- meaningful result batch.
