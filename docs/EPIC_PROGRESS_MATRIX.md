# UFO Predictor — Epic Progress Matrix

Last refreshed: post-E07 / MVP 1 public fixture expansion and refresh.

| Epic / Block | MVP Stage | Status | Purpose | Next Action |
|---|---:|---|---|---|
| Epic A — Project Foundation | Foundation | Complete | Repo/app/Supabase/project base. | None. Maintain only. |
| Epic B — Public Prediction Foundation | Foundation | Complete | Public-safe prediction structures and read boundaries. | Continue using public projections. |
| Epic C — Registered/Premium Foundation | Foundation | Complete | Registered user/free-premium scaffolding. | Define access tiers in E09. |
| Epic D — Real Data & Calibration Lab | MVP 0 | Complete / PASS | Validate controlled real-data loop before World Cup. | Frozen except explicit follow-up. |
| D05 — Real Fixture Lab Loop | MVP 0 | Complete | Exact fixture ingest, internal prediction, result verification, evaluation persistence. | Use as internal foundation. |
| D06 — Friendly Pilot Batch | MVP 0 | Complete | 5 exact friendlies fully evaluated. | Do not keep extending D06. |
| D07 — Model Sanity / v0.2-prelaunch | MVP 0 | Complete / Frozen | Fix default-signal collapse and activate MVP 1 model. | Keep active. Further calibration in E10/M later. |
| D08A — Admin Lab Navigation Cleanup | MVP 0/1 | Complete | Make Real Fixture Lab accessible and clarify legacy/mock lanes. | Maintain. |
| F01 — MVP 1 UI Polish | MVP 1 | Complete | Polish public/admin UX without logic changes. | Use as launch baseline. |
| Epic E — World Cup Data & Prediction Launch | MVP 1 | Active | Launch real World Cup fixture ingestion/publication. | Continue exact fixture ops only. |
| E01 — Launch Readiness Recognition | MVP 1 | Complete | Establish World Cup launch readiness and next work. | Superseded by E03/E07. |
| E03B — Exact Scheduled World Cup Apply Guard | MVP 1 | Complete | Allow only one scheduled World Cup fixture apply by exact fixture id. | Keep broad apply blocked. |
| E03D — Competition Slug Reuse | MVP 1 | Complete | Reuse existing `world-cup-2026` row when external id differs. | Maintain in ingest writer. |
| E03E — Team Slug Reuse | MVP 1 | Complete | Reuse existing team rows when external id differs. | Maintain in ingest writer. |
| E04 — First Exact World Cup Fixture Ingest | MVP 1 | Complete | Ingest Mexico vs South Africa as admin-only real fixture. | Repeat only for selected exact fixtures. |
| E05 — Manual Public Prediction Publication | MVP 1 | Runtime pass | Clone selected internal prediction into public_product and publish exact match. | Keep manual; do not batch. |
| E05-G — Publication Access RPC | MVP 1 | Runtime pass | Use `0029` RPC to flip `matches.access_scope` safely. | Preserve as stable first-publication path. |
| E06 / F02 — Public Launch QA & Mock Cleanup | MVP 1 | Complete baseline | Make public surface launch-safe and real-fixture focused. | Maintain; polish through E09. |
| E07 — Next World Cup Fixture Expansion | MVP 1 | Complete / PR #61 | Add fallback signals, publish more fixtures, support exact public refresh. | Use proven flow for future selected fixtures. |
| E08 — Public Copy / Confidence / Risk Framing | MVP 1 | Partially complete | Safer public probability/risk framing. | Continue as part of E09. |
| E09 — Access Tiers for Prediction Detail | MVP 1 | Next | Decide anonymous/free/premium visibility for prediction detail and scorelines. | Start read-only recognition. |
| E10 — Scoreline Calibration & Signal Enrichment Plan | MVP 1/1.5 | Next after E09 | Reduce over-conservative `1-1` behavior and plan real data snapshots. | Recognition/planning first. |
| Epic G — Auth/Payment/Tournament Pass | MVP 1 | Future / Optional parallel | Payment gateway/tournament-pass flow. | Discovery only after access-tier definition. |
| Epic H — Live Evaluation & Model Iteration | MVP 1.5 | Future | Use real World Cup outcomes for evaluation/iteration. | Open after fixtures finish. |
| Epic I — Workers Lite & Automation | MVP 1.5 | Future | Reduce manual operator burden during tournament. | Not before manual exact flow stays stable. |
| Epic J — Product Iteration During Tournament | MVP 1.5 | Future | Improve pricing/copy/features from real usage. | Later. |
| Epic K — Recurring Competitions | MVP 2 | Future | Support post-World-Cup recurring competitions. | Later. |
| Epic L — Recurring Payments & Premium Depth | MVP 2 | Future | Subscriptions and deeper premium product. | Later. |
| Epic M — Model & Transparency Maturity | MVP 2 | Future | Better features, calibration, transparency. | Later. |
| Epic N — Production Ops & Scale | MVP 2 | Future | Operational hardening and scaling. | Later. |

## Current MVP 1 milestone

Four real World Cup fixtures are public:

- `api-football:fixture:1489369` — Mexico vs South Africa;
- `api-football:fixture:1538999` — South Korea vs Czech Republic;
- `api-football:fixture:1539000` — Canada vs Bosnia & Herzegovina;
- `api-football:fixture:1489370` — USA vs Paraguay.

MVP 1 now has:

- exact fixture ingest;
- manual publication;
- exact public refresh;
- fallback signals for immediate launch teams;
- public-safe real fixture surface.

## Current bottleneck

The public product now needs value-tier and model-output clarity, not more RLS archaeology unless a real bug appears. The next work should focus on:

1. access tiers;
2. probable score visibility;
3. premium/free separation;
4. scoreline calibration;
5. real signal enrichment;
6. result verification after fixtures finish.

## Non-negotiable boundaries

- No broad World Cup apply.
- No batch publication.
- No automatic publication.
- No provider predictions.
- No betting odds as hidden model input.
- No public exposure of `prediction_results`.
- No service-role in app routes.
- No large model rewrite before a planned calibration epic.
