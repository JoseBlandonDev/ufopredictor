# Implementation Plan - UFO Predictor

_Last refreshed: post PR #81 real fixture publish queue bypass / Data Ops 02 completion (2026-06-16)._

## Completed implementation blocks

### Premium Prediction Detail MVP v1

Done via PR #77: protected premium projection RPC, model detail normalization/resolver, match detail premium UI, tests, and migration `0035_premium_match_model_detail_projection.sql`.

### Data Ops 01 and Data Ops 02

Done operationally. Public upcoming runway is restored/expanded and recent finished fixtures are verified/evaluated.

### Real Fixture Publish Queue

Done via PR #81. `/admin/real-fixture-publish-queue` provides a lightweight admin-only path to save/publish scheduled exact fixtures using existing actions.

### Probable score gate

Done via PR #77. Registered-free probable score is gated until verified result.

## Next implementation candidates

### TM01 - Admin JSON export for Torneo Mundialista

Implementation type: small product/admin tool.

Proposed scope:

- admin-only export action/page;
- date-range JSON export;
- full public-safe prediction package;
- UFO match links;
- no public endpoint by default;
- no writes;
- no service-role app route;
- no Torneo human-pick signals as UFO model inputs.

### Real Fixture Lab stack overflow cleanup

Implementation type: admin refactor/bug fix.

Goal: resolve `RangeError: Maximum call stack size exceeded` in `/admin/real-fixture-lab` and exact-detail route without regressing the publish queue.

Recommended direction: split the Lab into smaller components/routes, keep heavy previews out of page render, and avoid broad summary/detail coupling.

### Premium v2 - Post-match demo unlock

Implementation type: product policy + UI. Decide and implement whether registered-free users should see full premium model detail after verified result.

## Epic G implementation candidates

- G03 production smoke test.
- G04 plans/pricing MVP.
- G05 Wompi payment integration spike/MVP.
- G06 entitlement model.
- G07 premium gate shell/CTA.
- G08 trust/legal/responsible-use copy.

## Deferred

Public API endpoint for Torneo, venue metadata, signal refresh automation, full subscription automation, and Real Fixture Lab full rebuild.
