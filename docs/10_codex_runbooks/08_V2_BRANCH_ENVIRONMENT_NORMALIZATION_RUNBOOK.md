# V2 Branch and Environment Normalization Runbook

_Last refreshed: 2026-06-25 after Task 3A completion and final M2-01 implementation checkpoint approval._

## Goal

Preserve the completed Prediction Intelligence v2 normalization on top of the current production baseline and hand off safely into the read-only stage-audit phase without losing historical research or regressing MVP1 behavior.

## Live-state source

Before work, read and verify:

```text
docs/00_chatgpt_sources/00_START_HERE_CURRENT.md
docs/00_chatgpt_sources/05_PREDICTION_INTELLIGENCE_V2_CURRENT.md
docs/00_chatgpt_sources/06_V2_STAGE_RELEASE_PLAN.md
docs/00_chatgpt_sources/09_WORKFLOW_GUARDRAILS_DOC_POLICY.md
```

Verify live SHAs and environment boundaries before any task.

## Current stable references

```text
production main at integration base: e771de3c39c480f05d026075e5e553fb75207468
active integration branch: integration/prediction-intelligence-v2
active Draft PR: #114
active head at this refresh: 0db9ac8867eae344e56237ac028cc32255ff1a3d
old v2 branch: feature/prediction-intelligence-v2-data-foundation
old Draft PR: #106
old v2 head: eefcff709e80209215b25b90fb870aa5c080d735
```

## Completed normalization map

| Historical concern | Integrated commit | Status |
|---|---|---|
| Task 1 data foundation | `76500de` | Complete |
| Task 1.1 replay readiness | `16fef9b` | Complete |
| Task 1.2 historical Elo | `f411d60` | Complete |
| Task 2 challenger/replay | `ca5fd01` | Complete |
| Task 2 calibration stabilization | `bf13c21` | Complete |
| Task 2 gates/eligibility | `1d70412` | Complete |
| Task 2 release packaging | `de083c1` | Complete |
| Task 2 local-run guard | `1b746f9` | Complete |
| Task 3A local-only planner/dry-run | `0db9ac8` | Complete |

Checkpoint verdicts:

```text
TASK2_CHECKPOINT_READY
M2_01_IMPLEMENTATION_CHECKPOINT_READY
```

No useful implementation remains to be ported from the old branch.

## Intentionally excluded historical items

Do not port:

- `supabase/.gitignore` from the old branch;
- `supabase/config.toml` from the old branch;
- the final old-branch documentation-only handoff commit;
- broad environment-specific paths or configuration;
- stale frontend/shared-query changes outside the normalized slices.

The old branch and PR #106 remain preservation/reference only.

## Completed Task 3A safety contract

Task 3A is:

- local-only;
- planner/dry-run only;
- argument-driven;
- no `.env`;
- no credential;
- no Supabase client;
- no network;
- no live provider read;
- no subprocess execution;
- no remote migration;
- no stage or production write;
- no current candidate generation;
- no publication;
- no modification of preserved historical evidence;
- fail closed for migration, import, persistence, publication, partner delivery, stage, production, and remote execution.

Task 3A writes only to strict descendants of:

```text
artifacts/prediction-intelligence-v2/task3a/local-run/
```

It rejects the root itself, preserved dated evidence, external paths, arbitrary repository paths, sibling runner trees, traversal escapes, textual-prefix lookalikes, and non-empty targets.

## M2-01 closeout meaning

M2-01 is implementation-complete.

This means:

- every approved normalization slice is present;
- no useful old-branch implementation remains;
- the final implementation checkpoint passed;
- protected MVP1 behavior remains intact;
- Migration 0038 remains committed, tested, and unapplied;
- no stage or production write occurred.

It does not mean:

- PR #114 is merged or ready to merge;
- Prediction Intelligence v2 is live;
- historical candidates are current;
- Migration 0038 is applied;
- stage synchronization is authorized;
- a release mode has been selected.

## Stage transition

Task 3B begins only after the final M2-01 documentation refresh and source replacement.

First phase is read-only:

- validate ignored stage credentials without printing values;
- identify the stage target safely;
- prove the target is not production;
- inspect remote migration history and schema;
- compare against repository migrations;
- inspect RLS, functions, views, policies, and dependencies;
- confirm existing stage Auth users will not be deleted or corrupted;
- produce an ordered non-destructive synchronization plan;
- stop for owner approval.

Only a later explicitly approved phase may apply migration 0038 and import approved non-sensitive data into stage.

## Validation after bounded work

- focused task-specific tests;
- relevant local runners only when needed;
- protected MVP1 regression tests when shared code is touched;
- lint;
- production build when warranted;
- typecheck classification with zero new task-local diagnostics;
- diff-check;
- generated-noise cleanup;
- no production write;
- no stage write during read-only audit.

## Current production concerns that must survive

- PR #111 fixture registry behavior;
- PR #112 trusted result refresh behavior;
- immutable v1 Matchday 3 publications;
- `torneo-ufo-export-v1` compatibility;
- Wompi/Auth/entitlement behavior;
- public lifecycle and history.

## Required output for Task 3B Phase A

- confirmed branch, HEAD, and clean worktree;
- confirmed stage target and explicit production denial;
- remote migration/schema inventory;
- drift and dependency analysis;
- existing stage-user preservation assessment;
- exact non-destructive synchronization plan;
- evidence that no remote writes occurred;
- concrete blockers only;
- final read-only audit verdict;
- no Git commit/push unless the owner explicitly delegates it.
