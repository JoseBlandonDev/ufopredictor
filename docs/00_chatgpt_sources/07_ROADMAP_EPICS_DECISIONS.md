# Roadmap, MVP2 Epics, and Open Decisions

_Last refreshed: 2026-06-24._

## MVP2 objective

MVP2 is the shortest safe path from the sellable MVP1 to a product with:

- first-party normalized football history/reference data;
- reliable tournament operations;
- explainable evidence/scenario output;
- reproducible v1/v2 comparison;
- immutable prediction versions;
- tournament and qualification context;
- lower manual operational burden;
- ES/EN/PT-ready contracts;
- continued production delivery during research.

The central product epic is Prediction Intelligence v2, not a frontend rewrite.

## Current status summary

```text
M2-01  Next core task / ready to start
M2-02  Done
M2-03  Ready after M2-01 normalization
M2-04  Planned after stage data path
M2-05  Partially delivered and operational
M2-06  Parallel, bounded microreleases
M2-07  Contract design active; public rollout later
M2-08  Later
```

## P0 - immediate

### Epic M2-01 - Prediction Intelligence v2 integration normalization

Status: `Ready`

- preserve old v2 branch and Draft PR #106;
- create integration branch from current `main`;
- selectively port nine v2-only commits;
- use separate worktrees where useful;
- open replacement Draft PR;
- prevent regression to current MVP1;
- preserve exact commit/file mapping and exclusions.

### Epic M2-02 - World Cup group-stage coverage and publication continuity

Status: `Done`

Delivered:

- bounded fixture registry flow in PR #111;
- 72 canonical group-stage fixtures recognized;
- 24/24 Matchday 3 fixtures stored;
- 20 new Matchday 3 fixtures created in four exact batches;
- dry-run/apply/idempotency evidence;
- 24/24 Matchday 3 v1 predictions published;
- publish queue cleared;
- Torneo JSON export with 24 unique fixtures.

Future fixture coverage continues as routine operations, not unfinished M2-02 scope.

### Epic M2-03 - stage data foundation and Task 3B

Status: `Ready after M2-01`

- read-only stage audit;
- migration reconciliation;
- migration 0038 in stage;
- idempotent source/history import;
- signal snapshots;
- immutable development and replay versions;
- RLS/localization/venue validation.

### Epic M2-04 - model integration and release decision

Status: `Planned`

- restore v2 replay/challenger tooling on current `main`;
- compare v1 and gated v2 under identical cutoffs;
- validate tournament-current signals;
- validate scenario families, evidence, contradictions, and reliability;
- choose v1 probability + v2 analysis or gated v2 + v2 analysis;
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

- automatic selection of relevant recent pending fixtures;
- scheduler around match windows;
- retry/backoff for transient provider absence;
- run notifications;
- persistent reconciliation workflow;
- operational metrics;
- recurring signal refresh after v2 stage stabilization.

Human verification is not mandatory for normal trusted-provider finals. It remains available for exceptions and reconciliation.

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

Spanish remains current production. English and Portuguese are both first-class targets.

### Epic M2-08 - commercial platform abstraction

Status: `Later`

- provider-neutral payment event/entitlement adapter;
- evaluate PayPal Business;
- define refund/revocation/reconciliation;
- preserve Wompi as current production provider.

This is not an immediate v2 blocker.

## Immediate tournament intelligence scope

Promoted into MVP2:

- World Cup form from current tournament matches;
- group position;
- points and goal-difference context;
- qualification/elimination pressure;
- win/draw/loss need scenarios;
- reliability controls for small tournament samples;
- opponent quality;
- supporting and contradicting evidence.

Final-group qualification pressure is no longer a distant v3-only idea.

## Later radar

- confirmed lineups and major player absences;
- injuries, suspensions, and rotation;
- rest/travel and tactical context;
- player/scorer propositions;
- timestamped news evidence;
- market odds after legal/product review;
- French and German localization;
- larger holdout and stricter accuracy acceptance gates.

## Decisions already made

- MVP1 remains live during v2 work;
- production and stage remain separate;
- no new Docker dependency;
- no new stage environment;
- old v2 branch is preserved, not used as the new base;
- Task 3B starts read-only;
- production writes denied during Task 3B audit;
- v2 probability is near parity;
- v2 analysis is the main current gain;
- scenarios are representative families, not prophecy;
- predictions are immutable;
- fair finished-fixture comparison uses `historical_replay`;
- canonical identity is locale-neutral;
- core target languages are ES, EN, and PT;
- API-Football is trusted for valid exact `FT` results;
- manual result review is exception-only;
- Torneo Mundialista consumes JSON, not PDF;
- `fixtureId`/`externalId` are the partner identity keys;
- project-management spreadsheets are derived, not canonical.

## Decisions still required

- exact nine-commit port map;
- final integration branch commit composition;
- exact stage migration reconciliation after audit;
- final stage seed scope;
- v1 probability + v2 analysis versus gated-v2 probability + v2 analysis;
- final public/free/premium signal matrix;
- deterministic narrative versus optional LLM polish;
- public proprietary boundary;
- scheduler/retry notification architecture;
- legal/terms/privacy publication timing;
- second payment provider strategy.

## Exact next sequence

1. finish and merge this documentation refresh;
2. replace ChatGPT project sources with the exact refreshed 10-file set;
3. create `integration/prediction-intelligence-v2` from current `main`;
4. port v2 selectively;
5. open replacement Draft PR;
6. run Task 3B read-only stage audit;
7. synchronize stage only after approval;
8. generate fair v1/v2 comparisons;
9. decide v2.0 production mode;
10. prepare knockout-context v2.1.

## Delivery rule

Every epic must be split into bounded, deployable increments with:

- explicit branch base;
- explicit environment;
- exact write scope;
- acceptance evidence;
- rollback boundary;
- documentation update after merge.

Avoid giant cross-cutting PRs that combine model, payments, UI, migrations, operations, and documentation.
