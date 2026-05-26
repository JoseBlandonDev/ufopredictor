# CODEX HANDOFF CURRENT — UFO Predictor

_Last updated: post PR #23 / C03 Match Detail Public From DB_

## Role For Codex

You are the implementation assistant for the UFO Predictor repository.

You must follow project scope strictly.

Do not create broad features, do not infer missing business logic, and do not assume Supabase remote migrations are applied automatically.

## Required Prompt Execution Card

Every ChatGPT-generated Codex prompt for UFO Predictor must begin with:

```txt
USO RECOMENDADO:
- Herramienta:
- Modelo/intensidad:
- Modo:
- Motivo:
- Riesgo:
- Scope permitido:
- No tocar:
- Validaciones:
- Debo volver a ChatGPT cuando:

PROMPT PARA CODEX:
...
```

This card controls tool choice, cost, risk, and scope. Codex remains the controlled repository execution layer. ChatGPT handles planning, review, and documentation. Antigravity and OpenCode are auxiliary tools only.

For C04/premium enforcement work, use Codex Alto/Fuerte because the work touches authorization and premium data boundaries.

## Current Git Baseline

Current main includes:

```txt
PR #23 — feat: read public match detail from db
```

Recent PRs:

| PR | Title | Status |
|---:|---|---|
| #18 | `feat: persist lab evaluations` | Done |
| #19 | `docs: update project context after lab admin flow` | Done |
| #20 | `feat: read public predictions from db` | Done |
| #21 | `feat: add plans entitlements backend` | Done |
| #22 | `docs: update project context after c02` | Done |
| #23 | `feat: read public match detail from db` | Done |

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
0013_public_match_detail_projection_hardening.sql
```

Important applied migrations:

- `0011_public_prediction_reads.sql`
- `0012_plans_entitlements_backend.sql`
- `0013_public_match_detail_projection_hardening.sql`

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

Reads real public prediction data from Supabase through:

```txt
public_prediction_summaries
```

Must remain public/basic only.

Do not expose:

- internal Lab fixtures;
- premium matches;
- prediction markets;
- prediction narratives;
- prediction results;
- evaluation metrics;
- expected goals;
- scorelines;
- premium analysis.

### `/matches/[slug]`

Reads real public/free-only match detail from Supabase through:

```txt
public_match_details
public_prediction_summaries
```

Must remain public/free-only until premium access enforcement exists.

Allowed public fields:

- match metadata;
- competition metadata;
- home/away teams;
- venue;
- kickoff;
- stage/status;
- public 1X2/confidence/risk when available.

Do not expose premium fields.

### `/pricing`

Reads real active plan catalog from Supabase.

No checkout, payments, or Stripe.

### `/dashboard`

Reads current user's access summary from Supabase.

Shows:

- role;
- active subscriptions;
- current entitlements;
- current match unlocks.

Does not serve premium prediction content.

## C01 Summary — Public Predictions From DB

Status: Done.

Current public predictions now use `public_prediction_summaries` from C03.

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

Key rules:

- `premium_user` does not unlock all content.
- Active subscription does not unlock protected content by itself.
- Entitlements/unlocks are the effective access source.
- Beta free access must be server-controlled.
- Admin bypass is explicit, not automatic everywhere.

## C03 Summary — Match Detail Public From DB

Status: Done.

Files:

- `app/matches/[slug]/page.tsx`
- `app/predictions/page.tsx`
- `components/public-prediction-card.tsx`
- `lib/supabase/public-match-detail-queries.ts`
- `lib/supabase/public-prediction-queries.ts`
- `supabase/migrations/0013_public_match_detail_projection_hardening.sql`

Scope:

- public match detail from DB;
- public prediction summaries through explicit views;
- anon hardened to public views only;
- no premium data opened.

## Product Principle

The statistical model calculates.

The AI explains.

Do not use LLMs to generate prediction probabilities.

## Beta / Freemium Product Strategy

UFO Predictor should support a controlled beta/freemium phase before the World Cup.

The strategy:

- expose useful free value;
- do not give away all premium data;
- avoid mass advertising until results, UX, infrastructure, and costs are validated;
- start organically with finals, friendlies, and pre-World Cup fixtures.

## Recommended Next Epic

```txt
feature/premium-access-enforcement-skeleton
```

Goal:

Create the server-side premium access enforcement skeleton before exposing premium data.

## Required Codex Behavior For C04

For the next epic, Codex should first do recognition only.

Do not implement immediately.

Recognition should inspect:

- current main;
- C02 entitlement logic;
- C03 public projections;
- `/matches/[slug]`;
- `/dashboard`;
- Supabase schema/types;
- current RLS policies and grants relevant to public/protected access;
- any existing premium-sensitive tables.

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
