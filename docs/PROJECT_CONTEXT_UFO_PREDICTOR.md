# PROJECT CONTEXT — UFO Predictor

_Last updated: post PR #23 / C03 Match Detail Public From DB_

UFO Predictor is a football prediction app being built toward a controlled public beta before the World Cup.

The app currently combines:

- internal Lab workflows;
- public prediction listing;
- public/free match detail;
- beta plan catalog;
- entitlement/access foundations;
- future premium access.

## Current Baseline

Main includes PR #23.

Completed:

- Lab Admin Flow through persisted evaluations;
- C01 public predictions from DB;
- C02 plans and entitlements backend;
- C03 public match detail from DB.

## Current Supabase State

Remote Supabase migrations are manually applied through `0013_public_match_detail_projection_hardening.sql`.

Supabase CLI local is not configured.

## Current Product State

- `/predictions` is real/public DB-backed through `public_prediction_summaries`.
- `/matches/[slug]` is real/public/free-only through `public_match_details` and `public_prediction_summaries`.
- `/pricing` is real/catalog DB-backed.
- `/dashboard` is real/user-access DB-backed.
- `/admin/beta-lab` is operational.

## Product Strategy

Beta/freemium organic before the World Cup.

Show controlled free value, protect premium, validate before mass promotion.

## Tooling Strategy

ChatGPT plans and reviews.

Codex executes controlled repository work.

Antigravity and OpenCode are auxiliary tools.

Manual user steps apply Supabase migrations and validate remote state.

Every ChatGPT-generated Codex prompt must include the required execution card.

## Next Task

Recommended next epic:

```txt
feature/premium-access-enforcement-skeleton
```

Create premium access enforcement skeleton before serving premium data.
