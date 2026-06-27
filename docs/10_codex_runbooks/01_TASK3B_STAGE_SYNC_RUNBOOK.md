# Task 3B Stage Synchronization Runbook

_Last refreshed: 2026-06-26 after Task 3B completion and the later Task 1C fixture-linkage checkpoint._

## Status

Task 3B foundation synchronization is complete for the current stage checkpoint.

```text
branch: integration/prediction-intelligence-v2
stage project: yfmklapgjrupctgxaako
production deny project: gcpdffkgsdomzyoenalg
source cutoff: 2026-06-20
```

Production writes remain forbidden.

## Completed prerequisites

- current-main-based integration branch established;
- old V2 branch preserved;
- Task 3A planning and safety contracts integrated;
- stage Supabase project identified;
- existing stage Auth user and admin profile identified and preserved;
- canonical migration chain manually reconciled where CLI behavior was unreliable;
- 46 migrations externally verified;
- migration 0038 applied to stage only.

## Completed Task 3B import

The bounded importer loaded:

| Destination | Count |
|---|---:|
| competitions | 1 |
| seasons | 1 |
| teams | 48 |
| venues | 16 |
| matches | 72 |
| source snapshots | 8 |
| canonical aliases | 309 |
| localizations | 488 |
| canonical links | 48 |
| rating snapshots | 699 |
| historical match facts | 1,392 |
| schedule snapshots | 1 |
| venue catalog | 16 |
| official schedule matches | 104 |
| official schedule links | 72 |

Knockout schedule rows 73-104 remain intentionally deferred from runtime linkage.

The non-file-backed API-Football sentinel was not inserted as a fake checksum-backed source snapshot.

## Alias normalization rule

Equivalent Unicode and punctuation variants that resolve to the same canonical team and semantic payload collapse deterministically:

- one stable representative insert;
- remaining equivalent rows recorded as deterministic skips;
- source provenance retained;
- incompatible canonical targets remain blocking conflicts.

Final alias accounting:

```text
source rows = 312
inserts = 309
skips = 3
conflicts = 0
```

## Migration-history attestation

The importer records:

```text
independently verified migration history = false
external operator attestation accepted = true
expected migration count = 46
verification mode = external_operator_attestation
```

Reason:

```text
PostgREST query error: Invalid schema: supabase_migrations
```

Do not expose the migration schema or add an RPC merely to satisfy the importer.

## Approved command

Dry-run or apply uses explicit stage and production-deny refs:

```powershell
npx tsx scripts/prediction-intelligence-v2/run-task3b-stage-bootstrap.ts `
  --env-file .env.stage.local `
  --project-ref yfmklapgjrupctgxaako `
  --deny-project-ref gcpdffkgsdomzyoenalg `
  --expected-migration-count 46 `
  --accept-external-migration-verification `
  --prepared-dir "D:\Projects\ufo-predictor-source-snapshots\2026-06-20\prepared-v2" `
  --dry-run
```

Use `--apply` only under a separately approved rerun or recovery task.

## Idempotency proof

First apply succeeded.

Second exact apply produced:

```text
planned inserts = 0
planned updates = 0
blockers = 0
```

All destination counts remained unchanged.

Do not perform a third ceremonial apply merely to restate idempotency.

## Preservation proof

Before and after Task 3B:

- Auth user count remained 1;
- profile count remained 1;
- profile role remained `admin`;
- production remained untouched;
- no payment, entitlement, Wompi, webhook, session, or personal-data write occurred.

## Current stage application result

At Task 3B completion:

- World Cup competition resolved;
- World Cup season resolved;
- publish queue competition resolution succeeded;
- publish queue loaded but had no active model version and no eligible exact fixture;
- `/predictions` loaded but had no public predictions.

These empty states were expected and were not a Task 3B failure.

Post-Task 3B checkpoint:

- the exact 24 Matchday 3 rows were linked to approved API-Football fixture IDs;
- the atomic linkage RPC requested and updated 24 rows;
- all 24 post-state rows were verified;
- production remained untouched.

The post-Task 3B linkage is not part of this importer and must not be replayed through a Task 3B rerun.

## Remaining work outside Task 3B

Completed after Task 3B:

- exact 24 Matchday 3 fixture linkage in stage.

Still remaining:

- import one canonical V1 model;
- import 24 immutable V1 prediction versions;
- import 240 required prediction-market rows;
- activate the V1 model;
- expose and validate public/admin predictions;
- refresh current Elo or FIFA data;
- refresh current standings and tournament form;
- generate V2 candidates;
- configure Wompi or an AI provider only under a later explicit task.

The next task is:

```text
Task 1C - V1 Model and Prediction Import
```

Operational debt outside this runbook:

```text
migration-history repair pending for 20260626220000
```

The RPC migration is already applied and operational in stage. Do not rerun it. The pending history repair does not block the V1 import.

## Rerun gate

A future Task 3B rerun must stop if:

- target ref is not exact stage;
- production denial is absent;
- expected migration count is not 46 unless a later approved migration changes the canonical count;
- required destination tables are missing;
- Auth/admin preservation cannot be observed;
- source checksums differ unexpectedly;
- natural-key conflicts appear;
- row accounting is unbalanced.

## Evidence retention

Retain the selected evidence set covering:

- final eligible pre-apply dry-run;
- first apply plan;
- post-apply verification;
- second idempotency apply;
- final zero-growth verification.

Exclude redundant failed or superseded local-run noise from version control.
