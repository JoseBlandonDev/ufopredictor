# Model History and Calibration

_Last refreshed: 2026-06-26 after the Task 3B stage foundation checkpoint._

## Purpose

This document preserves model history so current work does not reinterpret old baselines, rewrite published predictions, or manufacture progress.

## V0.1 / V1-compatible baseline

The production model established:

- expected-goal inputs;
- score matrix;
- 1X2, BTTS, over/under, and exact-score probabilities;
- confidence and risk presentation;
- immutable pre-match publication.

Its limitations include thinner historical context, limited provenance, and weaker evidence and scenario explanations.

## Calibration closeout around PR #94

The stored baseline was closed out honestly.

Later challenger work must compare against a fair stored/runtime-compatible baseline rather than a simplified strawman.

Core guardrails:

- no post-result rewrite;
- no post-kickoff evidence;
- fair fixture identity and cutoff;
- preserve publication lineage;
- separate probability performance from explanation quality.

## Production V1 comparison set

Matchday 3 provides an immutable V1 baseline:

- 24 stored fixtures;
- 24 published V1 predictions;
- stable provider and product identities;
- partner export under `torneo-ufo-export-v1`.

These publications must be preserved into stage without recalculation before V2 comparison.

## Historical V2 research

The normalized research stack preserves:

- exact and stored V1 replay references;
- challenger candidates;
- expanded calibration rows;
- neutral-context correction;
- candidate-selection correction;
- train, validation, and holdout separation;
- high-confidence signal gates;
- reliability shrinkage and contradiction penalties;
- movement caps;
- time-series evaluation;
- eligibility and blocked states;
- stored/runtime drift classification;
- historical safe-analysis and gated-V2 packaging.

## Historical candidate names

Preserved bounded probability label:

```text
v1_plus_high_confidence_signals
```

Preserved historical development package:

```text
gated_v2_probability_v2_analysis
```

These labels are research history, not current release approvals.

## Honest probability interpretation

The preserved gated V2 candidate was near parity with exact V1:

- small favorable log-loss movement;
- essentially flat or slightly worse Brier behavior;
- no established outcome-accuracy advantage;
- no established goals-error advantage.

Therefore:

- do not market V2 as more accurate yet;
- do not promote from historical artifacts alone;
- use stage to verify regression safety and product quality;
- treat evidence, provenance, scenarios, reliability, localization, and tournament context as value that can be assessed separately;
- reserve stronger accuracy claims for a larger fair current sample.

## Calibration corrections that must remain

- World Cup matches are neutral by default except host-country cases;
- date-only historical evidence resolves strictly before fixture cutoff;
- validation and holdout remain separate;
- candidate selection uses explicit auditable metrics and conservative tie-breaking;
- low-confidence or contradictory signals remain shrunk or blocked;
- probability movement remains capped;
- diagnostic-only candidates cannot silently become production candidates;
- eligibility is distinct from promotion, release approval, and publication.

## Stage foundation status

Task 3B completed the stage data foundation:

- 699 rating snapshots;
- 1,392 historical match facts;
- 104 official schedule rows;
- 72 runtime group-stage matches and schedule links;
- canonical aliases, localizations, venues, and source snapshots;
- zero-write second apply.

This closes the missing-schema and missing-foundation-data gap.

It does not close the current-data or current-candidate gap.

## Current calibration gaps

Before a real V2.0 decision:

1. import the immutable original V1 baseline into stage;
2. refresh current Elo;
3. capture latest available FIFA ranking;
4. refresh recent verified match facts;
5. calculate current standings, tournament form, points, and goal difference;
6. record opponent quality and reliability;
7. create source-backed signal snapshots with explicit cutoffs;
8. generate current live candidates and fair historical replays.

The imported stage foundation cutoff is `2026-06-20` and must not be treated as current on 2026-06-26.

## Versioned comparison contract

Each compared prediction identifies:

- fixture;
- model version;
- feature version;
- calculation time;
- evidence cutoff;
- publication or replay purpose;
- predecessor lineage.

For finished fixtures:

```text
original V1 publication
vs fair V2 historical_replay
vs verified result
```

For not-started fixtures:

```text
original V1 publication
vs V2 candidate under an explicit comparable cutoff
```

A replay uses only pre-kickoff evidence and never replaces the original.

## Evaluation dimensions

Evaluate separately:

- 1X2 calibration and direction;
- Brier and log loss;
- expected-goal and total-goal error;
- BTTS and totals;
- exact and scenario-family hit;
- margin and surprise severity;
- explanation usefulness;
- evidence correctness and freshness;
- confidence calibration;
- data availability and reliability.

A better explanation does not prove better probabilities. Better probabilities do not excuse weak provenance or misleading explanations.

## Explanation-first model output

V2 analysis should convert structured signals into football meaning:

- stronger or weaker structural rating;
- tournament attack and defense profile;
- points and qualification context;
- controlled, tight, open, or upset match scripts;
- supporting and contradicting evidence;
- uncertainty and missing-data limitations.

Exact scores are representative anchors inside scenario families.

## Future player and squad signals

Later model versions may incorporate:

- squad and lineup availability;
- injuries and suspensions;
- expected minutes;
- tournament goals and assists;
- player contribution to team goals;
- individual shooting and xG;
- offensive dependency;
- replacement strength;
- likely scoring candidates.

Each player signal requires source, observed time, cutoff, and reliability. No later lineup or injury fact may leak into an earlier replay.

These signals are not required for the first V2.0 candidate.

## Post-match learning contract

Evaluation may classify:

- exact scenario hit;
- scenario-family hit;
- correct 1X2 direction;
- margin and total-goal behavior;
- BTTS and over/under;
- surprise severity;
- path state and late-goal sensitivity;
- model error versus football variance;
- structural versus tournament-context contribution;
- player-availability impact when that data exists.

Learning artifacts may inform V2.1, V3, or later versions but must never rewrite the original published prediction.
