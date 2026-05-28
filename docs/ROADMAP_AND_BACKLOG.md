# ROADMAP AND BACKLOG — UFO Predictor

_Last updated: post PR #26 / C05 Gate 1 Registered Free Value Wall_

## Roadmap snapshot

```text
A/B Foundation + Lab ✅
C01-C03 Public DB-backed surfaces ✅
C04 Premium access enforcement skeleton ✅
C05 Gate 0 Product audit ✅
C05 Gate 1 Registered Free value wall ✅
C05 Gate 2 Data boundary ⏭️
C05 Gate 3 Registered Free capture ⏳
C06 World Cup premium package foundation ⏳
C07 Entitled premium match projection ⏳
C08 Trust/transparency real ⏳
D Sports data/API/workers ⏳
E Payments/packages/subscriptions ⏳
F AI explanations ⏳
G i18n/auth/infra hardening ⏳
```

## Immediate backlog

### C05 Gate 2 — Data Boundary

- Audit current `public_prediction_summaries` and `public_match_details` fields.
- Define field split across Anonymous, Registered Free, World Cup Packages, Post-World Cup Subscription.
- Decide whether 1X2 full probabilities stay public or move behind free registration.
- Decide whether new views/projections are required.
- Do not open premium base tables.

### C05 Gate 3 — Registered Free Capture

- Favorites/watchlist.
- Team/competition preferences.
- Basic usage/interest events.
- Preview signal interest.
- Onboarding questions.

### C06 — World Cup Premium Package Foundation

Candidate package backlog:

- Full World Cup Pass.
- 10 Match Pack.
- Single Match Unlock.
- Country/Team Pass.
- Group Pass.
- Stage Pass.
- Semifinals / Final Pass.

### C07 — Premium Projection

- Define premium field boundary.
- Choose view/RPC/server-only query pattern.
- Integrate C04 resolver before querying/returning payload.
- Add tests and manual Supabase validation.

## Product backlog

- Spanish UI consistency until i18n.
- Future EN/ES i18n.
- Public CTA refinement.
- Dashboard value improvements.
- Pricing copy for World Cup packages.
- Trust Center real metrics.

## Deferred

- Monthly subscriptions after World Cup.
- Sports API provider integration.
- Workers automation.
- Odds/model-vs-market.
- LLM narratives.
- Google Auth.
- Staging/observability.
