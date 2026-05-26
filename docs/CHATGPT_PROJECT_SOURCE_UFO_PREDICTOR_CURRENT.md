# CHATGPT PROJECT SOURCE — UFO Predictor Current

_Last updated: post PR #23 / C03 Match Detail Public From DB_

This is the main contextual source for ChatGPT conversations in the UFO Predictor project.

## Project Identity

UFO Predictor is a football prediction product.

It combines:

- deterministic statistical prediction logic;
- transparent public prediction surfaces;
- public/free match detail;
- internal Lab evaluation workflows;
- future premium access via plans and entitlements;
- eventual AI-generated explanations.

Permanent principle:

```txt
The statistical model calculates.
The AI explains.
```

LLMs must not be treated as the source of prediction probabilities.

## Current Repository State

Main includes work through:

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

## Current Supabase Remote State

Remote Supabase has been updated manually through:

```txt
0013_public_match_detail_projection_hardening.sql
```

Important applied migrations:

- `0011_public_prediction_reads.sql`
- `0012_plans_entitlements_backend.sql`
- `0013_public_match_detail_projection_hardening.sql`

Supabase CLI local is not configured.

All remote migrations are applied manually in Supabase SQL Editor.

Do not assume a migration file in the repo is applied remotely until the user confirms manual application and validation.

## Tool Usage / Cost Discipline

ChatGPT is the planning, direction, review, and documentation layer.

Codex is the controlled repository execution layer.

Antigravity is an auxiliary tool for visual prototypes, UI/product exploration, isolated demos, and Google stack experiments.

OpenCode is an auxiliary tool for low-cost audit, second opinions, candidate tests, simple scripts, repetitive tasks, and non-critical support.

Manual user actions remain required for Supabase SQL Editor, remote SQL validation, GitHub UI, final PR/merge confirmations, and sharing console results.

Every ChatGPT-generated Codex prompt must start with:

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

Codex Bajo/Medio is appropriate for recognition, file discovery, diff summaries, validation commands, simple mechanical edits, and git operations after approval.

Codex Alto/Fuerte is appropriate for SQL migrations, RLS, Supabase queries, auth, entitlements, premium filtering, security-sensitive changes, and access logic.

Codex should not be used as a general LLM for broad strategy, commercial decisions, brainstorming, or long documentation unless repo inspection is required.

## What Works Now

### Internal Lab Admin Flow

The internal Lab flow is operational at:

```txt
/admin/beta-lab
```

It supports:

- reading Lab fixtures from Supabase;
- reviewing fixtures;
- creating/editing `match_results`;
- reading internal `prediction_markets`;
- persisting/updating `prediction_results`;
- showing evaluation readiness;
- showing persisted evaluation metrics.

Still mock:

- worker runs.

### Public Predictions

The public predictions listing is operational at:

```txt
/predictions
```

It reads from Supabase using:

```txt
public_prediction_summaries
```

It shows:

- competition;
- match;
- teams;
- venue;
- kickoff;
- public 1X2 probabilities;
- confidence;
- risk level;
- public detail link.

It does not expose:

- Lab data;
- premium markets;
- premium narratives;
- prediction results;
- evaluation data;
- expected goals;
- scorelines;
- odds;
- premium analysis.

### Public Match Detail

The match detail route is operational at:

```txt
/matches/[slug]
```

It reads real public/free-only match detail from Supabase using:

```txt
public_match_details
public_prediction_summaries
```

It shows:

- competition;
- match teams;
- venue;
- kickoff;
- status/stage;
- public prediction basics when available.

It does not expose:

- `prediction_markets`;
- `prediction_narratives`;
- `prediction_results`;
- premium analysis;
- expected goals;
- scorelines;
- BTTS;
- over/under;
- Golden Hour Delta;
- Model vs Market.

### Pricing

The beta pricing/catalog page is operational at:

```txt
/pricing
```

It reads active plans from Supabase.

It does not implement:

- checkout;
- payments;
- Stripe;
- purchases.

### Dashboard

The authenticated dashboard is operational at:

```txt
/dashboard
```

It reads the current user's access summary from Supabase:

- role;
- active subscriptions;
- current entitlements;
- current match unlocks.

It does not return premium prediction content.

## C01 — Public Predictions From DB

Status: Done.

Goal:

Connect `/predictions` to real public prediction data.

Current public predictions now read from `public_prediction_summaries`, introduced by C03.

C01/C03 deliberately do not open:

- `prediction_markets`;
- `prediction_narratives`;
- `prediction_results`.

## C02 — Plans & Entitlements Backend

Status: Done.

Goal:

Create the backend foundation for plans, entitlements, beta/freemium access, and future premium enforcement.

Important files:

- `app/pricing/page.tsx`
- `app/dashboard/page.tsx`
- `components/plan-card.tsx`
- `lib/supabase/entitlement-queries.ts`
- `lib/permissions/entitlements.ts`
- `lib/permissions/entitlements.test.ts`
- `supabase/migrations/0012_plans_entitlements_backend.sql`

Rules:

- `premium_user` does not unlock all content.
- Active subscription does not unlock protected content by itself.
- Entitlements/unlocks are the effective access source.
- Beta free access must be server-controlled.
- Admin bypass is explicit, not automatic everywhere.

## C03 — Match Detail Public From DB

Status: Done.

Goal:

Connect `/matches/[slug]` to real Supabase data using a public/free-only projection.

Important files:

- `app/matches/[slug]/page.tsx`
- `app/predictions/page.tsx`
- `components/public-prediction-card.tsx`
- `lib/supabase/public-match-detail-queries.ts`
- `lib/supabase/public-prediction-queries.ts`
- `supabase/migrations/0013_public_match_detail_projection_hardening.sql`

C03 delivered:

- `public_match_details`;
- `public_prediction_summaries`;
- anon public view access only;
- blocked anon base-table and premium-table access;
- DB-backed match detail;
- empty state for public matches without prediction;
- 404 for non-public/nonexistent slugs.

C03 did not implement premium content.

## Beta/Freemium Strategy

The product should support an organic beta/freemium phase before the World Cup.

The beta should:

- show useful free value;
- avoid exposing all premium data;
- avoid mass advertising until confidence grows;
- validate results, UX, infrastructure, and costs;
- use finals, friendlies, and pre-World Cup fixtures for early learning.

## Plans And Access Strategy

Commercial plans should stay simple.

Internal permissions should be granular.

Possible visible plans:

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

Future work must decide how these rights map to concrete match access.

## What Is Still Missing

Not implemented:

- final premium enforcement;
- entitled/premium match detail;
- public or entitled `prediction_markets`;
- public or entitled `prediction_narratives`;
- public or entitled `prediction_results`;
- payments;
- Stripe;
- checkout;
- odds;
- LLM;
- real workers;
- sports API;
- Google Auth;
- Supabase CLI local;
- final staging.

## Recommended Next Epic

```txt
feature/premium-access-enforcement-skeleton
```

Purpose:

Create the server-side skeleton for premium access enforcement before exposing premium data.

Allowed:

- inspect entitlements/access logic;
- define free vs premium fields;
- create server-only enforcement patterns;
- test entitlement access behavior;
- keep premium data closed.

Forbidden in the next epic unless explicitly approved:

- public premium tables;
- premium content UI;
- payments;
- odds;
- LLM;
- workers;
- sports API.

## Suggested Next Conversation Flow

1. Start new ChatGPT conversation with updated docs.
2. ChatGPT generates Codex recognition prompt with execution card.
3. Ask Codex for recognition only.
4. Codex should confirm main includes PR #23.
5. Codex should inspect C02 entitlements, C03 projections, match detail, schema, and RLS/grants.
6. ChatGPT should review Codex's recognition before implementation.

## Trust The Active Docs

If older documents contradict this file, prefer:

- `START_HERE_FOR_NEW_CONVERSATIONS.md`
- `CURRENT_PROJECT_STATUS.md`
- `CODEX_HANDOFF_CURRENT.md`
- `EPIC_PROGRESS_MATRIX.md`
- `NEXT_EPICS_PLAN.md`
- `ROADMAP_AND_BACKLOG.md`
- `OPEN_DECISIONS.md`
- `DATA_DICTIONARY.md`
- `CODEX_WORKFLOW.md`

Secondary documents may be historical.
