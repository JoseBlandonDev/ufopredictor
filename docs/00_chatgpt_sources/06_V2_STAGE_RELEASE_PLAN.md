# Prediction Intelligence v2 - Integration, Stage, and Release Plan

_Last refreshed: 2026-06-25 after Task 3A completion and final M2-01 implementation checkpoint approval._

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
integration head: 0db9ac8867eae344e56237ac028cc32255ff1a3d
old source branch: feature/prediction-intelligence-v2-data-foundation
old Draft PR: #106
```

Migration 0038 is committed but unapplied.

## Phase 0 - normalization status

Completed:

- preserved old branch and PR #106 unchanged;
- created integration branch from the current production baseline;
- opened replacement Draft PR #114;
- selectively ported Task 1, Task 1.1, and Task 1.2;
- selectively ported Task 2A, Task 2B, Task 2C, and Task 2D;
- enforced strict runner-specific local-run output boundaries;
- selectively normalized Task 3A as a local-only planner/dry-run;
- restored dated artifacts with preservation manifests;
- kept historical candidates, commands, plans, and decisions non-current and non-authorizing;
- validated bounded slices against protected MVP1 behavior;
- passed the accumulated Task 2 checkpoint and final M2-01 implementation checkpoint.

Final Phase 0 verdict:

```text
M2_01_IMPLEMENTATION_CHECKPOINT_READY
```

No useful implementation remains to be ported from the old branch. The old branch's final documentation handoff and broad Supabase-local support files remain intentionally excluded.
## Phase 0A - Task 3A planner and dry-run

Status: `Complete`

Integrated commit:

```text
0db9ac8 feat: add local-only prediction intelligence v2 task3a planner
```

Delivered concerns:

- explicit local-only target/environment guard;
- ordered migration plan;
- idempotent source/history import plan;
- current-cutoff release review;
- signal snapshot persistence plan;
- immutable development/replay publication plan;
- Torneo Mundialista export dry-run;
- explicit production, stage, remote, migration, import, persistence, publication, and partner-delivery denial;
- focused tests and historical preservation evidence.

Task 3A uses no `.env`, credentials, Supabase client, remote schema inspection, live API-Football read, network request, migration apply, remote import, prediction publication, stage write, or production write.

M2-01 implementation is complete. PR #114 remains Draft pending documentation refresh, review, and later stage evidence.
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
