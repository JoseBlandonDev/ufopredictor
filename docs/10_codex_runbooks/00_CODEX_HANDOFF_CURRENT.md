# Codex Handoff Current

_Last refreshed: 2026-06-24 after Task 2 normalization and checkpoint approval._

## Canonical-source rule

Before implementation, read:

```text
docs/00_chatgpt_sources/00_START_HERE_CURRENT.md
docs/00_chatgpt_sources/05_PREDICTION_INTELLIGENCE_V2_CURRENT.md
docs/00_chatgpt_sources/07_ROADMAP_EPICS_DECISIONS.md
docs/00_chatgpt_sources/09_WORKFLOW_GUARDRAILS_DOC_POLICY.md
```

Those files own live product, branch, roadmap, and workflow truth.

## Current baseline

```text
production main: e771de3c39c480f05d026075e5e553fb75207468
active branch: integration/prediction-intelligence-v2
active Draft PR: #114
active head: 1b746f9d038ecfbd49068ecacf8d39c62d4a5fc9
old branch: feature/prediction-intelligence-v2-data-foundation
old Draft PR: #106
old head: eefcff709e80209215b25b90fb870aa5c080d735
```

PR #106 remains Draft and unchanged. Do not add implementation work to it.

## Completed normalization

```text
Task 1    complete
Task 1.1  complete
Task 1.2  complete
Task 2A   complete
Task 2B   complete
Task 2C   complete
Task 2D   complete
Task 2 checkpoint: TASK2_CHECKPOINT_READY
```

The Task 2 stack is local-only and historical artifacts remain non-current.

## Immediate next task

Selectively port only:

```text
Task 3A source: 6967fd6b22a49e23ab9963345f1a1437b1d6b668
```

Task 3A concern:

- safe target authorization guard;
- migration plan;
- idempotent import plan;
- signal persistence plan;
- immutable publication/replay plan;
- Torneo export dry-run;
- production-write denial;
- focused tests.

Task 3A is planner/dry-run only.

Do not:

- access or write stage unless a later prompt explicitly starts the read-only stage audit;
- apply migration 0038;
- write to Supabase;
- fetch live current data;
- publish predictions;
- alter `torneo-ufo-export-v1`;
- port the old final documentation commit;
- mark PR #114 ready or merge it.

## After Task 3A

1. run final M2-01 checkpoint;
2. confirm all useful old-branch code concerns are preserved or intentionally excluded;
3. update PR #114 description to reflect full scope;
4. begin Task 3B with read-only stage audit;
5. stop for owner approval before any stage write.

## Source workspace

External prepared source workspace:

```text
D:\Projects\ufo-predictor-source-snapshots\2026-06-20\prepared-v2
```

Committed equivalents exist under `data/`, `artifacts/prediction-intelligence-v2/`, `lib/prediction-intelligence-v2/`, and `scripts/prediction-intelligence-v2/`.

Do not report the data as lost merely because the external path is unavailable in one environment.

## Hard boundaries

- no production writes;
- no stage writes during Task 3A or the read-only audit;
- no merge of PR #106;
- no blanket old-branch cherry-pick;
- no production migration 0038;
- no production Auth/payment/entitlement cloning;
- no secrets in output;
- no post-kickoff prediction generation;
- no rewriting original v1 publications;
- no claim that historical v2 is currently approved or more accurate;
- no output outside approved local-run/planner artifact roots.

## Reporting contract

Return:

- exact source boundary inspected;
- files changed;
- behavior before/after;
- local-only/write-safety review;
- tests, lint, build, and diff-check as appropriate;
- generated noise cleanup;
- concrete blockers only;
- final verdict.

The owner handles routine Git staging, commit, push, and final log confirmation unless explicitly requested otherwise.
