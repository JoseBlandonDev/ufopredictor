# Epic Progress Matrix - UFO Predictor

_Last refreshed: post PR #99 Data Ops 06 and Torneo delivery (2026-06-19)._

| Track / Epic | Status | Notes |
|---|---|---|
| Public Prediction MVP | Done / Operational | Public list/detail, upcoming view, bounded recent results, paginated history. |
| Result Review Flow | Done / Operational | Exact final-result verification queue. |
| Internal Evaluation Persistence | Done / Operational | Internal-only fair evaluation baseline retained. |
| Premium Prediction Detail | Done / Operational | Protected xG, scorelines, BTTS, O/U, confidence/risk. |
| Free Probable Score Gate | Done | Pre-result registered-free gate retained. |
| Data Ops 01-04 | Done | Prior runway/result/model closeout work. |
| Data Ops 05 | Done / Operational cycle | Second-round publication groundwork. |
| Data Ops 06 / PR #99 | Done | 24/24 Matchday 2, 5 frozen, 9 public versions, idempotent export batch. |
| Model Closeout PR #94 | Done / Closed | SIGNAL04 + DRAW01 retained; expected-goals unchanged. |
| Signal Refresh PR #97 | Done / Reproducible baseline | Versioned source snapshot, generator, quality gates. Cadence still open. |
| Prediction Review Gate PR #98 | Done / Operational | Shadow, provider revalidation, alerts, decisions, immutable lineage. |
| Review Gate AI | Not connected | No supported provider key; no fake output. |
| Reviewed-xG Publication | Preview only | Publication intentionally disabled. |
| Real Fixture Publish Queue | Done / Operational | Preferred exact scheduled publication path. |
| Real Fixture Lab Exact Detail | Blocked / Non-blocking | Stack overflow; focused queues cover operations. |
| Torneo Mundialista Export | Done / Delivered | `torneo-ufo-export-v1`, final Matchday 2 JSON sent. |
| UIHISTORY01 / PR #96 | Done | Main list bounded; history/upcoming routes added. |
| Venue/Stadium Metadata | Pending | Provider reliability review required. |
| Future xG Research | Deferred | Separate experiment; current formula unchanged. |
| Epic G01 Auth Foundation | Done | Google/email/session baseline. |
| Epic G02 Dev/Prod Config | Done | Environment separation baseline. |
| Epic G03 Production Smoke | Partial / Open | Ad hoc flows tested; formal role/device matrix pending. |
| Epic G04 Plans/Pricing | Operational MVP / P0 polish | DB-managed pricing; USDT/COP truth and catalog simplification required. |
| Epic G05 Wompi Payment | Done / Production live | Approved webhook activates premium. |
| Epic G06 Entitlement Activation | Done | Entitlements are authorization source. |
| Epic G07 Premium Active Experience | Done for MVP / polish open | Role/plan/entitlement copy needs clarity. |
| Epic G08 Trust/Legal/Truthful Copy | Partial / High priority | No-betting copy exists; model-status, terms/refund pass open. |
| Epic G09 Frontend Commercial Readiness | Planned / Concrete backlog | Home freshness, language, pricing, review gate, admin empty states. |
| Epic G10 PWA Installability | Planned | Manifest/icons/standalone; no unsafe caching. |
| Epic G11 Offline/Update Safety | Optional / Deferred by default | Ship only if low risk. |
| Epic G12 Accessibility/Performance | Planned | Contrast, focus, touch, Lighthouse, long routes. |
| Epic G13 Cross-Device Smoke | Planned / Launch gate | Anonymous/free/premium/admin + payment/export/review. |
| Epic G14 Ownership Coordination | Required | Explicit file ownership for parallel work. |

## Current priority order

1. Monitor and evaluate Matchday 2 results.
2. Prepare the next fixture batch.
3. Resolve G04 P0 price truth.
4. Refresh home/transparency copy.
5. Apply the small Review Gate UI patch.
6. Complete G08, G03, and refund/revocation operations.
7. Run G09/G12/G13 commercial launch passes.
8. Define signal refresh cadence.
