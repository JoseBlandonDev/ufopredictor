# CURRENT PROJECT STATUS — UFO Predictor

_Last updated: post PR #21 / C02 Plans & Entitlements Backend_

## Executive Summary

UFO Predictor has completed the internal Lab Admin Flow, public predictions from DB, and the backend foundation for plans and entitlements.

Current baseline:

```txt
main includes PR #21: feat: add plans entitlements backend
```

The project now has:

- internal Lab workflow using Supabase;
- public predictions listing from Supabase;
- public beta plans catalog from Supabase;
- authenticated dashboard access summary from Supabase;
- pure entitlement logic with tests;
- manual Supabase migrations applied through `0012`.

The next recommended feature is:

```txt
feature/match-detail-public-from-db
```

This should connect `/matches/[slug]` to real DB data in a public/free-only way.

## Recent PRs

| PR | Title | Status |
|---:|---|---|
| #18 | `feat: persist lab evaluations` | Done |
| #19 | `docs: update project context after lab admin flow` | Done |
| #20 | `feat: read public predictions from db` | Done |
| #21 | `feat: add plans entitlements backend` | Done |

## Supabase Remote State

Remote Supabase has been updated manually through:

```txt
0012_plans_entitlements_backend.sql
```

Important applied migrations:

| Migration | Purpose | Remote Applied |
|---|---|---|
| `0011_public_prediction_reads.sql` | Public read policies for public predictions | Yes, manually |
| `0012_plans_entitlements_backend.sql` | Plans and own-row entitlement reads | Yes, manually |

## Supabase Migration Rule

Supabase CLI local is not configured.

Codex does not apply migrations to remote Supabase.

Codex may create SQL migration files, but the user must apply them manually in Supabase SQL Editor.

Do not treat a migration as active until manual application and validation are confirmed.

Required validation after migration:

1. Inspect SQL.
2. Apply in Supabase SQL Editor.
3. Validate policies in `pg_policies`.
4. Validate grants.
5. Validate `anon` and `authenticated` behavior.
6. Validate UI.
7. Run `npm run test`, `npm run lint`, and `npm run build`.
8. Restore `next-env.d.ts` if modified by build.

## Current Route Status

| Route | Status |
|---|---|
| `/` | Prototype landing page, still contains simulated featured predictions |
| `/predictions` | Real public predictions from Supabase |
| `/pricing` | Real active plans catalog from Supabase |
| `/dashboard` | Authenticated viewer access summary from Supabase |
| `/admin` | Admin shell, partially mock |
| `/admin/beta-lab` | Internal Lab workflow operational |
| `/matches/[slug]` | Still mock |
| `/transparency` | Still simulated transparency metrics |
| `/login`, `/register`, `/auth/callback` | Auth foundation present |

## `/admin/beta-lab`

Current real capabilities:

- reads Lab fixtures from Supabase;
- supports fixture review;
- supports match result creation/editing;
- reads internal `prediction_markets`;
- persists/updates `prediction_results`;
- displays readiness and persisted evaluation metrics.

Still mock:

- worker runs.

## `/predictions`

Implemented by C01.

Reads public predictions from Supabase.

Safety constraints:

- only public product competitions;
- only public matches;
- only public product prediction versions;
- no Lab data;
- no premium markets;
- no premium narratives;
- no prediction results;
- no premium analysis.

Relevant files:

- `app/predictions/page.tsx`
- `components/public-prediction-card.tsx`
- `lib/supabase/public-prediction-queries.ts`
- `supabase/migrations/0011_public_prediction_reads.sql`

## `/pricing`

Implemented by C02.

Reads active visible plans and public plan features from Supabase.

Current constraints:

- no checkout;
- no payments;
- no Stripe;
- no purchase flow;
- plan features are treated as public catalog/marketing values.

Relevant files:

- `app/pricing/page.tsx`
- `components/plan-card.tsx`
- `lib/supabase/entitlement-queries.ts`
- `supabase/migrations/0012_plans_entitlements_backend.sql`

## `/dashboard`

Implemented by C02 as a real access summary.

Reads:

- current profile role;
- active subscriptions;
- current entitlements;
- current match unlocks.

It does not serve premium prediction content.

Relevant files:

- `app/dashboard/page.tsx`
- `lib/supabase/entitlement-queries.ts`
- `lib/permissions/entitlements.ts`

## Entitlements Foundation

C02 added pure access logic.

Access sources:

- `public_basic_access`
- `beta_free_access`
- `entitlement_access`
- `admin_access`
- `none`

Important rules:

- `premium_user` role does not unlock all content by itself.
- Active subscription does not unlock protected content by itself.
- Protected access requires entitlement or match unlock unless an explicit admin/beta rule applies.
- Beta free access must be assembled server-side, never from client input.

Tests:

- `lib/permissions/entitlements.test.ts`

## Product Strategy

UFO Predictor is preparing for a beta/freemium organic phase before the World Cup.

The beta should:

- show useful free value;
- avoid giving away all premium data;
- avoid mass advertising until the model, UX, infrastructure, and costs are validated;
- allow organic testing with finals, friendlies, and pre-World Cup fixtures.

Infrastructure may begin on free tiers, but costs are expected later for:

- Supabase;
- Railway;
- sports data APIs;
- odds APIs;
- LLM usage if added;
- workers and cron.

## Plans Strategy

The product should avoid too many public-facing plans.

Visible plans should be few and understandable.

Potential plan types:

- Free
- 10 Match Pack
- World Cup Pass
- Team Pass
- Semifinals / Final Pass
- Premium Monthly later

Internal access should be granular:

- competition entitlement;
- stage entitlement;
- team entitlement;
- match unlock;
- quantity / pack consumption.

Future work must define how those entitlements translate into access to concrete matches.

## Not Implemented Yet

Still missing:

- real `/matches/[slug]`;
- final premium enforcement;
- public/premium-safe `prediction_markets`;
- public/premium-safe `prediction_narratives`;
- public/premium-safe `prediction_results`;
- payments;
- Stripe;
- checkout;
- odds;
- LLM;
- real workers;
- sports API;
- Google Auth;
- Supabase CLI local;
- staging final.

## Recommended Next Epic

```txt
feature/match-detail-public-from-db
```

Goal:

Connect `/matches/[slug]` to Supabase using only public/free data.

Allowed:

- match metadata;
- competition;
- home/away teams;
- venue;
- kickoff;
- stage/status;
- public prediction basics.

Not allowed:

- premium markets;
- premium narratives;
- prediction results/evaluations;
- final paywall;
- payments;
- odds;
- LLM;
- workers;
- API sports integration.
