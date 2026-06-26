# Task 3B Stage Synchronization Runbook

_Last refreshed: 2026-06-26 after successful stage apply and idempotency verification._

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
  --env-file .env.task3b.development.local `
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

- World Cup competition resolves;
- World Cup season resolves;
- publish queue competition resolution succeeds;
- publish queue loads but has no active model version and no eligible exact fixture;
- `/predictions` loads but has no public predictions.

These empty states are expected and are not a Task 3B failure.

## Remaining work outside Task 3B

Task 3B did not:

- import the V1 model;
- import prediction versions;
- publish predictions;
- refresh current Elo or FIFA data;
- refresh current standings and tournament form;
- generate V2 candidates;
- configure Wompi or an AI provider.

The next task is `Stage V1 Visible Predictions Slice`.

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
