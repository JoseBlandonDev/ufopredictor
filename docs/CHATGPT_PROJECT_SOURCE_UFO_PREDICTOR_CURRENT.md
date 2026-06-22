# ChatGPT Project Source - UFO Predictor Current

_Last refreshed: 2026-06-22, Prediction Intelligence v2 Task 3A handoff._

## Purpose

This is the compact canonical source for new ChatGPT conversations. It summarizes the product, architecture, implemented v2 work, environment state, accepted model interpretation, and exact next task.

## Product

UFO Predictor is a football intelligence product for probabilistic World Cup analysis. It does not accept bets and does not guarantee results.

Core principle:

```text
El modelo estadístico calcula.
La IA explica.
```

The value is not that FIFA, Elo, fixtures, and results are impossible to find. The value is that UFO collects, normalizes, links, calculates, simulates, and explains them in one pre-match product.

## Production baseline

Production already supports:

- public predictions and verified history;
- registered-free and premium access layers;
- Wompi payment and approved-webhook activation;
- entitlement-based authorization;
- admin pricing and operational queues;
- prediction review/publication workflows;
- Torneo Mundialista export.

Prediction Intelligence v2 is not yet live in production.

## Current branch

```text
feature/prediction-intelligence-v2-data-foundation
```

Latest Task 3A commit:

```text
6967fd6b22a49e23ab9963345f1a1437b1d6b668
```

## Prediction Intelligence v2 architecture

### Durable data

- source snapshots;
- canonical aliases and localization;
- FIFA and Elo rating snapshots;
- historical match facts;
- correction lineage;
- official schedule and venue catalog;
- links to product/API-Football identities;
- signal snapshots;
- immutable provenance.

### Coverage

| Asset | Count |
|---|---:|
| Historical match facts | 1,392 |
| Elo timeline entries | 3,028 |
| Elo teams | 244 |
| FIFA rows | 211 |
| Official World Cup matches | 104 |
| Group-stage links | 72/72 |
| Knockout placeholders | 32 |
| Venues | 16/16 |
| World Cup runtime teams | 48/48 |
| Replay-ready fixtures | 36/36 |

### Core signal groups

- current and start-of-year Elo;
- FIFA rank/points snapshot;
- recent form windows;
- attack/defense/conversion;
- failed-to-score and clean-sheet rates;
- BTTS and total-goal tendencies;
- opponent quality/strength of schedule;
- performance relative to Elo expectation;
- official/friendly and neutral/home/away context;
- tournament-current form;
- source/sample reliability;
- structural vs current-form disagreement.

All pre-match calculations use strict pre-kickoff evidence cutoffs.

## Model 2.0 result

The first broad challenger regressed and was not promoted. Subsequent work corrected neutral context, replay parity, selection logic, bounded movement, and scenario evaluation.

Selected candidates:

```text
Probability: v1_plus_high_confidence_signals
Release:     gated_v2_probability_v2_analysis
```

The gated v2 probability engine is effectively near parity with v1. It is a conservative development candidate, not proof of materially higher accuracy.

The v2 analysis layer is approved for development because it adds traceable and useful information even where probabilities remain similar.

## Scenario philosophy

The UI must not present three scorelines as three prophecies.

Use:

1. principal scenario;
2. principal risk/coverage scenario;
3. alternate scenario.

Each scenario should contain representative score, exact and family probabilities, evidence for/against, match script, reliability, and source cutoff. Additional plausible scores should reveal that UFO models a full distribution.

Post-match evaluation distinguishes:

- exact score;
- 1X2 family;
- winning margin;
- total-goal range;
- BTTS/O-U;
- match path and late-goal sensitivity;
- model error versus normal variance.

Preferred post-match wording:

```text
Se materializó uno de los escenarios contemplados.
```

Do not claim clairvoyance.

## Case-study lessons

- Germany-Curaçao 7-1: direction correct, extreme goal volume underestimated.
- Spain-Cape Verde 0-0: structural favorite failed to convert; low-scoring draw was a meaningful risk family.
- Brazil-Morocco 1-1: low-scoring draw family was plausible and represented.
- Germany-Ivory Coast 2-1: narrow favorite win after long 1-1 state; path analysis matters.
- Ecuador-Curaçao 0-0: structural gap remained, but conversion/draw risk materialized.

Individual results do not validate a calibration by themselves.

## Environment state

```text
Production: ufopredictor.com       + production Supabase
Stage:      stage.ufopredictor.com + separate Supabase stage
```

Stage registration/login works. Its user identity is intentionally independent. Stage predictions are unavailable because the schema/data are not yet synchronized.

Task 3B must receive credentials through a local Git-ignored file. Its presence and structure are operator-local facts and must be revalidated before execution. Never expose it.

## Task 3A

Task 3A provides a safe dry-run operational layer:

- target guard;
- migration/import/signal/publication plans;
- Torneo export preview;
- production denial;
- tests.

No physical remote write has occurred.

## Exact next task

Task 3B:

1. read-only stage migration/schema parity audit;
2. human approval;
3. stage migration synchronization;
4. migration 0038;
5. non-sensitive idempotent import;
6. signal persistence;
7. immutable development prediction versions;
8. Torneo development export;
9. RLS/public/localization/venue/UI validation;
10. production remains untouched.

## Near-term product roadmap

After Task 3B:

- premium scenario/evidence UI;
- anonymous/free/premium segmentation;
- Spanish team names now, English via the same localization structure;
- eliminate known `Por definir` venue placeholders;
- controlled stage-to-production promotion;
- future v3 tournament-form/UFO-strength research.
