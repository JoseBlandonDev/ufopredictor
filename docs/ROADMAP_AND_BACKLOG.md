# Roadmap and Backlog - UFO Predictor

_Last refreshed: post PR #81 real fixture publish queue bypass / Data Ops 02 completion (2026-06-16)._

## Completed / Done

### Public prediction MVP

Controlled public World Cup predictions, public prediction list/detail, public verified result display, and internal result verification/evaluation separated from public display.

### Premium Prediction Detail MVP v1

Status: Done.

Scope: match detail only, protected premium RPC, expected goals, top 3 scorelines, BTTS, Over/Under 2.5, confidence/risk, no `/predictions` premium expansion, no payments/checkout.

### Data Ops 01 and Data Ops 02

Status: Done.

Outcome: recent finished fixtures verified/evaluated and `/predictions` restored/expanded to a 12-fixture active/upcoming runway.

### Real Fixture Publish Queue

Status: Done / operational bypass.

Scope: admin-only lightweight queue at `/admin/real-fixture-publish-queue` for saving/publishing scheduled exact fixtures while Real Fixture Lab exact-detail is unstable.

### Free probable score gate

Status: Done. Registered-free users do not see/fetch probable score before result verification. Post-verified probable score may be shown as reference.

## Immediate backlog

### TM01 - Torneo Mundialista Admin JSON Export

Priority: Highest product/integration task.

Goal: use Torneo Mundialista as a discovery surface for UFO Predictor by exporting complete public-safe UFO predictions for Torneo to display with its own reveal rules.

Recommended V0: admin-only JSON export, date range selection, full public-safe prediction package, UFO match links, Torneo-owned display/reveal policy, no endpoint by default.

Acceptance:

- admin-only export route/action;
- selected date range or next-window default;
- includes 1X2, confidence/risk, most likely score, top scorelines, xG, BTTS, O/U 2.5 where available;
- includes UFO match links;
- excludes `prediction_results`, raw Lab/admin/evaluation payloads, provider odds/predictions, service-role-only data;
- no writes.

### Real Fixture Lab stack overflow cleanup

Status: Open / bug.

Goal: fix `/admin/real-fixture-lab` and exact-detail route stack overflow without regressing the publish queue.

## Planned / Discovery

### Premium v2 - Post-match demo unlock

Status: Open. Decide whether registered-free users should see full premium detail after verified result as a post-match demo.

### Venue/stadium metadata

Status: Pending. Replace `Sede por confirmar` where provider venue metadata is trustworthy and supported.

### Signal refresh strategy

Status: Open. Decide cadence and boundaries for refreshing model inputs/signals.

## Epic G parallel track

Done: G01 auth foundation, G02 dev/prod environment separation + config readiness audit.

Pending: G03 production smoke test, G04 plans/pricing MVP, G05 Wompi payment integration, G06 subscription/entitlement model proposal, G07 premium gate UI shell/CTA, G08 trust/legal/responsible-use copy.

## Non-goals / guardrails

Do not expose `prediction_results`, raw Lab/admin/evaluation payloads, service-role in app routes, provider odds/predictions as hidden inputs, Torneo human picks as UFO model inputs, or payment secrets in client/public runtime.
