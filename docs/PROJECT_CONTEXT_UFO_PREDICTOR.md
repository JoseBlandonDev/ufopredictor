# PROJECT CONTEXT — UFO Predictor

_Last updated: post C05 Gate 2A / Presentation Boundary sin SQL_

Current baseline: main is post PR #27 (`docs: update project context after c05 gate 1`) and the active working tree includes C05 Gate 2A changes pending commit/PR. Do not assume a future PR number until it is created and merged.


UFO Predictor is a football prediction app being built toward a controlled public beta before the World Cup.

The app currently combines:

- internal Lab workflows;
- public prediction listing;
- public/free match detail;
- beta plan catalog;
- entitlement/access foundations;
- registered-free value messaging;
- presentation-level Anonymous vs Registered Free differentiation;
- future premium access and World Cup packages.

## Current Baseline

Main includes PR #27.

Completed:

- Lab Admin Flow through persisted evaluations;
- C01 public predictions from DB;
- C02 plans and entitlements backend;
- C03 public match detail from DB;
- C04 premium access enforcement skeleton;
- C05 Gate 0 product audit;
- C05 Gate 1 registered free value wall;
- C05 Gate 2A presentation boundary without SQL, pending commit/PR if active branch.

## Current Supabase State

Remote Supabase migrations are manually applied through `0013_public_match_detail_projection_hardening.sql`.

Supabase CLI local is not configured as the normal workflow.

## Current Product State

- `/predictions` is real/public DB-backed through `public_prediction_summaries`.
- `/matches/[slug]` is real/public/free-only through `public_match_details` and `public_prediction_summaries`.
- `/pricing` is real/catalog DB-backed, no checkout.
- `/dashboard` is real/user-access DB-backed.
- `/admin/beta-lab` is operational.
- C05 Gate 2A differentiates UI/presentation between Anonymous and Registered Free using existing public data.

## Product Strategy

Funnel:

```txt
Anonymous -> Registered Free -> World Cup premium packages -> post-World Cup monthly subscriptions
```

Beta/freemium organic before the World Cup.

Show controlled free value, protect premium, validate before mass promotion.

Before the World Cup, use finals, friendlies, and attractive fixtures to validate the model and product.

## Commercial Strategy

World Cup monetization should use packages/passes/unlocks:

- World Cup Full Pass;
- 10 Match Pack;
- Single Match Unlock;
- Country/Team Pass;
- Group Pass;
- Stage/Semifinals/Final Pass.

Monthly subscriptions are expected after the World Cup for recurring American/European league coverage.

## Tooling Strategy

ChatGPT plans and reviews.

Codex executes controlled repository work.

Antigravity and OpenCode are auxiliary tools.

Manual user steps apply Supabase migrations and validate remote state.

ChatGPT-generated Codex work must separate:

- `EJECUCIÓN RECOMENDADA`
- `PROMPT LIMPIO PARA CODEX`

## Next Task

Recommended next decision:

```txt
C05 Gate 2B — Real Data Boundary / Projection Decision
```

Decide whether Gate 2A should stay presentation-only or become a real backend/data boundary.
