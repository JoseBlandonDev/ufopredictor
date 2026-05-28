# START HERE FOR NEW CONVERSATIONS — UFO Predictor

_Last updated: post C05 Gate 2A / Presentation Boundary sin SQL_

Current baseline: main is post PR #27 (`docs: update project context after c05 gate 1`) and the active working tree includes C05 Gate 2A changes pending commit/PR. Do not assume a future PR number until it is created and merged.


This is the first document to read when starting a new ChatGPT, Codex, or handoff conversation for UFO Predictor. It preserves broad project context and operational continuity.

## Current Baseline

Main includes work through:

| PR | Scope | Status |
|---:|---|---|
| #18 | `feat: persist lab evaluations` | Done |
| #19 | `docs: update project context after lab admin flow` | Done |
| #20 | `feat: read public predictions from db` | Done |
| #21 | `feat: add plans entitlements backend` | Done |
| #22 | `docs: update project context after c02` | Done |
| #23 | `feat: read public match detail from db` | Done |
| #24 | `docs: update project context after c03` | Done |
| #25 | `feat: add premium match access enforcement skeleton` | Done |
| #26 | `feat: add registered free value wall` | Done |
| #27 | `docs: update project context after c05 gate 1` | Done |

Current active implementation state:

```txt
C01 — Public Predictions From DB ✅
C02 — Plans & Entitlements Backend ✅
C03 — Match Detail Public From DB ✅
C04 — Premium Access Enforcement Skeleton ✅
C05 Gate 0 — Anonymous vs Registered Free Product Audit ✅
C05 Gate 1 — Registered Free Value Wall ✅
C05 Gate 2A — Presentation Boundary sin SQL ✅ / current working branch, pending commit/PR
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

No later migration is assumed to exist remotely unless the user explicitly applies it in Supabase SQL Editor and shares validation results.

## Critical Supabase Rule

Supabase CLI local is not configured as the normal workflow.

Codex may create migration files, but Codex does not apply migrations to the remote Supabase project.

All remote migrations must be applied manually by the user in Supabase SQL Editor. Never assume a local migration file is already applied to the remote database. After every migration:

1. Review SQL.
2. Apply manually in Supabase SQL Editor.
3. Run SQL validation queries.
4. Validate grants/policies.
5. Validate anon/authenticated behavior.
6. Validate UI.
7. Run local validation:
   - `npm run test`
   - `npm run lint`
   - `npm run build`
8. Restore `next-env.d.ts` if Next modifies it.

## Product Principle

The statistical model calculates.

The AI explains.

Do not use LLM output as the source of prediction probabilities. Prediction probabilities must come from deterministic model code and persisted prediction versions, not narrative generation.

## Current Product Funnel

The active funnel is:

```txt
Anonymous
→ Registered Free
→ World Cup premium packages
→ post-World Cup monthly subscriptions
```

Important decisions:

- There is no separate `beta/free expanded` plan.
- Registered Free is a permanent user state, not a temporary beta plan.
- Before the World Cup, Registered Free may receive selected previews to validate product/model interest.
- During the World Cup, Registered Free still has more value than Anonymous, while World Cup premium packages protect deeper analysis.
- After the World Cup, monthly subscriptions are expected for American/European league coverage.

## World Cup Premium Direction

Premium monetization for the World Cup should be package/pass/unlock based, not monthly subscription first.

Candidate World Cup products:

- World Cup Full Pass.
- 10 Match Pack.
- Single Match Unlock.
- Country/Team Pass.
- Group Pass.
- Stage Pass.
- Semifinals / Final Pass.

Monthly subscriptions are expected after the World Cup for recurring league coverage.

## Codex Prompt Rule

ChatGPT must separate Codex instructions into two blocks:

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

The first block is for the user. The second block is the only block meant to be copied into Codex. Keep these blocks separate to maintain clarity and reuse.

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

Do not touch Lab Admin unless the task explicitly asks for it.

### `/`

Public landing page.

Current status:

- communicates public prediction value;
- promotes free registration;
- explains premium comes later;
- featured cards may still use mock/static data and should be tracked as debt.

### `/predictions`

Operational public product surface.

It reads public predictions from Supabase through:

```txt
public_prediction_summaries
```

After C05 Gate 2A:

- Anonymous keeps metadata + complete 1X2 probabilities.
- Anonymous sees confidence/risk as a basic teaser/presentation signal.
- Registered Free sees the complete confidence/risk presentation and more free-account context.
- No query changed.
- No new SQL/view/RLS was added.

It must not expose:

- internal Lab data;
- premium markets;
- premium narratives;
- prediction results/evaluations;
- private admin data;
- expected goals, scorelines, odds, Golden Hour Delta, Model vs Market, or premium analysis.

### `/matches/[slug]`

Operational public/free-only match detail.

It reads real public match data from Supabase through:

```txt
public_match_details
public_prediction_summaries
```

After C05 Gate 2A:

- Anonymous keeps match metadata + complete public 1X2 probabilities.
- Anonymous sees confidence/risk as a basic teaser/presentation signal.
- Registered Free sees full confidence/risk display and more context.
- Preview signals remain placeholder/teaser only.

This is a presentation boundary, not a real DB/data boundary.

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

Current constraints:

- no checkout;
- no payments;
- no Stripe;
- no purchases.

Pricing should present free access now and premium World Cup packages as roadmap/catalog preview until payments are approved.

### `/dashboard`

Operational authenticated access summary.

It reads the signed-in user's real access state:

- profile role;
- active subscriptions;
- current entitlements;
- current match unlocks.

After C05 Gate 1/2A it also reinforces free account value. It still does not serve premium prediction content.

### `/transparency`

Still simulated/mock.

Future Trust/Transparency must distinguish:

- Lab/internal testing;
- beta calibration;
- trust-eligible public predictions.

Do not inflate trust claims using early calibration matches.

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
- Public views expose only approved columns.
- `authenticated` grants needed by Lab/Admin remain intentionally preserved for now.

## C04 Premium Access Skeleton

C04 created server-side/pure authorization scaffolding without opening premium data.

Key rules:

- `premium_user` role alone does not unlock all premium content.
- Active subscription alone does not unlock protected content.
- Effective access comes from current entitlements, current match unlocks, explicit admin access, or trusted server-side beta grants.
- `quantity/match_pack` does not authorize content directly; packs should materialize explicit unlocks.
- `stageAccessKey` must be canonical and server-derived.
- `trustedBetaFreeMatchIds` must come from trusted server-side context, never from client/query params.

## C05 Gate 2A Boundary Note

C05 Gate 2A is not a data-security boundary.

It is a presentation boundary using already-public fields.

If future work introduces any sensitive field, the boundary must move to backend projection/query layer before rendering.

## What Is Not Implemented Yet

Still not implemented:

- C05 Gate 2B real DB/data boundary;
- favorites/watchlist/user interest capture;
- final premium match detail projection;
- public or entitled `prediction_markets`;
- public or entitled `prediction_narratives`;
- public or entitled `prediction_results`;
- payments;
- Stripe;
- checkout;
- odds;
- LLM explanations;
- real workers;
- sports API;
- Google Auth;
- Supabase CLI local workflow;
- final staging;
- i18n EN/ES.

## Recommended Next Work

Recommended next step:

```txt
C05 Gate 2B — Real Data Boundary / Projection Decision
```

Goal:

Decide whether to formalize Anonymous vs Registered Free separation at DB/query level.

Possible approaches:

- continue with current presentation boundary temporarily;
- create separate anonymous and registered-free views;
- use RPC/server-only query shapes;
- use RLS if appropriate.

Do not jump directly into C06/C07 premium payload until Gate 2B decision is explicit.

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

Treat older prompt files as historical if they contradict active sources.
