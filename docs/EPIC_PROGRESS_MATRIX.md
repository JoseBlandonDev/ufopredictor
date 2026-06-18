# Epic Progress Matrix - UFO Predictor

_Last refreshed: post PR #81 real fixture publish queue bypass / Data Ops 02 completion (2026-06-16)._

| Track / Epic | Status | Notes |
|---|---|---|
| Public Prediction MVP | Done | Public 1X2 predictions, match detail, verified result display. |
| Result Verification Flow | Done / Operational | Results can be verified/evaluated after exact provider final state. |
| Internal Evaluation Persistence | Done / Operational | Evaluations remain internal/admin-only. |
| Premium Prediction Detail MVP v1 | Done | Match detail only; xG, top scorelines, BTTS, O/U, confidence/risk via protected RPC. |
| Free Probable Score Gate | Done | Registered-free users no longer see/fetch probable score before verified result. |
| Data Ops 01 | Done | First upcoming batch restored and recent results processed. |
| Data Ops 02 | Done | Active/upcoming runway expanded to 12 fixtures. |
| Real Fixture Publish Queue | Done / Operational | PR #81 admin-only bypass for scheduled fixture save/publish. |
| Real Fixture Lab Exact Detail | Blocked | Stack overflow; use publish queue until separate fix. |
| Torneo Mundialista Export | Planned / Next | TM01 admin JSON export, not endpoint-first. |
| Venue/Stadium Metadata | Pending | Provider venue support still not implemented. |
| Signal Refresh Strategy | Open | Cadence and rules still pending. |
| Premium v2 / Post-match Demo | Open | Decide whether registered-free gets full premium detail post-verification. |
| Epic G01 Auth Foundation | Done | Google login, email/password, confirmation flow. |
| Epic G02 Dev/Prod Environment + Config Readiness | Done / Verify in G03 | Environment/config readiness done; production smoke remains pending. |
| Epic G03 Production Smoke Test | Pending | Must include public surfaces, queue admin path, auth, and no leaks. |
| Epic G04 Plans/Pricing | Pending | Parallel Epic G task. |
| Epic G05 Wompi Payment Integration | Production Smoke | Wompi checkout + verified webhook activation for `world-cup-pass`; production smoke in progress. |
| Epic G06 Entitlement Activation Binding | Implemented / Backend | Admin/manual grants bind into existing entitlements and match unlocks; Wompi remains G05. |
| Epic G07 Premium Gate Shell | Pending | CTA/gated UI shell. |
| Epic G08 Trust/Legal Copy | Pending | Responsible-use, no betting, no guarantees. |

## Current priority order

1. TM01 Torneo Mundialista admin JSON export MVP.
2. Monitor active fixtures and process results as they finish.
3. Fix Real Fixture Lab stack overflow as separate admin cleanup.
4. Continue Epic G in parallel: Wompi production smoke, pricing expansion, premium gate shell, trust/legal.
