# Prediction Intelligence v2 - Integration, Stage, and Release Plan

_Last refreshed: 2026-06-26 after the Task 1C Matchday 3 fixture-linkage checkpoint._

## Environment decision

The development environment is:

```text
stage.ufopredictor.com -> Railway development -> Supabase stage yfmklapgjrupctgxaako
```

Production is:

```text
ufopredictor.com -> Railway production -> Supabase gcpdffkgsdomzyoenalg
```

Canonical local stage variables live only in:

```text
.env.stage.local
```

Do not create another environment, revive the abandoned Docker path, or restore task-specific active stage env files.

## Current branch state

```text
production base: e771de3c39c480f05d026075e5e553fb75207468
integration branch: integration/prediction-intelligence-v2
Draft PR: #114
reviewed checkpoint HEAD: dba63d8cc3d6d9235295abb4fe8834db44caf519
old source branch: feature/prediction-intelligence-v2-data-foundation
old Draft PR: #106
```

Verify the actual integration HEAD and worktree before implementation.

## Phase 0 - integration normalization

Status: `Complete`

Completed:

- preserved old branch and PR #106;
- created integration branch from the production baseline;
- selectively integrated Task 1, 1.1, 1.2, Task 2, and Task 3A concerns;
- restored historical evidence with non-current eligibility flags;
- protected MVP1 behavior;
- enforced local-run output boundaries;
- proved no useful old-branch implementation remains.

## Phase 1 - stage audit and schema synchronization

Status: `Complete for the current foundation`

Completed:

- explicit stage identity and production denial;
- migration and schema inspection;
- stage Auth preservation assessment;
- manual application of the canonical 46-migration foundation chain where CLI behavior was unreliable;
- migration 0038 applied to stage only;
- no production migration or write.

The prior migration history remains externally verified because the service-role PostgREST path cannot query `supabase_migrations`.

A later Task 1C RPC migration, version `20260626220000`, was applied manually in the stage SQL Editor. It is operational, but migration-history repair for that version remains pending and non-blocking.

## Phase 2 - Task 3B foundation bootstrap

Status: `Complete`

Completed:

- stage-only importer and tests;
- prepared snapshot checksum validation;
- deterministic aliases and localization handling;
- competition, season, teams, venues, runtime matches, ratings, history, schedule, and venue reference import;
- zero conflicts and balanced accounting;
- first apply success;
- second apply with zero inserts and zero updates;
- Auth and admin preservation;
- public/admin smoke checks;
- production denial.

Current source cutoff:

```text
2026-06-20
```

## Phase 3 - Stage V1 Visible Predictions Slice

Status: `In progress`

Goal: establish the exact immutable V1 baseline in stage before V2 comparison.

Completed fixture-linkage subblock:

- exact Matchday 3 dry-run and 24-fixture allowlist;
- trusted API-Football identity verification;
- atomic service-role-only RPC installation;
- 24-row stage apply;
- exact 24-row post-state verification;
- zero production writes.

Accepted result:

```text
RPC requestedCount = 24
RPC updatedCount = 24
verified external_id matches = 24
verified intake_source matches = 24
```

Remaining work:

1. locate and freeze the complete original V1 baseline from committed safe artifacts or strict read-only production queries;
2. import one canonical V1 model version;
3. map 24 original V1 prediction versions to the already linked stage matches;
4. import 240 required prediction-market rows and only frozen source child records;
5. activate V1 in stage;
6. verify `/predictions`, match detail, and admin surfaces;
7. rerun and prove zero growth;
8. preserve Auth/admin and production read-only/no-write boundaries.

Do not repeat fixture linkage.

Do not recompute historical V1 probabilities, markets, timestamps, or narratives with current data.

Production access, if needed as a source, is read-only and exact-scope only.

## Phase 4 - current football data refresh

Status: `Planned immediately after V1 visibility`

Refresh and register:

- current API-Football fixture identity, kickoff, and status;
- recent verified results;
- current Elo timeline and cutoff;
- latest available FIFA ranking snapshot;
- group standings, points, goals, and goal difference;
- current tournament form;
- opponent quality;
- source manifests, hashes, provenance, and reliability.

Every candidate signal preserves a pre-kickoff cutoff.

The refresh must be repeatable and idempotent. Stage should not require another foundation bootstrap for every new data update.

## Phase 5 - V2 candidates and fair comparison

Generate only after V1 and current-data gates pass.

Required states:

```text
original stored/published V1 baseline
v1 probabilities + V2 analysis
bounded/gated V2 probabilities + V2 analysis
```

For completed fixtures:

```text
original V1 publication
vs V2 historical_replay
vs verified result
```

For future fixtures, candidates use the same explicit evidence cutoff.

Evaluation must separate:

- probability quality;
- scenario-family quality;
- explanation and evidence quality;
- football variance;
- data availability and reliability.

## V2.0 Tournament Candidate gate

A V2.0 candidate requires:

- current stage data and provenance;
- no post-kickoff leakage;
- stable fixture identity;
- deterministic and idempotent execution;
- acceptable V1 parity or better probability performance;
- bounded movements;
- useful evidence and scenario explanations;
- RLS and public-safe projection validation;
- Auth, Wompi, and entitlement regression protection;
- compatible Torneo export;
- owner approval and rollback plan.

Possible release modes:

```text
v1 probabilities + V2 analysis
```

or:

```text
gated V2 probabilities + V2 analysis
```

The first mode may release the explanation layer before a probability superiority claim is justified.

## V2.1 and later context

After a stable V2.0 candidate, add bounded increments for:

- knockout qualification probability separate from 90-minute result;
- extra time and penalties;
- knockout-specific caution and changing risk through the match;
- richer standings and bracket context;
- squad, lineup, injury, suspension, and player-impact signals;
- top scorers and team offensive dependency.

Do not block V2.0 on full player intelligence or complete multilingual rollout.

## Parallel product delivery

A separate owner may work on the expert product experience while the primary owner continues data and model work.

That work should:

- branch from current `main` when production-safe;
- improve use of existing V1 information without changing probabilities;
- support missing data gracefully;
- prepare locale-neutral contracts and ES/EN/PT rendering;
- merge normally to `main` and then flow into the integration branch through Git history.

It must not duplicate stage data pipelines or V2 model implementation.

## Production promotion gate

Production promotion requires:

- accepted stage schema and data state;
- visible V1 baseline and fair comparison evidence;
- chosen release mode;
- immutable version and cutoff proof;
- no regression to MVP1 commercial or operational flows;
- partner export compatibility;
- explicit owner approval.
