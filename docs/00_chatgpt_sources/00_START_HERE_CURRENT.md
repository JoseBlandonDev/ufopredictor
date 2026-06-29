# Start Here - UFO Predictor Current

_Last refreshed: 2026-06-27 after Task 2A reached `exact_complete`, PR #119 completed football-first premium terminology, and `main` was synchronized into the V2 integration branch at `4f758b2`._

## Current truth

UFO Predictor has:

- a commercially usable MVP1 in production;
- a separate, stable stage environment;
- an active Prediction Intelligence v2 integration track in Draft PR #114;
- the original immutable V1 prediction baseline visible and queryable in stage;
- a persisted V2 signal baseline with 48 exact team rows and 72/72 runtime fixtures covered;
- the production `Lectura UFO` presentation layer from PR #117;
- football-first premium terminology from PR #119;
- the latest trusted API-Football result batch persisted, verified, evaluated, and publicly checked;
- no V2 probability candidate generated, published, or released to production.

Production remains on the V1-compatible probability layer. V2 work continues behind the existing product surface in stage.

**Decision:** V1 remains the published baseline while V2 is built in shadow mode.

**Motivo:** the team needs a fair, immutable predecessor for comparison and must not block the live product while research continues.

**Consecuencia operativa:** stage may present the V1-compatible UI while its source lineage, signal tables, candidate versions, and evaluation paths evolve toward V2.

## Repository and PR baseline

```text
production branch: main
production main HEAD: 9f89d62
active V2 branch: integration/prediction-intelligence-v2
active V2 Draft PR: #114
active V2 HEAD: 4f758b2
Task 2A implementation commit: 9491fd8
operator worktree checkpoint: clean and synchronized
local/remote divergence: 0 0
```

The active integration branch contains accepted `main` changes from PR #115, PR #116, PR #117, and PR #119 through normal Git history, plus the completed Task 2A signal-baseline loader.

Preserved historical source:

```text
old branch: feature/prediction-intelligence-v2-data-foundation
old Draft PR: #106
status: preservation/reference only
```

Do not resume implementation on PR #106. Do not blanket-merge or blanket-cherry-pick the old branch.

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

## Epic 1 completion

Epic 1 - Foundation and Stage is complete.

Completed:

- Task 1A integration normalization;
- Task 1B stage schema and foundation bootstrap;
- Task 1C fixture linkage, immutable V1 import, model activation, publication, idempotency verification, and visual smoke.

Verified stage foundation counts include:

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

Official knockout schedule rows 73-104 remain reference rows until participants are deterministically known.

## Complete Task 1C stage baseline

Fixture linkage:

```text
linked Matchday 3 fixtures = 24
provider identity = API-Football exact fixture identity
post-state verified rows = 24
production writes = 0
```

V1 import and publication:

```text
active V1 model versions = 1
immutable V1 prediction versions = 24
prediction market rows = 240
prediction narratives = 0
public fixture publications = 24
post-apply state = exact_complete
pending match publications = 0
```

The stage UI smoke passed at:

```text
https://stage.ufopredictor.com/predictions
```

The page visibly renders published predictions, 1X2 probabilities, confidence, risk, public detail links, pending-result fixtures, and upcoming fixtures.

**No repetir:** do not rerun Task 3B, the 24-row fixture linkage, the V1 import apply, or the Task 1C SQL migrations merely to restate idempotency.

## Stage-only RPCs and migrations

Operational stage RPCs include:

```text
public.apply_task1c_stage_v1_fixture_linkage(jsonb)
public.apply_task1c_stage_v1_import(jsonb)
```

Both are stage-only operational tools with service-role execution and revoked public, anonymous, and authenticated execution.

Relevant migrations:

```text
0038_prediction_intelligence_v2_data_foundation.sql
20260626220000_task1c_stage_v1_atomic_fixture_linkage_apply.sql
20260626233000_task1c_stage_v1_import_apply.sql
```

The manual SQL installations are operational in stage. Formal migration-ledger reconciliation for manually applied migrations remains separate, non-blocking housekeeping. Do not infer ledger state merely from a migration file being present in Git.

The integration branch also contains:

```text
0039_manual_world_cup_result_reconciliation.sql
```

Its presence in Git is confirmed. The migration was applied successfully to both production and stage. It enables exact admin-only manual reconciliation as an exception path; it is not the normal trusted-provider result flow.

## Parallel MVP1 checkpoint

Epic 4 remains independent from the V2 data/model track.

Completed:

```text
Task 4A - V1 Information Inventory
Task 4B - Public Expert Read
PR #117 - merged to main
Task 4C - Football-first premium terminology
PR #119 - merged to main
main -> V2 synchronization - 4f758b2
```

The product now includes:

- `Probabilidad del resultado` on the touched public surfaces;
- a deterministic `Lectura UFO` on prediction cards and match detail;
- confidence/uncertainty wording only where the viewer is already authorized to see confidence and risk;
- football-first labels and explanations for premium BTTS/totals-oriented information;
- unchanged underlying probabilities, xG, scenarios, premium authorization, payments, and entitlements.

Task 4C was presentation-only. It did not create V2 data, alter model calculations, broaden premium access, or change Wompi behavior.

No additional parallel MVP1 task is declared active in this checkpoint.

## Task 2A baseline completion and freshness decision

Prepared workspace cutoff:

```text
2026-06-20
```

Task 2A loaded that preserved baseline into the real stage signal table and closed with:

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

**Decision:** the 2026-06-20 package is the canonical reproducible V2 signal baseline. Newer data is appended or versioned incrementally.

**Alternativa descartada:** rebuilding the foundation or waiting for every source to become perfectly current before proving persistence and lineage.

**Motivo:** schema mapping, source identity, cutoff, reliability metadata, idempotency, and fixture coverage are now proven in the real stage database.

**Consecuencia operativa:** the stored baseline must not be described as current. Candidate generation remains blocked until the explicit incremental current-data gate passes.

**No repetir:** do not rerun Task 2A dry-run, apply, or verification without a concrete recovery requirement.

## Exact next tasks by workstream

Primary V2 track:

```text
Task 2B - Current fixture and result refresh
```

Bounded result:

1. refresh not-started fixture identity and kickoff state;
2. persist new verified results through the established exact-identity path;
3. preserve immutable V1 publications and the 48-row Task 2A baseline;
4. report conflicts and unsupported states instead of overwriting them;
5. stop before ranking/context synthesis or V2 candidate generation.

Then continue in order:

```text
Task 2C - Ranking, standings, and tournament context
-> Task 2D - Repeatable current signal snapshots
-> Task 3A - First live V2 shadow candidate
```

Parallel MVP1 track:

```text
Task 4A, Task 4B, and Task 4C are complete.
No new parallel MVP1 task is active in this checkpoint.
```

## Working responsibility split

**ChatGPT**

- owns canonical shared-source and runbook authoring;
- preserves product, roadmap, process, and decision context;
- defines bounded handoffs and interprets implementation evidence.

**Codex**

- inspects the repository;
- implements bounded code and migrations;
- runs focused tests and static validation;
- reports concrete findings, evidence, blockers, and changed files;
- does not independently redefine canonical documentation unless explicitly delegated.

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

A completed checkpoint is not reopened because a new conversation lacks context. Read these sources first.

## Required reading order

1. `00_START_HERE_CURRENT.md`
2. `05_PREDICTION_INTELLIGENCE_V2_CURRENT.md`
3. `06_V2_STAGE_RELEASE_PLAN.md`
4. `07_ROADMAP_EPICS_DECISIONS.md`
5. `09_WORKFLOW_GUARDRAILS_DOC_POLICY.md`

For model history and evaluation also read:

6. `08_MODEL_HISTORY_CALIBRATION.md`

For fixture, result, and evaluation operations read:

7. `04_FIXTURE_RESULT_AND_EVALUATION_OPS.md`
