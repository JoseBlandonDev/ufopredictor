# Start Here - UFO Predictor Current

_Last refreshed: 2026-06-27 after the complete Task 1C V1 stage baseline checkpoint._

## Current truth

UFO Predictor has:

- a commercially usable MVP1 in production;
- a separate, stable stage environment;
- an active Prediction Intelligence v2 integration track in Draft PR #114;
- the original V1 prediction baseline visible and queryable in stage;
- no V2 probability candidate released to production.

Production remains on the V1-compatible probability layer. V2 work continues behind the existing product surface in stage.

**Decision:** V1 remains the published baseline while V2 is built in shadow mode.

**Motivo:** the team needs a fair, immutable predecessor for comparison and must not block the live product while research continues.

**Consecuencia operativa:** stage may look like V1 in the UI while its database, source lineage, signal tables, candidate versions, and evaluation paths evolve toward V2.

## Repository and PR baseline

```text
active branch: integration/prediction-intelligence-v2
active Draft PR: #114
reviewed checkpoint HEAD: bce9999
worktree at checkpoint: clean and synchronized
```

The active integration branch already includes the accepted `main` changes from PR #115 and PR #116 through normal Git history.

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

Its presence in Git is confirmed. This checkpoint does not claim that migration 0039 was applied to stage or production.

## Data freshness decision

The prepared foundation workspace has cutoff:

```text
2026-06-20
```

It is historical relative to 2026-06-27, but it remains an approved reproducible baseline.

**Decision:** load the 2026-06-20 signal baseline into the real V2 tables first, then refresh incrementally.

**Alternativa descartada:** waiting for every source to be perfectly current before building the database and pipeline.

**Motivo:** the schema, lineage, idempotency, fixture coverage, and candidate flow can be proven with the preserved baseline; later refreshes should be ordinary incremental operations rather than another foundation rebuild.

**Consecuencia operativa:** documents and UI must not describe the 2026-06-20 data as current, but its age does not block the next V2 engineering slice.

## Exact next task

```text
V2 Signal Baseline Database Load
```

Bounded result:

1. inspect only the existing prepared 2026-06-20 signal package and committed equivalents;
2. map approved baseline records to the existing Prediction Intelligence tables;
3. persist source, observed time, cutoff, version, and lineage;
4. perform one idempotent stage load;
5. prove row accounting and fixture signal coverage;
6. stop before candidate generation.

The immediate transition after that task is:

```text
Current-data incremental refresh
-> First V2 shadow candidate run
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
