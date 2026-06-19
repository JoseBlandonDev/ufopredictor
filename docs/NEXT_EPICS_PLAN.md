# Next Epics Plan - UFO Predictor

_Last refreshed: post PR #99 Data Ops 06 and Torneo delivery (2026-06-19)._

## Immediate operational sequence

### 1. Matchday 2 result operations

- monitor provider status;
- verify only exact final fixtures;
- persist internal evaluation;
- keep frozen prediction history immutable.

### 2. Next fixture runway

- inventory exact upcoming round;
- dry-run;
- generate/publish only future scheduled fixtures;
- preserve idempotence;
- export only after public prediction completeness.

### 3. Small Review Gate UI patch

- missing market -> `No disponible`;
- pre-shadow -> `Sin comparación todavía`;
- translate provider/alert/risk labels;
- compact long review presentation if low risk.

## Commercial readiness sequence

### G04 pricing truth and catalog

P0:

- confirm final price;
- align COP/USDT/checkout;
- remove duplicate World Cup Pass presentation;
- separate active and future products.

### G08 trust and truthful copy

- model calibration closed vs signals refreshable;
- purchase terms;
- refund/cancellation expectations;
- no-betting/no-guarantee consistency.

### G09 frontend commercial readiness

- dynamic home content;
- Spanish presentation consistency;
- dashboard role/plan/entitlement clarity;
- compact admin empty states;
- responsive pass.

### G12/G13 launch gates

- accessibility/performance;
- anonymous/free/premium/admin cross-device smoke;
- payment/export/review routes.

## Data/model next

### Signal refresh cadence

Choose a trigger such as:

- official ranking release;
- completed matchday;
- meaningful result batch.

Do not refresh after every surprising result.

### Scoreline monitoring

Continue fair stored metrics. Open a new model experiment only with a larger clean sample and explicit acceptance criteria.

## Deferred

- Review Gate AI;
- reviewed-xG publication;
- Real Fixture Lab exact-detail;
- venue metadata;
- service-worker offline caching;
- future xG formula work.
