# Task 3B Stage Synchronization Runbook

_Last refreshed: 2026-06-23._

## Prerequisite: normalized branch

Do not execute Task 3B from `feature/prediction-intelligence-v2-data-foundation`.

Required branch:

```text
integration/prediction-intelligence-v2
```

It must be based on current `origin/main` and contain a reviewed selective port of the nine old v2 commits.

## Stage target

```text
stage.ufopredictor.com -> Railway development -> separate Supabase stage
```

Production writes are forbidden.

## Phase A - read-only target audit

1. Confirm clean branch/worktree and expected integration SHA.
2. Validate ignored environment variables without printing values.
3. Resolve Supabase project identity and prove it is stage.
4. Inspect migration history/schema/RLS/functions/views/indexes.
5. Compare against repository migrations.
6. Identify drift/manual objects/dependencies.
7. Confirm stage Auth users will be preserved.
8. Resolve the prepared-v2 source workspace or committed equivalents.
9. Verify manifests/checksums/cutoffs.
10. Generate a non-destructive ordered plan.
11. Stop for human approval.

## Phase B - authorized writes

1. Snapshot pre-write counts/schema/migrations.
2. Reconcile approved missing canonical migrations.
3. Apply migration 0038.
4. Run idempotent non-sensitive imports.
5. Validate row counts, FK/link integrity, indexes, and RLS.
6. Rerun import and prove zero duplicates.
7. Persist signal snapshots with source/cutoff.
8. Refresh the not-started fixture manifest.
9. Create immutable development prediction versions only before kickoff.
10. Generate development Torneo export.
11. Validate stage public/admin projections and UI.
12. Capture post-write evidence and rollback notes.

## Seed exclusions

Never clone:

- production users/sessions;
- Wompi transactions/webhook payloads;
- production entitlements/subscriptions;
- secrets/personal data.

## Exit gate

- current-main-based integration branch;
- old v2 preservation proof;
- stage migration chain synchronized;
- migration 0038 applied in stage;
- idempotent import proven;
- signals and immutable predictions persisted;
- RLS/localization/venue/public UI validated;
- v1/v2 comparison captured;
- no production write;
- owner approval for any later promotion.
