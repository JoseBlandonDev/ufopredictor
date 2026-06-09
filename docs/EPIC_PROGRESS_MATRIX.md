# UFO Predictor — Epic Progress Matrix

Last refreshed: after D08A admin lab navigation cleanup.

| Epic / Block | MVP Stage | Status | Purpose | Next Action |
|---|---:|---|---|---|
| Epic A — Project Foundation | Foundation | Complete | Repository, app base, Supabase foundation, conventions | None |
| Epic B — Public Prediction Foundation | Foundation | Complete | Public prediction structures and presentation boundaries | None |
| Epic C — Registered/Premium Foundation | Foundation | Complete | Saved matches, premium skeleton, registered boundaries | None |
| Epic D — Real Data & Calibration Lab | MVP 0 | In progress | Controlled real-data loop before World Cup | Finish D06D/E for remaining 3 fixtures |
| D05 — Real Fixture Lab controlled single-fixture loop | MVP 0 | Functionally complete | Single-fixture ingest/predict/verify/evaluate loop | Full live PASS pending result data |
| D06 — Friendly Pilot / Calibration Batch | MVP 0 | In progress | 3-5 exact friendly fixtures through full internal loop | Wait for final results on remaining 3 fixtures |
| D07 — Emergency Model Calibration | MVP 0 | Partially complete / frozen | National-team fallback implemented as minimal sanity fix | Hold model steady until all 5 D06 fixtures are evaluated |
| D08 — Minimum Launch Polish | MVP 0 | In progress | Small admin/public polish where evidence shows pain | D08A complete; continue only with scoped follow-ups if needed |
| Epic E — World Cup Data & Prediction Launch | MVP 1 | Future | Controlled World Cup ingest and selected prediction launch | After MVP 0 evidence |
| Epic F — Public Experience & Trust Layer | MVP 1 | Next active frontend lane | Public prediction UX, trust copy, methodology | Start F01 UI polish without touching DB/model/auth/payments |
| Epic G — Auth, Paywall, and One-Time Payment Gateway Slice | MVP 1 | Future / parallel candidate | Google auth, soft paywall, PayPal/gateway/tournament pass | Candidate for second contributor |
| Epic H — Live Evaluation & Model Iteration | MVP 1.5 | Future | Improve model during World Cup from real results | During tournament |
| Epic I — Workers Lite & Operational Automation | MVP 1.5 | Future | Automate proven painful operations | After manual flow evidence |
| Epic J — Monetization/Product Iteration During Tournament | MVP 1.5 | Future | Paywall/offer/product iteration during tournament | After launch signal |
| Epic K — Recurring Competitions | MVP 2 | Future | Leagues/cups/friendlies after World Cup | Post-World-Cup |
| Epic L — Recurring Payments & Premium Depth | MVP 2 | Future | Recurring subscriptions and deeper premium | Post-World-Cup |
| Epic M — Model & Transparency Maturity | MVP 2 | Future | Model maturity and historical transparency | Post-World-Cup |
| Epic N — Production Operations & Scale | MVP 2 | Future | Full workers, monitoring, scaling | Post-World-Cup |

## D05 detail

D05 is now closed as the foundation block, not as all of Epic D.

Completed D05 sequence:

- D05F — ingest run tracking.
- D05G — exact friendly pre-match ingest.
- D05H — Real Fixture Lab evaluation persistence.
- D05I — Real Fixture Lab result verification.
- D05J — first runtime trial partial pass.
- D05K — exact friendly post-match result ingest guard.

## D06 active plan

D06 should not be treated as broad friendlies apply.

It is an operational pilot with 3-5 exact fixtures:

- D06A — read-only candidate discovery.
- D06B — pilot matrix selection.
- D06C — pre-match exact ingest and prediction save.
- D06D — post-match exact ingest, verification, and evaluation.
- D06E — evidence capture.
- D06F — model error summary.
- D06G — decide small admin/front fixes.

Current D06 pilot status:

- evaluated: `2/5`;
- pending final result: `3/5`.

## D07 current note

- D07B national-team fallback signals: implemented.
- active model version: `v0.2-prelaunch` (manual DB activation).
- v0.2 saved for all 5 pilot fixtures.
- v0.1 preserved as baseline.
- model is frozen until all 5 pilot fixtures have evaluation records.

## D08 current note

- D08A admin lab navigation cleanup: complete.
- Beta Lab remains legacy/mock.
- Real Fixture Lab is the active real-data admin lab.
- no provider predictions or betting odds are consumed by the active Real Fixture Lab model.

## F01 frontend note

F01 — MVP 1 UI Polish / Product Readiness should be the next public/product-facing workstream.

Boundaries:

- no DB changes;
- no model changes;
- no auth/payment logic changes;
- no prediction-logic changes;
- no migrations;
- no provider predictions;
- no betting odds as model input.

## Parallel contributor lanes

Preferred ownership:

- Jonathan: Epic D, Real Fixture Lab, API-Football, D06/D07.
- Second contributor: Epic G payment/auth/paywall discovery or Epic F public UX/trust copy.

Do not have multiple contributors modify the same surface without explicit coordination.
