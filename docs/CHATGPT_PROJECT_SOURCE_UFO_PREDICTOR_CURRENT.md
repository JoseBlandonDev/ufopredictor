# ChatGPT Project Source — UFO Predictor Current

Last refreshed: after PR #40.

This is the high-signal project source for ChatGPT conversations. It should prevent new conversations from improvising the roadmap like jazz with production access.

## Product summary

UFO Predictor is a football prediction product built around probabilistic match forecasts, transparent methodology, free/premium boundaries, and a controlled real-data pipeline.

Current product focus: validate the prediction loop before and during the World Cup, using controlled friendlies first, then selected World Cup fixtures.

## Current MVP-stage roadmap

### MVP 0 — Pre-World-Cup Calibration Lab

Purpose: validate real-data flow and model v0.1 using controlled friendly fixtures.

Active epic:

- Epic D — Real Data & Calibration Lab.

### MVP 1 — World Cup Launch MVP

Purpose: ship a safe public World Cup-focused MVP while tournament demand is active.

Likely epics:

- Epic E — World Cup Data & Prediction Launch.
- Epic F — Public Experience & Trust Layer.
- Epic G — Auth, Paywall, and One-Time Payment Gateway Slice.

Payment note: do not assume Stripe. Use PayPal or another selected/available payment gateway. During the World Cup, prefer one-time packages or a tournament pass. Recurring subscriptions can be evaluated after the tournament.

### MVP 1.5 — Live World Cup Iteration

Purpose: improve model, UX, operations, and monetization during the tournament.

Likely epics:

- Epic H — Live Evaluation & Model Iteration.
- Epic I — Workers Lite & Operational Automation.
- Epic J — Monetization/Product Iteration During Tournament.

### MVP 2 — Post-World-Cup Sustainable Product

Purpose: expand into recurring competitions, premium depth, recurring payments, monitoring, model maturity, and long-term transparency.

Likely epics:

- Epic K — Recurring Competitions.
- Epic L — Recurring Payments & Premium Depth.
- Epic M — Model & Transparency Maturity.
- Epic N — Production Operations & Scale.

## Completed foundations

- Epic A: complete.
- Epic B: complete.
- Epic C: complete.

## Epic D current state

Epic D is in progress. D05 is functionally complete, but Epic D continues with D06/D07/D08.

### D05 — Real Fixture Lab controlled single-fixture loop

Status: functionally complete.

Completed sequence:

- D05F — ingest run tracking.
- D05G — exact friendly pre-match ingest.
- D05H — Real Fixture Lab evaluation persistence.
- D05I — Real Fixture Lab result verification.
- D05J — first runtime partial E2E trial.
- D05K — exact friendly post-match result ingest guard.

D05J detail:

- fixture `api-football:fixture:1540356` loaded;
- scope: `admin_only + api_football`;
- saved internal prediction visible;
- no `match_results` row existed;
- verification correctly unavailable;
- evaluation correctly blocked;
- result: partial pass due to missing runtime data, not a system failure.

D05K detail:

- scheduled exact friendly apply remains allowed;
- finished exact friendly apply is allowed only when exactly one planned `pending_review` `match_results` write exists;
- broad friendlies remain blocked;
- World Cup apply remains blocked.

### D06 — Friendly Pilot / Calibration Batch

Status: next active block.

Goal: select and operate 3-5 exact pre-World-Cup friendlies.

D06 does not mean broad friendlies apply. It is an operator-controlled pilot using exact fixture IDs.

Subtasks:

- D06A candidate discovery;
- D06B pilot matrix;
- D06C pre-match exact ingest + prediction save;
- D06D post-match exact ingest + verify + evaluate;
- D06E evidence capture;
- D06F model error summary;
- D06G decide admin/front fixes from evidence.

## Current hard no-go list

- broad friendlies apply;
- broad World Cup apply;
- provider predictions;
- betting odds;
- public exposure of Lab outputs;
- service-role in app routes;
- score-editing UI;
- manual result creation UI;
- automatic public prediction publication;
- full workers before manual flow evidence;
- large model rewrite before pilot evidence.

## Parallel contributor plan

If a second contributor joins:

- Jonathan owns Epic D/D06/D07 and Real Fixture Lab/API-Football/model-evaluation work.
- Second contributor should preferably start Epic G recognition/design: auth, paywall, PayPal/selected gateway, tournament pass/access entitlement.
- Alternative second contributor lane: Epic F public UX/trust copy.

Rules:

- one branch per task from updated `main`;
- no direct work on `main`;
- do not touch the same files across contributors unless coordinated;
- coordinate migration numbers before adding migrations;
- PRs must stay scoped.

## Codex rules

Prompts to Codex must be in English.

Default Codex mode is recognition/design first unless implementation is explicitly approved.

Codex must not:

- commit;
- push;
- open PR;
- run SQL;
- apply migrations;
- run `--apply true`;
- use service-role in app routes;
- broaden ingest;
- expose internal Lab data publicly.

## Immediate next action

Start D06 candidate discovery from a clean branch.
