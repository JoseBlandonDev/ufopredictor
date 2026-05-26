# CHATGPT PROJECT SOURCE — UFO Predictor Current

_Last updated: post PR #21 / C02 Plans & Entitlements Backend_

This is the main contextual source for ChatGPT conversations in the UFO Predictor project.

## Project Identity

UFO Predictor is a football prediction product.

It combines:

- deterministic statistical prediction logic;
- transparent public prediction surfaces;
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
PR #21 — feat: add plans entitlements backend
```

Recent PRs:

| PR | Title | Status |
|---:|---|---|
| #18 | `feat: persist lab evaluations` | Done |
| #19 | `docs: update project context after lab admin flow` | Done |
| #20 | `feat: read public predictions from db` | Done |
| #21 | `feat: add plans entitlements backend` | Done |

## Current Supabase Remote State

Remote Supabase has been updated manually through:

```txt
0012_plans_entitlements_backend.sql
```

Important applied migrations:

- `0011_public_prediction_reads.sql`
- `0012_plans_entitlements_backend.sql`

Supabase CLI local is not configured.

All remote migrations are applied manually in Supabase SQL Editor.

Do not assume a migration file in the repo is applied remotely until the user confirms manual application and validation.

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

It reads from Supabase using a public projection.

It shows:

- competition;
- match;
- teams;
- venue;
- kickoff;
- public 1X2 probabilities;
- confidence;
- risk level.

It does not expose:

- Lab data;
- premium markets;
- premium narratives;
- prediction results;
- evaluation data.

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

### Match Detail

The match detail route remains mock:

```txt
/matches/[slug]
```

This is the next recommended surface to connect to DB, using public/free-only data.

## C01 — Public Predictions From DB

Status: Done.

Goal:

Connect `/predictions` to real public prediction data.

Main safety constraints:

- only `competitions.usage_scope = public_product`;
- only `matches.access_scope = public`;
- only `prediction_versions.run_scope = public_product`.

Important files:

- `app/predictions/page.tsx`
- `components/public-prediction-card.tsx`
- `lib/supabase/public-prediction-queries.ts`
- `supabase/migrations/0011_public_prediction_reads.sql`

C01 deliberately did not open:

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
- `lib/supabase/README.md`
- `lib/permissions/README.md`

Access decision sources:

- `public_basic_access`
- `beta_free_access`
- `entitlement_access`
- `admin_access`
- `none`

Rules:

- `premium_user` role does not unlock all content.
- Active subscription does not unlock protected content by itself.
- Current entitlements and match unlocks are the effective access source.
- Beta free access must be server-controlled.
- Admin bypass must be explicit in future queries.

## Beta/Freemium Strategy

The product should support an organic beta/freemium phase before the World Cup.

The beta should:

- show useful free value;
- avoid exposing all premium data;
- avoid mass advertising until confidence grows;
- validate results, UX, infrastructure, and costs;
- use finals, friendlies, and pre-World Cup fixtures for early learning.

Infrastructure may start on free tiers, but scaling likely requires paid:

- Supabase;
- Railway;
- sports data APIs;
- odds APIs;
- workers;
- LLM if added.

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

Example:

- `competition` entitlement can cover matches in a competition;
- `stage` entitlement can cover semifinals/final;
- `team` entitlement can cover matches involving a team;
- `match unlock` can cover a specific match;
- `quantity` can support a pack like 10 selected matches.

## What Is Still Missing

Not implemented:

- real `/matches/[slug]`;
- final premium enforcement;
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
feature/match-detail-public-from-db
```

Purpose:

Connect `/matches/[slug]` to real Supabase data using public/free-only projection.

Allowed:

- match details;
- competition;
- teams;
- venue;
- kickoff;
- status/stage;
- public prediction basics.

Forbidden in this epic:

- premium markets;
- premium narratives;
- prediction results/evaluations;
- final paywall;
- payments;
- odds;
- LLM;
- workers;
- sports API.

## Suggested Next Conversation Flow

1. Start new ChatGPT conversation with this document and active docs.
2. Ask Codex for recognition only.
3. Codex should confirm main includes PR #21.
4. Codex should inspect `/matches/[slug]`, public prediction query, entitlements, and schema.
5. ChatGPT should review Codex's recognition before implementation.
6. Then create `feature/match-detail-public-from-db`.

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
