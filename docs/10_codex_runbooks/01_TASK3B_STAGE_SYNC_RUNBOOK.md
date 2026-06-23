# Task 3B Stage Synchronization Runbook

_Last refreshed: 2026-06-23._

## Objective

Synchronize the existing Supabase stage environment with repository migrations and Prediction Intelligence v2 without touching production.

## Preconditions

- branch: `feature/prediction-intelligence-v2-data-foundation`;
- Draft PR #106 remains open;
- stage target is positively identified;
- Git-ignored administrative stage credentials are available locally;
- values are never printed;
- worktree state understood;
- no production credential accepted.

## Phase 1 - read-only audit

1. Validate credential presence/shape without outputting secrets.
2. Query remote stage migration history.
3. Inventory public schema objects, functions, views, policies, extensions, and dependencies.
4. Compare against canonical repository migrations.
5. Detect missing migrations, history drift, manually created objects, and conflicts.
6. Confirm existing `auth.users` stage account is safe.
7. Produce ordered migration reconciliation options.
8. Produce proposed non-sensitive seed/import scope.
9. Produce rollback/stop conditions.
10. Stop.

Required status:

```text
READ_ONLY_AUDIT_COMPLETE_AWAITING_HUMAN_REVIEW
```

## Human review gate

Choose one only after evidence:

- apply repository chain as-is;
- repair migration-history metadata;
- reconcile manual objects first;
- create a bounded compatibility migration.

No destructive reset.

## Phase 2 - authorized write

1. Revalidate target and production denial.
2. Apply approved migration reconciliation.
3. Apply migration 0038.
4. Import reference/history/schedule/venue data idempotently.
5. Rerun import and prove zero duplicates.
6. Persist signal snapshots with cutoff and provenance.
7. Create development-only immutable predictions for not-started fixtures.
8. Generate development Torneo export.
9. Validate RLS/public/admin projections.
10. Validate aliases/localization/venues/UI.
11. Capture counts, checksums, and evidence.

## Stop conditions

- target cannot be proven to be stage;
- production credential detected;
- destructive schema action required but not approved;
- migration conflict could affect Auth;
- idempotency fails;
- started fixture would be rewritten;
- public projection leaks internal fields;
- source cutoff/provenance missing.

## Exit verdict

```text
TASK3B_STAGE_EXIT_GATE_PASS
```

Only after this may PR #106 be considered for non-Draft review.
