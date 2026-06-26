# V2 Branch and Environment Normalization Runbook

_Last refreshed: 2026-06-26 after Task 3B stage bootstrap completion._

## Goal

Preserve the completed Prediction Intelligence v2 normalization on top of the production baseline, maintain strict production separation, and hand off from stage foundation into the V1-visible and current-data phases.

## Live-state source

Before work, read and verify:

```text
docs/00_chatgpt_sources/00_START_HERE_CURRENT.md
docs/00_chatgpt_sources/05_PREDICTION_INTELLIGENCE_V2_CURRENT.md
docs/00_chatgpt_sources/06_V2_STAGE_RELEASE_PLAN.md
docs/00_chatgpt_sources/09_WORKFLOW_GUARDRAILS_DOC_POLICY.md
```

Verify actual branch, HEAD, environment, and write boundary before every task.

## Stable references

```text
production base: e771de3c39c480f05d026075e5e553fb75207468
active integration branch: integration/prediction-intelligence-v2
active Draft PR: #114
last reviewed pre-checkpoint HEAD: 27782c25bb4dc752fe335f0b2515feec264f8a6d
old V2 branch: feature/prediction-intelligence-v2-data-foundation
old Draft PR: #106
old V2 head: eefcff709e80209215b25b90fb870aa5c080d735
```

The reviewed HEAD is the base before the owner commits Task 3B and the current documentation refresh.

## Completed normalization map

Completed concerns:

- Task 1 data foundation;
- Task 1.1 replay readiness;
- Task 1.2 historical Elo;
- Task 2 challenger and replay;
- Task 2 calibration stabilization;
- Task 2 gates and eligibility;
- Task 2 release packaging;
- Task 2 local-run guard;
- Task 3A planner and target-safety contracts;
- Task 3B stage synchronization and foundation import.

No useful implementation remains to be ported from the old branch.

## Intentionally excluded historical items

Do not port:

- old environment-specific Supabase config;
- old documentation-only handoff commits as implementation;
- stale frontend and shared-query changes outside reviewed slices;
- broad environment paths or credentials;
- historical candidate artifacts as current release authority.

The old branch and PR #106 remain reference only.

## Environment map

```text
production domain: ufopredictor.com
production Supabase: gcpdffkgsdomzyoenalg
stage domain: stage.ufopredictor.com
stage Supabase: yfmklapgjrupctgxaako
```

Do not create another stage environment.

Do not use production credentials for stage.

## Completed Task 3B state

- canonical stage migration chain externally verified at 46;
- migration 0038 applied in stage only;
- stage foundation data imported;
- second apply produced zero inserts and zero updates;
- Auth user and admin profile preserved;
- competition and season resolve;
- publish queue and predictions pages load;
- no model or prediction rows exist yet;
- production remained untouched.

Verified stage counts include:

```text
teams = 48
runtime matches = 72
official schedule matches = 104
rating snapshots = 699
historical match facts = 1392
```

Current source cutoff is `2026-06-20`.

## Current application gap

Stage has foundation data but no active prediction product:

```text
model_versions = 0
prediction_versions = 0
public_prediction_summaries = 0
```

This is the next bounded gap, not a reason to redo normalization or Task 3B.

## Next transition

Begin:

```text
Stage V1 Visible Predictions Slice
```

Required sequence:

1. fixture registry Matchday 3 dry-run against stage;
2. exact 24-fixture allowlist;
3. deterministic provider linkage;
4. immutable V1 source selection;
5. V1 model and prediction import;
6. public/admin smoke;
7. idempotent second run;
8. current-data and V2 handoff.

Do not generate V2 during this slice.

## Validation after bounded work

- focused task-specific tests;
- relevant fixture and publication tests;
- protected MVP1 regression tests when shared code is touched;
- lint;
- typecheck classification with zero new task-local diagnostics;
- diff-check;
- generated-noise cleanup;
- exact environment proof;
- no production write.

## Production concerns that must survive

- fixture registry behavior;
- trusted result refresh behavior;
- immutable V1 Matchday 3 publications;
- `torneo-ufo-export-v1` compatibility;
- Wompi, Auth, and entitlement behavior;
- public lifecycle and history;
- production UI microreleases from `main`.

## Parallel branch rule

A separate owner may improve the expert product experience from current `main`.

Those changes must:

- remain independent of unfinished V2 data;
- avoid probability changes;
- merge normally to `main`;
- flow into the integration branch through normal Git history;
- not be manually reimplemented in both branches.

## Required output for the next slice

- confirmed branch, HEAD, and worktree;
- exact stage target and production denial;
- exact 24-fixture mapping;
- immutable V1 source and preservation proof;
- per-table dry-run and apply counts;
- active V1 model proof;
- public/admin smoke results;
- second-run zero-growth proof;
- Auth/admin preservation;
- production read-only/no-write proof;
- concrete blockers only;
- no Git commit or push unless the owner explicitly delegates it.
