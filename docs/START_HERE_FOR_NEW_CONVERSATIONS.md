# START HERE FOR NEW CONVERSATIONS — UFO Predictor

_Last updated: post C07 / pre C08_

Current baseline: `main` is post PR #32 (`Feature/c07 premium match projection`). C01–C07 are functionally closed. Next major block: C08 — Trust / Transparency Real v0.1.


This is the first document to read when starting a new ChatGPT, Codex, or handoff conversation for UFO Predictor. It preserves broad project context, operational continuity, and current constraints.

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
| #28 | `feat: shape anonymous prediction payload server-side` | Done |
| #29 | `Feature/registered free saved matches` | Done |
| #30 | `Docs/update context after c05` | Done |
| #31 | `Feature/c06 world cup package foundation` | Done |
| #32 | `Feature/c07 premium match projection` | Done |

Current completed state:

```txt
C01 — Public Predictions From DB ✅
C02 — Plans & Entitlements Backend ✅
C03 — Match Detail Public From DB ✅
C04 — Premium Access Enforcement Skeleton ✅
C05 Gate 0 — Anonymous vs Registered Free Product Audit ✅
C05 Gate 1 — Registered Free Value Wall ✅
C05 Gate 2A — Presentation Boundary sin SQL ✅
C05 Gate 2B — Server-side Anonymous Payload Shaping sin SQL ✅
C05 Gate 3 — Saved Matches / Watchlist Foundation ✅
C06 — World Cup Premium Package Foundation ✅
C07 — Entitled Premium Match Projection ✅
```

## Supabase Remote State

Supabase remote has been manually updated through:

```txt
0016_premium_match_projection.sql
```

Important applied migrations:

- `0011_public_prediction_reads.sql`
- `0012_plans_entitlements_backend.sql`
- `0013_public_match_detail_projection_hardening.sql`
- `0016_premium_match_projection.sql`

No later migration is assumed to exist remotely unless the user explicitly applies it in Supabase SQL Editor and shares validation results.

## Critical Supabase Rule

Supabase CLI local is not configured as the normal workflow.

Codex may create migration files, but Codex does not apply migrations to the remote Supabase project.

All remote migrations must be applied manually by the user in Supabase SQL Editor. After every migration:

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
→ post-World-Cup monthly subscriptions
```

Important decisions:

- There is no separate `beta/free expanded` plan.
- Registered Free is permanent, not a temporary beta plan.
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
- ¿Esto debe terminar en PR ahora?:

PROMPT LIMPIO PARA CODEX
...
```

The first block is for the user. The second block is the only block meant to be copied into Codex.

## Tool Discipline

Use manual PowerShell/Git for simple commands:

- `git status`
- `git diff`
- `git log`
- `git add` / `git commit` / `git push`
- simple validation commands
- copying results back to ChatGPT

Use Codex for:

- repository inspection that requires reasoning across files;
- code edits;
- refactors;
- implementation;
- SQL/migrations;
- technical reports tied to files it is modifying.

Do not spend Codex tokens on trivial terminal work unless it is already executing an implementation task.

## Git / Merge Discipline

Do not merge every micro-step to `main`.

Use longer feature branches with multiple commits when the block has one coherent functional goal. Merge to `main` only when there is functional value, a closed security boundary, or a real stage transition.

C05 Gate 2A was integrated directly to `main` by workflow mistake. It should not be reverted. After that, the project returned to the correct flow:

```txt
feature branch -> push branch -> PR -> merge
```

## Documentation Refresh Rule

Do not refresh docs for every micro-progress.

Refresh docs when:

- closing an epic/stage;
- switching conversations;
- changing architectural/product decisions;
- preparing a handoff.

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

Do not touch Lab Admin unless explicitly requested.

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

After C05:

- Anonymous keeps metadata + complete 1X2 probabilities.
- Anonymous does not receive `confidenceScore` / `riskLevel` in the shaped DTO sent to UI.
- Registered Free receives complete confidence/risk presentation and more free-account context.
- `public_prediction_summaries` does not expose `match_id`.

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

After C05:

- Anonymous keeps match metadata + complete public 1X2 probabilities.
- Anonymous sees confidence/risk teaser presentation and does not receive confidence/risk DTO fields.
- Registered Free sees full confidence/risk display and more context.
- Registered Free can save/remove public matches.
- Anonymous sees CTA to create account/login to save matches.

`public_match_details` now exposes `match_id` to support server-side saved-match resolution for public matches without service role and without reading `public.matches` directly in normal UI.

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

After C05, it also shows a minimal saved matches section backed by `user_saved_matches` and `public_match_details`.

### `/transparency`

Still simulated/mock.

Future Trust/Transparency must distinguish:

- Lab/internal testing;
- beta calibration;
- trust-eligible public predictions.

Do not inflate trust claims using early calibration matches.

## Public Projection Hardening

C03 introduced explicit public views:

- `public_match_details`
- `public_prediction_summaries`

Security posture:

- `anon` reads approved public views only.
- `anon` no longer reads base public product tables directly.
- `anon` cannot read `prediction_markets`.
- `anon` cannot read `prediction_narratives`.
- `anon` cannot read `prediction_results`.
- Public views expose only approved columns.

C05 added `match_id` to `public_match_details` only, for saved matches server-side resolution. `public_prediction_summaries` does not expose `match_id`.

## C04 Premium Access Skeleton

C04 created server-side/pure authorization scaffolding without opening premium data.

Key rules:

- `premium_user` role alone does not unlock all premium content.
- Active subscription alone does not unlock protected content.
- Effective access comes from current entitlements, current match unlocks, explicit admin access, or trusted server-side beta grants.
- `quantity/match_pack` does not authorize content directly; packs should materialize explicit unlocks.
- `stageAccessKey` must be canonical and server-derived.
- `trustedBetaFreeMatchIds` must come from trusted server-side context, never from client/query params.

## C05 Boundary Note

C05 is complete.

- Gate 1 improved Registered Free value wall.
- Gate 2A created presentation boundary.
- Gate 2B added server-side DTO shaping so Anonymous does not receive confidence/risk DTO fields.
- Gate 3 added saved matches/watchlist foundation.

C05 does not serve premium payload.

## What Is Not Implemented Yet

Still not implemented:

- C06 World Cup Premium Package Foundation;
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
C08 — Trust / Transparency Real v0.1
```

Goal:

Design and prepare World Cup package/pass/unlock foundations without serving premium match payload yet.

Do not jump directly into C07 premium payload.

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

## Start Here — Post C07 Operational Snapshot

Read this first in any new ChatGPT or Codex conversation.

```txt
Current branch baseline: main post PR #32
Completed epics/gates: C01–C07
Next recommended work: C08 — Trust / Transparency Real v0.1
Remote Supabase: manually applied through 0016_premium_match_projection.sql
```

### What C08 Must Respect

C08 starts after protected premium projection is already implemented for match detail. It must not reopen premium payload boundaries casually.

C08 should focus on trust/transparency real v0.1, replacing simulated or placeholder transparency with real, safe, product-facing evidence. It should not introduce payments, checkout, provider integrations, or prediction result exposure unless explicitly scoped.

### Current Premium Boundary

The product can now serve premium markets/narrative to authorized users through the protected projection flow. The product must still keep `prediction_results` out of public/product premium UI unless a later explicit trust/evaluation gate opens a safe projection.


---

## Post C07 Baseline Update

Current merged baseline:

```txt
main includes PR #31 — Feature/c06 world cup package foundation
main includes PR #32 — Feature/c07 premium match projection
Completed: C01–C07
Next: C08 — Trust / Transparency Real v0.1
Supabase remote manually applied through: 0016_premium_match_projection.sql
```

### C06 Closure Summary

C06 — World Cup Premium Package Foundation is complete.

Implemented:

- C06B: World Cup package mapping helpers.
- C06D: World Cup 2026 pricing preview without checkout.
- C06E: pure package intent materialization simulation without DB writes.
- C06G: canonical World Cup access keys.
- C06C: explicitly resolved as a defer decision, not forgotten.

C06C decision:

- No DB package catalog yet.
- No `plans` / `plan_features` seeds for World Cup packages yet.
- No `package_catalog` table yet.
- No 10 Match Pack ledger yet.

Reason: World Cup packages are still flexible commercial templates, not final persisted products. The project needs room for team-only passes, group passes, stage passes from octavos/cuartos/semis/final, semifinals/final bundles, single-match unlocks, flexible match packs, and other demand-based combinations.

### C07 Closure Summary

C07 — Entitled Premium Match Projection is complete.

Implemented:

- C07A: `PremiumMatchResource` contract and canonicalization.
- C07B.1: public-safe match access context SQL.
- C07B.2: server-side premium access gate context.
- C07C: premium projection contract and shaping helper.
- C07D: `premiumProjection` wired into match detail DTO.
- C07E.1: allowed premium payload selectors.
- C07E.2: protected premium match projection RPC.
- C07E.3: protected premium query integration and minimal authorized rendering.

C07 security boundary:

- Premium payload is queried only when `premiumAccess.status === "authorized"`.
- `locked` and `unavailable` never call the premium RPC and never contain payload.
- Authorized null/error responses become `authorized_unavailable`.
- Premium payload is filtered through selectors/whitelists before DTO output.
- `prediction_results` remains excluded from product premium projection.
- No service role is used for normal UI.
- No checkout, PayPal, Stripe, or payments were implemented.
- No entitlement/unlock inserts were implemented.

### C07 SQL Applied Manually

Remote Supabase was manually updated through:

```txt
0016_premium_match_projection.sql
```

New C07 migrations applied manually and validated:

- `0015_public_match_access_context.sql`
  - extends `public_match_details` with public-safe access context:
    `competition_id`, `competition_access_key`, `home_team_id`, `away_team_id`.
- `0016_premium_match_projection.sql`
  - creates `public.get_premium_match_projection(p_match_id uuid)`.
  - `SECURITY DEFINER` with safe `search_path`.
  - `anon` cannot execute.
  - `authenticated` can execute.
  - `auth.uid()` is required.
  - returns only allowed premium markets/narratives after DB-side authorization.
  - does not expose `prediction_results`.

### Payments / Provider Decision

Do not assume Stripe.

Because the project/user is Colombia-based, Stripe should not be assumed available directly without a supported-country structure such as an LLC/company in a supported country.

PayPal is currently a likely candidate. Other Colombia-compatible payment gateways must be evaluated before checkout/fulfillment.

No checkout, PayPal integration, Stripe integration, or payments were implemented in C06/C07.

### Workflow Decisions To Preserve

SQL/migrations:

- Codex may create SQL files/migrations.
- The user applies SQL manually in Supabase SQL Editor.
- Never assume a migration is applied remotely until the user confirms validation results.
- SQL validation queries must be provided with migrations.
- Current remote is manually applied through `0016_premium_match_projection.sql`.

Git:

- The user handles simple Git manually.
- During an epic/feature branch, use small local commits per logical subtask.
- Do not push for every subtask.
- Push/PR when the full functional block is ready for review/merge, unless backup/review requires earlier push.
