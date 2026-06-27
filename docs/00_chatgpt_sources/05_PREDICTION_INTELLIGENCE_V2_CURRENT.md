# Prediction Intelligence v2 - Current

_Last refreshed: 2026-06-27 after the complete Task 1C V1 stage baseline checkpoint._

## Current product and model state

Production remains on the V1-compatible probability layer.

Stage now has a complete immutable V1 comparison baseline:

```text
1 active V1 model
24 V1 prediction versions
240 prediction-market rows
0 narratives
24 public fixtures
post-state exact_complete
```

V2 is not live in production and no current V2 candidate has yet been accepted for release.

## Why the V1 baseline matters

The stage V1 baseline is the predecessor against which V2 must be judged.

It preserves:

- original probabilities;
- original xG and score distributions where present;
- confidence and risk;
- original timestamps;
- exact fixture identity;
- public visibility behavior;
- immutable history.

**Decision:** V2 cannot rewrite or retrospectively improve the original V1 record.

## Completed foundation

The integration track contains:

- normalized team, alias, localization, venue, schedule, rating, and historical-match foundations;
- deterministic fixture identity;
- source snapshots and provenance structures;
- prediction/model/evaluation versioning;
- candidate/replay research code and historical evidence;
- stage target and production-denial guards;
- a stable visible V1 baseline.

Task 3B and Task 1C are closed.

## Historical V2 research status

Preserved research includes:

- historical Elo reconstruction;
- challenger candidates;
- neutral-context correction;
- reliability shrinkage;
- contradiction penalties;
- movement caps;
- eligibility and release packaging;
- fair replay and evaluation concepts.

Historical candidate names remain research evidence, including:

```text
v1_plus_high_confidence_signals
gated_v2_probability_v2_analysis
```

They do not authorize a current release.

## Honest performance position

Historical V2 probability work was near parity with the exact V1 baseline. It did not establish a robust superiority claim.

Therefore:

- do not market V2 as more accurate yet;
- do not move probabilities merely to make V2 look different;
- evaluate explanation, evidence, provenance, reliability, and scenario quality separately from probability metrics;
- require a fair current sample before a stronger accuracy claim.

## Active technical decision: baseline first

Prepared source workspace cutoff:

```text
2026-06-20
```

**Decision:** use this preserved package to create the first real signal baseline in the V2 database, then update it incrementally.

**Alternativa descartada:** delaying pipeline construction until every ranking, result, table, and signal source is refreshed to the latest minute.

**Motivo:** a reproducible baseline is enough to prove schema mapping, lineage, idempotency, signal coverage, feature assembly, and candidate execution.

**Consecuencia operativa:** the 2026-06-20 package is valid baseline input but must not be described as current data.

## Exact next task

```text
V2 Signal Baseline Database Load
```

Scope:

1. inventory only the prepared baseline and committed equivalents;
2. classify raw, normalized, derived, and report artifacts;
3. map approved records to existing stage tables;
4. persist source snapshot, observed time, cutoff, parser/feature version, and checksum lineage;
5. preserve missing and reliability metadata;
6. load once under exact stage and production-deny boundaries;
7. rerun once to prove zero duplicate growth;
8. demonstrate fixture-level signal coverage;
9. stop before V2 candidate generation.

This task is a database load, not another schema-foundation project and not a broad current-data audit.

## Transition after baseline load

```text
current fixture/result refresh
-> current Elo and latest available FIFA ranking
-> standings and tournament form
-> repeatable source-backed signal snapshots
-> first V2 shadow candidate
```

Current refreshes should update or append versioned snapshots rather than rebuild Task 3B.

## First V2 shadow candidate contract

The first candidate should:

- use a not-started stage fixture;
- carry explicit model and feature versions;
- carry calculation time and evidence cutoff;
- reference exact source and signal snapshots;
- identify V1 as predecessor/baseline;
- remain unpublished or development-only;
- report missing, weak, and contradictory signals;
- obey movement caps and reliability gates;
- produce scenario families and structured evidence.

Finished fixtures use `historical_replay` with only pre-kickoff evidence.

## V2 output direction

V2 should move the product from a thin probability display toward football intelligence.

Structured output may include:

- rating and ranking advantage;
- tournament points and form;
- goals for and against;
- attack and defense profile;
- opponent quality;
- qualification or pressure context;
- likely match scripts;
- supporting and contradicting evidence;
- reliability, data quality, source, and cutoff.

Exact scores are anchors inside scenario families, not prophecies.

Facts remain locale-neutral. ES, EN, and PT rendering happens separately.

## Possible release modes

A later stage decision may choose:

```text
V1 probabilities + V2 analysis
```

or:

```text
gated V2 probabilities + V2 analysis
```

The explanation layer may be releasable before V2 probability superiority is established.

## Non-blocking future signals

Not required for the first V2.0 candidate:

- squads and call-ups;
- likely and confirmed lineups;
- injuries and suspensions;
- player expected minutes;
- top scorers and individual xG;
- offensive dependency;
- replacement quality;
- extra-time and penalties modeling.

The architecture should receive them later without rewriting canonical team, match, or prediction identity.

## Decisions that must persist

- V1 remains the immutable published predecessor.
- V2 runs in shadow before promotion.
- Stage is the same application surface, not a separate prototype.
- The 2026-06-20 package is a reproducible baseline, not current truth.
- Current refresh follows baseline load and is incremental.
- No post-kickoff leakage.
- No candidate release from historical artifacts alone.
- One bounded review is sufficient unless a concrete defect appears.
- Production writes remain forbidden from the V2 integration track.

## Responsibility split

- ChatGPT owns model-state, roadmap, and decision documentation.
- Codex implements and validates bounded database/model slices.
- The operator approves and executes remote stage, Git, and release operations.
