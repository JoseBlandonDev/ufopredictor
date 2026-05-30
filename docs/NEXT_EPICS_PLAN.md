# NEXT EPICS PLAN — UFO Predictor

_Last updated: post C05 / pre C06_

Current baseline: `main` is post PR #29 (`Feature/registered free saved matches`). C05 is functionally closed. Next major block: C06 — World Cup Premium Package Foundation.


## Current Position

Completed:

- C01 — Public Predictions From DB
- C02 — Plans & Entitlements Backend
- C03 — Match Detail Public From DB
- C04 — Premium Access Enforcement Skeleton
- C05 — Anonymous vs Registered Free Freemium Boundary / Registered Free Capture

Current app state:

- `/predictions` reads real public predictions from `public_prediction_summaries`.
- `/matches/[slug]` reads real public/free-only match detail from public views.
- `/pricing` reads real active plans/catalog.
- `/dashboard` reads real viewer access summary and saved matches.
- `/admin/beta-lab` remains operational.
- C05 differentiates Anonymous vs Registered Free and gives Registered Free saved-match value.

## Recommended Next Epic: C06

```txt
C06 — World Cup Premium Package Foundation
```

## C06 Goal

Prepare the World Cup package/pass/unlock commercial foundation without serving premium match payload yet.

C06 should answer:

1. What package products exist for the World Cup?
2. How do packages map to existing entitlement/resource concepts?
3. Which packages are visible in public/pricing UI now?
4. Which package definitions need database support?
5. What remains deferred to payments/checkout?
6. What remains deferred to C07 premium projection?

## C06 Candidate Packages

- World Cup Full Pass
- 10 Match Pack
- Single Match Unlock
- Country/Team Pass
- Group Pass
- Stage/Semifinals/Final Pass

## C06 Allowed Scope

Recognition/planning first:

- inspect existing plans/entitlements schema;
- inspect pricing/dashboard access surfaces;
- map packages to entitlement types;
- decide if SQL is needed;
- decide what UI/catalog changes are safe;
- avoid premium payload.

If implementation is approved later:

- add package catalog/seeds/migration if needed;
- add product UI copy/catalog surface if needed;
- add pure mapping helpers/tests if useful.

## C06 Not Allowed Without Explicit Approval

Do not implement:

- checkout;
- Stripe;
- payments;
- public or entitled premium prediction payload;
- `prediction_markets` serving;
- `prediction_narratives` serving;
- `prediction_results` serving;
- odds;
- LLM narratives;
- sports API;
- workers;
- broad Lab/Admin changes.

## After C06

Potential sequence:

1. C06 — World Cup Premium Package Foundation
2. C07 — Entitled Premium Match Projection
3. C08 — Trust / Transparency Real v0.1
4. D — Data Intake / Sports API
5. D/E — Workers Runtime
6. E — Payments / World Cup Packages / Post-World-Cup Subscriptions
7. F — Odds / LLM Explanations
8. G — Google Auth / i18n / Staging / Observability

## Product Strategy Context

UFO Predictor is preparing for a controlled beta/freemium phase before the World Cup.

The beta should:

- show value without giving away premium data;
- build confidence organically;
- avoid mass promotion until model performance, UX, infra, and costs are validated;
- capture Registered Free users before World Cup premium packages.

Funnel:

```txt
Anonymous -> Registered Free -> World Cup premium packages -> post-World-Cup monthly subscriptions
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

## Tool Discipline For C06

ChatGPT should provide:

```txt
EJECUCIÓN RECOMENDADA
...

PROMPT LIMPIO PARA CODEX
...
```

Manual PowerShell/Git handles simple commands. Codex handles repo inspection/implementation.

Use recognition first. Do not jump straight into SQL or premium payload.
