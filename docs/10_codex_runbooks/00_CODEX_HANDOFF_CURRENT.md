# Codex Handoff Current

_Last refreshed: 2026-06-26 after Task 3B stage bootstrap completion._

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
last reviewed pre-checkpoint HEAD: 27782c25bb4dc752fe335f0b2515feec264f8a6d
old branch: feature/prediction-intelligence-v2-data-foundation
old Draft PR: #106
old head: eefcff709e80209215b25b90fb870aa5c080d735
```

Verify actual HEAD and worktree before every task.

The old branch remains preservation and reference only.

## Completed checkpoint

Task 3B is technically complete.

Stage target:

```text
yfmklapgjrupctgxaako
```

Production deny target:

```text
gcpdffkgsdomzyoenalg
```

Completed:

- 46 migrations externally verified;
- migration 0038 applied in stage only;
- Task 3B stage importer implemented and tested;
- foundation data imported;
- second exact apply produced zero inserts and zero updates;
- stage Auth user and admin profile preserved;
- publish queue loads without the old competition-resolution error;
- `/predictions` loads;
- production remained untouched.

Current stage product state:

```text
model_versions = 0
prediction_versions = 0
public_prediction_summaries = 0
```

## Immediate next task

```text
Stage V1 Visible Predictions Slice
```

Bounded goal:

1. reconcile all 24 Matchday 3 fixture identities in stage;
2. preserve the exact immutable production V1 baseline;
3. import and activate the canonical V1 model version;
4. import original V1 predictions and required child records without recalculation;
5. map by stable provider/product identity, never localized names;
6. validate public and admin surfaces;
7. rerun and prove zero growth;
8. prepare current-data and V2 replay handoff.

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
- no migration-history writes;
- no post-kickoff prediction generation;
- no rewriting original V1 publications;
- no invented provider IDs;
- no broad fixture or prediction apply;
- no V2 generation during the V1 visible slice;
- no Wompi or AI provider configuration;
- no merge or Draft PR state change without owner instruction.

## Validation contract

Return:

- exact branch, HEAD, and worktree;
- stage target and production denial;
- exact fixture mapping counts;
- chosen immutable V1 source;
- per-table source, insert, update, skip, reject, and conflict counts;
- probability and timestamp preservation proof;
- public and admin smoke results;
- second-run zero-growth proof;
- Auth/admin preservation;
- production read-only/no-write proof;
- concrete blockers only.

The owner handles routine Git staging, commit, push, and final source replacement unless explicitly delegated.
