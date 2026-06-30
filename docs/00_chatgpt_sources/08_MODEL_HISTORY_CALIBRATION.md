# Model History and Calibration

_Last refreshed: 2026-06-29 after Task 2B closed the current fixture/result gap without generating a V2 candidate._

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

```text
1 active model
24 immutable prediction versions
240 market rows
24 public fixtures
state = exact_complete
```

**Decision:** all V2 comparisons use stored V1 versions, never a reconstructed strawman.

## Presentation changes are not model changes

`Lectura UFO` and football-first premium scenario wording are deterministic presentation layers over existing authorized V1 information.

They do not:

- create a model version;
- recalculate a prediction;
- move probabilities;
- alter calibration;
- change confidence/risk values;
- use post-kickoff evidence;
- establish V2 accuracy.

Public History likewise exposes immutable prediction and verified result state. It does not rewrite the model.

## Historical calibration closeout

Preserved historical work includes:

- exact/runtime-compatible V1 references;
- challenger candidates;
- expanded calibration rows;
- neutral-context correction;
- train/validation/holdout separation;
- reliability shrinkage and contradiction penalties;
- movement caps;
- time-series evaluation;
- eligibility and blocked states;
- historical safe-analysis and gated-V2 packaging.

Historical labels such as:

```text
v1_plus_high_confidence_signals
gated_v2_probability_v2_analysis
```

remain research history, not release approval.

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

## Binding calibration rules

- World Cup fixtures are neutral by default except host-country cases.
- Historical evidence resolves strictly before fixture cutoff.
- Validation and holdout remain separate.
- Candidate selection uses explicit auditable metrics.
- Low-confidence and contradictory signals are shrunk or blocked.
- Probability movement is capped.
- Diagnostic-only candidates cannot silently become release candidates.
- Eligibility is distinct from promotion and publication.

## Completed baseline and result evidence

Task 2A:

```text
prepared cutoff = 2026-06-20
signal rows = 48
state = exact_complete
runtime fixture coverage = 72/72
candidate-ready fixtures = 0
```

Task 2B:

```text
fixture actions satisfied = 41/41
result actions satisfied = 69/69
evaluation actions satisfied = 24/24
evaluation-pending rows preserved = 45
kickoff-conflict exclusions preserved = 3
```

**Decision:** preserve the Task 2A baseline and Task 2B result/evaluation evidence as immutable lineage. New current signals append or version newer truth.

Task 2B completion closes the fixture/result freshness gap. It does not create candidate-ready fixtures by itself.

## Current calibration gaps

Before a real V2 release decision:

1. append current World Football Elo;
2. capture the latest available official FIFA ranking;
3. calculate current standings, form, points, goals, and goal difference;
4. derive qualification and pressure context;
5. persist repeatable current source-backed signal snapshots;
6. define and pass a minimum current-data gate;
7. generate live shadow candidates;
8. create fair historical replays;
9. compare with immutable V1 and verified results.

Fixture/result refresh is complete. Ranking/context coverage, candidate generation, and fair evaluation remain open.

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

Finished fixtures:

```text
original V1 publication
vs V2 historical_replay
vs verified result
```

Not-started fixtures:

```text
stored V1 baseline
vs V2 shadow candidate under explicit cutoff
```

## Result and evaluation evidence

Task 2B evaluation rows always reference the original immutable prediction version.

Timestamp equality compares represented instants, so equivalent UTC/offset strings are equal while invalid or genuinely different instants fail closed.

The 45 pending evaluations remain pending because required evaluation conditions were not satisfied. They are not missing writes disguised as success.

## First shadow-candidate calibration gate

A candidate is eligible when:

- fixture has not started;
- required identity and source lineage resolve;
- Task 2C/2D minimum current-data coverage is met;
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

Learning artifacts may inform V2.1, V3, or later versions, but never rewrite the original publication.

Classify model error, data limitation, tactical path, late-goal sensitivity, and football variance separately where evidence permits.
