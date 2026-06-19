# ChatGPT Project Source - UFO Predictor Current

_Last refreshed: post PR #99 Data Ops 06 / PR #98 Prediction Review Gate / PR #97 reproducible signal refresh (2026-06-19)._

## Product summary

UFO Predictor is a probabilistic football prediction product for the 2026 World Cup. It publishes controlled public predictions, preserves immutable historical predictions, verifies final results, keeps internal evaluation private, and offers premium public-safe model detail.

It does not receive bets and does not guarantee outcomes.

## Current production baseline

Implemented and operational:

- public prediction list and match detail;
- bounded recent results and paginated history;
- public verified final results;
- protected premium model detail;
- registered-free probable-score gating;
- Wompi production checkout and approved-webhook activation;
- G06 entitlement materialization;
- premium-active UI;
- admin pricing controls;
- Result Review Queue;
- Evaluation Queue;
- Real Fixture Publish Queue;
- Prediction Review Gate;
- Torneo Mundialista admin export.

Real Fixture Lab exact-detail remains a separate stack-overflow follow-up.

## Accepted model state

PR #94 remains the model closeout:

- SIGNAL04 retained;
- DRAW01 retained;
- `expected-goals.ts` unchanged;
- Cabo Verde alias handling retained;
- rejected signal and xG candidates remain closed.

Fair stored baseline:

- raw evaluation rows: 31;
- unique fixtures: 28;
- 1X2: 16/28;
- exact score: 7/28;
- BTTS: 16/27;
- O/U 2.5: 16/28;
- average total-goal error: 1.821.

Current-signal recomputations over finished fixtures are diagnostic only.

## Signal refresh V2

PR #97 established the 2026-06-19 reproducible national-team signal snapshot.

The runtime pack is generated deterministically from validated source data and checked for idempotence. It preserves the accepted model formulas and does not import raw source files at runtime.

The signal baseline is operational. The future refresh cadence remains open.

## Prediction Review Gate

PR #98 added:

- production migration with four admin-only review tables;
- RLS;
- API-Football temporal revalidation;
- deterministic shadow predictions;
- refresh and Elo-coherence alerts;
- auditable human decisions;
- immutable reviewed publication lineage.

Validated production example:

- Netherlands vs Sweden shadow generated;
- no material model delta;
- Elo gap at WATCH level;
- `KEEP_CURRENT` human decision stored.

AI is unavailable until a concrete supported provider key is configured. Reviewed-xG is preview-only.

## Data Ops 06 / Matchday 2

PR #99 completed Group Stage - 2:

- API-Football count: 24;
- database count: 24 before and after;
- no ingest required;
- 5 fixtures frozen;
- 3 future fixtures regenerated;
- 10 existing V2-current public predictions reused;
- 6 V2 internal predictions published;
- 9 new immutable public versions created;
- idempotence verified.

## Torneo Mundialista export

TM01 is done and operational.

Final delivered file:

- contract: `torneo-ufo-export-v1`;
- 24 fixtures;
- 24 unique fixture IDs;
- 0 localhost URLs;
- 0 null BTTS objects;
- 0 null O/U 2.5 objects;
- source origin: `https://ufopredictor.com`.

The final Matchday 2 JSON was sent to Torneo Mundialista.

## Payment and Epic G state

- G01 Auth: done.
- G02 environment/config baseline: done.
- G03 formal production smoke: partial/open.
- G04 pricing/catalog MVP: operational, polish open.
- G05 Wompi production payment: done.
- G06 entitlement activation: done.
- G07 premium active experience: done for MVP.
- G08 trust/legal/truthful copy: partial, final pass open.
- G09 frontend commercial readiness: planned with concrete findings.
- G10 PWA installability: planned.
- G11 offline/update safety: optional/deferred unless safe.
- G12 accessibility/performance: planned.
- G13 cross-device production smoke: planned.
- G14 ownership/coordination: required for parallel work.

## Frontend findings to carry forward

Highest priority:

- pricing currently shows an inconsistent USDT/COP relationship and must be verified against DB/checkout;
- home content is stale and still highlights the opening match;
- transparency copy says calibration is active although model calibration is closed;
- pricing/catalog duplicates or ambiguously presents World Cup Pass;
- dashboard copy mixes admin role, free plan, and entitlement state.

See `G09_FRONTEND_COMMERCIAL_READINESS_PLAN.md`.

## Immediate next work

1. monitor and process Matchday 2 final results;
2. prepare the next fixture batch;
3. execute the small Review Gate UI patch;
4. fix P0 commercial frontend inconsistencies;
5. complete G08/G03/refund operations;
6. define the next signal refresh trigger.

Prefer console for repetitive API reads and batch operations. Use Codex for architecture, implementation, tests, and complex review.
