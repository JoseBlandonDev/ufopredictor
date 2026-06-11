# UFO Predictor — Roadmap and Backlog v3

Last refreshed: post-E07 / MVP 1 public fixture expansion and refresh.

## Planning principle

The roadmap is organized by MVP stages and epics.

MVP stages describe timing and product goals. Epics describe implementation work. A single MVP stage may contain several epics, and an epic may have follow-up work in later stages.

New work should attach to an existing MVP stage/epic unless there is a clear reason to create a new epic. Do not keep inventing new letters because one RLS policy got dramatic.

---

# MVP 0 — Pre-World-Cup Calibration Lab

## Goal

Validate the real-data prediction loop and model sanity with controlled friendly fixtures before official World Cup matches.

## Status

Complete / operational PASS.

MVP 0 proved the internal loop:

```text
exact fixture ingest
-> internal prediction
-> result ingest
-> verification
-> evaluation persistence
```

It did not prove broad statistical performance.

## Epic D — Real Data & Calibration Lab

Status: complete for MVP 0.

### D05 — Real Fixture Lab controlled single-fixture loop

Status: complete.

Delivered:

- exact friendly pre-match ingest;
- ingest run tracking;
- Real Fixture Lab;
- internal prediction save;
- result verification;
- evaluation persistence;
- exact friendly post-match result ingest guard.

### D06 — Friendly Pilot / Calibration Batch

Status: complete.

Final state:

- 5 exact friendlies operated.
- 5/5 have verified results and persisted evaluations.
- Do not extend D06; future evaluation belongs in live/future epics.

Final v0.2-prelaunch pilot metrics:

- winner: 4/5;
- BTTS: 2/5;
- over 2.5: 3/5;
- exact score: 0/5;
- average goal error: 1.6.

### D07 — Emergency Model Calibration

Status: complete / launch-frozen.

Delivered:

- national-team fallback signals;
- `v0.2-prelaunch` activated;
- v0.2 predictions saved for D06 fixtures.

Post-E07 update:

- fallback signals were extended for immediate World Cup MVP 1 teams;
- this was a controlled launch enrichment, not a full model rewrite.

Boundary:

- no further model changes unless a future explicit calibration epic opens.

### D08A — Admin Lab Navigation Cleanup

Status: complete.

Delivered:

- Real Fixture Lab navigation/admin visibility;
- legacy Beta Lab labeling;
- no-provider-predictions/no-betting-odds copy alignment.

---

# MVP 1 — World Cup Launch MVP

## Goal

Ship a safe World Cup-focused product while tournament demand is active.

Core launch promise:

- public basic predictions for selected World Cup fixtures;
- transparent confidence/risk framing;
- registered/free/premium scaffolding without overclaiming;
- internal Lab/evaluation data protected.

## MVP 1 current status

Active / public launch baseline established.

Four real World Cup fixtures are public:

- Mexico vs South Africa — `api-football:fixture:1489369`;
- South Korea vs Czech Republic — `api-football:fixture:1538999`;
- Canada vs Bosnia & Herzegovina — `api-football:fixture:1539000`;
- USA vs Paraguay — `api-football:fixture:1489370`.

Public predictions are no longer generic default clones for the launch window. Static fallback signals now provide non-default team context for the first MVP 1 fixtures.

## Epic E — World Cup Data & Prediction Launch

Status: active.

Purpose: safely ingest selected World Cup fixtures, create internal predictions, publish selected public-safe predictions, and keep publication exact/manual until further evidence supports automation.

### E01 — World Cup Launch Readiness

Status: complete.

Purpose:

- confirm launch-readiness posture after D06/D07;
- establish that World Cup launch work should use safe exact fixtures, not broad ingest.

### E03B — Exact Scheduled World Cup Apply Guard

Status: complete.

Delivered:

- exact World Cup scheduled-fixture apply guard;
- broad World Cup apply remains blocked;
- only one exact scheduled fixture with `limit=1`, explicit `fixtureId`, and explicit date range can apply.

### E03D — Competition Slug Reuse

Status: complete.

Delivered:

- writer reuses existing `competitions.slug='world-cup-2026'` when external id differs/missing;
- avoids duplicate `competitions_slug_key` failure;
- preserves existing non-null legacy/mock external id.

### E03E — Team Slug Reuse

Status: complete.

Delivered:

- writer reuses existing team rows by slug when external id differs/missing;
- avoids duplicate `teams_slug_key` failure;
- Mexico legacy/mock row reused;
- South Africa inserted as API-Football row.

### E04 — First Exact World Cup Fixture Ingest

Status: complete.

Delivered:

- fixture `1489369` read from API-Football;
- dry-run validated;
- exact guarded apply completed;
- match inserted/updated as `admin_only + api_football + scheduled`;
- no public exposure at ingest time.

### E05 — Manual Public Prediction Publication

Status: runtime pass.

Delivered:

- admin-only publication action;
- selected internal prediction cloned into `public_product` prediction version;
- internal prediction row preserved;
- no `prediction_results` exposure;
- match published to `access_scope='public'` through the E05-G RPC.

Runtime winner:

- `0029_manual_publication_match_access_scope_rpc.sql`
- function `publish_real_fixture_match_access_scope(target_match_id uuid, target_match_slug text)`

### E06 / F02 — Public Launch QA and Mock Cleanup

Status: complete baseline.

Goal:

- make sure real public fixtures are understandable and trustworthy;
- prevent mock/previews from being confused with real published predictions.

Delivered:

- homepage no longer reads like an internal milestone memo;
- `/predictions` focuses on real published World Cup fixtures;
- public launch filters exclude legacy/mock rows from launch surfaces;
- public copy clarified probability/risk boundaries;
- session-aware navbar/CTA behavior fixed.

### E07 — Next Exact World Cup Fixture Expansion + Refresh

Status: complete / PR #61 merged.

Goal:

- expand public fixtures and remove default-signal collapse from immediate launch predictions.

Delivered:

- MVP 1 fallback signals for immediate World Cup teams;
- exact public refresh path for already-public fixtures;
- migration `0030_real_fixture_lab_public_refresh_rls.sql`;
- Mexico and South Korea refreshed after fallback signals;
- Canada and USA published with fallback signals active.

Boundaries preserved:

- exact fixture only;
- no broad apply;
- no batch publication;
- no automatic publication;
- no `prediction_results` exposure;
- no provider predictions;
- no betting odds.

### E08 — Public Copy / Confidence / Risk Framing

Status: partially complete.

Delivered through E06/E07:

- public no-guarantee framing;
- high uncertainty copy;
- confidence/risk labels.

Remaining:

- improve interpretation text per access tier;
- avoid making “confidence” look like certainty when 1X2 is close;
- decide how much of scoreline/exact score to show publicly.

### E09 — Access Tiers for Prediction Detail + Scoreline Visibility

Status: next.

Goal:

- define anonymous/free/premium boundaries;
- decide probable score visibility;
- decide top scoreline/BTTS/O-U visibility;
- avoid exposing `prediction_results`;
- keep payment implementation out of scope.

Backlog:

- inspect public query payloads;
- design gated UI blocks;
- ensure free registration has real value;
- reserve deeper analysis for premium future;
- update public copy.

### E10 — Scoreline Calibration + Real Signal Enrichment Plan

Status: next after E09.

Goal:

- address over-conservative `1-1` scoreline tendency;
- plan real team-strength data inputs.

Backlog:

- inspect expected goals and scoreline distribution;
- build calibration tests;
- plan FIFA/Elo/recent-form snapshot source;
- define provenance/source dates;
- consider DB-backed team strength snapshots.

## Epic F — Public Experience & Trust Layer

Status: F01 and F02 baseline complete; access-tier work next.

### F01 — MVP 1 UI Polish

Status: complete.

Delivered:

- Spanish encoding baseline;
- public prediction/detail polish;
- admin/navigation polish;
- no data/model/payment changes.

### F02 — Real-vs-Mock Public Surface Cleanup

Status: complete baseline.

Delivered:

- real published surfaces separated from legacy/mock content;
- launch-safe public filters;
- copy cleanup.

Follow-up:

- mobile polish;
- access-tier UI;
- probable score/premium visibility.

## Epic G — Auth, Paywall, and One-Time Payment Gateway Slice

Status: future / optional parallel.

Goal:

- add a paid/tournament-pass path without distracting from core prediction launch.

Constraints:

- do not assume Stripe;
- evaluate PayPal or selected available/local gateway;
- start with one-time tournament pass/package;
- recurring subscriptions can wait until post-World-Cup.

Backlog:

- G01 payment provider discovery;
- G02 tournament-pass product definition;
- G03 checkout proof-of-concept;
- G04 entitlement activation;
- G05 premium copy/paywall QA.

---

# MVP 1.5 — Live World Cup Iteration

## Goal

Improve during the tournament using real outcomes, user feedback, and operational evidence.

## Epic H — Live Evaluation & Model Iteration

Status: future.

Backlog:

- collect public fixture outcomes;
- verify results;
- evaluate public prediction performance;
- publish aggregate transparency only when sample is meaningful;
- consider planned v0.3 only after evidence.

## Epic I — Workers Lite & Operational Automation

Status: future.

Backlog:

- automate read-only fixture refresh;
- prepare candidate drafts;
- keep publication manual until safe;
- no broad apply without new guards.

## Epic J — Monetization/Product Iteration During Tournament

Status: future.

Backlog:

- adjust copy/pricing;
- use product analytics;
- improve premium hooks;
- avoid overbuilding recurring subscription logic during tournament chaos.

---

# MVP 2 — Post-World-Cup Sustainable Product

## Goal

Turn UFO Predictor into a recurring football prediction product beyond the World Cup.

Likely epics:

- Epic K — Recurring Competitions.
- Epic L — Recurring Payments & Premium Depth.
- Epic M — Model & Transparency Maturity.
- Epic N — Production Operations & Scale.

---

# Current hard boundaries

Do not do these without explicit approval:

- broad World Cup apply;
- broad friendlies apply;
- automatic publication;
- batch publication;
- provider predictions;
- betting odds as hidden model input;
- service-role in app routes;
- public exposure of `prediction_results`;
- large model rewrite before planned calibration;
- editing already-applied migrations.
