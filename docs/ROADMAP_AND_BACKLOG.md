# UFO Predictor — Roadmap and Backlog v2

Last refreshed: after D05K / PR #40.

## Planning principle

The roadmap is organized by MVP stages and epics.

MVP stages describe timing and product goals. Epics describe implementation work. A single MVP stage may contain several epics, and an epic may have follow-up work in later stages.

The roadmap can evolve, but new work should attach to an existing MVP stage/epic unless there is a clear reason to create a new epic. No more drifting into alphabet soup because a conversation got bored.

---

# MVP 0 — Pre-World-Cup Calibration Lab

## Goal

Use the few remaining pre-World-Cup days to validate the real-data prediction loop and model v0.1 with controlled friendly fixtures.

This stage is internal-first. It is not the full public product.

## Success criteria

- 3-5 exact friendly fixtures selected.
- Internal predictions saved before kickoff where possible.
- Post-match results ingested as `pending_review`.
- Results verified as `verified`.
- Evaluations persisted into `prediction_results`.
- Model errors reviewed.
- Minimum changes for World Cup launch identified.

## Epic D — Real Data & Calibration Lab

Status: in progress.

Purpose: build and validate the controlled real-data lane before World Cup launch.

### D05 — Real Fixture Lab controlled single-fixture loop

Status: functionally complete.

Delivered:

- exact friendly pre-match ingest;
- ingest run tracking;
- Real Fixture Lab;
- internal prediction save;
- result verification;
- evaluation persistence;
- exact friendly post-match result ingest guard;
- first runtime partial trial.

Remaining condition:

- full live PASS once selected fixtures have actual post-match `match_results`.

### D06 — Friendly Pilot / Calibration Batch

Status: next active block.

Goal: run 3-5 exact friendly fixtures through the internal Real Fixture Lab loop.

Subtasks:

- D06A — read-only candidate discovery.
- D06B — pilot matrix selection.
- D06C — pre-match exact ingest and prediction save.
- D06D — post-match exact ingest, verification, and evaluation.
- D06E — evidence capture.
- D06F — model error summary.
- D06G — decide small admin/front gaps from evidence.

Boundaries:

- exact fixtures only;
- no broad friendlies apply;
- no World Cup apply;
- no provider predictions;
- no odds;
- no public exposure.

### D07 — Emergency Model Calibration

Status: future, after D06 evidence.

Goal: make minimum viable model v0.1/v0.2 adjustments before official World Cup matches.

Possible scope:

- confidence/risk tuning;
- top scoreline sanity;
- neutral/friendly uncertainty handling;
- recent-form/team-strength adjustments if available;
- copy notes around friendly volatility.

### D08 — Minimum Launch Polish

Status: future, only if needed before MVP 1.

Goal: fix only the front/admin gaps that block useful World Cup launch or internal operation.

Possible scope:

- clearer Real Fixture Lab metadata;
- pilot/evaluation summary;
- public prediction card polish;
- launch-safe copy;
- methodology/disclaimer improvements.

---

# MVP 1 — World Cup Launch MVP

## Goal

Ship a safe World Cup-focused MVP while tournament demand is active.

This stage is not full automation. It is controlled World Cup prediction delivery with a minimal monetization path if the product is intended to capture World Cup hype.

## Success criteria

- selected World Cup fixtures can be ingested safely;
- predictions can be generated/reviewed internally;
- selected predictions can be shown publicly;
- public copy is safe and honest;
- no provider predictions or odds are used;
- free/premium boundary is decided;
- one-time payment/tournament pass path is implemented if monetization is in launch scope.

## Epic E — World Cup Data & Prediction Launch

Status: future.

Goal: move from friendly calibration to selected World Cup fixtures.

Possible subtasks:

- E01 — World Cup source/competition recognition.
- E02 — World Cup controlled dry-run design.
- E03 — selected fixture ingest plan.
- E04 — prediction generation/review flow for World Cup fixtures.
- E05 — publication rules for selected predictions.
- E06 — rollback and operator safety plan.

Hard no-go:

- broad World Cup apply without explicit approval;
- automatic public publication;
- provider predictions;
- odds.

## Epic F — Public Experience & Trust Layer

Status: future.

Goal: make the public World Cup prediction experience usable and trustworthy.

Possible subtasks:

- F01 — public prediction cards/pages.
- F02 — match detail polish.
- F03 — methodology/trust copy.
- F04 — confidence/risk explanation.
- F05 — accuracy/transparency baseline.
- F06 — mobile/social sharing polish.

## Epic G — Auth, Paywall, and One-Time Payment Gateway Slice

Status: future or parallel if a second contributor starts.

Goal: create the smallest monetization path that does not block product learning.

Important:

- do not assume Stripe;
- default candidates are PayPal or another selected/available payment gateway;
- for the World Cup, prefer one-time packages/tournament pass over complex recurring subscriptions;
- recurring subscriptions belong later unless the selected gateway makes them trivial.

Possible subtasks:

- G01 — current auth/premium recognition.
- G02 — Google authentication hardening.
- G03 — free vs premium boundary decision.
- G04 — payment provider decision: PayPal/local gateway/etc.
- G05 — checkout/payment proof of concept.
- G06 — entitlement/access model.
- G07 — simple paywall enforcement.
- G08 — account/payment status page.

Recommended launch model:

- soft paywall or tournament pass.

Possible free/premium split:

- free: basic winner prediction, limited probability summary, one likely scoreline, general match insight;
- premium: full probabilities, BTTS, over/under, top scorelines, confidence/risk, deeper model explanation, prediction history/accuracy when available.

---

# MVP 1.5 — Live World Cup Iteration

## Goal

Improve the product during the tournament using real results, user feedback, and operational pain.

## Epic H — Live Evaluation & Model Iteration

Possible subtasks:

- H01 — World Cup result verification/evaluation.
- H02 — model error summaries.
- H03 — model v0.2/v0.3 adjustments.
- H04 — confidence recalibration.
- H05 — public accuracy notes.

## Epic I — Workers Lite & Operational Automation

Goal: automate only the proven painful parts of the workflow.

Possible subtasks:

- I01 — fixture refresh worker.
- I02 — result polling worker.
- I03 — evaluation worker.
- I04 — retry/error logging.
- I05 — admin alerts.

Rule: no full automation before the manual flow is proven.

## Epic J — Monetization/Product Iteration During Tournament

Possible subtasks:

- J01 — adjust premium offer based on usage.
- J02 — improve paywall copy.
- J03 — improve account/payment UX.
- J04 — add tournament pass refinements.
- J05 — improve public/mobile/social UX.

---

# MVP 2 — Post-World-Cup Sustainable Product

## Goal

Turn UFO Predictor into a recurring football prediction product beyond the World Cup.

## Epic K — Recurring Competitions

Possible scope:

- leagues;
- cups;
- friendlies;
- competition configuration;
- season/calendar handling.

## Epic L — Recurring Payments & Premium Depth

Possible scope:

- recurring subscriptions;
- richer saved match experience;
- premium prediction history;
- account dashboard;
- subscription management;
- premium-only insights.

## Epic M — Model & Transparency Maturity

Possible scope:

- model v0.2/v0.3;
- feature improvements;
- calibration reports;
- accuracy history;
- methodology pages.

## Epic N — Production Operations & Scale

Possible scope:

- full workers;
- monitoring;
- incident handling;
- data quality dashboards;
- scheduled maintenance;
- cost/runtime controls.

---

# Current immediate priorities

1. Rebaseline documentation.
2. Start D06.
3. Select 3-5 exact friendly fixtures.
4. Run the internal pilot.
5. Use pilot evidence to decide MVP 1 launch scope.
6. If a second contributor joins, assign them to G01/G02/G04 discovery or F01/F03 public UX.

# Hard no-go list

Until explicitly approved:

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
