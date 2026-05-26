# NEXT EPICS PLAN — UFO Predictor

_Last updated: post PR #23 / C03 Match Detail Public From DB_

## Current Position

Completed:

- C01 — Public Predictions From DB
- C02 — Plans & Entitlements Backend
- C03 — Match Detail Public From DB

Current app state:

- `/predictions` reads real public predictions from `public_prediction_summaries`.
- `/matches/[slug]` reads real public/free-only match detail from `public_match_details` and optional prediction data from `public_prediction_summaries`.
- `/pricing` reads real active plans.
- `/dashboard` reads real viewer access summary.
- `/admin/beta-lab` remains operational.

## Recommended Next Epic: C04

```txt
feature/premium-access-enforcement-skeleton
```

## C04 Goal

Create the server-side premium access enforcement skeleton before exposing any premium match detail data.

C04 exists because C02 created entitlements and C03 created safe public match detail, but premium data still needs a hard backend access boundary before it can be served.

## C04 Allowed Scope

- Inspect entitlement/access logic from C02.
- Inspect public projection boundaries from C03.
- Define free vs protected field boundaries.
- Prepare server-only premium access query patterns.
- Add or refine pure tests for entitlement/match access resolution.
- Keep `prediction_markets`, `prediction_narratives`, and `prediction_results` closed publicly.
- Keep `/matches/[slug]` public/free-only unless an explicitly safe protected projection is approved.

## C04 Not Allowed

Do not implement:

- public `prediction_markets` access;
- public `prediction_narratives` access;
- public `prediction_results` access;
- final premium match detail UI;
- payments;
- Stripe;
- checkout;
- odds;
- LLM;
- sports API;
- real workers;
- Google Auth;
- Supabase CLI setup.

## Why Not Premium Detail Immediately

C02 created access foundations, but premium serving still requires server-side projection filtering.

C03 proved the pattern for public/free-only projections. C04 should extend the discipline to protected access without leaking premium fields.

Visual locks are not authorization. Apparently this must be said because frontend locks are the cardboard doors of security.

## Product Strategy Context

UFO Predictor is preparing for a controlled beta/freemium phase before the World Cup.

The beta should:

- show value without giving away all premium data;
- build confidence organically;
- avoid mass promotion until model performance, UX, infra, and costs are validated.

## After C04

Potential sequence:

1. C04 — Premium Access Enforcement Skeleton
2. C05 — Entitled Match Detail Premium Projection
3. C06 — Data Intake / Sports API research or minimal integration
4. C07 — Workers runtime
5. Later — odds, LLM narratives, payments/Stripe, Google Auth

## Tool Discipline For C04

Any prompt from ChatGPT to Codex must include the execution card.

C04 should use:

- Tool: Codex
- Intensity: Alto/Fuerte
- Mode: recognition first, no changes
- Reason: premium enforcement touches authorization and possible premium leakage
- Return to ChatGPT: after recognition and before implementation

## Supabase Rule For Every Future Epic

Supabase CLI local is not configured.

Codex may create migration files but must not assume they are applied remotely.

The user applies migrations manually in Supabase SQL Editor and validates them before commit/PR.
