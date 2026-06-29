# Model History and Calibration

_Last refreshed: 2026-06-27 after Task 2A closed the baseline-storage gap and PR #119 changed premium terminology without changing model or calibration behavior._

## Purpose

Preserve model history so current work does not reinterpret old baselines, rewrite published predictions, or manufacture progress.

## V1-compatible baseline

V1 established:

- expected-goal inputs;
- score matrix;
- 1X2, BTTS, over/under, and exact-score probabilities;
- confidence and risk presentation;
- immutable pre-match publication.

Known limitations include thinner provenance, weaker tournament context, and less developed evidence/scenario explanation.

## Stage V1 comparison baseline

The immutable V1 baseline is now present in stage:

```text
1 active model
24 prediction versions
240 market rows
0 narratives
24 public fixtures
```

The post-import read returned:

```text
state = exact_complete
pending publications = 0
```

This closes the missing-stage-baseline gap.

**Decision:** all V2 comparisons use the stored V1 versions, never a reconstructed strawman.

## Presentation changes are not model changes

PR #117 introduced deterministic `Lectura UFO` output derived from existing V1 probability fields and authorized confidence/risk presentation.

PR #119 introduced football-first premium terminology for existing BTTS/totals-oriented information.

Neither change:

- creates a model version;
- recalculates a prediction;
- moves any probability;
- alters calibration;
- changes confidence or risk values;
- uses post-kickoff evidence;
- establishes a V2 accuracy claim.

These are presentation layers. Their release must not be counted as model-performance progress.

The latest verified results remain evaluation evidence for the original immutable V1 versions:

```text
Egypt 1-1 Iran
New Zealand 1-5 Belgium
Uruguay 0-1 Spain
Cape Verde 0-0 Saudi Arabia
Panama 0-1 Croatia
```

## Historical calibration closeout

Preserved historical work includes:

- exact and runtime-compatible V1 references;
- challenger candidates;
- expanded calibration rows;
- neutral-context correction;
- candidate-selection correction;
- train, validation, and holdout separation;
- reliability shrinkage and contradiction penalties;
- movement caps;
- time-series evaluation;
- eligibility and blocked states;
- stored/runtime drift classification;
- historical safe-analysis and gated-V2 packaging.

Historical labels include:

```text
v1_plus_high_confidence_signals
gated_v2_probability_v2_analysis
```

They remain research history, not release approval.

## Honest probability interpretation

Historical gated V2 work was near parity with exact V1:

- small favorable log-loss movement;
- flat or slightly worse Brier behavior;
- no established outcome-accuracy advantage;
- no established goals-error advantage.

Therefore:

- do not claim V2 is more accurate yet;
- do not force probability movement;
- assess explanation, provenance, scenarios, reliability, and tournament context separately;
- require a fair current sample for stronger claims.

## Calibration corrections that remain binding

- World Cup fixtures are neutral by default except host-country cases;
- historical evidence resolves strictly before fixture cutoff;
- validation and holdout remain separate;
- candidate selection uses explicit auditable metrics;
- low-confidence and contradictory signals are shrunk or blocked;
- probability movement is capped;
- diagnostic-only candidates cannot silently become release candidates;
- eligibility is distinct from promotion and publication.

## Baseline-first decision

Prepared workspace cutoff:

```text
2026-06-20
```

Task 2A has now stored that preserved baseline in the real stage signal database.

Verified result:

```text
signal rows = 48
state = exact_complete
verification identical = 48
verification inserts = 0
runtime fixture coverage = 72/72
candidate-ready fixtures = 0
```

**Decision:** preserve this baseline as reproducible calibration and lineage evidence, then append/version current refreshes.

**Motivo:** calibration now has a queryable source lineage and feature-assembly path without rewriting historical identity.

**Consequence:** baseline storage is no longer a gap, but the data is not sufficient for a current candidate until the explicit freshness gate passes.

## Current calibration gaps

Before a real V2.0 release decision:

1. refresh current fixture identity, kickoff state, and verified results;
2. append current World Football Elo;
3. capture the latest available official FIFA ranking;
4. calculate current standings, form, points, and goal difference;
5. derive current source-backed signal snapshots;
6. generate live shadow candidates;
7. create fair historical replays;
8. compare with immutable V1 and verified results.

The baseline-storage gap is closed. Current-data coverage, candidate generation, and evaluation remain open.

## Versioned comparison contract

Each compared version identifies:

- fixture;
- model version;
- feature version;
- calculation time;
- evidence cutoff;
- purpose;
- source and signal snapshots;
- predecessor lineage.

For finished fixtures:

```text
original V1 publication
vs V2 historical_replay
vs verified result
```

For not-started fixtures:

```text
stored V1 baseline
vs V2 shadow candidate under explicit cutoff
```

## First shadow-candidate calibration gate

A candidate is eligible for evaluation when:

- fixture has not started;
- required identity and source lineage resolve;
- minimum current-data coverage is met;
- missing optional signals are explicit;
- no post-kickoff evidence is present;
- movement caps and reliability gates pass;
- predecessor V1 is linked;
- candidate remains unpublished.

## Evaluation dimensions

Evaluate separately:

- 1X2 direction and calibration;
- log loss and Brier;
- xG and total-goal error;
- BTTS and totals;
- exact-score and scenario-family hit;
- margin and surprise severity;
- explanation usefulness;
- evidence correctness and freshness;
- confidence calibration;
- missing-data and reliability behavior.

A better explanation does not prove better probabilities. Better probabilities do not excuse weak provenance.

## Explanation-first output

V2 analysis should express:

- structural rating strength;
- tournament attack and defense profile;
- points and qualification context;
- controlled, tight, open, or upset match scripts;
- supporting and contradicting evidence;
- uncertainty and data limitations.

Exact scores remain representative anchors inside scenario families.

## Future player and squad signals

Later versions may add:

- squad and lineup availability;
- injuries and suspensions;
- expected minutes;
- player goals, assists, shots, and xG;
- offensive dependency;
- replacement quality;
- likely scoring candidates.

Every player signal requires source, observed time, cutoff, and reliability. These are not first-candidate blockers.

## Post-match learning contract

Learning artifacts may inform V2.1, V3, or later versions, but they never rewrite the original publication.

Classify model error, data limitation, tactical path, late-goal sensitivity, and football variance separately where evidence permits.
