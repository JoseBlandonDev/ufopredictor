# V2 Source Snapshot Workspace Runbook

_Last refreshed: 2026-06-23._

## Source workspace status

The prepared source package is not lost. The operator-local path is:

```text
D:\Projects\ufo-predictor-source-snapshots\2026-06-20\prepared-v2
```

Expected top-level content:

- `contracts/`;
- `normalized-snapshot/`;
- `parsing/`;
- `reference/`;
- `reports/`;
- `package-manifest`;
- `source-access-matrix`;
- `source-registry`;
- readme/prompt helpers.

## Committed equivalents

The branch/repo also preserves durable equivalents under:

- `data/prediction-engine/national-team-signals/2026-06-19/`;
- `artifacts/prediction-intelligence-v2/`;
- `lib/prediction-intelligence-v2/`;
- `scripts/prediction-intelligence-v2/`;
- `supabase/migrations/0038_prediction_intelligence_v2_data_foundation.sql`;
- `types/database.ts`.

## Recommended local placement

Do not copy the raw workspace into Git-tracked docs merely for convenience.

Preferred options:

1. keep the external canonical path and document it; or
2. create an ignored local junction/copy under:

```text
D:\Projects\ufo-predictor-v2\.local\prediction-intelligence-v2\source-snapshots\2026-06-20\prepared-v2
```

Ensure `.local/` is ignored before creating any copy.

## Retention rule

Keep the external workspace until all are true:

- stage import completed;
- import rerun proves idempotency;
- row counts and checksums match expected manifests;
- source snapshot lineage is persisted;
- all required reports/artifacts are committed or archived;
- owner explicitly approves archive/removal.

## Codex inspection rule

When the external path is unavailable:

- do not claim the source data is missing;
- inspect committed equivalents;
- report which external-only files could not be verified;
- do not fabricate checksums or file contents;
- request a mounted/local path only if an exact validation truly requires it.

## Secret/data safety

- no credentials in manifests/docs;
- no personal data/payment payloads;
- cite source URL/license/terms where applicable;
- preserve acquisition timestamp and parser version;
- separate raw, normalized, and derived outputs.
