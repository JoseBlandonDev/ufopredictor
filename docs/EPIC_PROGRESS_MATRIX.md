# EPIC PROGRESS MATRIX — UFO Predictor

_Last updated: post C05 / pre C06_

Current baseline: `main` is post PR #29 (`Feature/registered free saved matches`). C05 is functionally closed. Next major block: C06 — World Cup Premium Package Foundation.


## Current Epic Position

The project is at the end of C05 and ready to start C06.

## Progress Matrix

| Epic / Gate | Status | Notes |
|---|---:|---|
| Lab Admin Flow | ✅ Done | Internal Lab workflow operational |
| C01 — Public Predictions From DB | ✅ Done | `/predictions` reads public data from Supabase |
| C02 — Plans & Entitlements Backend | ✅ Done | Plans, subscriptions, entitlements, dashboard access summary |
| C03 — Match Detail Public From DB | ✅ Done | `/matches/[slug]` reads public views |
| C04 — Premium Access Enforcement Skeleton | ✅ Done | Pure server-side access resolver, no premium payload |
| C05 Gate 0 — Anonymous vs Registered Free Audit | ✅ Done | Product decision/audit |
| C05 Gate 1 — Registered Free Value Wall | ✅ Done | UI/copy value wall in Spanish |
| C05 Gate 2A — Presentation Boundary sin SQL | ✅ Done | UI/render boundary only |
| C05 Gate 2B — Server-side Anonymous Payload Shaping | ✅ Done | Anonymous DTO excludes confidence/risk |
| C05 Gate 3 — Saved Matches / Watchlist Foundation | ✅ Done | Save/remove public matches + dashboard list |
| C06 — World Cup Premium Package Foundation | ⏭ Next | Package/pass/unlock foundation; no premium payload yet |
| C07 — Entitled Premium Match Projection | Future | Protected premium content serving |
| C08 — Trust / Transparency Real v0.1 | Future | Replace simulated transparency |
| D — Data Intake / Sports API | Future | Provider selection and integration |
| D/E — Workers Runtime | Future | Real workers and scheduled processing |
| E — Payments / Packages / Subscriptions | Future | Stripe/payments when package scope is explicit |
| F — Odds / LLM Explanations | Future | Deferred until product/legal/technical readiness |
| G — Google Auth / i18n / Staging / Observability | Future | Platform maturity tracks |

## C05 Completion Details

C05 delivered the full Anonymous -> Registered Free foundation:

- registered free value wall;
- presentation boundary;
- server-side DTO shaping;
- saved matches/watchlist;
- saved matches dashboard surface.

## Supabase Milestone

Remote Supabase is applied through:

```txt
0014_user_saved_matches.sql
```

## Next Gate / Epic

```txt
C06 — World Cup Premium Package Foundation
```

C06 should define package foundations and access mapping without serving protected premium prediction payload yet.
