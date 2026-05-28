# NEXT EPICS PLAN — UFO Predictor

_Last updated: post C05 Gate 2A / Presentation Boundary sin SQL_

Current baseline: main is post PR #27 (`docs: update project context after c05 gate 1`) and the active working tree includes C05 Gate 2A changes pending commit/PR. Do not assume a future PR number until it is created and merged.


## Current Position

Completed:

- C01 — Public Predictions From DB
- C02 — Plans & Entitlements Backend
- C03 — Match Detail Public From DB
- C04 — Premium Access Enforcement Skeleton
- C05 Gate 0 — Anonymous vs Registered Free Product Audit
- C05 Gate 1 — Registered Free Value Wall
- C05 Gate 2A — Presentation Boundary sin SQL, current branch/pending commit or PR if not merged

Current app state:

- `/predictions` reads real public predictions from `public_prediction_summaries`.
- `/matches/[slug]` reads real public/free-only match detail from `public_match_details` and optional prediction data from `public_prediction_summaries`.
- `/pricing` reads real active plans/catalog.
- `/dashboard` reads real viewer access summary.
- `/admin/beta-lab` remains operational.
- C05 Gate 2A differentiates Anonymous vs Registered Free in presentation only.

## Recommended Next Epic / Gate: C05 Gate 2B

```txt
C05 Gate 2B — Real Data Boundary / Projection Decision
```

## C05 Gate 2B Goal

Decide whether the presentation-only boundary from Gate 2A should become a real backend/data boundary.

Gate 2A deliberately did not change:

- SQL;
- RLS;
- migrations;
- views;
- queries;
- premium tables;
- premium payload.

Gate 2B should answer:

1. Should Anonymous continue seeing full 1X2?
2. Should confidence/risk be separated at DB/query level?
3. Should preview signals require a registered-free projection?
4. Is a new anon vs registered-free view needed?
5. Is RPC/server-only shaping safer?
6. Can this wait until C07 premium projection?

## C05 Gate 2B Allowed Scope

Recognition/planning first:

- inspect current public views and UI rendering;
- compare Anonymous vs Registered Free data shapes;
- evaluate whether any currently displayed field is sensitive;
- propose minimal boundary approach;
- avoid implementation until scope is approved.

If implementation is approved later, possible scope:

- create a new projection view;
- create server-only query shape;
- add tests if pure logic is introduced;
- update UI to consume different shapes.

## C05 Gate 2B Not Allowed Without Explicit Approval

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
- Supabase CLI setup;
- broad dashboard redesign;
- Lab Admin changes.

## After C05 Gate 2B

Potential sequence:

1. C05 Gate 2B — Real Data Boundary / Projection Decision
2. C05 Gate 3 — Registered Free Capture Foundation
3. C06 — World Cup Premium Package Foundation
4. C07 — Entitled Premium Match Projection
5. C08 — Trust / Transparency Real v0.1
6. D — Data Intake / Sports API
7. D/E — Workers Runtime
8. E — Payments / World Cup Packages / Post-World-Cup Subscriptions
9. F — Odds / LLM Explanations
10. G — Google Auth / i18n / Staging / Observability

## Product Strategy Context

UFO Predictor is preparing for a controlled beta/freemium phase before the World Cup.

The beta should:

- show value without giving away all premium data;
- build confidence organically;
- avoid mass promotion until model performance, UX, infra, and costs are validated;
- capture Registered Free users before World Cup premium packages.

Funnel:

```txt
Anonymous -> Registered Free -> World Cup premium packages -> post-World Cup monthly subscriptions
```

## World Cup Commercial Context

World Cup premium is expected to be package/pass/unlock based:

- World Cup Full Pass;
- 10 Match Pack;
- Single Match Unlock;
- Country/Team Pass;
- Group Pass;
- Stage/Semifinals/Final Pass.

Monthly subscriptions come later, after the World Cup, for recurring American/European leagues.

## Tool Discipline For Gate 2B

ChatGPT should provide:

```txt
EJECUCIÓN RECOMENDADA
...

PROMPT LIMPIO PARA CODEX
...
```

Use Codex 5.3-Codex Medium for recognition/planning.

Escalate to stronger model/intelligence only if SQL/RLS/auth/premium access changes are approved.

## Supabase Rule For Every Future Epic

Supabase CLI local is not configured as the normal workflow.

Codex may create migration files but must not assume they are applied remotely.

The user applies migrations manually in Supabase SQL Editor and validates them before commit/PR.
