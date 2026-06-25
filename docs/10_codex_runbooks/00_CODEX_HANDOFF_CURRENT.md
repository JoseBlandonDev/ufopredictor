# Codex Handoff Current

_Last refreshed: 2026-06-25 after Task 3A completion and final M2-01 implementation checkpoint approval._

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
production main: e771de3c39c480f05d026075e5e553fb75207468
active branch: integration/prediction-intelligence-v2
active Draft PR: #114
active head: 0db9ac8867eae344e56237ac028cc32255ff1a3d
old branch: feature/prediction-intelligence-v2-data-foundation
old Draft PR: #106
old head: eefcff709e80209215b25b90fb870aa5c080d735
```

PR #114 remains open and Draft. PR #106 remains unchanged and historical. Do not add implementation work to the old branch or blanket-cherry-pick it.

## M2-01 completion

```text
Task 1    complete
Task 1.1  complete
Task 1.2  complete
Task 2A   complete
Task 2B   complete
Task 2C   complete
Task 2D   complete
Task 3A   complete
Task 2 checkpoint: TASK2_CHECKPOINT_READY
M2-01 checkpoint: M2_01_IMPLEMENTATION_CHECKPOINT_READY
```

No useful old-branch implementation remains unported.

Task 2 and Task 3A are local-only. Historical artifacts, candidate names, commands, migration plans, import plans, signal plans, publication plans, and export payloads remain non-current and non-authorizing.

## Immediate next task

After this documentation refresh and shared-source replacement, begin **Task 3B Phase A only**:

- validate ignored stage credentials without printing values;
- prove the target is stage, not production;
- inspect remote migration history and schema read-only;
- compare stage with repository migrations;
- inspect drift, tables, views, functions, policies, RLS, and dependencies;
- confirm existing stage Auth users will not be deleted or corrupted;
- produce an ordered non-destructive synchronization plan;
- stop for owner review.

Task 3B Phase A performs no remote write.

Do not:

- apply migration 0038;
- import data;
- create signal snapshots;
- create prediction versions;
- publish anything;
- alter `torneo-ufo-export-v1`;
- access production;
- mark PR #114 ready or merge it.

## Source workspace

External prepared source workspace:

```text
D:\Projects\ufo-predictor-source-snapshots\2026-06-20\prepared-v2
```

Committed equivalents exist under `data/`, `artifacts/prediction-intelligence-v2/`, `lib/prediction-intelligence-v2/`, and `scripts/prediction-intelligence-v2/`.

Do not report the data as lost merely because the external path is unavailable in one environment. Do not treat historical artifacts as approved stage seed authority without the Task 3B audit and owner approval.

## Hard boundaries

- no production writes;
- no stage writes during the read-only audit;
- no merge of PR #106;
- no more old-branch code porting;
- no blanket old-branch cherry-pick;
- no production migration 0038;
- no production Auth/payment/entitlement cloning;
- no secrets in output;
- no post-kickoff prediction generation;
- no rewriting original v1 publications;
- no claim that historical v2 is currently approved or more accurate;
- no output outside approved local-run/planner artifact roots;
- no interpretation of M2-01 completion as production readiness.

## Reporting contract

Return:

- exact branch, HEAD, and environment target;
- read-only evidence that the target is stage;
- remote migration/schema inventory;
- repository-to-stage drift classification;
- RLS/view/function/policy/dependency review;
- non-destructive synchronization plan;
- stage-user preservation analysis;
- concrete blockers only;
- explicit confirmation of zero remote writes;
- final verdict and stop point.

The owner handles routine Git staging, commit, push, PR-description changes, and all later write authorization unless explicitly delegated.
