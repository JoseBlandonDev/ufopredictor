# Documentation Refresh Manifest

_Last refreshed: 2026-06-25 after Task 3A completion and final M2-01 implementation checkpoint approval._

## Canonical structure

| Path | Purpose | Canonical status |
|---|---|---|
| `00_chatgpt_sources` | Shared live product, architecture, operations, model, roadmap, and workflow truth | Canonical dynamic |
| `10_codex_runbooks` | Stable execution/operator procedures | Procedural |
| `20_optional_project_sources` | Specialized optional context | Optional |
| `30_project_management` | Derived planning/visual tracking | Non-canonical derived |
| `90_archive/source_snapshot_2026-06-22` | Dated legacy source snapshot | Historical |
| `G06_ENTITLEMENT_ACTIVATION_PREFLIGHT.sql` | Active read-only operator preflight | Active operational SQL |

## Canonical dynamic source rule

Only the exact 10 Markdown files under:

```text
docs/00_chatgpt_sources/
```

are uploaded as the shared ChatGPT project source set.

They own current truth, including the distinction between production `main`, the active integration branch, and the preserved historical branch.

## Current repository truth

```text
production main: e771de3c39c480f05d026075e5e553fb75207468
active integration branch: integration/prediction-intelligence-v2
active Draft PR: #114
active integration head: 0db9ac8867eae344e56237ac028cc32255ff1a3d
preserved old branch: feature/prediction-intelligence-v2-data-foundation
preserved Draft PR: #106
preserved old head: eefcff709e80209215b25b90fb870aa5c080d735
```

## Current Prediction Intelligence v2 truth

Completed on the integration branch:

- Task 1 data foundation;
- Task 1.1 replay readiness;
- Task 1.2 historical Elo reconstruction;
- Task 2A challenger/replay;
- Task 2B calibration stabilization;
- Task 2C signal gates and candidate eligibility;
- Task 2D historical release-candidate packaging;
- strict runner-specific Task 2 local-run output containment;
- Task 3A local-only planner/dry-run;
- accumulated Task 2 checkpoint with verdict `TASK2_CHECKPOINT_READY`;
- final M2-01 implementation checkpoint with verdict `M2_01_IMPLEMENTATION_CHECKPOINT_READY`.

M2-01 is implementation-complete.

No useful old-branch implementation remains to be ported. Task 3A historical evidence remains byte-exact and non-authorizing. Migration 0038 is committed and structurally tested but unapplied.

Task 3B has not started. Its first phase is a read-only Supabase stage audit. Stage writes require a later explicit owner approval. Production writes remain unauthorized.

## Updated files in this refresh

### Shared canonical sources

- `00_START_HERE_CURRENT.md`
- `01_PRODUCT_MVP1_CURRENT.md`
- `05_PREDICTION_INTELLIGENCE_V2_CURRENT.md`
- `06_V2_STAGE_RELEASE_PLAN.md`
- `07_ROADMAP_EPICS_DECISIONS.md`

### Updated active runbooks

- `00_CODEX_HANDOFF_CURRENT.md`
- `08_V2_BRANCH_ENVIRONMENT_NORMALIZATION_RUNBOOK.md`

### Updated derived project-management Markdown

- `MVP2_SCOPE_AND_DELIVERY_TRACKER.md`

### Updated refresh manifest

- `DOCS_REFRESH_MANIFEST.md`

Total replacement files:

```text
9
```

## No-change decisions

Canonical shared sources intentionally unchanged:

- `02_ARCHITECTURE_DATA_SECURITY.md`;
- `03_AUTH_PAYMENTS_ENTITLEMENTS.md`;
- `04_FIXTURE_RESULT_AND_EVALUATION_OPS.md`;
- `08_MODEL_HISTORY_CALIBRATION.md`;
- `09_WORKFLOW_GUARDRAILS_DOC_POLICY.md`.

Other no-change decisions:

- do not update `docs/10_codex_runbooks/01_TASK3B_STAGE_SYNC_RUNBOOK.md`; its read-only/write-gated separation is already correct;
- do not update `UFO_Predictor_MVP2_Backlog_Tracker.xlsx`;
- do not rewrite `docs/90_archive/`;
- do not modify historical artifacts;
- do not modify active entitlement SQL;
- do not modify unrelated Wompi, entitlement, API-Football, creative, frontend, or operations runbooks;
- do not apply migration 0038;
- do not access or write stage/production during documentation apply;
- do not modify app code, tests, package files, generated artifacts, or secrets;
- do not update Draft PR #114 description in this docs-only apply unless separately authorized.

## Apply target for this checkpoint

Apply this refresh to:

```text
integration/prediction-intelligence-v2
```

This is a branch-local final M2-01 checkpoint refresh so the long-running integration branch and next conversations remain self-describing.

After PR #114 eventually merges, perform another final canonical refresh from updated `main`.

## Apply protocol

1. verify the active integration branch at `0db9ac8867eae344e56237ac028cc32255ff1a3d` and a clean worktree;
2. replace exactly the 9 files listed in this manifest;
3. do not editorialize, summarize, or merge with older content;
4. confirm a documentation-only diff;
5. confirm exactly 9 changed files;
6. search active docs for stale claims including:
   - Task 3A pending or remaining;
   - M2-01 `In Progress`;
   - final M2-01 checkpoint still pending;
   - active integration head `1b746f9` or `927cb1b`;
   - more code to port from the old branch;
   - Task 3B already writing or synchronizing stage;
   - Migration 0038 already applied;
   - PR #114 no longer Draft;
7. validate paths, filenames, cross-file SHAs, statuses, and sequence;
8. run `git diff --check`;
9. owner reviews, stages, commits, and pushes.

## ChatGPT upload rule

After the documentation commit is accepted:

1. remove superseded project sources;
2. upload only the exact 10 files in `docs/00_chatgpt_sources/`;
3. do not keep old and new canonical copies together;
4. start the next conversation from `00_START_HERE_CURRENT.md`;
5. keep Codex runbooks in the repository rather than the shared ChatGPT source set unless specifically needed.

## Archive and source snapshot rule

Do not delete or rewrite:

```text
docs/90_archive/source_snapshot_2026-06-22/
D:\Projects\ufo-predictor-source-snapshots\2026-06-20\prepared-v2
```

They remain historical/source evidence until stage import, lineage, checksums, and idempotency are proven.

## Active SQL rule

`G06_ENTITLEMENT_ACTIVATION_PREFLIGHT.sql` remains active at the `docs/` root. This refresh does not modify its operational contents.
