# Start Here - UFO Predictor Current

_Last refreshed: 2026-06-29 after Task 2B.1 and Task 2B.2 completed, the accepted `main` checkpoint was integrated into V2, the V2 closeout was published at `bd580c8baaa230def78f9d72de066bb453d7f9ff`, and the canonical project documentation was prepared for a docs-only synchronization to `main`._

## Current truth

UFO Predictor has:

- a commercially usable MVP1 in production;
- a separate, stable stage environment;
- an active Prediction Intelligence v2 integration track in Draft PR #114;
- an immutable V1 comparison baseline visible and queryable in stage;
- a persisted V2 signal baseline with 48 exact team rows and 72/72 runtime fixtures covered;
- completed current fixture identity and trusted result refreshes for Task 2B;
- public prediction History with pagination and verified-result detail behavior;
- the production `Lectura UFO` presentation layer and football-first premium terminology;
- no V2 probability candidate generated, published, or released to production.

Production remains on the V1-compatible probability layer. V2 continues in shadow mode behind the existing product surface.

**Decision:** V1 remains the published and immutable predecessor while V2 is built and evaluated.

**Consequence:** stage may expose the current product experience while source lineage, current signals, candidate versions, and evaluation paths advance independently.

## Repository and PR baseline

```text
production branch: main
canonical documentation target: main through a docs-only synchronization
accepted main source merged into V2: 3d4b036d20df44027d8927a9a90cb546e7553e64
active V2 branch: integration/prediction-intelligence-v2
active V2 Draft PR: #114
published V2 checkpoint: bd580c8baaa230def78f9d72de066bb453d7f9ff
Task 2B implementation commit: 6d3fb7485b5a7dc1467812466107359daccdc902
Task 2B evidence commit: 1cdaa8b6384d02854c3bd2dce321b85ea71c869d
main-to-V2 merge commit: 9672b55644d8a2bd3818ecd08086ab3ebf111398
V2 documentation closeout commit: bd580c8baaa230def78f9d72de066bb453d7f9ff
implementation location: V2 code and accepted artifacts remain on the V2 branch until separately merged
runtime Git status: verify the checked-out branch, HEAD, upstream, and worktree before acting
```

The published V2 branch contains the accepted product/documentation work from `main`, the completed Task 2B implementation and accepted evidence, and the integration fixes discovered during full build validation. A docs-only synchronization to `main` carries project truth and handoff context only; it does not merge V2 implementation code, migrations, or evidence artifacts into `main`.

Preserved historical source:

```text
old branch: feature/prediction-intelligence-v2-data-foundation
old Draft PR: #106
status: preservation/reference only
```

Do not resume implementation on PR #106. Do not blanket-merge or blanket-cherry-pick it.

## Environment map

```text
production domain: ufopredictor.com
production Supabase: gcpdffkgsdomzyoenalg

stage domain: stage.ufopredictor.com
stage Supabase: yfmklapgjrupctgxaako

canonical local stage env: .env.stage.local
```

Production and stage have separate Auth, users, sessions, roles, entitlements, data, and secrets.

**No repetir:** do not create another stage environment and do not revive the abandoned Docker path for normal stage work.

## Closed foundation checkpoints

Epic 1 is complete:

- Task 1A integration normalization;
- Task 1B stage schema and foundation bootstrap;
- Task 1C fixture linkage, immutable V1 import, model activation, publication, exact verification, and UI smoke;
- legacy Task 3B stage synchronization.

Verified foundation and comparison state includes:

| Entity | Count |
|---|---:|
| competitions | 1 |
| seasons | 1 |
| teams | 48 |
| venues | 16 |
| runtime group-stage matches | 72 |
| source snapshots | 8 |
| canonical team aliases | 309 |
| canonical team localizations | 488 |
| canonical team links | 48 |
| team rating snapshots | 699 |
| historical match facts | 1,392 |
| official schedule matches | 104 |
| official schedule/runtime links | 72 |
| active V1 models | 1 |
| immutable V1 prediction versions | 24 |
| prediction market rows | 240 |
| public fixture publications | 24 |

Official knockout schedule rows 73-104 remain reference rows until participants are deterministically known.

**Terminology note:** the closed legacy “Task 3B Stage Synchronization” is not the future Epic 3 historical-replay task.

## Task 2A baseline completion

Prepared workspace cutoff:

```text
2026-06-20
```

Task 2A closed with:

```text
signal rows = 48
state = exact_complete
manifest status = verified
verification inserts = 0
verification identical rows = 48
conflicts = 0
unexpected existing rows = 0
runtime fixtures = 72
baseline-ready fixtures = 72
candidate-ready fixtures = 0
production writes = 0
```

**Decision:** the 2026-06-20 package remains the canonical reproducible V2 signal baseline. It is historical evidence, not current truth.

**No repetir:** do not rerun Task 2A without a concrete recovery requirement.

## Task 2B completion

### Task 2B.1 - Fixture refresh

Accepted reviewed state:

```text
selected fixtures = 72
safe reviewed actions = 41
already identical = 2
blocked kickoff conflicts = 3
provider-only unknown = 1
terminal-result-ready fixtures = 24
verification = 41/41 satisfied
missing = 0
mismatched = 0
ambiguous = 0
verification passed = true
```

The workflow preserves exact provider identity, sanitized provider evidence, semantic reviewed-plan binding, conflict reporting, and write-free rejection paths.

### Task 2B.2 - Result and evaluation refresh

Accepted reviewed state:

```text
selected fixtures = 72
reviewed result actions = 69
result actions satisfied = 69/69
reviewed evaluation actions = 24
evaluation actions satisfied = 24/24
evaluation-pending rows preserved = 45
excluded kickoff-conflict rows preserved = 3
verification passed = true
```

Result/evaluation apply is atomic and uses trusted-provider verification metadata. Timestamp equality is evaluated by represented instant rather than raw string formatting.

**No repetir:** Task 2B.1 and Task 2B.2 dry-run, apply, and final verification are closed. In particular, never rerun the accepted Task 2B.2 apply.

## Public History checkpoint

Repository behavior proves:

- `/predictions/history` exists and paginates;
- only verified-result entries enter the public history query;
- match detail keeps the immutable prediction separate from the verified final result;
- registered-free historical preview remains distinct from premium entitlement;
- an unverified result does not unlock historical premium content.

Accepted operational smoke additionally confirmed that History was populated, pagination was active, a public detail opened, the verified result remained separate from the original prediction, and premium visibility respected entitlement.

The smoke is operational evidence. The capability and authorization rules are also covered by repository tests.

## Integrated product and technical changes

The accepted `main` synchronization added football-first premium scenario wording without changing probabilities, pricing, Auth, payments, or entitlements.

Full integration validation also corrected:

- Task 1C publication payload keys to canonical snake_case;
- canonical fixture resolution from sanitized Task 2B provider snapshots;
- nullable verified-timestamp comparison;
- Task 2B.1 internal mode naming to `verification`;
- per-test artifact-directory isolation for Task 2B tests.

Final integration validation passed:

```text
Task 2B focused regression = 73/73, twice
focused ESLint = passed
Next.js build and TypeScript = passed
unresolved conflicts = 0
production writes = 0
stage reads/writes during integration = 0
API-Football calls during integration = 0
```

## Pricing truth

Keep these facts separate:

```text
owner-approved target: US$10 one-time
owner-observed Wompi production display: COP 35,000
tracked repository fallback/tests: US$20 / COP 68,700
status: unresolved implementation drift
```

Do not document US$10 / COP 35,000 as fully implemented repository behavior until runtime configuration, backend logic, fallbacks, tests, and forward migration/configuration are reconciled.

Historical applied migrations must not be edited to rewrite the past.

## Exact next tasks by workstream

Primary V2 track:

```text
Task 2C - Ranking, standings, and tournament context
```

Scope:

1. append effective-dated World Football Elo;
2. capture the latest available official FIFA ranking;
3. derive current standings, points, wins/draws/losses, goals and goal difference;
4. derive tournament form, opponent quality, qualification, and pressure context;
5. preserve source, observed time, cutoff, reliability, missing-data, and contradiction metadata;
6. stop before candidate generation.

Then:

```text
Task 2D - Repeatable current source-backed signal snapshots
-> Task 3A - First live unpublished V2 shadow candidate
-> fair replay/evaluation
-> explicit release decision
```

There is no dedicated Task 2C runner yet. The first Task 2C step should therefore be a bounded repository/source-contract reconnaissance, not an unreviewed remote apply.

Parallel MVP1/product work continues from `main` under its own scope. Pricing reconciliation remains pending.

## Working responsibility split

**ChatGPT**

- owns canonical source and runbook authoring;
- preserves product, roadmap, process, and decision continuity;
- defines bounded handoffs and interprets evidence.

**Codex**

- inspects the repository;
- implements bounded code and migrations;
- runs focused tests and static validation;
- reports concrete findings and blockers;
- reviews authored documentation when delegated;
- does not independently redefine canonical documentation.

**Operator/owner**

- runs Git, PowerShell, Supabase, SQL Editor, Railway, and approved external API operations;
- approves remote writes and exact artifacts;
- reviews diffs, commits, pushes, and replaces the uploaded canonical source set.

## Process rule

For a bounded operation use:

```text
one preflight
one apply
one verification
```

Repeat only after a concrete blocker, mismatch, or approved recovery need.

A completed checkpoint is not reopened because a new conversation lacks context.

## Required reading order

1. `00_START_HERE_CURRENT.md`
2. `05_PREDICTION_INTELLIGENCE_V2_CURRENT.md`
3. `06_V2_STAGE_RELEASE_PLAN.md`
4. `07_ROADMAP_EPICS_DECISIONS.md`
5. `09_WORKFLOW_GUARDRAILS_DOC_POLICY.md`
6. `08_MODEL_HISTORY_CALIBRATION.md`
7. `04_FIXTURE_RESULT_AND_EVALUATION_OPS.md`
