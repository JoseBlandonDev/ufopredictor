# UFO Predictor — Next Epics Plan

Last refreshed: post-E07 / MVP 1 public fixture expansion and refresh.

This document defines the next executable blocks. It is intentionally shorter than `ROADMAP_AND_BACKLOG.md`.

## Current reality

The public product now has four real World Cup fixtures visible:

- Mexico vs South Africa — `api-football:fixture:1489369`;
- South Korea vs Czech Republic — `api-football:fixture:1538999`;
- Canada vs Bosnia & Herzegovina — `api-football:fixture:1539000`;
- USA vs Paraguay — `api-football:fixture:1489370`.

That means the next work is not “prove the path exists.” It exists. The next work is to decide what product value belongs to anonymous/free/premium tiers and to improve model-output credibility without pretending the current fallback file is a supercomputer. Because it is not. It is a helpful bandage with a passport.

## Completed near-term epics

### E06 / F02 — Public Launch QA and Mock Cleanup

Status: complete baseline.

Delivered:

- public launch surface cleaned;
- primary public predictions are real fixture focused;
- public copy is no longer release-note flavored;
- navbar and CTA session behavior corrected;
- public-safe filters exclude legacy/mock rows from launch surfaces.

### E07 — Next World Cup Fixture Expansion

Status: complete / PR #61 merged.

Delivered:

- additional World Cup fixtures processed;
- fallback signals expanded for immediate launch teams;
- exact public refresh path added;
- migration `0030` applied manually;
- four real fixtures visible publicly.

## Next Epic: E09 — Access Tiers for Prediction Detail + Scoreline Visibility

### Goal

Define and implement the MVP 1 value ladder.

The product must decide what is visible to:

- anonymous users;
- free authenticated users;
- future premium users.

### Why this is next

Right now public cards show 1X2, confidence, and risk. The Lab also has probable score and top scorelines, but those are not clearly positioned in the product. If everything valuable becomes public, registration and premium become decorative buttons. Humanity has tried that monetization plan. It is called “oops.”

### Recommended access direction

| Tier | Suggested visibility |
|---|---|
| Anonymous | Match info, 1X2 probabilities, confidence/risk, no-betting/no-guarantee copy. |
| Free authenticated | Probable score, short interpretation, watchlist/following. |
| Future premium | Top scorelines, BTTS, Over/Under, expanded signal explanation, model movement/history. |

### Scope

- Inspect public prediction queries and payload shape.
- Confirm whether probable score is already public-safe.
- Confirm whether top scorelines / BTTS / O-U are accessible but hidden.
- Decide UI copy and gated blocks.
- Keep payment implementation out of scope.
- Keep `prediction_results` internal.

### Suggested branch

```bash
git checkout main
git pull origin main
git status --short
git checkout -b feature/e09-access-tiers-prediction-detail
git status --short
git branch --show-current
```

### Suggested recognition prompt for Codex

```text
Read-only recognition for E09 access tiers and prediction detail visibility.

Context:
- MVP 1 has four real public World Cup fixtures.
- Public cards show 1X2 + confidence/risk.
- Real Fixture Lab shows probable score/top scorelines internally.
- We need to decide what anonymous, free authenticated, and future premium users can see.

Scope:
- Inspect /predictions, /matches/[slug], dashboard, pricing/access copy, and public Supabase query helpers.
- Do not modify files.
- Do not run SQL writes.
- Do not use service-role.
- Do not expose prediction_results.
- Do not implement payments.

Questions:
1. What fields are available in public_prediction_summaries and public_match_details?
2. Is probable score available from public-safe data already?
3. Are top scorelines, BTTS, and Over/Under available or only in internal payloads?
4. What does anonymous currently see?
5. What does an authenticated free user currently see?
6. What would require a migration/view change?
7. What is the smallest safe implementation slice?
8. What files would likely change?
9. What tests/build validation should run?

Return a read-only report and a minimal recommendation. Do not edit files.
```

## Next after E09: E10 — Scoreline Calibration + Real Signal Enrichment Plan

### Goal

Improve credibility of exact-score/probable-score outputs and plan real data enrichment.

### Why this matters

The current model now differentiates fixtures better after fallback expansion, but scoreline generation still leans too much toward `1-1`. That is fine as a cautious baseline, but awkward as a product if every match appears to be spiritually drawn.

### Scope

- inspect expected goals / scoreline generation;
- understand why favorites still often show `1-1` as top scoreline;
- design calibration tests;
- plan real data inputs;
- avoid hidden betting odds/provider predictions.

### Potential real data sources/features

- FIFA ranking snapshots;
- Elo-style ratings;
- recent form;
- attack/defense signals;
- competition context;
- source/provenance dates;
- DB-backed team strength snapshots.

### Boundary

Recognition/planning first. No large model rewrite during public launch without an explicit implementation slice.

## Later: H01 — Result Verification for Public Fixtures

### Trigger

Open after one or more public World Cup fixtures finish.

### Goal

- ingest real result;
- verify result;
- persist internal evaluation;
- decide public result display;
- keep `prediction_results` internal.

### Public transparency caution

Do not publish model-performance claims from one or two matches as if statistics resigned and handed us the keys.

## Optional parallel: Epic G — Payment/Tournament Pass Discovery

### Goal

Prepare monetization without derailing the product surface.

### Constraints

- do not assume Stripe;
- evaluate PayPal or selected available gateway;
- one-time tournament pass first;
- recurring subscriptions later.

### Best parallel shape

Discovery only until access tiers are defined. No checkout implementation until product value is clear.

## Current no-go list

- broad World Cup apply;
- automatic publication;
- batch publication;
- service-role in app routes;
- provider predictions;
- betting odds as hidden model input;
- model rewrite without planned calibration scope;
- premium market copy without access-tier decision;
- public `prediction_results`;
- editing already-applied migrations.
