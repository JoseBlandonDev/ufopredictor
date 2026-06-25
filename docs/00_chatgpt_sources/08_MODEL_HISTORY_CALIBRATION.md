# Model History and Calibration

_Last refreshed: 2026-06-24 after Prediction Intelligence v2 Task 2 normalization._

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

These v1 publications remain production history and must not be replaced by replay or dated v2 artifacts.

## Normalized historical v2 research

Task 2A through Task 2D were selectively restored on the current integration branch.

The normalized research stack now preserves:

- exact/stored v1 replay references;
- challenger candidates;
- expanded calibration rows;
- neutral-context correction;
- candidate-selection correction;
- explicit train/validation/holdout separation;
- high-confidence signal gates;
- reliability shrinkage and contradiction penalties;
- movement caps;
- time-series fold evaluation;
- candidate eligibility and blocked states;
- stored/runtime drift classification;
- historical safe-analysis and gated-v2 packaging;
- historical publication and release planning artifacts.

## Historical candidate names

Selected bounded probability candidate in the preserved research:

```text
v1_plus_high_confidence_signals
```

Selected historical development package:

```text
gated_v2_probability_v2_analysis
```

These names are historical research labels, not current release approvals.

## Historical-only interpretation

Preservation manifests declare the dated artifacts historical and non-current.

Where applicable:

```text
historicalOnly: true
currentCandidateEligible: false
currentReleaseDecisionEligible: false
currentPublicationEligible: false
```

No historical `promotion-gate`, `production-candidate-selection`, `release-recommendation`, `release-decision`, or `publication-plan` artifact may be treated as a current decision.

## Honest probability interpretation

The preserved gated v2 candidate was near parity with exact v1:

- small favorable log-loss movement;
- essentially flat or slightly worse Brier behavior;
- no established outcome-accuracy advantage;
- no established goals-error advantage.

Therefore:

- do not market v2 as more accurate yet;
- do not promote from historical artifacts alone;
- use stage to verify regression safety and product quality;
- treat evidence, provenance, scenarios, reliability, localization, and tournament context as the main value under evaluation;
- reserve stronger accuracy claims for a larger fair current sample.

## Calibration corrections that must remain

- World Cup matches are neutral by default except host-country cases;
- date-only historical evidence must resolve strictly before the fixture date/cutoff;
- validation and holdout remain separate;
- candidate selection uses explicit auditable metrics and conservative tie-breaking;
- low-confidence or contradictory signals remain shrunk or blocked;
- probability movement remains capped;
- diagnostic-only candidates cannot silently become production candidates;
- eligibility is distinct from promotion, release approval, and publication.

## Runner and artifact safety

Task 2 runners may write only to strict descendants of their own runner-specific `local-run` trees.

This prevents accidental writes to:

- preserved dated evidence;
- repository siblings;
- another runner's output tree;
- external absolute paths;
- traversal-resolved paths outside the allowed root.

## Current-data calibration gap

Historical normalization is complete through Task 2, but current model calibration is not.

Before a real v2.0 decision, refresh:

- current Elo;
- latest available FIFA ranking;
- recent verified match facts;
- current World Cup form;
- standings, goal difference, and qualification pressure;
- source provenance and reliability;
- explicit prediction cutoffs.

Then compare under identical cutoffs:

```text
stored/published v1
v1 probabilities + v2 analysis
gated v2 probabilities + v2 analysis
```

## Versioned comparison contract

Each compared prediction identifies:

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

The replay uses only pre-kickoff evidence and never replaces the original.

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
