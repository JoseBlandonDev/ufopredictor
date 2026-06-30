# Prediction Intelligence v2 - Current

_Last refreshed: 2026-06-29 after Task 2B completed and the accepted `main` checkpoint was integrated into the V2 branch at `9672b55644d8a2bd3818ecd08086ab3ebf111398`._

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

Task 2B fixture actions verified = 41/41
Task 2B result actions verified = 69/69
Task 2B evaluation actions verified = 24/24
evaluation-pending rows preserved = 45
kickoff-conflict exclusions preserved = 3

candidate-ready fixtures = 0
```

No current V2 candidate has been generated, accepted, published, or released.

## Active branch checkpoint

```text
main source integrated = 3d4b036d20df44027d8927a9a90cb546e7553e64
V2 integration branch = integration/prediction-intelligence-v2
V2 integrated checkpoint = 9672b55644d8a2bd3818ecd08086ab3ebf111398
Task 2B implementation = 6d3fb7485b5a7dc1467812466107359daccdc902
Task 2B accepted evidence = 1cdaa8b6384d02854c3bd2dce321b85ea71c869d
active Draft PR = #114
```

The integrated product wording changes are presentation changes, not V2 probability candidates and not calibration evidence.

## Why the V1 baseline matters

The stage V1 baseline is the predecessor against which V2 must be judged.

It preserves:

- original probabilities;
- original xG and score distributions where present;
- confidence and risk;
- original timestamps and cutoffs;
- exact fixture identity;
- public visibility behavior;
- immutable history.

**Decision:** V2 cannot rewrite or retrospectively improve the original V1 record.

## Completed foundation and current-data checkpoints

Closed:

- normalized team, alias, localization, venue, schedule, rating, and historical-match foundations;
- legacy Task 3B stage synchronization;
- Task 1C exact fixture linkage and immutable V1 publication;
- Task 2A reproducible signal baseline;
- Task 2B.1 current fixture refresh;
- Task 2B.2 trusted result and evaluation refresh.

Task 2A:

```text
rows = 48
state = exact_complete
verification identical = 48
fixture coverage = 72/72
candidate-ready = 0
```

Task 2B.1:

```text
selected = 72
reviewed safe actions = 41
verified satisfied = 41/41
blocked kickoff conflicts = 3
verification passed = true
```

Task 2B.2:

```text
selected = 72
reviewed result actions = 69
verified result actions = 69/69
reviewed evaluations = 24
verified evaluations = 24/24
evaluation pending = 45
excluded rows = 3
verification passed = true
```

The three exclusions remain preserved because provider kickoff evidence conflicted with the canonical fixture schedule. They are not silently repaired.

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

Historical labels such as:

```text
v1_plus_high_confidence_signals
gated_v2_probability_v2_analysis
```

remain research evidence, not release approval.

## Honest performance position

Historical V2 probability work was near parity with exact V1. It did not establish robust superiority.

Therefore:

- do not market V2 as more accurate yet;
- do not move probabilities merely to create visible difference;
- evaluate explanation, evidence, provenance, reliability, and scenario quality separately from probability metrics;
- require a fair current sample before stronger claims.

## Active technical decision: continue incremental freshness

Prepared baseline cutoff:

```text
2026-06-20
```

The baseline is stored and Task 2B refreshed fixture/result truth.

**Decision:** continue by appending newer rankings and tournament context rather than rebuilding foundations or overwriting history.

**Consequence:** candidate generation remains blocked until Task 2C and Task 2D produce accepted current, source-backed signal snapshots.

## Exact next task

```text
Task 2C - Ranking, standings, and tournament context
```

Required scope:

1. effective-dated World Football Elo;
2. latest available official FIFA ranking;
3. current standings, points, wins/draws/losses, goals and goal difference;
4. tournament form and opponent quality;
5. qualification and pressure context;
6. source, observed time, cutoff, reliability, missing-data, and contradiction metadata;
7. exact canonical team/fixture linkage;
8. no candidate generation.

There is no dedicated Task 2C implementation or runner yet. Start with bounded source/contract reconnaissance and an implementation plan.

## Transition after Task 2C

```text
Task 2C current rankings and context
-> Task 2D repeatable current source-backed signal snapshots
-> Task 3A first unpublished V2 shadow candidate
-> fair historical replay and V1/V2 evaluation
-> explicit release decision
```

Current refreshes append or version snapshots rather than rebuilding legacy Task 3B or rewriting the Task 2A baseline.

## First V2 shadow candidate contract

The first candidate must:

- use a not-started stage fixture;
- carry explicit model and feature versions;
- carry calculation time and evidence cutoff;
- reference exact source and signal snapshots;
- identify V1 as predecessor;
- remain unpublished/development-only;
- report missing, weak, and contradictory signals;
- obey movement caps and reliability gates;
- produce coherent scenario families and structured evidence.

Finished fixtures use `historical_replay` with pre-kickoff evidence only.

## V2 output direction

V2 should move the product from thin probabilities toward football intelligence.

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

## Public History and evaluation visibility

Current repository behavior supports:

- paginated verified-result History;
- immutable prediction versus final-result separation;
- registered-free historical preview;
- premium entitlement protection;
- no unlock from unverified results.

The accepted stage/public smoke is operational evidence that the integrated path is visible and usable.

## Pricing is not a V2 model change

Current documented split:

```text
owner-approved target = US$10
owner-observed Wompi display = COP 35,000
tracked repository fallback/tests = US$20 / COP 68,700
```

This drift is a product/payment implementation issue. It is not model progress and must not be “fixed” by changing V2 calculations or historical migrations.

## Integration fixes included in the checkpoint

- Task 1C stable publication payload emits snake_case;
- sanitized Task 2B provider snapshots resolve through a minimal canonical fixture contract;
- verified timestamps compare by represented instant;
- Task 2B.1 uses canonical internal mode `verification`;
- Task 2B test artifact paths are isolated per test.

These fixes preserve runtime behavior while making the integrated tree type-safe, deterministic, and buildable.

## Possible release modes

A later decision may choose:

```text
V1 probabilities + V2 analysis
```

or:

```text
gated V2 probabilities + V2 analysis
```

The explanation layer may be releasable before probability superiority is established.

## Non-blocking future signals

Not required for the first V2 candidate:

- squads and call-ups;
- likely and confirmed lineups;
- injuries and suspensions;
- player expected minutes;
- player xG and attacking dependency;
- replacement quality;
- extra-time and penalties modeling.

## Decisions that must persist

- V1 remains the immutable published predecessor.
- V2 runs in shadow before promotion.
- Stage is the same application surface, not a separate prototype.
- The 2026-06-20 package is reproducible baseline evidence, not current truth.
- Task 2B is complete and must not be rerun.
- Current ranking/context refresh is incremental and versioned.
- No post-kickoff leakage.
- No candidate release from historical artifacts alone.
- Production writes remain forbidden from the V2 integration track.

## Responsibility split

- ChatGPT owns model-state, roadmap, and decision documentation.
- Codex implements and validates bounded database/model slices.
- The operator approves and executes remote stage, Git, and release operations.
