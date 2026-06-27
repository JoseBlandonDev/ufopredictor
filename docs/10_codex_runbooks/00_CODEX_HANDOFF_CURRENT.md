# Codex Handoff Current

_Last refreshed: 2026-06-26 after the Task 1C Matchday 3 fixture-linkage checkpoint._

## Canonical-source rule

Before implementation, read:

```text
docs/00_chatgpt_sources/00_START_HERE_CURRENT.md
docs/00_chatgpt_sources/05_PREDICTION_INTELLIGENCE_V2_CURRENT.md
docs/00_chatgpt_sources/06_V2_STAGE_RELEASE_PLAN.md
docs/00_chatgpt_sources/07_ROADMAP_EPICS_DECISIONS.md
docs/00_chatgpt_sources/09_WORKFLOW_GUARDRAILS_DOC_POLICY.md
```

Those files own live product, branch, roadmap, stage, and workflow truth.

## Current baseline

```text
production base: e771de3c39c480f05d026075e5e553fb75207468
active branch: integration/prediction-intelligence-v2
active Draft PR: #114
reviewed checkpoint HEAD: dba63d8cc3d6d9235295abb4fe8834db44caf519
canonical local stage env: .env.stage.local
old branch: feature/prediction-intelligence-v2-data-foundation
old Draft PR: #106
old head: eefcff709e80209215b25b90fb870aa5c080d735
```

Verify actual HEAD and worktree before every task.

The old branch remains preservation and reference only.

## Completed checkpoint

Task 3B foundation synchronization is complete and idempotent.

Task 1C fixture-linkage subblock is also complete.

Stage target:

```text
yfmklapgjrupctgxaako
```

Production deny target:

```text
gcpdffkgsdomzyoenalg
```

Completed:

- prior stage migration history externally verified at 46 entries;
- migration 0038 applied in stage only;
- Task 3B stage importer implemented and tested;
- foundation data imported;
- second exact Task 3B apply produced zero inserts and zero updates;
- stage Auth user and admin profile preserved;
- publish queue loads without the old competition-resolution error;
- `/predictions` loads;
- exact 24 Matchday 3 fixture allowlist approved;
- atomic linkage RPC installed in stage;
- RPC requested 24 and updated 24;
- exact post-state verified for all 24 rows;
- production remained untouched.

Task 1C RPC:

```text
public.apply_task1c_stage_v1_fixture_linkage(jsonb)
```

The RPC is service-role-only and updates only `matches.external_id` and `matches.intake_source`.

Migration `20260626220000` was applied manually through the stage SQL Editor. Migration-history repair is pending and non-blocking. Do not rerun the migration or linkage apply.

Current stage product state:

```text
model_versions = 0
prediction_versions = 0
public_prediction_summaries = 0
```

## Immediate next task

```text
Task 1C - V1 Model and Prediction Import
```

The verified 24-fixture mapping is an accepted prerequisite and must be reused, not regenerated.

Bounded goal:

1. preserve the exact immutable production V1 baseline;
2. import one canonical V1 model version;
3. import 24 original V1 prediction versions without recalculation;
4. import 240 required prediction-market rows and only frozen source child records;
5. map by stable provider/product identity, never localized names;
6. activate the canonical V1 model;
7. validate public and admin surfaces;
8. rerun and prove zero growth;
9. prepare current-data and V2 replay handoff.

Do not generate V2 in this slice.

## Source priority for immutable V1

Use, in order:

1. committed public-safe or publication artifacts containing the complete required baseline;
2. strict read-only production queries scoped to the exact 24 fixtures;
3. another preserved immutable source already in the project.

Production is source-read-only. Production writes are forbidden.

Do not copy production UUID relationships blindly. Resolve stage match IDs using trusted fixture identity.

## Authenticated browser

The internal browser may already be authenticated as the stage admin user.

Use it only for:

- `https://stage.ufopredictor.com`;
- read-only or explicitly approved stage smoke checks;
- public and admin projection validation.

Do not log into or inspect production through that browser during the stage task.

## Source workspace

Prepared historical/reference workspace:

```text
D:\Projects\ufo-predictor-source-snapshots\2026-06-20\prepared-v2
```

Its cutoff is historical as of 2026-06-26.

Do not describe it as current. Do not delete it until current refresh and lineage needs are settled.

## Hard boundaries

- no production writes;
- no production Auth, payment, entitlement, webhook, or session access beyond an explicitly bounded read-only prediction source if approved;
- no migration-history write during the V1 import slice;
- do not rerun migration `20260626220000`;
- do not rerun the completed 24-fixture linkage;
- no post-kickoff prediction generation;
- no rewriting original V1 publications;
- no invented provider IDs, markets, narratives, or detail records;
- no broad fixture or prediction apply;
- no V2 generation during the V1 import slice;
- no Wompi or AI provider configuration;
- no merge or Draft PR state change without owner instruction.

The owner may directly operate Git, PowerShell, Supabase, Railway, SQL, and trusted APIs. Codex is not a required intermediary for those routine operations.

## Validation contract

Return:

- exact branch, HEAD, and worktree;
- stage target and production denial;
- reuse proof for the verified 24-fixture mapping;
- chosen immutable V1 source;
- per-table source, insert, update, skip, reject, and conflict counts;
- probability and timestamp preservation proof;
- active model proof;
- public and admin smoke results;
- second-run zero-growth proof;
- Auth/admin preservation;
- production read-only/no-write proof;
- concrete blockers only.

Use one preflight, one apply, and one verification unless a concrete mismatch exists.

The owner handles routine Git, Supabase, Railway, SQL, API, staging, commit, push, and final source replacement unless explicitly delegated.
