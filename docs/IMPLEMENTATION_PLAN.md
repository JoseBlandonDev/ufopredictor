# Implementation Plan - UFO Predictor

_Last refreshed: post PR #77 Premium Prediction Detail MVP / Real Fixture Lab Ops Summary, after latest World Cup result batch verification._

## Completed implementation blocks

### Premium Prediction Detail MVP v1

Done via PR #77: protected premium projection RPC, model detail normalization/resolver, match detail premium UI, tests, and migration `0035_premium_match_model_detail_projection.sql`.

### Real Fixture Lab Ops Summary

Done via PR #77: operational summary sections, public row/status/evaluation metadata, model detail readiness fallback, and tests.

### Probable score gate

Done via PR #77. Registered-free probable score is gated until verified result.

## Next implementation candidates

### Data Ops 01 - Load next prediction batch

Implementation type: operational/data task.

Steps:

1. Identify upcoming World Cup fixtures.
2. Generate/refine predictions.
3. Publish public rows.
4. Verify premium model detail readiness.
5. Verify public pages.

### TM01 - Admin JSON export for Torneo Mundialista

Implementation type: small product/admin tool.

Proposed scope:

- admin-only export button/action in Real Fixture Lab;
- date-range JSON export;
- full public-safe prediction package;
- UFO match links;
- no public endpoint;
- no writes;
- no service-role app route.

### Premium v2 - Post-match demo unlock

Implementation type: product policy + UI. Decide and implement whether registered-free users should see full premium model detail after verified result.

## Deferred

Payments/checkout, full entitlement automation, public API endpoint for Torneo, venue metadata, and signal refresh automation.
