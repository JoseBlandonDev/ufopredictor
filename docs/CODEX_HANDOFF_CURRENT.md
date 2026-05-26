# CODEX HANDOFF CURRENT — UFO Predictor

_Last updated: post PR #21 / C02 Plans & Entitlements Backend_

## Role For Codex

You are the implementation assistant for the UFO Predictor repository.

You must follow project scope strictly.

Do not create broad features, do not infer missing business logic, and do not assume Supabase remote migrations are applied automatically.

## Current Git Baseline

Current main includes:

```txt
cc68936 Merge pull request #21 from JoseBlandonDev/feature/plans-entitlements-backend
```

Recent PRs:

| PR | Title | Status |
|---:|---|---|
| #18 | `feat: persist lab evaluations` | Done |
| #19 | `docs: update project context after lab admin flow` | Done |
| #20 | `feat: read public predictions from db` | Done |
| #21 | `feat: add plans entitlements backend` | Done |

Before any new work, run:

```bash
git checkout main
git pull origin main
git status
git branch
git log --oneline -5
```

## Current Supabase Remote State

Remote Supabase has been manually migrated through:

```txt
0012_plans_entitlements_backend.sql
```

Important applied migrations:

- `0011_public_prediction_reads.sql`
- `0012_plans_entitlements_backend.sql`

## Critical Supabase Rule

Supabase CLI local is not configured.

Codex must not assume migrations are applied remotely.

Codex may create SQL migration files, but the user applies them manually in Supabase SQL Editor.

For every migration task, Codex must:

1. Create the local migration file.
2. Show the complete SQL in the final response.
3. Provide validation queries.
4. State clearly that the migration has not been applied remotely unless the user confirms it.
5. Not claim remote validation until the user applies the SQL manually and shares results.

## Current Functional State

### `/admin/beta-lab`

Operational internal Lab workflow.

Can:

- read Lab fixtures;
- review fixtures;
- create/edit match results;
- read internal prediction markets;
- persist/update prediction results;
- show readiness and persisted evaluation metrics.

Do not touch unless explicitly requested.

Still mock:

- worker runs.

### `/predictions`

Reads real public prediction data from Supabase.

Implemented in C01.

Must remain public/basic only.

Do not expose:

- internal Lab fixtures;
- premium matches;
- prediction markets;
- prediction narratives;
- prediction results;
- evaluation metrics.

### `/pricing`

Reads real active plan catalog from Supabase.

Implemented in C02.

No checkout, payments, or Stripe.

### `/dashboard`

Reads current user's access summary from Supabase.

Implemented in C02.

Shows:

- role;
- active subscriptions;
- current entitlements;
- current match unlocks.

Does not serve premium prediction content.

### `/matches/[slug]`

Still mock.

Recommended next work is to connect it to DB in public/free-only mode.

## Product Principle

The statistical model calculates.

The AI explains.

Do not use LLMs to generate prediction probabilities.

## C01 Summary — Public Predictions From DB

Status: Done.

Files:

- `app/predictions/page.tsx`
- `components/public-prediction-card.tsx`
- `lib/supabase/public-prediction-queries.ts`
- `supabase/migrations/0011_public_prediction_reads.sql`

Scope:

- public predictions listing from Supabase;
- public product only;
- no Lab;
- no premium;
- no match detail real data.

## C02 Summary — Plans & Entitlements Backend

Status: Done.

Files:

- `app/pricing/page.tsx`
- `app/dashboard/page.tsx`
- `components/plan-card.tsx`
- `lib/supabase/entitlement-queries.ts`
- `lib/permissions/entitlements.ts`
- `lib/permissions/entitlements.test.ts`
- `supabase/migrations/0012_plans_entitlements_backend.sql`
- `lib/supabase/README.md`
- `lib/permissions/README.md`

Scope:

- public active plans;
- public plan features;
- own-row subscriptions;
- own-row current entitlements;
- own-row current match unlocks;
- pure permission logic;
- tests for entitlement decisions;
- `/pricing` from DB;
- `/dashboard` from DB.

Key rules:

- `premium_user` does not unlock all content.
- Active subscription does not unlock protected content by itself.
- Entitlements/unlocks are the effective access source.
- Beta free access must be server-controlled.
- Admin bypass is explicit, not automatic everywhere.

## Beta / Freemium Product Strategy

UFO Predictor should support a controlled beta/freemium phase before the World Cup.

The strategy:

- expose useful free value;
- do not give away all premium data;
- avoid mass advertising until results, UX, infrastructure, and costs are validated;
- start organically with finals, friendlies, and pre-World Cup fixtures.

Free infrastructure tiers may be used during beta, but costs are expected later.

## Plans And Permissions Strategy

Do not create many public-facing plans unless product needs it.

Prefer few commercial plans with granular internal rights.

Potential visible plans:

- Free
- 10 Match Pack
- World Cup Pass
- Team Pass
- Semifinals / Final Pass
- Premium Monthly later

Internal access models:

- competition entitlement;
- stage entitlement;
- team entitlement;
- match unlock;
- quantity / pack consumption.

Future work must define how entitlements translate to concrete match access.

## Recommended Next Epic

```txt
feature/match-detail-public-from-db
```

Goal:

Connect `/matches/[slug]` to real DB data with public/free-only projection.

Allowed:

- match;
- competition;
- teams;
- venue;
- kickoff;
- status/stage;
- public prediction basics if available.

Not allowed:

- premium markets;
- premium narratives;
- prediction results/evaluations;
- final paywall enforcement;
- payments;
- Stripe;
- checkout;
- odds;
- LLM;
- workers;
- sports API.

## Required Codex Behavior

For the next epic, Codex should first do recognition only.

Do not implement immediately.

Recognition should inspect:

- current main;
- route `/matches/[slug]`;
- public prediction query module;
- entitlement logic;
- existing mock data contracts;
- Supabase schema/types;
- current RLS policies relevant to public match data.

Then propose minimal implementation scope.

## Out Of Scope Until Explicitly Approved

Do not implement:

- payments;
- Stripe;
- checkout;
- premium content serving;
- public `prediction_markets`;
- public `prediction_narratives`;
- public `prediction_results`;
- odds;
- LLM;
- real workers;
- sports API;
- Google Auth;
- Supabase CLI setup;
- broad dashboard redesign;
- Lab Admin changes.

## Validation Expectations

Before any commit:

```bash
git diff --check
npm run test
npm run lint
npm run build
git status --short
git diff --name-only
git diff --stat
```

If `next-env.d.ts` changes:

```bash
git restore next-env.d.ts
```

For migrations:

- user applies SQL manually;
- run SQL validation;
- run UI validation;
- then commit/push/PR.
