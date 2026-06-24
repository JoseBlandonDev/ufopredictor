# Documentation Refresh Manifest

_Last refreshed: 2026-06-24 after PR #111, PR #112, Matchday 3 publication, Torneo export validation, MVP2 scope decisions, and active-backlog consistency review._

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

They own current truth.

If a runbook, Markdown tracker, XLSX, prompt, or archived file conflicts with the shared source set, the shared source set wins.

## Current product and branch truth

- production `main` at this refresh: `130ffc8b6728ccccfdb9f29ecc4244ec1cd019b6`;
- PR #111 merged: bounded World Cup group-stage fixture registry;
- PR #112 merged: trusted World Cup result refresh;
- old v2 branch and Draft PR #106 remain preservation/reference;
- current audited divergence: 19 main-only commits, 9 v2-only commits;
- next core task: M2-01 integration normalization;
- Task 3B begins only after selective port and read-only stage audit.

## Current tournament operations truth

- Matchday 3 fixtures stored: 24/24;
- Matchday 3 v1 predictions published: 24/24;
- exact publish queue: empty;
- real trusted result auto-refresh executed;
- Colombia 1-0 Congo DR created, verified, and evaluated automatically;
- normal valid API-Football `FT` results no longer require manual verification;
- exceptions and changed-score reconciliation remain reviewable;
- provider absence may be transient and should use retry/backoff;
- routine polling should target recent pending/relevant fixtures.

## Torneo Mundialista truth

Approved artifact:

```text
schemaVersion: torneo-ufo-export-v1
format: JSON
```

Validated Matchday 3 export:

- range: 2026-06-24 to 2026-06-30;
- fixtures: 24;
- unique fixture IDs: 24;
- duplicates: 0.

PDF is not required.

## MVP2 scope decisions

- core release: Prediction Intelligence v2;
- planned milestones: v2.0 Tournament Candidate and v2.1 Knockout Context;
- tournament-current form and qualification pressure are immediate scope;
- predictions remain immutable;
- finished-fixture comparison uses fair `historical_replay`;
- premium direction emphasizes evidence, contradictions, scenarios, provenance, and post-match explanation;
- core target languages: ES, EN, PT;
- French and German are later;
- lineups, player props, news automation, and market odds are later tracks.

## Updated files in this refresh

### Shared canonical sources

- `00_START_HERE_CURRENT.md`
- `01_PRODUCT_MVP1_CURRENT.md`
- `02_ARCHITECTURE_DATA_SECURITY.md`
- `03_AUTH_PAYMENTS_ENTITLEMENTS.md`
- `04_FIXTURE_RESULT_AND_EVALUATION_OPS.md`
- `05_PREDICTION_INTELLIGENCE_V2_CURRENT.md`
- `06_V2_STAGE_RELEASE_PLAN.md`
- `07_ROADMAP_EPICS_DECISIONS.md`
- `08_MODEL_HISTORY_CALIBRATION.md`
- `09_WORKFLOW_GUARDRAILS_DOC_POLICY.md`

### Updated active runbooks

- `00_CODEX_HANDOFF_CURRENT.md`
- `02_API_FOOTBALL_FIXTURE_RESULT_RUNBOOK.md`
- `03_SIGNAL_REFRESH_AND_MODEL_OPS_RUNBOOK.md`
- `08_V2_BRANCH_ENVIRONMENT_NORMALIZATION_RUNBOOK.md`
- `09_MVP2_PARALLEL_DELIVERY_AND_AUTOMATION_RUNBOOK.md`
- `06_FRONTEND_COMMERCIAL_BACKLOG.md`

### Updated derived project-management Markdown

- `MVP2_SCOPE_AND_DELIVERY_TRACKER.md`

## No-change decisions

- do not update `UFO_Predictor_MVP2_Backlog_Tracker.xlsx` in this refresh;
- treat the XLSX as a derived visual tracker that may lag;
- do not rewrite `docs/90_archive/`;
- do not modify the active entitlement SQL;
- do not modify unrelated stable Wompi, entitlement, stage, validation, or source-snapshot runbooks;
- do not modify the creative master in this refresh.

## Documentation refresh protocol

The authoritative protocol is in:

```text
docs/00_chatgpt_sources/09_WORKFLOW_GUARDRAILS_DOC_POLICY.md
```

Summary:

1. Codex performs read-only recognition.
2. ChatGPT authors exact replacement files.
3. Codex applies the files without editorial changes.
4. Codex validates a docs-only diff and stale references.
5. After merge, replace the ChatGPT project source set with the exact refreshed 10 files.

## ChatGPT upload rule

After the docs PR merges:

1. remove superseded project sources;
2. upload only the exact 10 files in `docs/00_chatgpt_sources/`;
3. do not keep old and new canonical copies together;
4. start the next conversation from `00_START_HERE_CURRENT.md`.

## Archive rule

Do not delete or rewrite:

```text
docs/90_archive/source_snapshot_2026-06-22/
```

It is historical evidence, not current truth.

## Source snapshot rule

The prepared-v2 workspace remains:

```text
D:\Projects\ufo-predictor-source-snapshots\2026-06-20\prepared-v2
```

Keep it until stage import, lineage, checksums, and idempotency are proven.

## Active SQL rule

`G06_ENTITLEMENT_ACTIVATION_PREFLIGHT.sql` remains active at the `docs/` root. This refresh does not modify its operational contents.
