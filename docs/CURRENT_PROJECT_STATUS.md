# UFO Predictor — Current Project Status

Last refreshed: after PR #40.

## Executive status

UFO Predictor has completed the core Real Fixture Lab single-fixture loop and is ready to move into a controlled friendly pilot before the World Cup.

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

D05J runtime trial:

- fixture: `api-football:fixture:1540356`;
- teams: Peru vs Spain;
- fixture loaded in `/admin/real-fixture-lab`;
- scope remained `admin_only + api_football`;
- saved internal prediction was visible;
- no `match_results` row existed;
- verification correctly unavailable;
- evaluation correctly blocked.

Result: partial pass, blocked by missing runtime result data, not by system failure.

### D06 — Friendly Pilot / Calibration Batch

Status: next active block.

Goal: operate 3-5 exact pre-World-Cup friendlies through the internal loop.

D06 begins no-code/read-only:

- discover candidate friendlies;
- select 3-5 exact fixtures;
- build a pilot matrix;
- then operate pre-match and post-match flows fixture by fixture.

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

Re-enter D06 on a clean branch from updated `main` and run candidate discovery recognition/read-only commands.
