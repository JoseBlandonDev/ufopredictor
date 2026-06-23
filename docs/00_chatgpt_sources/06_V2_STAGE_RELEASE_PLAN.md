# Prediction Intelligence v2 - Integration, Stage, and Release Plan

_Last refreshed: 2026-06-23._

## Environment decision

The development environment already exists:

```text
stage.ufopredictor.com -> Railway development -> Supabase stage
```

Auth registration/login works. Do not create another environment or revive the abandoned Docker path.

## Phase 0 - branch normalization

Task 3B must not begin from the stale v2 branch.

1. Merge the current documentation refresh.
2. Fetch current `origin/main` and prove a clean worktree.
3. Preserve `feature/prediction-intelligence-v2-data-foundation` and Draft PR #106 unchanged.
4. Create `integration/prediction-intelligence-v2` from current `origin/main`.
5. Inventory the nine v2-only commits.
6. Classify each changed file as:
   - data/contracts/parsers;
   - model/replay/calibration;
   - migration/types;
   - tests/scripts/artifacts;
   - stale frontend/docs/shared runtime.
7. Selectively port only the valid v2 concerns.
8. Run current MVP1 tests, lint, and build after each bounded group.
9. Open a replacement Draft PR.
10. Mark #106 superseded only after preservation parity is proven.

No production behavior should regress during normalization.

## Worktree layout

Recommended local layout:

```text
D:\Projects\ufo-predictor       -> main / production operations
D:\Projects\ufo-predictor-v2    -> integration/prediction-intelligence-v2
D:\Projects\ufo-predictor-ui    -> independent MVP1 UI/UX microrelease
```

Each worktree has its own ignored `.env.local`. Never copy production secrets into documentation or prompts.

## Task 3B objective

Synchronize the existing Supabase stage project with the canonical repository schema and Prediction Intelligence v2 data safely, without touching production.

## Phase 1 - mandatory read-only stage audit

1. Validate ignored stage credentials without printing values.
2. Confirm the target is stage, not production.
3. Inspect remote migration history and schema.
4. Compare with `supabase/migrations`.
5. Identify missing migrations, drift, manually created objects, views, functions, policies, and dependencies.
6. Confirm the existing stage Auth user will not be deleted or corrupted.
7. Confirm the source snapshot path/manifest and committed equivalents.
8. Generate an ordered synchronization plan.
9. Stop for human review.

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
11. Compare v1 and v2 output on the same fixture/version cutoffs.

## Seed scope

Preferred stage data:

- teams, competitions, seasons, and reference entities;
- official World Cup schedule and venues;
- provider fixture links for remaining group-stage matches;
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

- normalized integration branch based on current `main`;
- old v2 work preservation proof captured;
- stage migration chain understood and synchronized;
- migration 0038 applied in stage;
- idempotent import proven;
- signal snapshots persisted;
- development predictions immutable;
- public/admin RLS behavior validated;
- Spanish localization and official venues validated;
- v1/v2 comparison captured;
- no production write occurred;
- artifacts and evidence captured.

## Production promotion gate

A later production promotion requires:

- accepted stage data/schema state;
- chosen probability release mode;
- current-fixture review;
- immutable version/cutoff proof;
- rollback plan;
- no regression to MVP1 Auth/Wompi/entitlements/public results;
- owner approval.

## Parallel delivery rule

While v2 is in stage:

- `main` continues production fixture/result work;
- independent UI/UX improvements use short branches from `main`;
- stable-contract ops automation may proceed separately;
- English internationalization waits until v2 is stable and merged;
- no UI microrelease should depend on migration 0038 unless explicitly part of the v2 stage PR.
