# Post G05/G06/G07 Production Changelog - UFO Predictor

_Last refreshed: 2026-06-22. Historical production behavior retained; Prediction Intelligence v2 does not change this runbook._

## G05/G06/G07 production baseline

- Wompi is live in production for World Cup Pass checkout.
- Approved webhooks activate premium through entitlement grants.
- Premium users see premium-active UI.
- Pricing is admin/DB controlled.
- Redirect and client assertions do not activate access.
- Vault-backed webhook validation is retained.

## Subsequent production progress

### PR #96 — public prediction pagination

- bounded recent results on `/predictions`;
- dedicated upcoming/history routes;
- server-side history pagination.

### PR #97 — signal refresh

- reproducible 2026-06-19 national-team source snapshot;
- deterministic generator;
- quality report and source manifest;
- no model formula change.

### PR #98 — Prediction Review Gate

- provider revalidation;
- shadow predictions;
- delta/Elo alerts;
- human decision audit;
- production RLS-backed review persistence.

### PR #99 — Data Ops 06 and Torneo

- 24/24 Group Stage - 2 fixtures;
- 5 frozen fixtures;
- 9 new public versions;
- idempotent batch;
- final 24-fixture JSON sent to Torneo.

## Current operational concerns

- World Cup Pass visible COP/USDT relationship must be verified and corrected.
- Formal production smoke remains incomplete.
- Refund/revocation operations remain open.
- Trust/truthful-copy pass is incomplete.
- Review Gate AI is not connected.
- Real Fixture Lab exact-detail remains unstable.

## Current product state

UFO Predictor now has a complete loop:

```text
public predictions
-> premium detail
-> production payment
-> entitlement activation
-> result verification/evaluation
-> signal refresh/review gate
-> partner export
```
## Prediction Intelligence v2 follow-on

The current unmerged feature branch adds the v2 data/scenario foundation through Task 3A. It does not replace or invalidate the production G05/G06/G07 loop. Task 3B stage validation is pending.
