# Current Project Status - UFO Predictor

_Last refreshed: post PR #99 Data Ops 06 / PR #98 Prediction Review Gate / PR #97 reproducible signal refresh (2026-06-19)._

## Executive status

UFO Predictor is operational in production as a public prediction, premium analysis, payment, and partner-export product.

The current baseline includes:

- public predictions and verified history;
- premium model detail;
- Wompi production checkout;
- approved-webhook entitlement activation;
- admin pricing controls;
- focused fixture/result/evaluation queues;
- reproducible national-team signals;
- Prediction Review Gate;
- complete Matchday 2 coverage;
- Torneo Mundialista JSON delivery.

## Recent completed milestones

### PR #97 — reproducible signal refresh

- tracked 2026-06-19 source snapshot;
- deterministic SIGNAL04 builder reconstruction;
- generator and idempotence check;
- validated FIFA/Elo/recent-form inputs;
- no change to expected-goals, DRAW01, Poisson, or model weights.

### PR #98 — Prediction Review Gate

- production migration applied;
- four review tables with RLS;
- API-Football revalidation;
- shadow prediction generation;
- refresh and Elo alerts;
- human decision audit;
- immutable publication lineage.

AI is not connected. Reviewed-xG remains preview-only.

### PR #99 — Data Ops 06 / Matchday 2

- 24/24 Group Stage - 2 fixtures;
- 5 fixtures frozen;
- 3 future fixtures regenerated;
- 6 V2 internal predictions published;
- 9 new immutable public versions;
- idempotence passed;
- final JSON delivered to Torneo.

## Torneo export state

Final Matchday 2 artifact:

- `torneo-ufo-export-v1`;
- 24 fixtures;
- 24 unique IDs;
- production URLs only;
- complete BTTS and O/U 2.5;
- no private/admin payloads.

TM01 is done and operational.

## Model status

Model calibration remains closed through PR #94.

Fair stored metrics:

- 1X2: 16/28;
- exact: 7/28;
- BTTS: 16/27;
- O/U 2.5: 16/28;
- average total-goal error: 1.821.

The V2 signal refresh updated reproducible inputs, not model formulas.

## Epic G status

- G01 Auth: done.
- G02 config readiness: done.
- G03 production smoke: partial/open.
- G04 pricing/catalog: operational MVP, polish open.
- G05 Wompi: production live.
- G06 entitlements: done.
- G07 premium active experience: done for MVP.
- G08 trust/legal/truthful copy: partial/open.
- G09 frontend commercial readiness: planned with P0 findings.
- G10 PWA installability: planned.
- G11 offline/update safety: optional/deferred.
- G12 accessibility/performance: planned.
- G13 cross-device smoke: planned.
- G14 ownership coordination: required.

## Current risks and gaps

1. Production pricing presentation shows an inconsistent USDT/COP relationship and needs owner confirmation.
2. Home content is stale relative to current coverage.
3. Transparency copy still says calibration is active.
4. Pricing/catalog duplicates or ambiguously presents World Cup Pass.
5. Dashboard copy mixes role, plan, and entitlement state.
6. Review Gate has translation and empty/pre-shadow state issues.
7. Real Fixture Lab exact-detail remains unstable.
8. Signal refresh cadence is not defined.
9. Refund/revocation operations remain incomplete.

## Immediate next actions

1. monitor and process Matchday 2 results;
2. prepare the next fixture runway;
3. fix P0 pricing truth and home/transparency copy;
4. execute the small Review Gate UI patch;
5. complete G08/G03/refund operations;
6. run responsive/accessibility/cross-device passes;
7. define the next signal refresh trigger.
