# Current Project Status - UFO Predictor

_Last refreshed: post PR #94 model closeout / Wompi production premium baseline / 28-fixture evaluation closeout (2026-06-19)._

## Executive status

UFO Predictor is operational as a public prediction and premium product. Public predictions, verified results, premium model detail, Wompi payment activation, automatic premium entitlement, admin payment controls, and focused fixture/result queues are implemented.

The model refresh cycle is closed. PR #94 is merged, SIGNAL04 and DRAW01 are retained, and no expected-goals formula change was accepted.

## Current product capabilities

- Public prediction list and match details.
- Public verified final results.
- Protected premium model detail.
- Registered-free probable-score gating.
- Wompi checkout/payment activation.
- Automatic premium access after verified payment.
- Premium-active UI presentation.
- Admin payment/price controls.
- Result Review Queue.
- Evaluation Queue.
- Real Fixture Publish Queue.
- Torneo Mundialista admin export.

## Model/evaluation status

- raw persisted evaluation rows: 31;
- unique evaluated World Cup fixtures: 28;
- 1X2: 16/28 (57.1%);
- exact score: 7/28 (25.0%);
- BTTS: 16/27 (59.3%);
- O/U 2.5: 16/28 (57.1%);
- average total-goal error: 1.821.

Latest evaluated results:

- Canada 6-0 Qatar;
- Mexico 1-0 South Korea.

Both operational queues are empty.

## Accepted model decisions

- Keep SIGNAL04.
- Keep DRAW01.
- Keep `expected-goals.ts` unchanged.
- Do not reopen SIGNAL04B/C/D/E or XG01A without new evidence.
- Continue fixture-level sanity review before publication/export.

## Current upcoming runway

Count: 4.

- United States vs Australia
- Scotland vs Morocco
- Brazil vs Haiti
- Türkiye vs Paraguay

## Known risks / gaps

1. Exact-score performance remains limited.
2. xG can compress favorites toward close scorelines and underestimate blowouts.
3. Extreme signal values still require fixture-level sanity review.
4. `/predictions` history will grow too long; UIHISTORY01 is recognized but not implemented.
5. Real Fixture Lab exact-detail remains a stack-overflow follow-up.
6. Mobile/responsive, PWA installability, accessibility/performance, and cross-device smoke require final launch passes.

## Recommended next actions

1. Merge this documentation refresh and update project sources.
2. Continue exact result monitoring for the four fixtures.
3. Prepare the next runway only after model sanity review.
4. Implement UIHISTORY01 in a focused branch.
5. Run Epic G09-G14 in parallel with explicit file ownership.
