# NEXT EPICS PLAN — UFO Predictor

_Last updated: post PR #21 / C02 Plans & Entitlements Backend_

## Current Position

Completed:

- C01 — Public Predictions From DB
- C02 — Plans & Entitlements Backend

Current app state:

- `/predictions` reads real public predictions.
- `/pricing` reads real active plans.
- `/dashboard` reads real viewer access summary.
- `/admin/beta-lab` remains operational.
- `/matches/[slug]` remains mock.

## Recommended Next Epic: C03

```txt
feature/match-detail-public-from-db
```

## C03 Goal

Connect `/matches/[slug]` to real Supabase data in a public/free-only way.

This is the next best product step because the public listing is now real, but clicking into a match still leads to mock data.

## C03 Allowed Scope

- Fetch match by slug.
- Fetch competition metadata.
- Fetch home/away teams.
- Fetch venue.
- Fetch kickoff/status/stage.
- Fetch public prediction version if available.
- Render a public/basic detail page.
- Keep the page safe for anonymous users.
- Avoid premium fields entirely.

## C03 Not Allowed

Do not implement:

- `prediction_markets` public access;
- `prediction_narratives` public access;
- `prediction_results` public access;
- premium analysis;
- final paywall enforcement;
- payments;
- Stripe;
- checkout;
- odds;
- LLM;
- sports API;
- real workers;
- Lab Admin changes.

## Why Not Premium Yet

C02 created access foundations, but premium projections are not implemented.

Premium serving requires a separate enforcement layer that ensures protected fields never reach the browser without entitlement checks.

C03 should avoid premium entirely and focus on replacing mock detail with real public data.

## Product Strategy Context

UFO Predictor is preparing for a controlled beta/freemium phase before the World Cup.

The beta should:

- show value without giving away all premium data;
- build confidence organically;
- avoid mass promotion until model performance, UX, infra, and costs are validated.

## After C03

Potential next sequence:

1. C03 — Match Detail Public From DB
2. C04 — Premium Access Enforcement Skeleton
3. C05 — Entitled Match Detail Premium Projection
4. C06 — Data Intake / Sports API research or minimal integration
5. C07 — Workers runtime
6. Later — odds, LLM narratives, payments/Stripe, Google Auth

## Supabase Rule For Every Future Epic

Supabase CLI local is not configured.

Codex may create migration files but must not assume they are applied remotely.

The user applies migrations manually in Supabase SQL Editor and validates them before commit/PR.
