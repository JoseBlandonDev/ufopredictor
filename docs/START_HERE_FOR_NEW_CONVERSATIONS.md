# START HERE FOR NEW CONVERSATIONS — UFO Predictor

_Last updated: post PR #23 / C03 Match Detail Public From DB_

This is the first document to read when starting a new ChatGPT, Codex, or handoff conversation for UFO Predictor.

## Current Baseline

Main includes work through:

- PR #18 — `feat: persist lab evaluations`
- PR #19 — `docs: update project context after lab admin flow`
- PR #20 — `feat: read public predictions from db`
- PR #21 — `feat: add plans entitlements backend`
- PR #22 — `docs: update project context after c02`
- PR #23 — `feat: read public match detail from db`

Current baseline:

```txt
main includes PR #23
C01 is done
C02 is done
C03 is done
```

## Supabase Remote State

Supabase remote has been manually updated through:

```txt
0013_public_match_detail_projection_hardening.sql
```

Important applied migrations:

- `0011_public_prediction_reads.sql`
- `0012_plans_entitlements_backend.sql`
- `0013_public_match_detail_projection_hardening.sql`

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

## Codex Prompt Rule

Every ChatGPT-generated Codex prompt for UFO Predictor must start with an execution card:

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

Codex is the controlled repository execution layer, not a general strategy LLM. ChatGPT handles planning, scope, review, documentation, and prompt generation. Antigravity and OpenCode are auxiliary tools only; they do not replace Codex for repo execution.

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

It reads public predictions from Supabase through the explicit public projection:

```txt
public_prediction_summaries
```

It only shows public/basic prediction data:

- competition;
- match;
- teams;
- venue;
- kickoff;
- public 1X2 probabilities;
- confidence;
- risk level;
- link to public match detail.

It does not expose:

- internal Lab data;
- premium markets;
- premium narratives;
- prediction results/evaluations;
- private admin data;
- expected goals, scorelines, odds, or premium analysis.

### `/matches/[slug]`

Operational public/free-only match detail.

It reads real public match data from Supabase through:

```txt
public_match_details
public_prediction_summaries
```

It shows:

- match slug;
- kickoff;
- status/stage;
- competition name/slug;
- home/away team names/slugs/logos/flags;
- venue name/city;
- public 1X2 prediction basics when available.

Behavior:

- public match with prediction: shows metadata and public 1X2/confidence/risk;
- public match without prediction: shows an empty state;
- nonexistent, internal, lab-only, or non-public slug: 404;
- no mock fallback.

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

## Public Projection Hardening

C03 introduced `0013_public_match_detail_projection_hardening.sql`.

This migration created explicit public views:

- `public_match_details`
- `public_prediction_summaries`

Security posture after manual validation:

- `anon` reads approved public views only.
- `anon` no longer reads base public product tables directly.
- `anon` cannot read `prediction_markets`.
- `anon` cannot read `prediction_narratives`.
- `anon` cannot read `prediction_results`.
- public views expose only approved columns.
- `authenticated` grants needed by Lab/Admin remain intentionally preserved for now.

## Current Product Strategy

UFO Predictor is moving toward a controlled beta/freemium organic phase before the World Cup.

The beta strategy is:

- show controlled free value;
- avoid giving away all premium data;
- avoid mass advertising until results, UX, costs, and infrastructure are validated;
- use finals, friendlies, and pre-World Cup fixtures to learn organically;
- keep premium access prepared but not overexposed.

## Plans And Access Strategy

Do not create many visible plans just because the database can support granular permissions.

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

- final premium enforcement;
- entitled/premium match detail sections;
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

Suggested code:

```txt
C04 — Premium Access Enforcement Skeleton
```

Goal:

Create the server-side enforcement skeleton for premium access before exposing any premium match detail data.

Allowed in C04:

- inspect entitlement/access logic;
- define free vs protected projection boundaries;
- create pure access resolver tests if needed;
- prepare server-only premium access checks;
- keep premium data closed unless explicitly authorized by a safe server projection.

Not allowed yet:

- public `prediction_markets`;
- public `prediction_narratives`;
- public `prediction_results`;
- final premium UI with real premium content;
- payments;
- Stripe;
- checkout;
- odds;
- LLM;
- workers;
- sports API.

## Recommended Workflow For Next Conversation

1. Start new ChatGPT conversation using updated docs.
2. ChatGPT should generate a Codex recognition prompt with the execution card.
3. Ask Codex for recognition only.
4. Codex should confirm main includes PR #23.
5. Codex should inspect C02 entitlements, C03 public projections, match detail, and current schema.
6. Do not implement until ChatGPT reviews Codex's recognition.
7. Keep all future migrations manual in Supabase SQL Editor.

## Active Source Priority

Prioritize these documents:

- `START_HERE_FOR_NEW_CONVERSATIONS.md`
- `CHATGPT_PROJECT_SOURCE_UFO_PREDICTOR_CURRENT.md`
- `CURRENT_PROJECT_STATUS.md`
- `CODEX_HANDOFF_CURRENT.md`
- `EPIC_PROGRESS_MATRIX.md`
- `NEXT_EPICS_PLAN.md`
- `ROADMAP_AND_BACKLOG.md`
- `OPEN_DECISIONS.md`
- `DATA_DICTIONARY.md`
- `CODEX_WORKFLOW.md`
- `DOCS_AND_SOURCES_INVENTORY.md`

Treat older secondary documents as historical if they contradict active sources.
