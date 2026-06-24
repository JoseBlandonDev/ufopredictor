# Model History and Calibration

_Last refreshed: 2026-06-24._

## Purpose

This document preserves historical model decisions so current work does not reinterpret old baselines, rewrite published predictions, or manufacture progress.

## V0.1 / v1-compatible baseline

The production model established:

- expected-goal inputs;
- score matrix;
- 1X2, BTTS, over/under, and exact-score probabilities;
- confidence/risk presentation;
- immutable pre-match publication.

Its limitations include thinner historical context, limited provenance, and weaker evidence/scenario explanations.

## Calibration closeout around PR #94

The stored baseline was closed out honestly.

Later challenger work must compare against a fair stored/runtime-compatible baseline rather than a simplified strawman.

Core guardrails:

- no post-result rewrite;
- no post-kickoff evidence;
- fair fixture identity and cutoff;
- preserve publication lineage;
- separate probability performance from explanation quality.

## Current production baseline evidence

Matchday 3 created an important immutable v1 comparison set:

- 24 stored fixtures;
- 24 published v1 predictions;
- public partner export under `torneo-ufo-export-v1`;
- stable fixture/provider IDs;
- public kickoff and probability fields.

These v1 publications must remain available for later fair v2 comparison.

## Recent production model operations

The production track added:

- reviewed xG publication;
- recent-form challenger work;
- public review gates;
- current-model World Cup publication continuity.

These remain v1 production operations and are separate from the unmerged v2 foundation.

## Prediction Intelligence v2 research

Initial unrestricted challengers did not beat v1.

Subsequent corrections addressed:

- neutral-site handling;
- historical windows;
- candidate-selection bug;
- stored/runtime replay parity;
- reliability shrinkage and gates;
- movement caps;
- scenario-family evaluation.

Selected bounded probability candidate:

```text
v1_plus_high_confidence_signals
```

Selected development release candidate:

```text
gated_v2_probability_v2_analysis
```

## Honest interpretation

Gated v2 is near parity with exact v1:

- small favorable log-loss movement;
- essentially flat/slightly worse Brier;
- no established outcome-accuracy advantage;
- no established goals-error advantage.

Therefore:

- do not market v2 as more accurate yet;
- use stage to verify regression safety and product quality;
- treat evidence, provenance, scenarios, reliability, localization, tournament context, and evaluation as the current product value;
- reserve stronger accuracy claims for a larger fair sample.

## Tournament-context calibration

Immediate v2 research should test:

- structural strength versus current World Cup form;
- group-state and qualification pressure;
- opponent quality;
- small-sample shrinkage;
- whether tournament signals improve explanation without destabilizing probabilities.

Two tournament matches are informative but insufficient to erase long-term strength anchors.

## Versioned comparison contract

Each compared prediction must identify:

- fixture;
- model version;
- feature version;
- calculation time;
- evidence cutoff;
- publication/replay purpose;
- predecessor lineage.

For finished fixtures:

```text
original v1 publication
vs fair v2 historical_replay
vs verified result
```

The replay must use only pre-kickoff evidence and may not replace the original.

## Post-match learning contract

Evaluation may classify:

- exact scenario hit;
- scenario-family hit;
- correct 1X2 direction;
- margin and total-goal behavior;
- BTTS/over-under;
- surprise severity;
- path state and late-goal sensitivity;
- model error versus football variance;
- structural versus tournament-context contribution.

Learning artifacts may inform future versions but must never rewrite the original published prediction.
