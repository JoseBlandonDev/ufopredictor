# Roadmap and Backlog - UFO Predictor

_Last refreshed: post PR #77 Premium Prediction Detail MVP / Real Fixture Lab Ops Summary, after latest World Cup result batch verification._

## Completed / Done

### Public prediction MVP

Controlled public World Cup predictions, public prediction list/detail, public verified result display, and internal result verification/evaluation separated from public display.

### Premium Prediction Detail MVP v1

Status: Done.

Scope: match detail only, protected premium RPC, expected goals, top 3 scorelines, BTTS, Over/Under 2.5, confidence/risk, no `/predictions` premium expansion, no payments/checkout.

### Real Fixture Lab Ops Summary

Status: Done.

Capabilities: operational queue, upcoming fixtures, pending result review, verified/evaluated states, IDs needed for exact operations, and `model_detail` readiness fallback.

### Free probable score gate

Status: Done. Registered-free users do not see/fetch probable score before result verification. Post-verified probable score may be shown as reference.

## Immediate backlog

### Data Ops 01 - Load next World Cup prediction batch

Priority: Highest.

Goal: restore active/upcoming predictions after the latest batch was verified/evaluated.

Acceptance:

- next fixtures identified;
- predictions generated/refreshed;
- `public_product` rows published;
- premium `model_detail` available;
- `/predictions` shows active/upcoming fixtures;
- match details render correctly;
- no odds/provider predictions;
- no raw internals exposed.

## Planned / Discovery

### TM01 - Torneo Mundialista Admin JSON Export

Status: Planned / Discovery.

Goal: use Torneo Mundialista as a discovery surface for UFO Predictor by exporting complete public-safe UFO predictions for Torneo to display with its own reveal rules.

Recommended V0: admin-only JSON export from Real Fixture Lab, date range selection, full public-safe prediction package, UFO match links, Torneo-owned display/reveal policy, no endpoint by default.

### Premium v2 - Post-match demo unlock

Status: Open. Decide whether registered-free users should see full premium detail after verified result as a post-match demo.

### Venue/stadium metadata

Status: Pending. Replace `Sede por confirmar` where provider venue metadata is trustworthy and supported.

### Signal refresh strategy

Status: Open. Decide cadence and boundaries for refreshing model inputs/signals.

## Epic G parallel track

Done: G01 auth foundation, G02 production config/readiness audit.

Pending: G03 production smoke test, G04 plans/pricing MVP, G05 payment provider spike, G06 subscription/entitlement model proposal, G07 premium gate UI shell/CTA, G08 trust/legal/responsible-use copy.

## Non-goals / guardrails

Do not expose `prediction_results`, raw Lab/admin/evaluation payloads, service-role in app routes, provider odds/predictions as hidden inputs, or Torneo human picks as UFO model inputs without a future approved design.
