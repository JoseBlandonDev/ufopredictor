# CODEX HANDOFF CURRENT — UFO Predictor

_Last updated: post C05 Gate 2A / Presentation Boundary sin SQL_

Current baseline: main is post PR #27 (`docs: update project context after c05 gate 1`) and the active working tree includes C05 Gate 2A changes pending commit/PR. Do not assume a future PR number until it is created and merged.


## Role For Codex

You are the implementation assistant for the UFO Predictor repository.

You must follow project scope strictly.

Do not create broad features, do not infer missing business logic, and do not assume Supabase remote migrations are applied automatically.

## Required Prompt Format

ChatGPT-generated Codex prompts must be given as two separate blocks:

```txt
EJECUCIÓN RECOMENDADA
- Herramienta:
- Modelo:
- Inteligencia:
- Tamaño:
- Riesgo:
- Motivo:
- Manual/PowerShell vs Codex:

PROMPT LIMPIO PARA CODEX
...
```

The execution recommendation is for the user. The clean prompt is the part copied into Codex.

## Current Git Baseline

Current main includes:

```txt
PR #27 — docs: update project context after c05 gate 1
```

Recent PRs:

| PR | Title | Status |
|---:|---|---|
| #20 | `feat: read public predictions from db` | Done |
| #21 | `feat: add plans entitlements backend` | Done |
| #22 | `docs: update project context after c02` | Done |
| #23 | `feat: read public match detail from db` | Done |
| #24 | `docs: update project context after c03` | Done |
| #25 | `feat: add premium match access enforcement skeleton` | Done |
| #26 | `feat: add registered free value wall` | Done |
| #27 | `docs: update project context after c05 gate 1` | Done |

Active working branch may include:

```txt
C05 Gate 2A — Presentation Boundary sin SQL
```

If so, treat it as pending commit/PR until the user confirms merge.

Before new work, run:

```bash
git checkout main
git pull origin main
git status
git branch
git log --oneline -5
```

If continuing active work, first confirm branch and `git status --short`.

## Current Supabase Remote State

Remote Supabase has been manually migrated through:

```txt
0013_public_match_detail_projection_hardening.sql
```

Important applied migrations:

- `0011_public_prediction_reads.sql`
- `0012_plans_entitlements_backend.sql`
- `0013_public_match_detail_projection_hardening.sql`

No migration beyond 0013 is assumed to be remotely applied.

## Critical Supabase Rule

Supabase CLI local is not configured as the normal workflow.

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

Gate 2A presentation behavior:

- Anonymous sees public metadata + complete 1X2 probabilities.
- Anonymous sees confidence/risk as basic teaser/presentation signal.
- Registered Free sees confidence/risk fully rendered with more context.

Must remain public/basic only until a real data boundary is approved.

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

Gate 2A presentation behavior:

- Anonymous sees match metadata + complete public 1X2.
- Anonymous sees confidence/risk as basic teaser/presentation signal.
- Registered Free sees confidence/risk fully rendered and account-active context.
- Preview signals are still placeholder/teaser.

Must remain public/free-only until a protected projection is approved.

Allowed public fields:

- match metadata;
- competition metadata;
- home/away teams;
- venue;
- kickoff;
- stage/status;
- public 1X2.

Do not expose premium fields.

### `/pricing`

Reads real active plan catalog from Supabase.

No checkout, payments, or Stripe.

World Cup premium packages can be previewed as catalog/roadmap but not sold unless checkout is explicitly implemented later.

### `/dashboard`

Reads current user's access summary from Supabase.

Shows:

- role;
- active subscriptions;
- current entitlements;
- current match unlocks;
- free account value messaging.

Does not serve premium prediction content.

## C01 Summary — Public Predictions From DB

Status: Done.

Current public predictions use `public_prediction_summaries` from C03.

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

## C04 Summary — Premium Access Enforcement Skeleton

Status: Done.

Scope:

- server-side/pure access decision skeleton;
- `PremiumMatchResource`;
- canonical `stageAccessKey`;
- entitlement/unlock/admin/beta decision logic;
- tests;
- no SQL;
- no premium data served.

## C05 Gate 0 / Gate 1 / Gate 2A Summary

Status:

- Gate 0: Done, product audit/decision.
- Gate 1: Done, registered free value wall in Spanish UI.
- Gate 2A: Implemented in active branch/pending PR, presentation boundary without SQL.

Gate 2A did not change data boundary. It renders different presentation for Anonymous vs Registered Free using already-public fields.

## Product Principle

The statistical model calculates.

The AI explains.

Do not use LLMs to generate prediction probabilities.

## Beta / Freemium Product Strategy

UFO Predictor supports a controlled beta/freemium phase before the World Cup.

The strategy:

- expose useful free value;
- do not give away all premium data;
- avoid mass advertising until results, UX, infrastructure, and costs are validated;
- start organically with finals, friendlies, and pre-World Cup fixtures;
- capture Registered Free users before World Cup package monetization.

## Commercial Direction

Funnel:

```txt
Anonymous -> Registered Free -> World Cup premium packages -> post-World Cup monthly subscriptions
```

World Cup premium should be package/pass/unlock based:

- Full World Cup Pass;
- 10 Match Pack;
- Single Match Unlock;
- Country/Team Pass;
- Group Pass;
- Stage/Semifinals/Final Pass.

Monthly subscriptions are expected after the World Cup for recurring league coverage.

## Recommended Next Decision

```txt
C05 Gate 2B — Real Data Boundary / Projection Decision
```

Goal:

Decide whether the presentation-only split from Gate 2A should become a real backend/data boundary.

Possible implementations:

- new `anon` vs `registered_free` projection views;
- RPC;
- server-only query shaping;
- RLS if appropriate.

## Out Of Scope Until Explicitly Approved

Do not implement:

- payments;
- Stripe;
- checkout;
- public or entitled premium content serving;
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
