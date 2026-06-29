# V2 Branch and Environment Normalization Runbook

_Last refreshed: 2026-06-27 after Epic 1 completion._

## Goal

Preserve the normalized V2 integration track and stable stage while moving directly into V2 data and candidate work.

## Live-state source

Read:

```text
docs/00_chatgpt_sources/00_START_HERE_CURRENT.md
docs/00_chatgpt_sources/05_PREDICTION_INTELLIGENCE_V2_CURRENT.md
docs/00_chatgpt_sources/06_V2_STAGE_RELEASE_PLAN.md
docs/00_chatgpt_sources/09_WORKFLOW_GUARDRAILS_DOC_POLICY.md
```

## Stable references

```text
active branch: integration/prediction-intelligence-v2
active Draft PR: #114
reviewed checkpoint HEAD: bce9999
canonical stage env: .env.stage.local
stage project: yfmklapgjrupctgxaako
production project: gcpdffkgsdomzyoenalg
old branch: feature/prediction-intelligence-v2-data-foundation
old Draft PR: #106
```

Verify actual HEAD and worktree before implementation.

## Completed normalization map

Completed:

- selective old-V2 normalization;
- data foundation and replay readiness;
- historical Elo and challenger research;
- calibration, gates, eligibility, and packaging;
- Task 3A safety planning;
- Task 3B stage synchronization;
- exact 24-fixture linkage;
- V1 model/prediction/market import;
- V1 activation/publication;
- exact-complete and UI smoke verification.

No useful implementation remains to be ported wholesale from the old branch.

## Environment rule

```text
production: ufopredictor.com -> gcpdffkgsdomzyoenalg
stage: stage.ufopredictor.com -> yfmklapgjrupctgxaako
```

Do not create another stage environment.

Do not use production credentials for stage.

Do not revive the Docker path for normal stage work.

## Current stage result

```text
runtime matches = 72
linked V1 fixtures = 24
active V1 models = 1
V1 predictions = 24
markets = 240
public fixtures = 24
state = exact_complete
```

Stage is no longer empty of prediction content.

## Integrated parallel work

PR #115 and PR #116 were merged to `main` and brought into the integration branch through normal history before checkpoint `bce9999`.

Do not reimplement those changes manually in the integration branch.

## Migration notes

Operational stage migrations include foundation and Task 1C functions.

Manual migration-ledger reconciliation remains non-blocking housekeeping.

`0039_manual_world_cup_result_reconciliation.sql` exists in Git; remote application is not asserted by this runbook.

## Next transition

```text
Task 2A - V2 Signal Baseline Database Load
```

Required sequence:

1. use the preserved 2026-06-20 package;
2. map to existing V2 tables;
3. retain lineage and cutoff;
4. load idempotently in stage;
5. prove fixture coverage;
6. refresh current sources incrementally;
7. generate the first V2 shadow candidate.

Do not redo normalization, Task 3B, linkage, or V1 import.

## Parallel branch rule

A separate owner may improve production-safe V1/expert-product work from current `main`.

Those changes:

- must not change model calculations casually;
- must not depend on unfinished V2 data;
- merge normally to `main`;
- flow into the integration branch through merge/rebase;
- are not manually duplicated.

## Responsibility

- ChatGPT owns canonical branch/environment decisions and handoffs.
- Codex implements bounded technical slices.
- The operator handles Git, stage SQL, Railway, and remote operations.

## Validation

- branch/HEAD/worktree;
- exact target and deny refs;
- task-specific tests;
- relevant protected regressions;
- lint and diff-check;
- zero new task-local diagnostics;
- no production write.
