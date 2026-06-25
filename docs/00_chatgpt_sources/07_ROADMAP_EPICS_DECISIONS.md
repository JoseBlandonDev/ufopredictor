# Roadmap, MVP2 Epics, and Open Decisions

_Last refreshed: 2026-06-25 after Task 3A completion and final M2-01 implementation checkpoint approval._

## MVP2 objective

MVP2 is the shortest safe path from the sellable MVP1 to a product with:

- normalized football history/reference data;
- reliable tournament operations;
- explainable evidence and scenario output;
- reproducible v1/v2 comparison;
- immutable prediction versions;
- tournament and qualification context;
- lower manual operational burden;
- ES/EN/PT-ready contracts;
- continued production delivery during research.

The central product epic is Prediction Intelligence v2, not a frontend rewrite.

## Current status summary

```text
M2-01  Implementation Complete - final checkpoint approved
M2-02  Done
M2-03  Ready for Task 3B read-only stage audit
M2-04  Planned after stage data/freshness path
M2-05  Partially delivered and operational
M2-06  Parallel, bounded microreleases
M2-07  Contract design active; public rollout later
M2-08  Later
```

## P0 - immediate

### Epic M2-01 - Prediction Intelligence v2 integration normalization

Status: `Implementation Complete`

Delivered:

- preserved old v2 branch and Draft PR #106;
- created `integration/prediction-intelligence-v2` from the current production baseline;
- opened replacement Draft PR #114;
- selectively ported Task 1, 1.1, and 1.2;
- selectively ported Task 2A, 2B, 2C, and 2D;
- restored historical artifacts and preservation manifests;
- passed the accumulated Task 2 checkpoint;
- enforced strict local-run-only output containment for Task 2 runners;
- selectively normalized Task 3A as a local-only planner/dry-run;
- preserved Task 3A historical artifacts byte-for-byte with explicit non-authorization flags;
- passed the final M2-01 implementation checkpoint;
- proved no useful old-branch implementation concern remains unaccounted for;
- preserved MVP1 runtime, production operations, Auth, Wompi, entitlements, immutable v1 publications, and partner export behavior.

Checkpoint verdict:

```text
M2_01_IMPLEMENTATION_CHECKPOINT_READY
```

M2-01 implementation completion does not mean merged, production-live, or release-approved. Draft PR #114 remains open and Draft. The old branch and PR #106 remain historical evidence only.

### Epic M2-02 - World Cup group-stage coverage and publication continuity

Status: `Done`

Delivered:

- bounded fixture registry flow in PR #111;
- 72 canonical group-stage fixtures recognized;
- 24/24 Matchday 3 fixtures stored;
- 24/24 Matchday 3 v1 predictions published;
- dry-run/apply/idempotency evidence;
- publish queue cleared at the recorded milestone;
- Torneo JSON export with 24 unique fixtures.

Future fixture coverage continues as routine operations, not unfinished M2-02 scope.

### Epic M2-03 - stage data foundation and Task 3B

Status: `Ready for Task 3B read-only stage audit`

Sequence:

1. read-only stage audit;
2. migration/schema reconciliation plan;
3. owner approval;
4. migration 0038 in stage;
5. idempotent source/history import;
6. second-run zero-duplicate proof;
7. signal snapshots;
8. immutable development/replay versions;
9. RLS, localization, venue, and public-safe projection validation.

No write is allowed during the initial audit. No production write belongs to M2-03.

### Epic M2-04 - current model integration and release decision

Status: `Planned`

- refresh current Elo, FIFA, results, schedule, standings, and tournament context;
- generate current stage candidates under explicit cutoffs;
- compare v1 and gated v2 fairly;
- validate tournament-current signals;
- validate scenario families, evidence, contradictions, and reliability;
- choose v1 probability + v2 analysis or gated-v2 probability + v2 analysis;
- promote only after stage exit gates;
- prepare v2.0 Tournament Candidate and v2.1 Knockout Context.

## P1 - parallel and near-term

### Epic M2-05 - operations efficiency and automation

Status: `Partially Done`

Delivered:

- bounded fixture registry;
- exact allowlist apply;
- trusted result refresh in PR #112;
- API-Football `FT` auto-verification;
- idempotent result/evaluation persistence;
- exception-oriented review;
- real apply and idempotency proof.

Remaining:

- automatic selection of recent pending fixtures;
- scheduler around match windows;
- retry/backoff for transient provider absence;
- run notifications;
- persistent reconciliation workflow;
- operational metrics;
- recurring signal refresh after v2 stage stabilization.

### Epic M2-06 - independent MVP1 UI/UX microreleases

Status: `Parallel`

Possible bounded work:

- mobile/accessibility polish;
- loading/empty/error states;
- visual hierarchy and motion restraint;
- CTA/conversion measurement;
- trusted venue display;
- admin workflow ergonomics;
- copy deduplication.

These tasks must not depend on unfinished v2 analytical tables.

### Epic M2-07 - ES/EN/PT internationalization foundation

Status: `Contract design now; public rollout after stable v2 contracts`

- locale-neutral team and competition identity;
- translation-key extraction;
- ES/EN/PT copy and metadata;
- locale-aware routing/selection;
- localized fallback behavior;
- regression protection across all three core languages.

Spanish remains current production. English and Portuguese are first-class targets.

### Epic M2-08 - commercial platform abstraction

Status: `Later`

- provider-neutral payment event/entitlement adapter;
- evaluate PayPal Business or another direct provider;
- define refund/revocation/reconciliation;
- preserve Wompi as current production provider.

This is not an immediate v2 blocker.

## Immediate tournament intelligence scope

Included in MVP2:

- structural Elo and FIFA strength;
- recent form and opponent quality;
- current World Cup form;
- group position, points, and goal difference;
- qualification/elimination pressure;
- win/draw/loss need scenarios;
- small-sample reliability controls;
- supporting and contradicting evidence;
- representative scenario families;
- exact provenance and cutoff.

## Later radar

- confirmed lineups and major player absences;
- injuries, suspensions, rotation, rest, and travel;
- player/scorer propositions;
- timestamped news evidence;
- market odds after legal/product review;
- French and German localization;
- larger holdout and stricter accuracy acceptance gates.

## Decisions already made

- MVP1 remains live during v2 work;
- production and stage remain separate;
- no new Docker dependency or new stage environment;
- old v2 branch is preserved, not used as the active base;
- Task 1, Task 2, and Task 3A normalization are complete;
- M2-01 implementation checkpoint is approved;
- no more code will be ported from the old branch;
- Task 3B starts read-only;
- stage writes require explicit owner approval after the audit;
- production writes remain denied during stage work;
- historical Task 2/3A candidates, plans, and decisions are non-current;
- v2 probability evidence is near parity, not an established accuracy breakthrough;
- v2 analysis is the main current product gain under evaluation;
- scenarios are representative families, not prophecy;
- predictions are immutable;
- fair finished-fixture comparison uses `historical_replay`;
- canonical identity is locale-neutral;
- core target languages are ES, EN, and PT;
- API-Football is trusted for valid exact `FT` results;
- manual result review is exception-only;
- Torneo Mundialista consumes JSON under `torneo-ufo-export-v1`;
- project-management spreadsheets are derived, not canonical.

## Decisions still required

- exact stage migration reconciliation after read-only audit;
- approved stage seed/import scope;
- current-data freshness source set and cutoff;
- v1 probability + v2 analysis versus gated-v2 probability + v2 analysis;
- final public/free/premium signal matrix;
- deterministic narrative versus optional LLM polish;
- public proprietary boundary;
- scheduler/retry notification architecture;
- legal/terms/privacy publication timing;
- second payment-provider strategy.

## Exact next sequence

1. apply the final M2-01 documentation refresh;
2. replace the shared ChatGPT source set and start the next conversation;
3. optionally refresh the Draft PR #114 description while keeping it Draft;
4. begin M2-03 Task 3B with a read-only stage audit only;
5. produce a non-destructive stage migration/schema reconciliation plan;
6. stop for owner approval;
7. synchronize stage only after explicit approval;
8. refresh current football data and tournament context;
9. generate fair current v1/v2 comparisons;
10. decide v2.0 production mode;
11. prepare knockout-context v2.1.

## Delivery rule

Every epic must use bounded increments with:

- explicit branch base;
- explicit environment;
- exact write scope;
- acceptance evidence;
- rollback boundary;
- documentation update at meaningful checkpoints and after merge.

Avoid giant cross-cutting PRs that combine model, payments, UI, migrations, operations, and documentation.
