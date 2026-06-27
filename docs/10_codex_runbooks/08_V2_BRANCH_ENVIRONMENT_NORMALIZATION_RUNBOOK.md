# V2 Branch and Environment Normalization Runbook

_Last refreshed: 2026-06-26 after Task 3B completion and the Task 1C fixture-linkage checkpoint._

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
reviewed checkpoint HEAD: dba63d8cc3d6d9235295abb4fe8834db44caf519
canonical local stage env: .env.stage.local
old V2 branch: feature/prediction-intelligence-v2-data-foundation
old Draft PR: #106
old V2 head: eefcff709e80209215b25b90fb870aa5c080d735
```

Verify actual HEAD and worktree before implementation.

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

## Completed Task 3B and later fixture-linkage state

Task 3B:

- prior stage migration history externally verified at 46 entries;
- migration 0038 applied in stage only;
- stage foundation data imported;
- second apply produced zero inserts and zero updates;
- Auth user and admin profile preserved;
- competition and season resolve;
- publish queue and predictions pages load;
- production remained untouched.

Verified foundation counts include:

```text
teams = 48
runtime matches = 72
official schedule matches = 104
rating snapshots = 699
historical match facts = 1392
```

Current source cutoff is `2026-06-20`.

Task 1C fixture-linkage checkpoint:

- exact 24 Matchday 3 rows selected;
- trusted provider identity verified;
- `public.apply_task1c_stage_v1_fixture_linkage(jsonb)` installed in stage;
- RPC requested 24 and updated 24;
- exact post-state verified for all 24;
- production writes remained zero.

Migration `20260626220000` was applied manually and is operational. Migration-history repair remains pending and non-blocking. Do not rerun the migration or linkage apply.

## Current application gap

Stage has foundation data and verified Matchday 3 provider linkage, but no active prediction product:

```text
model_versions = 0
prediction_versions = 0
public_prediction_summaries = 0
```

This is the next bounded gap, not a reason to redo normalization, Task 3B, or fixture linkage.

## Next transition

Begin:

```text
Task 1C - V1 Model and Prediction Import
```

Required sequence:

1. select and freeze the immutable V1 source;
2. reuse the verified 24-fixture stage mapping;
3. import one canonical V1 model version;
4. import 24 original V1 prediction versions;
5. import 240 required prediction-market rows and only frozen source child records;
6. activate V1;
7. run public/admin smoke;
8. rerun and prove zero growth;
9. hand off to current-data and V2 work.

Do not repeat fixture linkage.

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
- proof that the accepted 24-fixture mapping was reused;
- immutable V1 source and preservation proof;
- per-table dry-run and apply counts;
- one active V1 model proof;
- 24 prediction-version proof;
- 240 market-row proof;
- public/admin smoke results;
- second-run zero-growth proof;
- Auth/admin preservation;
- production read-only/no-write proof;
- concrete blockers only;
- no Git commit or push unless the owner explicitly delegates it.

Use one preflight, one apply, and one verification unless a concrete mismatch exists.
