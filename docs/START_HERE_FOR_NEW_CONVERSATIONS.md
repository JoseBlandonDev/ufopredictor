# START HERE FOR NEW CONVERSATIONS — UFO Predictor

_Last updated: post PR #21 / C02 Plans & Entitlements Backend_

This is the first document to read when starting a new ChatGPT or Codex conversation for UFO Predictor.

## Current Baseline

Main includes work through:

- PR #18 — `feat: persist lab evaluations`
- PR #19 — `docs: update project context after lab admin flow`
- PR #20 — `feat: read public predictions from db`
- PR #21 — `feat: add plans entitlements backend`

Current baseline:

```txt
main includes PR #21
C01 is done
C02 is done
```

## Supabase Remote State

Supabase remote has been manually updated through:

```txt
0012_plans_entitlements_backend.sql
```

Important applied migrations:

- `0011_public_prediction_reads.sql`
- `0012_plans_entitlements_backend.sql`

## Critical Supabase Rule

Supabase CLI local is not configured.

Codex creates migration files, but Codex does not apply migrations to the remote Supabase project.

All remote migrations must be applied manually by the user in Supabase SQL Editor.

Never assume a local migration file is already applied to the remote database. After every migration:

1. Review SQL.
2. Apply manually in Supabase SQL Editor.
3. Run SQL validation queries.
4. Run UI validation.
5. Run local validation:
   - `npm run test`
   - `npm run lint`
   - `npm run build`
6. Restore `next-env.d.ts` if Next modifies it.

## Product Principle

The statistical model calculates.

The AI explains.

Do not use LLM output as the source of prediction probabilities. The model and database contracts must stay deterministic and auditable.

## Current Functional State

### `/admin/beta-lab`

Operational internal Lab Admin Flow.

It can:

- read real Lab fixtures from Supabase;
- review Lab fixtures;
- create and edit `match_results`;
- read internal `prediction_markets`;
- persist and update `prediction_results`;
- show evaluation readiness and persisted metrics.

Still mock:

- `workerRuns`.

### `/predictions`

Operational public product surface.

It now reads public predictions from Supabase using a safe public projection.

It only shows public/basic prediction data.

It does not expose:

- internal Lab data;
- premium markets;
- premium narratives;
- prediction results/evaluations;
- private admin data.

### `/pricing`

Operational beta catalog surface.

It reads real active plans from Supabase.

It does not implement:

- checkout;
- payments;
- Stripe;
- purchases.

### `/dashboard`

Operational authenticated access summary.

It reads the signed-in user's real access state:

- profile role;
- active subscriptions;
- current entitlements;
- current match unlocks.

It does not serve premium prediction content.

### `/matches/[slug]`

Still mock.

This is the next recommended product surface to connect to real DB data, but only in a public/free-only way.

## Current Product Strategy

UFO Predictor is moving toward a beta/freemium organic phase before the World Cup.

The beta strategy is:

- show controlled free value;
- avoid giving away all premium data;
- avoid mass advertising until results, UX, costs, and infrastructure are validated;
- use finals, friendlies, and pre-World Cup fixtures to learn organically;
- keep premium access prepared but not overexposed.

Free tiers for Supabase, Railway, and APIs may be enough for early beta, but paid infrastructure should be expected as usage grows.

## Plans And Access Strategy

Do not create ten visible plans just because the database can technically survive it.

The commercial model should use few visible plans and granular internal permissions.

Possible visible plans:

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

Important rules:

```txt
premium_user role alone does not unlock all premium content.
active subscription alone does not unlock protected content.
effective access comes from current entitlements or current match unlocks.
```

Admin can have explicit bypass only where a future server query deliberately permits it.

## What Is Not Implemented Yet

Still not implemented:

- real `/matches/[slug]` data;
- final premium enforcement;
- public `prediction_markets`;
- public `prediction_narratives`;
- public `prediction_results`;
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

Goal:

Connect `/matches/[slug]` to real Supabase data in a public/free-only way.

Allowed:

- real match;
- competition;
- teams;
- venue;
- kickoff;
- stage/status;
- public prediction basics if available.

Not allowed yet:

- premium markets;
- premium narratives;
- prediction results/evaluations;
- final paywall;
- payments;
- odds;
- LLM;
- workers;
- sports API.

## Recommended Workflow For Next Conversation

1. Start new ChatGPT conversation using updated docs.
2. Ask Codex for recognition only.
3. Codex should confirm main includes PR #21.
4. Codex should inspect current state and propose C03 scope.
5. Do not implement until ChatGPT reviews Codex's recognition.
6. Keep all future migrations manual in Supabase SQL Editor.

## Active Source Priority

Prioritize these documents:

- `START_HERE_FOR_NEW_CONVERSATIONS.md`
- `CHATGPT_PROJECT_SOURCE_UFO_PREDICTOR_CURRENT.md`
- `CURRENT_PROJECT_STATUS.md`
- `CODEX_HANDOFF_CURRENT.md`
- `EPIC_PROGRESS_MATRIX.md`
- `NEXT_EPICS_PLAN.md`
- `ROADMAP_AND_BACKLOG.md`
- `DOCS_AND_SOURCES_INVENTORY.md`
- `OPEN_DECISIONS.md`
- `DATA_DICTIONARY.md`
- `CODEX_WORKFLOW.md`

Treat older secondary documents as historical if they contradict active sources.
