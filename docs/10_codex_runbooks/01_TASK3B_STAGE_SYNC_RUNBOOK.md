# Task 3B Stage Synchronization Runbook

_Last refreshed: 2026-06-27 after Task 1C completion._

## Status

Task 3B is a closed historical checkpoint.

```text
branch: integration/prediction-intelligence-v2
stage: yfmklapgjrupctgxaako
production denied: gcpdffkgsdomzyoenalg
foundation source cutoff: 2026-06-20
```

Do not use this runbook as the active next-task handoff.

## Completed Task 3B import

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

Knockout schedule rows 73-104 remain deferred from runtime linkage until participants are known.

## Idempotency and preservation proof

- first apply succeeded;
- second exact apply planned zero inserts and zero updates;
- Auth user and admin profile were preserved;
- no production, payment, entitlement, webhook, session, or personal-data write occurred.

## Later checkpoints completed after Task 3B

- 24 Matchday 3 fixtures linked to API-Football identity;
- 1 V1 model imported and activated;
- 24 V1 prediction versions imported;
- 240 markets imported;
- 24 fixtures published;
- stage state verified as `exact_complete`;
- `/predictions` visual smoke passed.

The empty prediction state described by the original Task 3B checkpoint is historical and no longer current.

## Historical command

The original Task 3B command remains evidence only:

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

Do not reuse the historical `46` count as a claim about the current migration ledger without a new dedicated inventory. Later manual migrations exist.

## Rerun gate

Task 3B may be rerun only for an approved recovery when:

- foundation tables are missing or corrupted;
- source checksums prove an unintended divergence;
- an environment restore requires replay;
- owner approves exact target, scope, and recovery plan.

A desire to “verify again” is not a rerun reason.

## Migration debt

Manual Task 1C migrations are operational. Formal migration-ledger reconciliation remains separate, non-blocking housekeeping.

Migration `0039_manual_world_cup_result_reconciliation.sql` is present in Git; this runbook does not assert remote application.

## Active next procedure

Use:

```text
docs/10_codex_runbooks/03_SIGNAL_REFRESH_AND_MODEL_OPS_RUNBOOK.md
```

for the V2 signal baseline and incremental refresh path.
