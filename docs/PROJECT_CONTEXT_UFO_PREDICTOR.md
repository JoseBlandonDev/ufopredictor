# PROJECT CONTEXT — UFO Predictor

_Last updated: post PR #21 / C02 Plans & Entitlements Backend_

UFO Predictor is a football prediction app being built toward a controlled public beta before the World Cup.

The app currently combines:

- internal Lab workflows;
- public prediction listing;
- beta plan catalog;
- entitlement/access foundations;
- future premium access.

## Current Baseline

Main includes PR #21.

Completed:

- Lab Admin Flow through persisted evaluations;
- C01 public predictions from DB;
- C02 plans and entitlements backend.

## Current Supabase State

Remote Supabase migrations are manually applied through `0012_plans_entitlements_backend.sql`.

Supabase CLI local is not configured.

## Current Product State

- `/predictions` is real/public DB-backed.
- `/pricing` is real/catalog DB-backed.
- `/dashboard` is real/user-access DB-backed.
- `/admin/beta-lab` is operational.
- `/matches/[slug]` is mock.

## Product Strategy

Beta/freemium organic before the World Cup.

Show controlled free value, protect premium, validate before mass promotion.

## Next Task

Recommended next epic:

```txt
feature/match-detail-public-from-db
```

Connect `/matches/[slug]` with public/free-only DB data.
