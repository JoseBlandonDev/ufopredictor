# CODEX HANDOFF CURRENT — UFO Predictor

_Last updated: post C08 / Track D D04C (2026-06-05)_

Current baseline:

- `main` includes C08 Trust / Transparency Real v0.1 through PR #34.
- `feature/d02-api-football-read-spike` contains Track D read-only API-Football work through D04C.
- C01-C08 are functionally closed.
- D02-D04C are implemented locally on the Track D feature branch.
- API-Football Pro is validated as the initial football data provider.
- Next major block: D05 fixture ingestion/persistence design, unless D04D exportable shortlist/report is chosen first.

<!-- POST_C08_D04C_UPDATE -->
## Post C08 / Track D Update — API-Football Pro + Beta Fixture Selection

Status after the latest working session:

- C08 — Trust / Transparency Real v0.1 is functionally closed as a product-safe transparency page update. `/transparency` no longer presents mock performance metrics as validated production results. It states beta/calibration limits, uncertainty, no sportsbook/no betting-advice posture, and explicitly does not expose `prediction_results`.
- Track D read-only football provider integration has started and progressed through D04C on branch `feature/d02-api-football-read-spike`.
- API-Football Pro was selected and validated as the initial football data provider for the beta/Mundial path.
- API-Football Free was useful for technical validation on historical seasons but blocked 2026 season access. API-Football Pro unlocked the required 2026 fixtures.
- Sportmonks remains a fallback candidate, not the active provider path.

Validated API-Football competitions:

| Competition | Provider leagueId | Season | Validation result | Current Lab decision |
|---|---:|---:|---|---|
| World Cup | `1` | 2026 | 72 fixtures returned; group-stage rounds returned | Included when tournament begins |
| Friendlies | `10` | 2026 | 488 fixtures returned | Included for pre-World-Cup beta, adults only by default |
| Colombia Primera A / Liga BetPlay | `239` | 2026 | 204 fixtures returned | Included for Lab v0.1 / local beta |
| Copa Colombia | `241` | 2026 | 56 fixtures returned | Mapped and validated, but excluded from Lab v0.1 for now |

Implemented Track D local commits on `feature/d02-api-football-read-spike`:

```txt
04a2646 feat: add api-football read spike
9ac3510 feat: add api-football league discovery mode
02a1461 feat: add api-football rounds diagnostics
ed2799f feat: add beta fixture target selector
5649b91 feat: prioritize beta fixture candidates
5c3f757 feat: add beta shortlist report mode
```

Available read-only CLI modes in `scripts/api-football-read-spike.ts`:

- `date`
- `league`
- `fixture`
- `leagues`
- `rounds`
- `beta-candidates`

`beta-candidates` supports:

- `--competition world-cup|friendlies|colombia-primera-a|copa-colombia|all`
- `--from YYYY-MM-DD`
- `--to YYYY-MM-DD`
- `--limit N`
- `--includeYouth true|false`
- `--prioritize true|false`
- `--maxPerCompetition N`
- `--report true|false`

Important boundaries remain unchanged:

- no SQL was created for Track D so far;
- no migrations were created for Track D so far;
- no Supabase writes exist in Track D so far;
- no workers or cron were added;
- provider predictions are not used as UFO predictions;
- odds are not in scope yet;
- `prediction_results` remains excluded from product/premium/public surfaces;
- premium projection and C07 access boundaries were not touched.

Recommended next step:

- If staying no-DB for one more slice: D04D — exportable shortlist/report file for manual beta operations.
- If moving productward: D05 — fixture ingestion/persistence design, starting with schema/RLS/upsert planning before any migration.

### Codex Execution Warning — Do Not Repeat Completed Track D Work

Do not repeat D02, D03A, D03B, D04A, D04B, or D04C. They are already implemented locally on `feature/d02-api-football-read-spike`.

Do not re-debug `rounds=0` unless the user explicitly asks. The root cause was the Free-plan season limit; API-Football Pro validated 2026 access.

Do not add Copa Colombia to Lab v0.1 defaults. It is validated but excluded from the initial Lab/beta set.

Allowed next prompts should start from one of these:

- D04D — exportable beta shortlist/report file, still no DB writes.
- D05A — fixture ingestion/persistence design, docs/spec first.

For D05A, Codex must not create SQL until the schema/RLS/upsert plan is reviewed and approved.

## Role For Codex

You are the implementation assistant for the UFO Predictor repository.

Follow project scope strictly. Do not create broad features, infer missing business logic, or assume Supabase remote migrations are applied automatically.

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
- ¿Esto debe terminar en PR ahora?:

PROMPT LIMPIO PARA CODEX
...
```

The execution recommendation is for the user. The clean prompt is the part copied into Codex.

## Current Git Baseline

Current `main` includes:

```txt
PR #29 — Feature/registered free saved matches
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
| #28 | `feat: shape anonymous prediction payload server-side` | Done |
| #29 | `Feature/registered free saved matches` | Done |
| #30 | `Docs/update context after c05` | Done |
| #31 | `Feature/c06 world cup package foundation` | Done |
| #32 | `Feature/c07 premium match projection` | Done |

Before new work, the user should run simple Git commands manually:

```bash
git checkout main
git pull origin main
git status
git branch
git log --oneline -5
```

Codex should not be used just to run trivial Git status/diff/log commands unless it is already executing a repo task.

## Current Supabase Remote State

Remote Supabase has been manually migrated through:

```txt
0016_premium_match_projection.sql
```

Important applied migrations:

- `0011_public_prediction_reads.sql`
- `0012_plans_entitlements_backend.sql`
- `0013_public_match_detail_projection_hardening.sql`
- `0016_premium_match_projection.sql`

No migration beyond 0014 is assumed to be remotely applied.

## Critical Supabase Rule

Supabase CLI local is not configured as the normal workflow.

Codex must not assume migrations are applied remotely.

Codex may create SQL migration files, but the user applies them manually in Supabase SQL Editor.

For every migration task, Codex must:

1. Create the local migration file.
2. Show the complete SQL in the final response.
3. Provide validation queries.
4. State clearly that the migration has not been applied remotely unless the user confirms it.
5. Not claim remote validation until the user applies SQL manually and shares results.

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

### `/predictions`

Reads real public prediction data from Supabase through:

```txt
public_prediction_summaries
```

After C05:

- Anonymous sees public metadata + complete 1X2 probabilities.
- Anonymous does not receive `confidenceScore` / `riskLevel` in shaped UI DTO.
- Registered Free sees confidence/risk fully rendered with more context.

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

After C05:

- Anonymous sees match metadata + complete public 1X2.
- Anonymous sees confidence/risk teaser and does not receive confidence/risk DTO fields.
- Registered Free sees confidence/risk fully rendered and account-active context.
- Registered Free can save/remove the public match.
- Anonymous sees login/register CTA for saved matches.

`public_match_details` exposes `match_id` to support saved matches server-side. `public_prediction_summaries` does not expose `match_id`.

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
- free account value messaging;
- saved matches list.

Does not serve premium prediction content.

## C01–C05 Summary

C01: public predictions from DB.

C02: plans and entitlements backend.

C03: public match detail from DB and public projection hardening.

C04: premium access enforcement skeleton with canonical `stageAccessKey` and trusted server-side beta access.

C05: Anonymous vs Registered Free freemium boundary and capture:

- value wall;
- presentation boundary;
- server-side anonymous payload shaping;
- saved matches/watchlist foundation.

## Product Principle

The statistical model calculates.

The AI explains.

Do not use LLMs to generate prediction probabilities.

## Beta / Freemium Product Strategy

UFO Predictor supports a controlled beta/freemium phase before the World Cup.

The strategy:

- expose useful free value;
- do not give away premium data;
- avoid mass advertising until results, UX, infrastructure, and costs are validated;
- capture Registered Free users before World Cup package monetization.

## Commercial Direction

Funnel:

```txt
Anonymous -> Registered Free -> World Cup premium packages -> post-World-Cup monthly subscriptions
```

World Cup premium should be package/pass/unlock based:

- Full World Cup Pass;
- 10 Match Pack;
- Single Match Unlock;
- Country/Team Pass;
- Group Pass;
- Stage/Semifinals/Final Pass.

Monthly subscriptions are expected after the World Cup for recurring league coverage.

## Recommended Next Block

```txt
C08 — Trust / Transparency Real v0.1
```

Goal:

Prepare package/pass/unlock product foundation for the World Cup without serving premium match payload yet.

Possible scope:

- visible package catalog decisions;
- product/entitlement mapping;
- seeds/admin structure if approved;
- package access rules.

Do not serve premium payload until C07.

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

## Current Recommended Codex Starting Point — C08

Codex should treat `main` as post PR #34 with C01-C08 complete, and treat `feature/d02-api-football-read-spike` as containing Track D through D04C.

Recommended first task in a new Codex conversation:

```txt
Recognize the current post-C07 codebase and propose C08 — Trust / Transparency Real v0.1 scope without implementing changes.
```

Do not begin C08 by exposing `prediction_results`. C08 must first define what trust/transparency evidence is safe and useful for product UI.

### C08 Initial Recognition Targets

Codex should inspect:

- existing transparency route/components;
- current model/lab evaluation surfaces;
- `prediction_results` and lab evaluation tables without opening them to product UI;
- public prediction/match detail DTOs;
- current premium projection DTOs from C07;
- existing copy that claims simulated transparency.

Expected output should be a plan, not implementation.


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
