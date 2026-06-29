# V2 Source Snapshot Workspace Runbook

_Last refreshed: 2026-06-27 for the active baseline-load phase._

## Workspace status

The prepared source package is preserved at:

```text
D:\Projects\ufo-predictor-source-snapshots\2026-06-20\prepared-v2
```

Expected top-level content:

- `contracts/`;
- `normalized-snapshot/`;
- `parsing/`;
- `reference/`;
- `reports/`;
- package manifest;
- source access matrix;
- source registry;
- readme/prompt helpers.

## Current decision

**Decision:** this workspace is the approved reproducible baseline for the first V2 Signal Baseline Database Load.

It is historical and must not be described as current on 2026-06-27.

Its age does not require delaying the database/pipeline work. Newer sources will be added through incremental refresh after baseline storage and lineage are proven.

## Committed equivalents

Durable equivalents exist under:

- `data/prediction-engine/national-team-signals/2026-06-19/`;
- `artifacts/prediction-intelligence-v2/`;
- `lib/prediction-intelligence-v2/`;
- `scripts/prediction-intelligence-v2/`;
- `supabase/migrations/0038_prediction_intelligence_v2_data_foundation.sql`;
- `types/database.ts`.

## Baseline-load use

The next task should:

1. inventory only files relevant to destination tables;
2. distinguish raw, normalized, derived, and report-only artifacts;
3. preserve manifest/checksum/source registry references;
4. map canonical identities and explicit cutoffs;
5. persist baseline rows idempotently;
6. report external-only files that cannot be verified;
7. avoid fabricating missing checksums or content.

## Local placement

Do not copy the raw workspace into Git-tracked docs.

Preferred:

1. keep the external canonical path; or
2. use an ignored `.local/` junction/copy after confirming `.local/` is ignored.

## Retention rule

Keep the external workspace until:

- baseline import completes;
- rerun proves idempotency;
- counts and checksums match manifests;
- source lineage is persisted;
- fixture coverage is demonstrated;
- required reports/artifacts are committed or archived;
- the owner approves removal.

## Incremental refresh rule

After baseline load:

- append or version newer source snapshots;
- do not overwrite historical baseline rows to appear current;
- record observed time and cutoff;
- preserve parser/feature version;
- retain source disagreement and missing-data evidence.

## Secret and data safety

- no credentials in manifests/docs;
- no personal or payment data;
- preserve source URL/license/terms where applicable;
- separate raw, normalized, and derived outputs;
- use explicit non-file-backed treatment where no file checksum exists.

## Responsibility

- Codex inspects and implements the bounded loader.
- The operator provides/mounts the external workspace and authorizes stage apply.
- ChatGPT owns the canonical decision that the baseline is historical but usable.
