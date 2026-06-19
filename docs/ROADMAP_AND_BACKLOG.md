# Roadmap and Backlog - UFO Predictor

_Last refreshed: post PR #99 Data Ops 06 and frontend visual audit (2026-06-19)._

## Completed

### Public and premium product

- public prediction list/detail;
- verified results;
- bounded recent results;
- paginated history/upcoming routes;
- premium xG, scorelines, BTTS, O/U, confidence/risk;
- registered-free score gate.

### Operations

- Result Review Queue;
- Evaluation Queue;
- Real Fixture Publish Queue;
- exact API-Football workflow;
- Matchday 2 batch and idempotence.

### Model/data

- PR #94 model closeout;
- PR #97 reproducible signal refresh;
- 2026-06-19 source snapshot and generator.

### Review and partner integration

- PR #98 Prediction Review Gate;
- TM01 admin export;
- PR #99 final 24-fixture Matchday 2 JSON;
- JSON delivered to Torneo.

### Monetization

- Wompi production payment;
- G06 entitlement activation;
- G07 premium active experience;
- admin pricing controls.

## Immediate backlog

### Data operations

- Matchday 2 final-result monitoring;
- evaluation persistence;
- next fixture runway.

### G04 pricing/catalog P0

Acceptance:

- owner-confirmed final price;
- consistent COP and USDT;
- checkout matches DB;
- no duplicate World Cup Pass;
- clear active vs future products.

### G08 trust/truthful copy

Acceptance:

- model calibration closed;
- signals can refresh;
- no-betting/no-guarantee;
- purchase/refund expectations;
- consistent pricing/footer/return/transparency copy.

### G09 frontend commercial readiness

See dedicated plan.

Key items:

- dynamic home;
- Spanish display consistency;
- dashboard access clarity;
- Review Gate polish;
- compact admin empty states;
- responsive pass.

### G03/G13 production smoke

Formal device/role/flow matrix.

### Refund/revocation operations

Document and test manual support path.

## Planned/deferred

- G10 PWA installability.
- G11 safe update/offline strategy.
- G12 accessibility/performance.
- Review Gate AI.
- reviewed-xG publication.
- Real Fixture Lab exact-detail.
- venue metadata.
- future xG research.
- signal refresh scheduling.

## Guardrails

No public `prediction_results`, no provider odds/predictions as hidden model inputs, no Torneo human-pick input, no post-result rewrites, no client payment secrets, and no unreviewed broad fixture writes.
