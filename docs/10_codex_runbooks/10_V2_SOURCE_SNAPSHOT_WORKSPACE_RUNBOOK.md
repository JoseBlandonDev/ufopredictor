# V2 Source Snapshot Workspace Runbook

_Last refreshed: 2026-06-29 after the baseline load and fixture/result refresh phases completed._

## Workspace status

The prepared source package remains preserved at:

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

**Decision:** this workspace is the approved reproducible historical baseline used by Task 2A.

It is no longer the active next-task workspace.

Task 2A successfully persisted its approved signal rows and proved exact-state verification. Task 2B subsequently refreshed fixture/result truth.

The workspace must still be described as historical, not current.

## Completed use

The workspace supported:

```text
signal rows = 48
state = exact_complete
verification identical = 48
runtime fixture coverage = 72/72
candidate-ready fixtures = 0
```

It proved:

- source/manifest/checksum lineage;
- canonical team mapping;
- explicit cutoff handling;
- deterministic persistence;
- zero duplicate growth;
- fixture coverage.

Do not rerun the baseline load merely to inspect the workspace again.

## Committed equivalents

Durable equivalents exist under:

- `data/prediction-engine/national-team-signals/2026-06-19/`;
- `artifacts/prediction-intelligence-v2/`;
- `lib/prediction-intelligence-v2/`;
- `scripts/prediction-intelligence-v2/`;
- `supabase/migrations/0038_prediction_intelligence_v2_data_foundation.sql`;
- `types/database.ts`.

## Current allowed uses

Use the external workspace only for:

- provenance and checksum verification;
- bounded recovery of Task 2A state;
- parser/feature lineage review;
- comparison with newer versioned source snapshots;
- investigation of a concrete baseline mismatch.

Do not use it as current Task 2C rankings or tournament-context truth.

## Active next source work

Task 2C requires newer or effective-dated sources for:

- World Football Elo;
- latest available official FIFA ranking;
- current tournament standings;
- current form and opponent quality;
- qualification and pressure context.

Those sources must be stored or referenced as newer snapshots with explicit observed time and cutoff. They must not overwrite the 2026-06-20 baseline to make it appear current.

## Local placement

Do not copy the raw workspace into Git-tracked docs.

Preferred:

1. keep the external canonical path; or
2. use an ignored `.local/` junction/copy after confirming `.local/` is ignored.

## Retention rule

The baseline acceptance conditions are complete, but physical deletion still requires owner approval.

Keep the workspace until:

- committed evidence and source lineage are confirmed sufficient;
- recovery needs are assessed;
- newer Task 2C source work no longer depends on comparison with it;
- the owner explicitly approves removal or archival.

## Incremental refresh rule

For newer sources:

- append or version snapshots;
- preserve historical baseline rows;
- record observed time and cutoff;
- preserve parser/feature version;
- retain source disagreement and missing-data evidence;
- use exact canonical identities;
- prove idempotent persistence.

## Secret and data safety

- no credentials in manifests/docs;
- no personal or payment data;
- preserve source URL/license/terms where applicable;
- separate raw, normalized, and derived outputs;
- use explicit non-file-backed treatment where no checksum exists.

## Responsibility

- Codex inspects and implements bounded Task 2C source/load contracts.
- The operator provides or mounts external sources and authorizes stage apply.
- ChatGPT owns the decision that the 2026-06-20 workspace is historical baseline evidence, not active current truth.
