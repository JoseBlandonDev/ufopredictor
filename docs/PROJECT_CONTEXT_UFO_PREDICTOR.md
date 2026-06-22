# Project Context - UFO Predictor

_Last refreshed: 2026-06-22._

## Product

UFO Predictor is a football intelligence product that combines public football data, historical results, ratings, probabilistic modeling, scenario analysis, and natural-language explanation.

It is not a sportsbook, does not accept bets, and does not guarantee outcomes.

## Current technical state

Production runs the established v1 product loop.

The current feature branch contains Prediction Intelligence v2 through Task 3A:

- normalized FIFA/Elo/results/schedule sources;
- durable analytical schema;
- historical replay;
- conservative gated probability candidate;
- v2 scenario/evidence layer;
- immutable release/export planning;
- production-safe dry-run tooling.

Task 3B stage synchronization is next.

## Core product shift

Old presentation risk:

```text
three exact scores that look like guesses or prophecies
```

Target presentation:

```text
statistical reading
+ principal scenario
+ risk/coverage scenario
+ alternate scenario
+ evidence, contradictions, reliability, and source cutoff
```

The user should understand why a favorite is favored, why a draw is plausible, and what an underdog path would require.

## Data strategy

Build and maintain UFO's own durable database of:

- canonical teams and localizations;
- FIFA/Elo snapshots;
- historical match facts;
- current tournament results;
- opponent quality;
- attack/defense/conversion;
- official schedule/venues;
- signal snapshots and provenance.

New results append or correct history; they do not trigger full-history redownloads. Recompute only affected teams/signals when practical.

## Current model truth

The gated v2 probability engine is near parity with v1. The main approved improvement is the analysis layer. Future v3 research may increase tournament-current weighting after a larger clean sample.

## Environments

- production: live user/payment data;
- stage: separate Auth/database for migration, data, prediction, export, and UI validation;
- no production user/payment cloning into stage.

## Immediate next task

Task 3B read-only stage parity audit, followed by authorized synchronization and validation after human review.
