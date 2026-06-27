# Prediction Intelligence v2 - Current

_Last refreshed: 2026-06-27 after Task 2A reached `exact_complete`, PR #119 completed football-first premium terminology, and the active V2 branch synchronized at `4f758b2`._

## Current product and model state

Production remains on the V1-compatible probability layer.

Stage contains:

```text
1 active V1 model
24 immutable V1 prediction versions
240 prediction-market rows
0 narratives
24 public fixtures
V1 post-state = exact_complete
48 V2 team-signal baseline rows
V2 signal post-state = exact_complete
72/72 runtime fixtures baseline-ready
0 candidate-ready fixtures
```

No current V2 candidate has been generated, accepted, published, or released.

## Active branch checkpoint

```text
production main HEAD = 9f89d62
V2 integration branch = integration/prediction-intelligence-v2
V2 integration HEAD = 4f758b2
Task 2A commit = 9491fd8
active Draft PR = #114
```

PR #117 and PR #119 are part of both `main` and the V2 branch through normal Git history.

Their presentation changes are not V2 probability candidates and are not evidence of calibration superiority.

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

## Completed foundation and signal baseline

The integration track contains:

- normalized team, alias, localization, venue, schedule, rating, and historical-match foundations;
- deterministic fixture identity;
- source snapshots and provenance structures;
- prediction/model/evaluation versioning;
- candidate/replay research code and historical evidence;
- stage target and production-denial guards;
- a stable visible immutable V1 baseline;
- the exact Task 2A V2 signal baseline in real stage tables.

Task 2A closed with:

```text
rows = 48
state = exact_complete
verification identical = 48
verification inserts = 0
conflicts = 0
unexpected existing = 0
fixture coverage = 72/72
candidate-ready = 0
```

Task 3B, Task 1C, and Task 2A are closed.

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

## Active technical decision: incremental current-data refresh

Prepared source workspace cutoff:

```text
2026-06-20
```

Task 2A has already persisted this package as the canonical reproducible baseline.

**Decision:** refresh only newer or changed source families incrementally instead of rebuilding the foundation or replacing historical rows.

**Motivo:** source identity, checksum lineage, cutoff, missing/reliability metadata, exact-state classification, and fixture coverage are now proven in the real database.

**Consecuencia operativa:** the stored rows remain baseline evidence, not current candidate evidence. Candidate generation stays blocked until current-data coverage passes.

## Exact next task

```text
Task 2B - Current fixture and result refresh
```

Scope:

1. refresh current not-started fixture identity and kickoff state;
2. persist newly verified results through exact provider identity;
3. preserve immutable V1 publications and Task 2A signal rows;
4. report conflicts and unsupported states instead of repairing silently;
5. stop before rankings/context synthesis and candidate generation.

## Transition after baseline load

```text
Task 2B current fixture/result refresh
-> Task 2C current Elo and latest available official FIFA ranking
-> group standings, tournament form, and qualification/pressure context
-> Task 2D repeatable current source-backed signal snapshots
-> first V2 shadow candidate
```

Current refreshes append or version snapshots rather than rebuilding Task 3B or rewriting the 2026-06-20 baseline.

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

Task 4C improves terminology on existing product surfaces only. It does not alter V2 signals, probabilities, or calibration.

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
