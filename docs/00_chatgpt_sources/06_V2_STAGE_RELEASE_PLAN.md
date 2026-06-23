# Prediction Intelligence v2 - Stage and Release Plan

_Last refreshed: 2026-06-23._

## Environment decision

The development environment already exists:

```text
stage.ufopredictor.com -> Railway development -> Supabase stage
```

Auth registration/login works. Do not create another environment or revive the abandoned Docker path.

## Task 3B objective

Synchronize the existing Supabase stage project with the canonical repository schema and Prediction Intelligence v2 data safely, without touching production.

## Phase 1 - mandatory read-only audit

1. Validate local Git-ignored stage credentials without printing values.
2. Confirm the target is the stage Supabase project and not production.
3. Inspect remote migration history and schema.
4. Compare with `supabase/migrations`.
5. Identify missing migrations, drift, manually created objects, views, functions, policies, and dependencies.
6. Confirm the existing stage Auth user will not be deleted or corrupted.
7. Generate an ordered synchronization plan.
8. Stop for human review.

No remote write is allowed in Phase 1.

## Phase 2 - authorized stage synchronization

Only after approval:

1. Reconcile stage migration history/schema using the approved non-destructive plan.
2. Apply the missing canonical chain.
3. Apply `0038_prediction_intelligence_v2_data_foundation.sql`.
4. Load non-sensitive reference/history data idempotently.
5. Rerun and prove zero duplicates.
6. Persist signal snapshots with cutoff/provenance.
7. Create immutable development prediction versions only for not-started fixtures.
8. Generate the development Torneo export.
9. Validate RLS and public-safe projections.
10. Validate localization, aliases, venues, and stage UI.

## Seed scope

Preferred stage data:

- teams, competitions, seasons, and reference entities;
- official World Cup schedule and venues;
- FIFA/Elo/history source data;
- signal snapshots;
- development-only prediction versions;
- test profiles/roles/entitlements where needed.

Do not copy:

- production users or sessions;
- Wompi transactions/webhooks;
- production entitlements/subscriptions;
- secrets or personal data.

## Task 3B exit gate

- stage migration chain understood and synchronized;
- migration 0038 applied in stage;
- idempotent import proven;
- signal snapshots persisted;
- development predictions immutable;
- public/admin RLS behavior validated;
- Spanish localization and official venues validated;
- no production write occurred;
- artifacts and evidence captured.

## V2 product validation

Validate separately:

- probability parity/regression;
- scenario family quality;
- supporting/contradicting evidence;
- missing-signal honesty;
- cutoff/provenance;
- free/premium/admin projection boundaries;
- historical scenario evaluation;
- mobile/basic UI usability.

## Promotion gate

PR #106 remains Draft until Task 3B passes.

A later production promotion requires:

- accepted stage data/schema state;
- chosen probability release mode;
- clear migration/rollback plan;
- current-fixture review;
- no regression to MVP1 Auth/Wompi/entitlements/public results;
- owner approval.
