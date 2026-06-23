# Model History and Calibration

_Last refreshed: 2026-06-23._

## Purpose

This document preserves historical model decisions so current work does not reinterpret old baselines or manufacture progress.

## V0.1 / v1-compatible baseline

The production model established:

- expected-goal inputs;
- score matrix;
- 1X2, BTTS, over/under, and exact-score probabilities;
- public confidence/risk presentation;
- immutable pre-match publication.

Its limitations included thinner historical context, limited provenance, and weaker evidence/scenario explanations.

## Calibration closeout around PR #94

The stored baseline was closed out honestly. Later challenger work must compare against a fair stored/runtime-compatible baseline rather than a simplified strawman.

Core guardrails:

- no post-result rewrite;
- no post-kickoff evidence;
- fair fixture identity and cutoff;
- preserve publication lineage;
- separate probability performance from explanation quality.

## Recent production model operations

The production track added reviewed xG publication and a recent-form challenger path before the MVP1 polish. Those changes remain part of production v1 operations and are separate from the unmerged v2 data foundation.

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

Selected probability candidate:

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
- treat evidence, provenance, scenarios, reliability, localization, and evaluation as the current product value;
- reserve v3 accuracy claims for a larger fair sample.

## Post-match learning contract

Evaluation may classify:

- exact scenario hit;
- scenario-family hit;
- correct 1X2 direction;
- margin and total-goal behavior;
- BTTS/over-under;
- surprise severity;
- path state and late-goal sensitivity;
- model error versus football variance.

Learning artifacts may inform future versions but must never rewrite the original published prediction.
