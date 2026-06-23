# Documentation Refresh Manifest

_Last refreshed: 2026-06-23 after MVP2 scope, branch-normalization, and parallel-delivery planning._

## Canonical structure

| Path | Purpose | Count |
|---|---|---:|
| `00_chatgpt_sources` | Shared canonical context for ChatGPT and Codex | 10 Markdown |
| `10_codex_runbooks` | Detailed execution/operator runbooks | 11 Markdown |
| `20_optional_project_sources` | Specialized creative context | 1 Markdown |
| `30_project_management` | MVP2 scope and editable tracker | 1 Markdown + 1 XLSX |
| `90_archive/source_snapshot_2026-06-22` | Dated legacy source snapshot | 29 files |
| `G06_ENTITLEMENT_ACTIVATION_PREFLIGHT.sql` | Active read-only operator preflight | 1 SQL |

## Current product/branch truth added by this refresh

- MVP1 is commercially usable and remains live during v2 work.
- Recent result/evaluation operations are current through Norway-Senegal and Jordan-Algeria.
- The old v2 branch and `main` are diverged (12 main-only, 9 v2-only commits; merge base `1dca9bf`).
- New v2 development must start from a current-main integration branch.
- The old v2 branch/PR #106 remain preservation/reference until superseded.
- Remaining group-stage fixture coverage and current-model publication continue immediately.
- Task 3B starts only after selective port/normalization.
- Ops automation is an MVP2 track with human result verification retained initially.
- Independent MVP1 UI/UX microreleases may proceed in parallel.
- English internationalization follows v2 stabilization; Portuguese is later.
- Secondary payment providers are later, not an immediate v2 blocker.

## New runbooks

- `08_V2_BRANCH_ENVIRONMENT_NORMALIZATION_RUNBOOK.md`
- `09_MVP2_PARALLEL_DELIVERY_AND_AUTOMATION_RUNBOOK.md`
- `10_V2_SOURCE_SNAPSHOT_WORKSPACE_RUNBOOK.md`

## Project-management assets

- `MVP2_SCOPE_AND_DELIVERY_TRACKER.md`
- `UFO_Predictor_MVP2_Backlog_Tracker.xlsx`

The workbook includes the new MVP2 backlog, branches/environments, automation plan, decisions, v2 source registry, and imported MVP1 historical tracker sheets.

## ChatGPT upload rule

Upload only the exact 10 files in `00_chatgpt_sources/` after the docs PR is merged.

Remove superseded project sources first. Do not keep old and new canonical truth together.

## Archive rule

Do not delete or rewrite `docs/90_archive/source_snapshot_2026-06-22/` during this update.

## Source snapshot rule

The external prepared-v2 workspace remains valid evidence at:

```text
D:\Projects\ufo-predictor-source-snapshots\2026-06-20\prepared-v2
```

Keep it until stage import, lineage, checksums, and idempotency are proven. Raw local snapshots should remain ignored/outside Git.

## Active SQL rule

`G06_ENTITLEMENT_ACTIVATION_PREFLIGHT.sql` remains active at the `docs/` root and archived separately. This refresh does not modify its operational contents.
