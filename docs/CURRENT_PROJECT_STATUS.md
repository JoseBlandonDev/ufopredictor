# UFO Predictor — Current Project Status

Last refreshed: after D08A admin lab navigation cleanup.

## Executive status

UFO Predictor has completed the core Real Fixture Lab single-fixture loop and is now partway through a controlled friendly pilot before the World Cup.

The project is not complete. It is now in a focused MVP-stage plan:

- MVP 0: pre-World-Cup calibration lab.
- MVP 1: World Cup launch MVP.
- MVP 1.5: live World Cup iteration.
- MVP 2: post-World-Cup recurring product.

## Completed foundation epics

### Epic A — Project foundation

Status: complete.

Covered repository setup, app foundation, Supabase base, early architecture, and documentation structure.

### Epic B — Public prediction foundation

Status: complete.

Covered public match/prediction structures, presentation boundaries, and anonymous-safe read patterns.

### Epic C — Registered and premium foundation

Status: complete.

Covered registered saved matches, premium skeleton, projection UI, free/premium access foundations, and transparency/product copy.

## Epic D — Real Data & Calibration Lab

Status: in progress.

Purpose: validate the real-data prediction loop before broad World Cup ingestion or public launch.

### D05 — Real Fixture Lab controlled single-fixture loop

Status: functionally complete.

Delivered:

- ingest run tracking and snapshots;
- exact `--fixtureId` friendly ingest before match;
- Real Fixture Lab admin route;
- internal prediction persistence;
- post-match result verification lane;
- internal evaluation persistence into `prediction_results`;
- saved evaluation readback;
- exact friendly post-match result ingest guard.

Recent merged PRs:

- PR #38 — `feat: persist real fixture lab evaluations`.
- PR #39 — `feat: add real fixture result verification`.
- PR #40 — `feat: allow exact friendly post-match result ingest`.

### D06 — Friendly Pilot / Calibration Batch

Status: in progress.

Goal: operate 3-5 exact pre-World-Cup friendlies through the internal loop.

Current D06 state:

- D06A candidate discovery: complete.
- D06B pilot fixture selection: complete.
- D06C exact pre-match ingest/apply: complete for 5 exact friendlies.
- D06C internal v0.1 predictions: saved for all 5 fixtures.
- D06G-1 admin pilot summary: implemented and committed.
- D06D/E post-match result/evaluation: partially complete.

Pilot fixture result/evaluation status:

- `api-football:fixture:1544367` — Congo DR vs Chile: finished `1-2`, result ingested, verified, evaluation persisted.
- `api-football:fixture:1525493` — Hungary vs Kazakhstan: finished `3-1`, result ingested, verified, evaluation persisted.
- `api-football:fixture:1544368` — Saudi Arabia vs Senegal: still pending final result.
- `api-football:fixture:1540357` — Argentina vs Iceland: still pending final result.
- `api-football:fixture:1546509` — Iraq vs Venezuela: still pending final result.

Result: 2 of 5 pilot fixtures have verified evaluation records; 3 of 5 remain pending result availability.

### D07 — Model Sanity / Emergency Calibration

Status: implemented, then frozen pending full pilot results.

Delivered:

- D07A recognition found Real Fixture Lab national-team fixtures were using default signals only.
- D07B implemented local/static national-team fallback signals.
- `v0.2-prelaunch` was manually activated in the database as the active model version.
- v0.2 internal predictions were saved for all 5 D06 pilot fixtures.
- v0.1 predictions remain preserved as baseline historical rows.

Early v0.2 evaluation from the first 2 completed fixtures:

- winner: `2/2`;
- BTTS: `2/2`;
- over 2.5: `2/2`;
- exact score: `0/2`.

Important freeze:

- do not change the model again until all 5 D06 pilot fixtures are evaluated.

### D08A — Admin Lab Navigation Cleanup

Status: complete.

Delivered:

- Real Fixture Lab is reachable from admin home and header.
- Beta Lab is labeled as legacy/mock/internal calibration.
- visible `sync-odds` wording was softened to legacy/mock market wording.
- active Real Fixture Lab flow explicitly preserves the no-provider-predictions / no-betting-odds boundary.

### F01 — MVP 1 UI Polish / Product Readiness

Status: next active frontend/product workstream.

Goal: improve product-facing UI polish and launch readiness while D06 waits on remaining match results.

Recognition findings:

- public/product-facing UI is structurally usable but visually rough;
- encoding/mojibake issues remain;
- `html lang` should be `es`;
- CTA/button hover/focus/pointer states are inconsistent;
- `/pricing` is the roughest public page;
- `/matches/[slug]` is the most important public page to polish.

Hard F01 boundaries:

- no DB changes;
- no model/prediction logic changes;
- no auth/payment logic changes;
- no migration work;
- no provider predictions;
- no betting odds as model input.

Future note:

- betting odds may be considered only later as a separate benchmark/market-comparison layer, never as hidden model input in the current MVP stages.

## Payment/monetization status

Payments are not implemented yet.

Important planning decision:

- do not assume Stripe;
- MVP 1 should use PayPal or another selected/available payment gateway;
- during the World Cup, monetization should start with one-time packages or a tournament pass;
- recurring payments/subscriptions can be evaluated after the World Cup.

## Parallel work status

A second contributor may join.

Recommended split:

- Jonathan: Epic D, D06/D07, API-Football, Real Fixture Lab, model/evaluation.
- Second contributor: Epic G payment/auth/paywall discovery, or Epic F public UX/trust layer.

No shared-file chaos. One branch per task. Migration numbers must be coordinated.

## Immediate next step

Split the next work clearly:

- new conversation: start F01 UI recognition/implementation planning from a clean branch and keep it frontend-only;
- resume this conversation later for remaining D06 result ingest, verification, and evaluation once the last 3 fixtures publish final scores.
