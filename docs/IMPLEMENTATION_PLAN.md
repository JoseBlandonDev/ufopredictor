# Implementation Plan - UFO Predictor

_Last refreshed: 2026-06-22._

## Objective

Move Prediction Intelligence v2 from deterministic branch artifacts into a validated development environment, then implement the user-facing analysis experience before any production promotion.

## Completed

### Phase 1 - source normalization and durable analytical schema

- source registry/contracts;
- aliases/localizations;
- FIFA/Elo snapshots;
- historical match facts;
- official schedule and venues;
- links to product/API-Football;
- signal preview and replay interface;
- migration 0038.

### Phase 2 - replay, candidate research, and release planning

- 36/36 completed fixtures replay-ready;
- expanded historical train/validation data;
- neutral-context correction;
- bounded/high-confidence signal gates;
- exact-v1 parity adapter and drift classification;
- scenario-family evaluation;
- current fixture release review;
- Torneo candidate exports.

### Phase 3A - dry-run operational layer

- target authorization guard;
- migration/import/signal/publication plans;
- export preview;
- production denial;
- tests;
- no physical write.

## Current Phase 3B - stage synchronization

### 3B.1 Read-only audit

- verify stage target without exposing credentials;
- inspect remote migration history and schema;
- compare with repository migration chain;
- identify drift/manual objects;
- assess Auth-user preservation;
- output exact ordered plan.

### 3B.2 Authorized stage synchronization

Only after human approval:

1. apply missing canonical migrations in order;
2. apply `0038_prediction_intelligence_v2_data_foundation.sql`;
3. load non-sensitive reference/history data;
4. rerun import and prove idempotency;
5. validate row counts and RLS;
6. persist signal snapshots;
7. create immutable prediction versions for not-started fixtures;
8. generate Torneo development export;
9. validate public queries, localization, venues, and stage UI.

## Phase 4 - premium/public UX

Implement after stage data validation:

- general statistical reading;
- scenario cards;
- supporting/contradicting evidence;
- exact and family probabilities;
- current form and opponent quality;
- FIFA/Elo/attack/defense/conversion;
- reliability/source cutoff;
- additional score distribution;
- post-match scenario evaluation;
- anonymous/free/premium/admin segmentation.

No proprietary weights are exposed.

## Phase 5 - production promotion

- production target authorization;
- backup/rollback plan;
- migration/import dry-run;
- production migration and seed;
- immutable publication;
- smoke across roles and payments;
- Torneo production export;
- documentation and PR.

## Phase 6 - v3 research

Potential after larger clean sample:

- stronger current-tournament weighting;
- UFO Effective Strength ranking;
- round-aware form changes;
- team conversion/finishing persistence;
- under/overvaluation detection;
- event-timeline path evaluation;
- market-odds snapshots for public-safe value analysis.

V3 requires explicit acceptance criteria and must not rewrite v2 history.
