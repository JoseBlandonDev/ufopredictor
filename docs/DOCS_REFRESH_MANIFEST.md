# Documentation Refresh Manifest

_Last refreshed: 2026-06-23. Corrected after the first Codex read-only audit._

## Goal

Reduce active ChatGPT sources while preserving prior information and giving Codex a clearer operational document hierarchy.

## New canonical structure

| Path | Purpose | Count |
|---|---|---:|
| `00_chatgpt_sources` | Shared canonical context for ChatGPT and Codex | 10 |
| `10_codex_runbooks` | Detailed repo/operator runbooks for Codex | 8 |
| `20_optional_project_sources` | Specialized project context | 1 |
| `90_archive/source_snapshot_2026-06-22` | Dated source snapshot | 29 |
| `G06_ENTITLEMENT_ACTIVATION_PREFLIGHT.sql` | Active read-only operator preflight | 1 |

The archive count is `28` Markdown sources plus `1` SQL preflight.

## Original-to-new crosswalk

| Original file | Primary replacement or disposition |
|---|---|
| `ARCHITECTURE_SUMMARY.md` | `00_chatgpt_sources/02_ARCHITECTURE_DATA_SECURITY.md` |
| `AUTH_SETUP.md` | `00_chatgpt_sources/03_AUTH_PAYMENTS_ENTITLEMENTS.md`, `04_FIXTURE_RESULT_AND_EVALUATION_OPS.md`, and Codex runbooks `00`/`02` |
| `CHATGPT_PROJECT_SOURCE_UFO_PREDICTOR_CURRENT.md` | `00_chatgpt_sources/00_START_HERE_CURRENT.md` and `05_PREDICTION_INTELLIGENCE_V2_CURRENT.md` |
| `CODEX_HANDOFF_CURRENT.md` | `10_codex_runbooks/00_CODEX_HANDOFF_CURRENT.md` |
| `CODEX_WORKFLOW.md` | `00_chatgpt_sources/09_WORKFLOW_GUARDRAILS_DOC_POLICY.md` |
| `CURRENT_PROJECT_STATUS.md` | `00_START_HERE_CURRENT.md`, `01_PRODUCT_MVP1_CURRENT.md`, `04_FIXTURE_RESULT_AND_EVALUATION_OPS.md`, and `05_PREDICTION_INTELLIGENCE_V2_CURRENT.md` |
| `DATA_DICTIONARY.md` | `02_ARCHITECTURE_DATA_SECURITY.md` |
| `DOCS_AND_SOURCES_INVENTORY.md` | `09_WORKFLOW_GUARDRAILS_DOC_POLICY.md` |
| `EPIC_PROGRESS_MATRIX.md` | `07_ROADMAP_EPICS_DECISIONS.md` |
| `G05_WOMPI_INTEGRATION_RUNBOOK.md` | `03_AUTH_PAYMENTS_ENTITLEMENTS.md` and Codex runbook `04` |
| `G06_ENTITLEMENT_ACTIVATION_PREFLIGHT.sql` | Keep active as `docs/G06_ENTITLEMENT_ACTIVATION_PREFLIGHT.sql`; also preserve in archive |
| `G06_ENTITLEMENT_ACTIVATION_RUNBOOK.md` | `03_AUTH_PAYMENTS_ENTITLEMENTS.md`, Codex runbooks `04` and `07` |
| `G09_FRONTEND_COMMERCIAL_READINESS_PLAN.md` | `01_PRODUCT_MVP1_CURRENT.md` and Codex runbook `06` |
| `IMPLEMENTATION_PLAN.md` | `06_V2_STAGE_RELEASE_PLAN.md` and Codex runbook `05` |
| `MODEL_CALIBRATION_CLOSEOUT_PR94.md` | `08_MODEL_HISTORY_CALIBRATION.md` |
| `MODEL_V01.md` | `08_MODEL_HISTORY_CALIBRATION.md` |
| `NEXT_EPICS_PLAN.md` | `07_ROADMAP_EPICS_DECISIONS.md` |
| `OPEN_DECISIONS.md` | `07_ROADMAP_EPICS_DECISIONS.md` |
| `POST_G05_G07_CHANGELOG.md` | `01_PRODUCT_MVP1_CURRENT.md`, `03_AUTH_PAYMENTS_ENTITLEMENTS.md`, `04_FIXTURE_RESULT_AND_EVALUATION_OPS.md`, and Codex runbook `00` |
| `PREDICTION_INTELLIGENCE_V2_CURRENT.md` | `05_PREDICTION_INTELLIGENCE_V2_CURRENT.md` |
| `PRODUCTION_READINESS.md` | `01_PRODUCT_MVP1_CURRENT.md`, `06_V2_STAGE_RELEASE_PLAN.md`, Codex runbook `05` |
| `PROJECT_CONTEXT_UFO_PREDICTOR.md` | `00_START_HERE_CURRENT.md` |
| `PROJECT_STATUS_FOR_MEETING.md` | `00_START_HERE_CURRENT.md` and `07_ROADMAP_EPICS_DECISIONS.md` |
| `ROADMAP_AND_BACKLOG.md` | `07_ROADMAP_EPICS_DECISIONS.md`, Codex runbooks `00`, `02`, and `06` |
| `SIGNAL_REFRESH_PLAYBOOK.md` | Codex runbook `03_SIGNAL_REFRESH_AND_MODEL_OPS_RUNBOOK.md` |
| `START_HERE_FOR_NEW_CONVERSATIONS.md` | `00_chatgpt_sources/00_START_HERE_CURRENT.md` |
| `TASK3B_STAGE_SYNC_RUNBOOK.md` | `06_V2_STAGE_RELEASE_PLAN.md` and Codex runbook `01` |
| `TRACK_D_API_FOOTBALL_HANDOFF.md` | `04_FIXTURE_RESULT_AND_EVALUATION_OPS.md` and Codex runbook `02` |
| `UFO_FLOW_CREATIVE_MASTER_CURRENT.md` | `20_optional_project_sources/UFO_FLOW_CREATIVE_MASTER_CURRENT.md` |

## Active operational exception

`G06_ENTITLEMENT_ACTIVATION_PREFLIGHT.sql` remains active at the `docs/` root after adoption because operators may need to run it directly before G06-related migration/admin work.

It is also copied into the archive so the refresh cannot erase its historical provenance.

## Information preservation rule

Do not delete the archive during the first adoption commit. Original documents remain available for line-by-line comparison and recovery.

Before archiving any legacy active document, verify that unique operational details are represented in the canonical files or Codex runbooks.

## ChatGPT upload rule

Upload only the 10 files in `00_chatgpt_sources/` to the primary UFO Predictor engineering project.

After the docs PR is merged:

1. remove superseded uploaded source copies;
2. upload the exact current 10-file core;
3. do not retain duplicate old and new project truth.

The creative master belongs only in a creative/marketing context when needed.

## Adoption note

`README_FIRST.md`, `PACKAGE_FILE_INVENTORY.md`, `CODEX_SECOND_AUDIT_PROMPT.md`, and `CODEX_DOCS_REORGANIZATION_PROMPT.md` were temporary review/adoption helpers and are not part of the long-lived repository documentation set.

The approved long-lived files now live directly at their final `docs/` paths.
