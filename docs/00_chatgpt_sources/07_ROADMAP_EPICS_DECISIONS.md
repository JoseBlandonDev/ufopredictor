# Roadmap, MVP2 Epics, and Decisions

_Last refreshed: 2026-06-29 after Task 2B completed, accepted `main` changes were synchronized into V2, and the integrated checkpoint reached `9672b55644d8a2bd3818ecd08086ab3ebf111398`._

## MVP2 objective

MVP2 is the shortest safe path from the sellable MVP1 to an explanation-first football-intelligence product with:

- normalized football history and reference data;
- repeatable source and signal operations;
- immutable V1/V2 comparison;
- current and historical candidate evaluation;
- tournament context;
- lower manual operational burden;
- ES/EN/PT-ready structured facts;
- uninterrupted production delivery.

It is not a frontend rewrite and not a promise of result certainty.

## Naming convention and legacy collision

Use:

```text
Epic 1, Epic 2, Epic 3...
Task 1A, 1B, 1C...
```

Old `M2-xx` labels remain historical.

The closed legacy checkpoint named “Task 3B Stage Synchronization” predates the current epic map. It must not be confused with the future Epic 3 task for historical replay.

## Current status

```text
Epic 1  Foundation and Stage          - DONE
Epic 2  Current Football Data         - ACTIVE (Task 2A DONE, Task 2B DONE, Task 2C NEXT)
Epic 3  V2 Candidate and Evaluation   - BLOCKED UNTIL TASK 2C/2D GATES
Epic 4  Expert Product Experience     - PARALLEL, CURRENT DELIVERIES DONE
Epic 5  Operations and Automation     - PARTIAL
```

## Epic 1 - Foundation and Stage

### Task 1A - Integration normalization

Status: `Done`

- active integration branch normalized;
- old branch/PR preserved for reference only;
- stage and production identities fixed;
- accepted `main` changes flow through normal Git history.

### Task 1B - Stage schema and data bootstrap

Status: `Done`

- Prediction Intelligence schema;
- foundation data;
- idempotent stage synchronization;
- source/provenance foundations.

### Task 1C - Visible immutable V1 baseline

Status: `Done`

- exact 24-fixture linkage;
- one active V1 model;
- 24 immutable V1 predictions;
- 240 markets;
- 24 public fixture publications;
- exact-complete verification;
- `/predictions` smoke.

Task 1C stable publication payload now uses canonical snake_case keys.

## Epic 2 - Current Football Data

### Task 2A - V2 Signal Baseline Database Load

Status: `Done`

```text
prepared cutoff = 2026-06-20
signal rows = 48
state = exact_complete
verification identical rows = 48
runtime fixture coverage = 72/72
candidate-ready fixtures = 0
production writes = 0
```

The baseline is reproducible historical evidence, not current truth.

### Task 2B - Current fixture and result refresh

Status: `Done`

Task 2B.1:

```text
selected fixtures = 72
reviewed safe actions = 41
verified satisfied = 41/41
blocked kickoff conflicts = 3
```

Task 2B.2:

```text
reviewed result actions = 69
verified result actions = 69/69
reviewed evaluations = 24
verified evaluations = 24/24
evaluation pending = 45
excluded rows = 3
```

Delivered:

- sanitized reviewed provider evidence;
- exact canonical fixture resolution;
- semantic reviewed-plan binding;
- atomic result/evaluation apply;
- trusted-provider verification metadata;
- post-state verification;
- timestamp equality by represented instant;
- explicit exclusions instead of silent repair.

**No repetir:** never rerun the accepted Task 2B.2 apply.

### Task 2C - Ranking, standings, and tournament context

Status: `Next`

- effective-dated World Football Elo;
- latest available official FIFA ranking;
- standings and points;
- wins, draws, losses;
- goals for/against and goal difference;
- tournament form and opponent quality;
- qualification and pressure context;
- source, observed time, cutoff, and reliability.

There is no dedicated Task 2C implementation yet. Start with bounded source/contract reconnaissance.

### Task 2D - Repeatable current signal snapshots

Status: `Pending after 2C`

- derive source-backed signals;
- persist explicit pre-kickoff cutoffs;
- record missing and contradictory inputs;
- apply reliability shrinkage;
- prove idempotent incremental refresh;
- produce a candidate-ready fixture set.

## Epic 3 - V2 Candidate and Evaluation

### Task 3A - First live V2 shadow candidate

Status: `Blocked`

- not-started fixture;
- V1 predecessor;
- current source/signal snapshots;
- movement and reliability gates;
- structured evidence and scenario families;
- unpublished development state.

### Task 3B - Historical replay

Status: `Future`

- completed fixtures only;
- pre-kickoff evidence only;
- labeled `historical_replay`;
- original V1 remains immutable.

This is separate from the closed legacy stage-synchronization checkpoint.

### Task 3C - V1/V2 evaluation

Status: `Future`

- probability metrics;
- goals and markets;
- scenario quality;
- explanation quality;
- freshness and reliability;
- model error versus football variance.

### Task 3D - Release decision

Status: `Future`

Choose:

```text
V1 probabilities + V2 analysis
```

or:

```text
gated V2 probabilities + V2 analysis
```

Production requires stage acceptance, rollback, and owner approval.

## Epic 4 - Expert Product Experience

Status: `Parallel, separate owner`

Completed:

### Task 4A - V1 Information Inventory

- public/free/premium/admin surface inventory;
- persisted-field inventory;
- authorization-boundary review;
- exclusion of unfinished V2-only claims.

### Task 4B - Public Expert Read

- deterministic `Lectura UFO`;
- `Probabilidad del resultado`;
- authorized confidence/risk wording;
- unchanged premium entitlement behavior.

### Task 4C - Football-first premium terminology

- football-first premium scenario wording;
- unchanged probabilities and xG;
- unchanged premium gating;
- presentation tests.

Accepted product changes from `main` were integrated into V2 at `9672b556...`.

## Public History checkpoint

Delivered and code-proven:

- paginated `/predictions/history`;
- verified-result-only history entries;
- immutable prediction versus final-result separation;
- free historical preview distinct from premium entitlement;
- no premium unlock from unverified results.

Accepted operational smoke confirmed the visible path in stage.

## Epic 5 - Operations and Automation

Delivered:

- fixture registry;
- exact allowlists;
- trusted result refresh;
- idempotent result/evaluation persistence;
- manual reconciliation exception;
- canonical result aliases;
- stage bootstrap and V1 import;
- Task 2B fixture/result refresh;
- public History smoke.

The production Round-of-32 publication batch is distinct from V2 stage knockout linkage. Official schedule reference rows 73-104 remain unlinked until participants are known.

Remaining:

- scheduled recent-pending polling;
- retry/backoff;
- provider observability;
- official-result-without-prediction path;
- venue ingestion/display;
- reconciliation metrics;
- recurring ranking and signal refresh.

## Decisions already made

### Architecture and model

- V1 remains live and immutable during V2 work.
- V2 runs in shadow before promotion.
- Stage is the same product surface, not a separate prototype.
- Production and stage remain separate.
- No third environment is created.
- Finished-fixture comparison uses `historical_replay`.
- Historical research does not authorize current release.
- V2 probability superiority is not yet established.

### Data

- The 2026-06-20 workspace is an approved reproducible baseline.
- It is not described as current.
- Task 2B is complete.
- Current rankings/context refresh is incremental and versioned.
- Source, observed time, cutoff, version, checksum, and reliability are preserved.
- No post-kickoff leakage.
- Kickoff conflicts remain explicit exclusions.

### Product and pricing

- Public History preserves immutable prediction and verified result separation.
- Owner-approved pass target is US$10.
- Owner-observed Wompi display is COP 35,000.
- Tracked repository behavior remains unreconciled at US$20 / COP 68,700.
- Pricing reconciliation requires forward implementation, not historical migration edits.

### Process

- One bounded review is sufficient unless a concrete defect appears.
- One preflight, one apply, and one verification is the default.
- A focused defect correction does not reopen completed reconnaissance.
- A migration file in Git is not proof of remote application.
- Completed Task 1C, Task 2A, and Task 2B are not rerun ceremonially.
- Codex does not author canonical documentation unless explicitly delegated.

### Ownership

- ChatGPT owns canonical sources, runbooks, roadmap, and decision wording.
- Codex owns repository inspection, bounded implementation, tests, and evidence.
- The operator owns approved remote operations, Git, SQL, and deployment actions.

## Decisions still required

- Task 2C source acquisition and refresh cadence;
- minimum current-data gate for the first shadow candidate;
- final V1-probabilities versus gated-V2 release mode;
- public/free/premium V2 signal matrix;
- deterministic narrative versus optional LLM polish;
- scheduler and notification architecture;
- player/squad/lineup/injury source strategy;
- timing of broad EN/PT rollout;
- exact pricing reconciliation implementation.

## Exact next sequence

Primary V2 track:

1. complete Task 2C source/contract reconnaissance;
2. implement and verify current Elo, FIFA ranking, standings, form, and pressure context;
3. complete Task 2D repeatable signal snapshots;
4. produce the first unpublished V2 shadow candidate;
5. create fair historical replays;
6. compare V1/V2 and decide release mode;
7. promote only after stage acceptance.

Documentation/Git checkpoint:

1. review this refreshed package once;
2. apply accepted files exactly;
3. create one documentation commit;
4. push the V2 integration branch;
5. replace the uploaded canonical source set;
6. start Task 2C from the pushed checkpoint.

## Delivery rule

Every bounded task declares:

- branch and HEAD;
- environment and production denial;
- exact read/write scope;
- acceptance evidence;
- rollback boundary;
- concrete blockers only.

Avoid tasks that combine model, data, payments, UI, migrations, operations, and documentation without a bounded reason.
