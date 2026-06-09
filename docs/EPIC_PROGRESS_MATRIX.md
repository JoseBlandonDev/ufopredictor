# UFO Predictor â€” Epic Progress Matrix

Last refreshed: after PR #40.

| Epic / Block | MVP Stage | Status | Purpose | Next Action |
|---|---:|---|---|---|
| Epic A â€” Project Foundation | Foundation | Complete | Repository, app base, Supabase foundation, conventions | None |
| Epic B â€” Public Prediction Foundation | Foundation | Complete | Public prediction structures and presentation boundaries | None |
| Epic C â€” Registered/Premium Foundation | Foundation | Complete | Saved matches, premium skeleton, registered boundaries | None |
| Epic D â€” Real Data & Calibration Lab | MVP 0 | In progress | Controlled real-data loop before World Cup | Continue with D06 |
| D05 â€” Real Fixture Lab controlled single-fixture loop | MVP 0 | Functionally complete | Single-fixture ingest/predict/verify/evaluate loop | Full live PASS pending result data |
| D06 â€” Friendly Pilot / Calibration Batch | MVP 0 | Next active | 3-5 exact friendly fixtures through full internal loop | Candidate discovery |
| D07 â€” Emergency Model Calibration | MVP 0 | Future | Minimal model v0.1/v0.2 improvements from D06 evidence | Wait for D06 |
| D08 â€” Minimum Launch Polish | MVP 0 | Future | Admin/public polish only where evidence shows pain | Wait for D06/D07 |
| Epic E â€” World Cup Data & Prediction Launch | MVP 1 | Future | Controlled World Cup ingest and selected prediction launch | After MVP 0 evidence |
| Epic F â€” Public Experience & Trust Layer | MVP 1 | Future | Public prediction UX, trust copy, methodology | Can run partly in parallel |
| Epic G â€” Auth, Paywall, and One-Time Payment Gateway Slice | MVP 1 | Future / parallel candidate | Google auth, soft paywall, PayPal/gateway/tournament pass | Candidate for second contributor |
| Epic H â€” Live Evaluation & Model Iteration | MVP 1.5 | Future | Improve model during World Cup from real results | During tournament |
| Epic I â€” Workers Lite & Operational Automation | MVP 1.5 | Future | Automate proven painful operations | After manual flow evidence |
| Epic J â€” Monetization/Product Iteration During Tournament | MVP 1.5 | Future | Paywall/offer/product iteration during tournament | After launch signal |
| Epic K â€” Recurring Competitions | MVP 2 | Future | Leagues/cups/friendlies after World Cup | Post-World-Cup |
| Epic L â€” Recurring Payments & Premium Depth | MVP 2 | Future | Recurring subscriptions and deeper premium | Post-World-Cup |
| Epic M â€” Model & Transparency Maturity | MVP 2 | Future | Model maturity and historical transparency | Post-World-Cup |
| Epic N â€” Production Operations & Scale | MVP 2 | Future | Full workers, monitoring, scaling | Post-World-Cup |

## D05 detail

D05 is now closed as the foundation block, not as all of Epic D.

Completed D05 sequence:

- D05F â€” ingest run tracking.
- D05G â€” exact friendly pre-match ingest.
- D05H â€” Real Fixture Lab evaluation persistence.
- D05I â€” Real Fixture Lab result verification.
- D05J â€” first runtime trial partial pass.
- D05K â€” exact friendly post-match result ingest guard.

## D06 active plan

D06 should not be treated as broad friendlies apply.

It is an operational pilot with 3-5 exact fixtures:

- D06A â€” read-only candidate discovery.
- D06B â€” pilot matrix selection.
- D06C â€” pre-match exact ingest and prediction save.
- D06D â€” post-match exact ingest, verification, and evaluation.
- D06E â€” evidence capture.
- D06F â€” model error summary.
- D06G â€” decide small admin/front fixes.

## Parallel contributor lanes

Preferred ownership:

- Jonathan: Epic D, Real Fixture Lab, API-Football, D06/D07.
- Second contributor: Epic G payment/auth/paywall discovery or Epic F public UX/trust copy.

Do not have multiple contributors modify the same surface without explicit coordination.
