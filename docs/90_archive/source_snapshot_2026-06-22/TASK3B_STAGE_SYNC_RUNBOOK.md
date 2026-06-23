# Task 3B Stage Synchronization Runbook

_Created: 2026-06-22._

## Objective

Safely bring the remote Supabase `stage` environment to the schema/data state required to validate Prediction Intelligence v2, without touching production or cloning sensitive production data.

## Preconditions

- repository branch is `feature/prediction-intelligence-v2-data-foundation`;
- worktree is clean;
- `.env.task3b.development.local` has been supplied in the active operator environment and is Git-ignored;
- its required fields pass structural validation immediately before execution;
- Railway development points to Supabase stage;
- stage Auth registration/login works;
- production and stage project refs differ;
- no secret values are printed.

## Phase 1 - mandatory read-only audit

Allowed:

- connect to stage using read-only queries;
- inspect migration-history tables;
- list schemas/tables/views/functions/triggers/policies/indexes;
- compare with repository migration files;
- inspect row counts and object metadata;
- generate local non-secret audit artifacts.

Forbidden:

- migration apply;
- DDL;
- insert/update/delete;
- write RPC;
- Auth mutation;
- publication;
- file edits/commit unless separately approved.

### Audit outputs

- authorized target check;
- remote migration inventory;
- canonical migration inventory;
- missing/applied/divergent classification;
- manually created object classification;
- Auth-user impact assessment;
- ordered write plan;
- rollback/backup requirements;
- concrete blockers.

## Human review gate

Do not proceed if:

- stage ref does not match the authorized file;
- production ref is detected;
- schema drift cannot be explained;
- a migration is destructive to current stage data/Auth;
- required DB password/connection fails;
- the write plan is not idempotent;
- secrets appear in output.

## Phase 2 - authorized stage write

Required flags:

```text
PREDICTION_INTELLIGENCE_TARGET=development
PREDICTION_INTELLIGENCE_ALLOW_REMOTE_DEV_WRITE=true
```

Use only `DEV_SUPABASE_*` variables.

### Execution order

1. capture exact UTC cutoff;
2. refresh API-Football statuses/results;
3. regenerate not-started fixture manifest;
4. snapshot stage pre-write object/row state;
5. apply canonical missing migrations in order;
6. apply migration 0038;
7. execute idempotent non-sensitive import;
8. validate counts/links/RLS;
9. rerun import and prove zero duplicates;
10. persist signal snapshots;
11. create immutable development prediction versions;
12. reject started/live/completed fixtures;
13. generate Torneo development export;
14. validate stage public queries/UI;
15. capture post-write state.

## Non-sensitive seed scope

Allowed:

- teams/competitions/reference rows;
- World Cup schedule and venues;
- canonical aliases/localizations;
- FIFA/Elo snapshots;
- historical match facts/links;
- development signal snapshots;
- development prediction versions;
- explicitly labeled test profiles/entitlements when required.

Do not copy:

- production Auth users/sessions;
- Wompi transactions/events/secrets;
- production subscriptions/entitlements;
- personal data;
- production admin tokens;
- production prediction rows by uncontrolled dump.

## Required validation targets

- analytical tables exist;
- intended RLS/internal-only policies exist;
- 48/48 World Cup teams resolve;
- 244 Elo teams and 211 FIFA rows match prepared plan;
- 104 official matches;
- 72/72 group links;
- 32 knockout placeholders;
- 16/16 venues;
- Spanish/English names resolve;
- known venues do not show `Por definir`;
- historical facts match import plan;
- second import is idempotent;
- signal snapshots contain cutoff/source/version metadata;
- original prediction versions are unchanged;
- new development versions have lineage;
- no started fixture is published.

## Required artifacts

Place under:

```text
artifacts/prediction-intelligence-v2/task3b/<execution-date>/
```

At minimum:

- `authorized-target-check.json`;
- `remote-migration-audit.json`;
- `schema-drift-report.json`;
- `pre-write-dry-run.json`;
- `migration-result.json`;
- `development-seed-write-result.json`;
- `development-row-counts-before-after.json`;
- `idempotency-rerun-result.json`;
- `development-data-validation.json`;
- `signal-snapshot-write-result.json`;
- `immutable-publication-write-result.json`;
- `torneo-mundialista-development-export.json`;
- `production-write-denial-proof.json`;
- `README.txt`.

No artifact may contain secrets.

## Exit status

Task 3B is complete only after physical stage validation succeeds. A dry-run or failed authorization is not completion.
