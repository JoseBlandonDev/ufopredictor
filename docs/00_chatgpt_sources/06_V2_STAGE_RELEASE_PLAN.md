# Prediction Intelligence v2 - Integration, Stage, and Release Plan

_Last refreshed: 2026-06-24._

## Environment decision

The development environment already exists:

```text
stage.ufopredictor.com -> Railway development -> Supabase stage
```

Auth registration/login works. Do not create another environment or revive the abandoned Docker path.

## Phase 0 - branch normalization

Task 3B must not begin from the stale v2 branch.

1. Fetch current `origin/main` and prove a clean worktree.
2. Preserve `feature/prediction-intelligence-v2-data-foundation` and Draft PR #106 unchanged.
3. Create `integration/prediction-intelligence-v2` from current `origin/main`.
4. Inventory the nine v2-only commits.
5. Classify every changed file as:
   - migration/types/contracts;
   - source data/manifests/parsers;
   - model/replay/calibration;
   - scripts/artifacts/tests;
   - stale frontend/docs/shared runtime.
6. Port only valid v2 concerns.
7. Validate MVP1 tests, lint, build, and diff-check after each bounded group.
8. Open a replacement Draft PR.
9. Close or supersede PR #106 only after preservation parity is proven.

Current reference:

```text
main at last docs refresh: 130ffc8
old v2 head: eefcff7
v2-only commits: 9
```

Always verify live SHAs before implementation.

## Worktree layout

Recommended local layout:

```text
D:\Projects\ufo-predictor       -> main / production operations
D:\Projects\ufo-predictor-v2    -> integration/prediction-intelligence-v2
D:\Projects\ufo-predictor-ui    -> optional independent UI/UX microrelease
```

Each worktree has its own ignored `.env.local`.

## Task 3B objective

Synchronize the existing Supabase stage project with the canonical repository schema and Prediction Intelligence v2 data safely, without touching production.

## Phase 1 - mandatory read-only stage audit

1. Validate ignored stage credentials without printing values.
2. Confirm the target is stage, not production.
3. Inspect remote migration history and schema.
4. Compare with `supabase/migrations`.
5. Identify missing migrations, drift, manually created objects, views, functions, policies, and dependencies.
6. Confirm the stage Auth user will not be deleted or corrupted.
7. Confirm source snapshot manifests and committed equivalents.
8. Generate an ordered non-destructive synchronization plan.
9. Stop for owner review.

No remote write is allowed in Phase 1.

## Phase 2 - authorized stage synchronization

Only after approval:

1. Reconcile stage migration history/schema using the approved plan.
2. Apply the missing canonical chain.
3. Apply `0038_prediction_intelligence_v2_data_foundation.sql`.
4. Load non-sensitive reference/history data idempotently.
5. Rerun and prove zero duplicates.
6. Persist signal snapshots with cutoff/provenance.
7. Create immutable development prediction versions only for eligible not-started fixtures.
8. Create fair `historical_replay` versions for selected finished fixtures if approved.
9. Generate a development Torneo JSON export.
10. Validate RLS and public-safe projections.
11. Validate aliases, ES/EN/PT localization contracts, venues, and stage UI.
12. Compare v1 and v2 on identical fixture/version cutoffs.

## Seed scope

Preferred stage data:

- teams, competitions, seasons, and reference entities;
- official World Cup schedule and venues;
- all known group-stage provider links;
- FIFA/Elo/history source data;
- tournament-current context;
- signal snapshots;
- development-only prediction versions;
- test profiles/roles/entitlements where needed.

Do not copy:

- production users or sessions;
- Wompi transactions/webhooks;
- production entitlements/subscriptions;
- secrets or personal data.

## Accelerated tournament release sequence

### v2.0 Tournament Candidate

Goal:

- restore the prepared v2 data/model/replay stack on current `main`;
- produce stage candidates with evidence and reliability;
- compare against current v1;
- choose a safe probability mode;
- preserve every prior version.

Possible release:

```text
v1 probabilities + v2 analysis
```

or:

```text
gated v2 probabilities + v2 analysis
```

### v2.1 Knockout Context

Add tournament-state features required for knockout rounds:

- qualification/path context;
- group outcome and bracket path;
- neutral venue;
- elimination stakes;
- small-sample reliability;
- scenario explanations appropriate to knockout football.

Do not bundle lineups, player props, market odds, and full news automation into this release.

## Task 3B exit gate

- normalized integration branch based on current `main`;
- old v2 preservation proof captured;
- stage migration chain understood and synchronized;
- migration 0038 applied in stage;
- idempotent import proven;
- signal snapshots persisted;
- development predictions immutable;
- fair replay contract validated where used;
- public/admin RLS validated;
- ES/EN/PT-ready localization contracts validated;
- official venues and canonical aliases validated;
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
- compatible Torneo export;
- owner approval.

## Parallel delivery rule

While v2 is in stage:

- `main` continues relevant fixture/result operations;
- current v1 publications remain live;
- trusted result auto-refresh may continue independently;
- bounded UI/UX improvements may use short branches from `main`;
- ES/EN/PT data contracts may be prepared, while full public translation rollout waits for stable contracts;
- no UI microrelease depends on migration 0038 unless explicitly part of v2 stage work.
