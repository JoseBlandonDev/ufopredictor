# CURRENT PROJECT STATUS — UFO Predictor

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

### Current Lab v0.1 Competition Scope

Lab v0.1 should use:

1. Colombia Primera A / Liga BetPlay (`leagueId=239`), for local beta and model sanity checks.
2. Friendlies (`leagueId=10`), adults only by default, for pre-World-Cup beta and historical/upcoming samples.
3. World Cup 2026 (`leagueId=1`), once tournament operation begins.

Copa Colombia (`leagueId=241`) is validated but intentionally excluded from Lab v0.1 for now. It can be used later as an auxiliary domestic competition if needed, but it should not be part of the initial Lab selection defaults.

## Executive Summary

UFO Predictor now has a working public/freemium foundation:

- public predictions from Supabase;
- public match detail from Supabase;
- plans and entitlements backend;
- premium access enforcement skeleton;
- Registered Free value wall;
- Anonymous vs Registered Free presentation and DTO boundary;
- saved matches/watchlist foundation for Registered Free.

The next major block is C08 — Trust / Transparency Real v0.1.

## Latest PRs

| PR | Title | Status |
|---:|---|---|
| #25 | `feat: add premium match access enforcement skeleton` | Done |
| #26 | `feat: add registered free value wall` | Done |
| #27 | `docs: update project context after c05 gate 1` | Done |
| #28 | `feat: shape anonymous prediction payload server-side` | Done |
| #29 | `Feature/registered free saved matches` | Done |
| #30 | `Docs/update context after c05` | Done |
| #31 | `Feature/c06 world cup package foundation` | Done |
| #32 | `Feature/c07 premium match projection` | Done |

## Current Supabase State

Remote Supabase is manually applied through:

```txt
0016_premium_match_projection.sql
```

Applied migrations:

- `0011_public_prediction_reads.sql`
- `0012_plans_entitlements_backend.sql`
- `0013_public_match_detail_projection_hardening.sql`
- `0014_user_saved_matches.sql`
- `0015_public_match_access_context.sql`
- `0016_premium_match_projection.sql`

Supabase CLI local is not the normal workflow. The user applies migrations manually in Supabase SQL Editor.

## Current Product States

### Anonymous

Anonymous users can:

- view public match metadata;
- view complete public 1X2 probabilities;
- see confidence/risk teaser messaging;
- see registration CTAs;
- see CTA to save matches but cannot save them.

Anonymous users should not receive:

- `confidenceScore` / `riskLevel` in shaped UI DTO;
- premium payload;
- premium markets/narratives/results.

### Registered Free

Registered Free users can:

- view public metadata and complete 1X2 probabilities;
- receive confidence/risk in shaped DTO and UI;
- see richer context and preview messaging;
- save/remove public matches from match detail;
- view saved matches in dashboard.

Registered Free does not unlock premium payload.

### World Cup Premium User / Package Holder

Foundation implemented through C06/C07, with product purchase and fulfillment still pending.

World Cup package/pass/unlock concepts are modeled through helpers, access intents, canonical keys, entitlements, and explicit match unlocks. C07 now supports entitled premium match projection behind a server-side access gate and protected RPC.

Current limitation: no checkout, payment provider, package catalog persistence, 10 Match Pack ledger, or purchase fulfillment exists yet. Grants/unlocks must come from existing entitlement/unlock data paths until payments/admin fulfillment are explicitly implemented.

### Post-World-Cup Subscription User

Not implemented yet.

Monthly subscriptions are expected after the World Cup for recurring league coverage. Do not assume Stripe; PayPal and other Colombia-compatible providers must be evaluated.

## Current Data Boundary

C05 introduced the Anonymous vs Registered Free presentation and DTO boundary. C07 added an entitled premium projection boundary.

Current boundary layers:

1. Presentation boundary: anonymous sees teaser copy; registered free sees richer confidence/risk presentation.
2. Server-side DTO boundary: anonymous does not receive confidence/risk DTO fields; registered free does.
3. Premium access gate: premium payload is queried only when `premiumAccess.status === "authorized"`.
4. Protected projection RPC: `public.get_premium_match_projection(p_match_id uuid)` returns only whitelisted premium markets/narratives after DB-side authorization.

Current public views / functions:

- `public_match_details` includes `match_id`, `competition_id`, `competition_access_key`, `home_team_id`, and `away_team_id` for server-side access context.
- `public_prediction_summaries` remains the public/free prediction summary surface.
- `public.get_premium_match_projection(p_match_id uuid)` is executable by `authenticated`, requires `auth.uid()`, and is not executable by `anon`.

Premium/internal boundaries:

- `prediction_markets` and `prediction_narratives` are not exposed directly to `anon`; product premium access goes through the protected RPC.
- `prediction_results` remains excluded from product premium projection.
- No service role is used for normal UI.

## Current Capture Foundation

C05 added:

```txt
public.user_saved_matches
```

Purpose:

- allow Registered Free users to save public matches;
- allow dashboard listing of saved matches;
- support future product interest signals and conversion without exposing premium payload.

Security posture:

- RLS enabled;
- own-row select/insert/delete;
- no update policy;
- `authenticated`: SELECT, INSERT, DELETE;
- `anon`: no access.

## Current Routes

| Route | Status |
|---|---|
| `/` | Public landing/value surface; may still include static featured cards |
| `/predictions` | Public predictions from DB; Anonymous DTO excludes confidence/risk |
| `/matches/[slug]` | Public match detail; saved match CTA/toggle |
| `/pricing` | DB-backed active plan catalog; no checkout |
| `/dashboard` | Access summary + saved matches list |
| `/admin/beta-lab` | Operational internal Lab/Admin flow |
| `/transparency` | Still simulated/mock |

## Completed Blocks

### C01 — Public Predictions From DB

Done.

### C02 — Plans & Entitlements Backend

Done.

### C03 — Match Detail Public From DB

Done.

### C04 — Premium Access Enforcement Skeleton

Done.

Key rules:

- `premium_user` alone does not unlock content.
- Active subscription alone does not unlock content.
- Pack quantity does not authorize content directly.
- Explicit entitlements/unlocks are the effective source of access.

### C05 — Anonymous vs Registered Free Freemium Boundary

Done.

Includes:

- Registered Free value wall;
- presentation boundary;
- server-side DTO shaping;
- saved matches/watchlist foundation.

## Next Block

```txt
C08 — Trust / Transparency Real v0.1
```

Goal:

Prepare World Cup commercial packages/passes/unlocks without serving premium match payload yet.

Do not jump to C07 before C06 decisions are explicit.


## Context Preservation — Milestone History

This section intentionally preserves broader historical context so future ChatGPT/Codex handoffs do not lose why the current baseline exists.

| Phase / PR | What changed | Why it matters now |
|---|---|---|
| C01 / PR #20 | Public predictions read from Supabase | `/predictions` became DB-backed instead of mock-only. |
| C02 / PR #21 | Plans and entitlements backend | Created the commercial/access foundation used by pricing/dashboard and future C06 package work. |
| C03 / PR #23 | Public match detail from DB | `/matches/[slug]` became DB-backed through public-safe projections. |
| C03 hardening / `0013` | Explicit public views and anon hardening | `anon` reads approved views only, not base product tables directly. |
| C04 / PR #25 | Premium access enforcement skeleton | Introduced server-side resource/access logic without opening premium data. |
| C05 Gate 1 / PR #26 | Registered Free value wall | Differentiated Anonymous and Registered Free at UI/copy level. |
| C05 Gate 2A | Presentation boundary | Kept 1X2 public while changing confidence/risk presentation. |
| C05 Gate 2B / PR #28 | Server-side DTO shaping | Anonymous no longer receives `confidenceScore` / `riskLevel` in shaped UI payload. |
| C05 Gate 3 / PR #29 | Saved matches foundation | Registered Free users can save/remove public matches and see them in dashboard. |

## Active Public Surfaces

### `/predictions`

Current status:

- DB-backed from `public_prediction_summaries`.
- Anonymous receives metadata + complete 1X2 probabilities.
- Anonymous does not receive `confidenceScore` / `riskLevel` in the shaped DTO.
- Registered Free receives full confidence/risk presentation.
- No saved-match button in cards yet.
- No premium payload.

### `/matches/[slug]`

Current status:

- DB-backed from `public_match_details` and `public_prediction_summaries` as needed.
- Uses server-side viewer shaping for prediction confidence/risk.
- Shows saved-match CTA for Anonymous.
- Lets Registered Free save/remove public matches.
- Does not expose premium markets/narratives/results.

### `/dashboard`

Current status:

- Authenticated-only surface.
- Shows viewer access summary.
- Shows saved matches list from `user_saved_matches` + public match metadata.
- Does not serve premium prediction content.

### `/pricing`

Current status:

- Shows active catalog/plans from Supabase.
- No checkout/payments yet.
- World Cup premium packages remain future C06 work.

## Current Constraints Still In Force

- Do not use service role for normal UI paths.
- Do not serve premium payload until C07 or an explicitly approved premium projection gate.
- Do not treat visual locks, blurs, teasers, or CSS as authorization.
- Keep public UI copy Spanish for now.
- Prefer canonical English for internal keys/types/slugs/entitlement identifiers.
- Keep Supabase remote migration workflow manual unless explicitly changed.

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
