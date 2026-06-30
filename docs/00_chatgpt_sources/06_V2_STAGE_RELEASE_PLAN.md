# V2 Stage and Release Plan

_Last refreshed: 2026-06-29 after Task 2B passed its fixture/result verification gates and `main` was integrated into V2 at `9672b55644d8a2bd3818ecd08086ab3ebf111398`._

## Goal

Move from a stable V1-visible stage to a fair, source-backed V2 shadow candidate without disrupting production or repeating completed foundation and current-result work.

## Current gate status

| Gate | Status |
|---|---|
| Separate stage and production identity | Passed |
| Prediction Intelligence schema in stage | Passed |
| Foundation data bootstrap | Passed |
| Bootstrap idempotency | Passed |
| Exact V1 fixture linkage/import/publication | Passed |
| Stage `/predictions` visual smoke | Passed |
| V2 signal baseline in real tables | Passed |
| Task 2A zero-growth verification | Passed |
| Task 2B.1 current fixture refresh | Passed |
| Task 2B.1 post-state verification | Passed, 41/41 |
| Task 2B.2 trusted result refresh | Passed |
| Task 2B.2 result verification | Passed, 69/69 |
| Task 2B.2 evaluation verification | Passed, 24/24 |
| Public History capability and smoke | Passed |
| Current ranking/standings/context refresh | Active next |
| Repeatable current signal snapshots | Pending |
| First V2 shadow candidate | Pending |
| V1/V2 evaluation | Pending |
| Production release decision | Pending |

## Stable integrated checkpoint

```text
branch: integration/prediction-intelligence-v2
Draft PR: #114
main source merged: 3d4b036d20df44027d8927a9a90cb546e7553e64
V2 checkpoint: 9672b55644d8a2bd3818ecd08086ab3ebf111398
Task 2B implementation: 6d3fb7485b5a7dc1467812466107359daccdc902
Task 2B evidence: 1cdaa8b6384d02854c3bd2dce321b85ea71c869d
stage: yfmklapgjrupctgxaako
production denied: gcpdffkgsdomzyoenalg
tracked worktree: clean
remote push: pending after documentation checkpoint
```

Stage comparison state:

```text
active V1 models = 1
predictions = 24
markets = 240
public fixtures = 24
V1 state = exact_complete

V2 baseline signal rows = 48
runtime fixture coverage = 72/72
Task 2B fixture actions satisfied = 41/41
Task 2B result actions satisfied = 69/69
Task 2B evaluations satisfied = 24/24
candidate-ready fixtures = 0
```

## Completed phase: foundation and visible V1

Closed:

- legacy Task 3B schema/data foundation;
- exact fixture linkage;
- frozen V1 source selection;
- atomic V1 import;
- publication and activation;
- exact-state verification;
- stage UI smoke.

**No repetir:** do not rerun these without a concrete recovery requirement.

## Completed phase: V2 signal baseline

Task 2A closed with:

```text
prepared cutoff = 2026-06-20
persisted signal rows = 48
manifest status = verified
post-state = exact_complete
verification identical = 48
duplicate growth = 0
runtime fixture coverage = 72/72
candidate-ready fixtures = 0
production writes = 0
```

The baseline retains source identity, checksum, observed time, cutoff, signal version, canonical team linkage, missing/optional metadata, contradictions, sample sizes, and reliability.

## Completed phase: current fixture and result refresh

Task 2B.1:

```text
selected fixtures = 72
reviewed safe actions = 41
verified satisfied = 41/41
blocked kickoff conflicts = 3
verification passed = true
```

Task 2B.2:

```text
reviewed result actions = 69
verified result actions = 69/69
reviewed evaluation actions = 24
verified evaluations = 24/24
evaluation pending = 45
excluded rows = 3
verification passed = true
```

The accepted result apply is closed and must never be rerun.

The phase preserved:

- immutable V1 predictions;
- Task 2A baseline rows;
- exact provider identity;
- three kickoff-conflict exclusions;
- atomic result/evaluation writes;
- timestamp equality by represented instant;
- post-state verification.

## Active phase: Task 2C current rankings and context

Task 2C must append or version:

- effective-dated World Football Elo;
- latest available official FIFA ranking;
- current standings and points;
- wins, draws, losses, goals, and goal difference;
- tournament form and opponent quality;
- qualification and pressure state;
- reliability, missing-data, disagreement, and cutoff metadata.

Acceptance requires:

- explicit source and observed time;
- canonical team identity;
- no history overwrite;
- no post-kickoff leakage into pre-match evidence;
- balanced source/insert/update/skip/conflict accounting;
- stage and production-denial guards;
- no candidate generation.

There is no dedicated Task 2C runner yet. Begin with bounded repository/source-contract reconnaissance.

## Next phase: Task 2D repeatable signal snapshots

Task 2D will:

- derive source-backed current signals;
- persist explicit pre-kickoff cutoffs;
- record missing and contradictory inputs;
- apply reliability shrinkage;
- prove idempotent incremental refresh;
- produce a candidate-ready fixture set.

Ordinary refresh must not require another foundation bootstrap, Task 2A apply, or Task 2B apply.

## First V2 shadow candidate

Generate only after Task 2C and Task 2D acceptance.

Required properties:

- fixture not started;
- explicit model and feature version;
- calculation time and evidence cutoff;
- V1 predecessor reference;
- source and signal snapshot references;
- reliability and missing-signal report;
- bounded probability movement;
- coherent scenario families;
- unpublished/development state.

Completed fixtures use labeled `historical_replay` with pre-kickoff evidence only.

## Evaluation gate

Compare separately:

- 1X2 probability and calibration;
- log loss and Brier;
- xG and total-goal error;
- BTTS and over/under;
- scenario-family quality;
- explanation and evidence usefulness;
- source freshness and reliability;
- data limitation, model error, and football variance.

A better explanation does not prove better probability calibration.

## Release decision gate

Choose explicitly between:

```text
V1 probabilities + V2 analysis
```

and:

```text
gated V2 probabilities + V2 analysis
```

Promotion requires:

- accepted stage state;
- immutable version and cutoff proof;
- no post-kickoff leakage;
- fair current-sample comparison;
- rollback plan;
- Auth/Wompi/entitlement regression protection;
- public, premium, admin, and export compatibility;
- owner approval.

## Parallel product and pricing track

Accepted product wording from `main` is integrated.

Pricing remains unresolved:

```text
owner-approved target = US$10
observed Wompi production display = COP 35,000
tracked repository behavior = US$20 / COP 68,700
```

Pricing reconciliation is separate from V2 model release and must use a forward implementation. Do not edit applied historical migrations.

## Process decisions

- one implementation review, not repeated general scrutiny;
- one preflight, one apply, one verification per bounded operation;
- a concrete defect permits focused correction, not a restart;
- migration files in Git and remote migration application are separate facts;
- canonical docs preserve state and decisions;
- Codex inspects/implements; ChatGPT authors canonical docs; the operator owns remote actions.

## Responsibility

- ChatGPT defines and documents gates, decisions, and handoffs.
- Codex implements bounded slices and returns evidence.
- The operator authorizes and executes remote stage and Git actions.
