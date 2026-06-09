# UFO Predictor — Implementation Plan v2

Last refreshed: after D05K / PR #40.

## Implementation strategy

The project now follows MVP stages:

1. MVP 0 — Pre-World-Cup Calibration Lab.
2. MVP 1 — World Cup Launch MVP.
3. MVP 1.5 — Live World Cup Iteration.
4. MVP 2 — Post-World-Cup Sustainable Product.

The plan is flexible, but each new task must attach to a stage/epic. No wandering epics because someone, somewhere, felt inspired.

## Phase 0 — Roadmap/documentation rebaseline

Status: current docs task.

Goal:

- update canonical docs;
- define D05 as functionally complete;
- define D06 as next;
- define MVP 1 monetization using PayPal/selected gateway, not Stripe assumption;
- define parallel contributor lanes.

## Phase 1 — D06 Friendly Pilot

Goal: run 3-5 exact friendly fixtures through the internal flow.

Steps:

1. Read-only candidate discovery.
2. Pilot matrix selection.
3. Pre-match exact ingest.
4. Save internal predictions.
5. Post-match exact ingest.
6. Verify results.
7. Persist evaluations.
8. Capture model errors.

Expected output:

- evidence matrix;
- model v0.1 error notes;
- known admin/front pain points.

## Phase 2 — D07 Emergency Model Calibration

Goal: make minimum viable model adjustments based on D06, not speculation.

Possible outputs:

- model v0.2 proposal;
- confidence/risk adjustment;
- friendly uncertainty notes;
- top scoreline sanity fixes.

## Phase 3 — D08 Minimum Launch Polish

Goal: only fix UI/admin gaps that block useful launch or operation.

Possible outputs:

- better Real Fixture Lab metadata;
- pilot/evaluation summary;
- public card copy/polish;
- clear blocked states.

## Phase 4 — MVP 1 World Cup Launch Slice

Epics:

- E — World Cup Data & Prediction Launch.
- F — Public Experience & Trust Layer.
- G — Auth, Paywall, and One-Time Payment Gateway Slice.

Payment notes:

- do not assume Stripe;
- use PayPal or selected gateway;
- World Cup monetization should prefer tournament pass / one-time package;
- recurring subscriptions can be revisited post-World-Cup.

## Phase 5 — Live iteration and post-World-Cup

During World Cup:

- H — Live Evaluation & Model Iteration.
- I — Workers Lite & Operational Automation.
- J — Monetization/Product Iteration.

After World Cup:

- K — Recurring Competitions.
- L — Recurring Payments & Premium Depth.
- M — Model & Transparency Maturity.
- N — Production Operations & Scale.

## Parallel work plan

If a second contributor joins:

### Jonathan lane

- Epic D: D06/D07/D08.
- API-Football.
- Real Fixture Lab.
- Model/evaluation.

### Contributor 2 lane

Preferred:

- Epic G: auth/paywall/payment provider discovery.

Alternative:

- Epic F: public UX/trust layer.

Rules:

- one branch per task;
- no direct work on `main`;
- no same-file work without coordination;
- no migration creation without reserving migration number;
- no PR with mixed epics unless explicitly approved.

## Validation expectations

For code tasks:

- `git diff --check`;
- targeted tests;
- `npm run test` when relevant;
- `npm run lint`;
- `npm run build`.

For docs tasks:

- `git diff --check`;
- no app tests unless code was accidentally changed.
