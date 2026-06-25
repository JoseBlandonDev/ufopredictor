# Prediction Intelligence v2 - Integration, Stage, and Release Plan

_Last refreshed: 2026-06-24 after Task 2 normalization and checkpoint approval._

## Environment decision

The development environment already exists:

```text
stage.ufopredictor.com -> Railway development -> Supabase stage
```

Auth registration/login works. Do not create another environment or revive the abandoned Docker path.

## Current branch state

```text
production main: e771de3c39c480f05d026075e5e553fb75207468
integration branch: integration/prediction-intelligence-v2
Draft PR: #114
integration head: 1b746f9d038ecfbd49068ecacf8d39c62d4a5fc9
old source branch: feature/prediction-intelligence-v2-data-foundation
old Draft PR: #106
```

Migration 0038 is committed but unapplied.

## Phase 0 - normalization status

Completed:

- preserved old branch and PR #106 unchanged;
- created integration branch from current production baseline;
- opened replacement Draft PR #114;
- selectively ported Task 1, Task 1.1, and Task 1.2;
- selectively ported Task 2A, Task 2B, Task 2C, and Task 2D;
- restored dated artifacts with preservation manifests;
- kept historical candidates and decisions non-current;
- validated bounded slices against protected MVP1 behavior;
- enforced strict runner-specific local-run output boundaries;
- passed the accumulated Task 2 checkpoint.

Remaining Phase 0 implementation:

```text
Task 3A source: 6967fd6b22a49e23ab9963345f1a1437b1d6b668
```

The old branch's final documentation handoff is not an implementation slice and should not be ported.

## Phase 0A - Task 3A planner and dry-run

Task 3A must remain local-only and no-write.

Expected concerns:

- explicit safe-target authorization guard;
- ordered migration plan;
- idempotent source/history import plan;
- signal snapshot persistence plan;
- immutable development/replay publication plan;
- Torneo Mundialista export dry-run;
- production-write denial;
- focused tests and preservation evidence where applicable.

Task 3A does not:

- inspect stage with credentials unless explicitly separated into a later read-only audit;
- apply migration 0038;
- import data remotely;
- create stage prediction versions;
- publish anything;
- touch production.

After Task 3A, run an M2-01 checkpoint before changing PR #114 from Draft status.

## Phase 1 - mandatory read-only stage audit

Only after Task 3A checkpoint:

1. validate ignored stage credentials without printing values;
2. prove the target is stage, not production;
3. inspect remote migration history and schema;
4. compare stage with `supabase/migrations`;
5. identify drift, manually created objects, views, functions, policies, and dependencies;
6. confirm existing stage Auth users will not be deleted or corrupted;
7. confirm source manifests and committed equivalents;
8. generate an ordered non-destructive synchronization plan;
9. stop for owner review.

No remote write is allowed in Phase 1.

## Phase 2 - authorized stage synchronization

Only after owner approval:

1. reconcile stage migration history/schema using the approved plan;
2. apply the approved missing canonical chain;
3. apply `0038_prediction_intelligence_v2_data_foundation.sql` in stage;
4. load non-sensitive reference/history data idempotently;
5. rerun and prove zero duplicates;
6. persist signal snapshots with cutoff and provenance;
7. validate RLS, public-safe views, canonical aliases, localizations, and venues;
8. create immutable development prediction versions only for eligible not-started fixtures;
9. create approved `historical_replay` versions for selected finished fixtures;
10. generate a development Torneo JSON export without altering `torneo-ufo-export-v1` production behavior.

Do not copy:

- production users or sessions;
- Wompi transactions or webhook payloads;
- production entitlements/subscriptions;
- secrets or personal data.

## Phase 3 - current-data freshness

Historical restoration is not current-data readiness.

Before current v2 candidates, refresh and register:

- current Elo timeline and cutoffs;
- latest available official FIFA ranking snapshot;
- recent verified results and match facts;
- official schedule and provider linkage;
- group standings and goal difference;
- qualification/elimination pressure;
- current tournament form;
- source manifests, hashes, provenance, and reliability metadata.

Every signal must preserve a pre-kickoff evidence cutoff.

## Phase 4 - current candidate generation and fair comparison

Generate current stage candidates only after schema, data, and freshness gates pass.

Required comparison states:

```text
stored/published v1 baseline
v1 probabilities + v2 analysis
gated v2 probabilities + v2 analysis
```

For finished fixtures:

```text
original immutable v1 publication
vs fair v2 historical_replay
vs verified result
```

For future fixtures, every compared candidate must use the same explicit cutoff and source state.

## v2.0 Tournament Candidate gate

A v2.0 candidate requires:

- current stage data and provenance;
- no post-kickoff leakage;
- stable fixture identity;
- deterministic and idempotent execution;
- acceptable v1 parity or better performance;
- bounded probability movements;
- reliable evidence/scenario output;
- RLS and public-safe projection validation;
- Auth/Wompi/entitlement regression protection;
- compatible Torneo export;
- owner approval and rollback plan.

Possible release modes:

```text
v1 probabilities + v2 analysis
```

or:

```text
gated v2 probabilities + v2 analysis
```

## v2.1 Knockout Context

After a stable v2.0 candidate, add:

- qualification and bracket path;
- group outcome context;
- neutral venue and elimination stakes;
- knockout-specific reliability controls;
- representative scenario explanations suitable for elimination football.

Do not bundle lineups, player props, market odds, or full news automation into v2.1.

## Production promotion gate

A later production promotion requires:

- PR #114 normalization complete and reviewed;
- stage schema/data state accepted;
- current candidate evidence captured;
- chosen release mode;
- immutable version/cutoff proof;
- no regression to MVP1 Auth, Wompi, entitlements, result operations, or public lifecycle;
- partner export compatibility;
- explicit owner approval.

## Parallel delivery rule

While v2 remains in Draft/stage:

- `main` continues relevant fixture/result operations;
- current v1 publications remain live and immutable;
- trusted result auto-refresh continues independently;
- bounded UI/UX improvements may use short branches from `main`;
- no independent task may consume unfinished migration 0038 contracts unless explicitly part of v2 stage work.
