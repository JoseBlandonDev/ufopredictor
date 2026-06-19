# Roadmap and Backlog - UFO Predictor

_Last refreshed: post PR #94 model closeout / Wompi production premium baseline / 28-fixture evaluation closeout (2026-06-19)._

## Completed / operational

### Public Prediction MVP

Public World Cup prediction list/detail, verified final-result display, and internal evaluation separation.

### Premium Prediction Detail and Free Gate

Protected premium model detail and registered-free probable-score gating are operational.

### Data Ops 01-04

Operational fixture publication, result review/evaluation, public runway management, and model/data refresh through PR #94.

### Real Fixture Publish Queue

Admin-only lightweight exact-fixture save/publish path.

### Torneo Mundialista Export

Admin public-safe JSON export implemented.

### Epic G platform/monetization baseline

- G01 auth foundation: done.
- G02 dev/prod/config readiness: done.
- G04 plans/pricing/admin pricing baseline: implemented.
- G05 Wompi checkout/payment integration: operational.
- G06 entitlement activation: operational.
- G07 premium-active UX/gate experience: operational.

G08 trust/legal copy still requires final production verification.

### Model refresh PR #94

- SIGNAL04 retained.
- DRAW01 retained.
- expected-goals formula unchanged.
- 28-fixture fair evaluation closeout documented.

## Immediate backlog

### Documentation closeout

Merge refreshed canonical docs and update ChatGPT project sources before opening the next fixture/model conversation.

### Data Ops 05 / next runway

Monitor current four fixtures, process exact final results, then load/publish the next approved runway after sanity review.

### UIHISTORY01

Limit `/predictions` to four recent verified results and add paginated `/predictions/history`.

### Real Fixture Lab cleanup

Fix exact-detail stack overflow without regressing focused queues.

## Model/data backlog

### Repeatable signal refresh

Use the documented FIFA CSV + Elo ranking/results HTML package workflow with a required quality report.

### Future xG research

Separate later project. Do not reopen current formula from fixture intuition alone.

### Venue/stadium metadata

Add only after provider reliability is reviewed.

## Epic G launch-week parallel backlog

### G09 Mobile and Responsive Launch Polish

Public/account/premium/payment presentation only. No business-logic changes.

### G10 PWA Installability MVP

Manifest, icons, standalone metadata, mobile installability. No aggressive caching.

### G11 PWA Update and Offline Safety

Service-worker version/update plan and public-shell-only offline strategy. May be deferred if risky.

### G12 Accessibility and Performance Launch Pass

Lighthouse, keyboard/focus, contrast, touch targets, LCP/CLS, console errors, heavy routes.

### G13 Cross-Device Production Smoke Test

Android Chrome, iOS Safari, desktop browsers, anonymous/free/premium/admin/payment flows.

### G14 Launch Coordination and Parallel Ownership

Explicit file ownership. Parallel contributors do not edit canonical docs, model, ingest, results, migrations, Wompi webhook, or entitlements without assignment.

## Non-goals / guardrails

No public `prediction_results`, no hidden provider odds/predictions, no Torneo human-pick model input, no raw refresh package runtime import, no client payment secrets, and no combined model/publication mega-slices.
