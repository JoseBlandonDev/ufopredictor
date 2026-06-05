# EPIC PROGRESS MATRIX — UFO Predictor

_Last updated: post C08 / Track D D04C (2026-06-05)_

Current baseline:

- `main` includes C08 Trust / Transparency Real v0.1 through PR #34.
- `feature/d02-api-football-read-spike` contains Track D read-only API-Football work through D04C.
- C01-C08 are functionally closed.
- D02-D04C are implemented locally on the Track D feature branch.
- API-Football Pro is validated as the initial football data provider.
- Next major block: D05 fixture ingestion/persistence design, unless D04D exportable shortlist/report is chosen first.

<!-- POST_C08_D04C_UPDATE -->
## Post C08 / Track D Progress Update

| Block | Status | Notes |
|---|---|---|
| C08 — Trust / Transparency Real v0.1 | Closed / minimal functional | `/transparency` replaced mock metrics with product-safe beta methodology, limitations, and no-guarantee copy. No `prediction_results` exposed. |
| D02 — API-Football read spike | Completed locally | Read-only API-Football client + CLI spike. No DB writes. |
| D03A — League discovery | Completed locally | `leagues` mode validates provider competition IDs. |
| D03B — Rounds diagnostics | Completed locally | `rounds` mode plus safe diagnostics for `errors/results/paging`. Free-plan 2026 limit diagnosed. |
| D04A — Target competition selector | Completed locally | Target competition config and beta candidate selector. |
| D04B — Prioritization | Completed locally | Priority/score/reasons added for beta candidates. |
| D04C — Shortlist report mode | Completed locally | Report builder separates upcoming/finished/active and summarizes competition/useCase/status. |

Validated provider competitions:

| Competition | leagueId | Season | Lab v0.1 decision |
|---|---:|---:|---|
| World Cup | `1` | 2026 | Include when tournament begins |
| Friendlies | `10` | 2026 | Include, adult fixtures by default |
| Colombia Primera A | `239` | 2026 | Include |
| Copa Colombia | `241` | 2026 | Validated, excluded from Lab v0.1 |

Next candidates:

- D04D — exportable shortlist/report file, optional if manual beta operations need a local artifact.
- D05 — fixture ingestion/persistence design, next major block before Supabase writes.

## Current Epic Position

The project is post C07 and ready to start C08.

## Progress Matrix — Post C07

| Epic / Gate | Status | Notes |
|---|---:|---|
| Lab Admin Flow | ✅ Done | Internal Lab workflow operational |
| C01 — Public Predictions From DB | ✅ Done | `/predictions` reads public data from Supabase |
| C02 — Plans & Entitlements Backend | ✅ Done | Plans, subscriptions, entitlements, dashboard access summary |
| C03 — Match Detail Public From DB | ✅ Done | `/matches/[slug]` reads public views |
| C04 — Premium Access Enforcement Skeleton | ✅ Done | Pure server-side access resolver |
| C05 — Anonymous vs Registered Free Foundation | ✅ Done | Value wall, DTO boundary, saved matches/watchlist |
| C06 — World Cup Premium Package Foundation | ✅ Done | Package mapping, pricing preview, materialization simulation, canonical keys; DB package catalog deferred |
| C07 — Entitled Premium Match Projection | ✅ Done | Protected premium projection behind access gate/RPC; `prediction_results` excluded |
| C08 — Trust / Transparency Real v0.1 | ⏭ Next | Replace simulated transparency safely |
| D — Data Intake / Sports API | Future | Provider selection and integration |
| D/E — Workers Runtime | Future | Real workers and scheduled processing |
| E — Payments / Packages / Subscriptions | Future | PayPal/other Colombia-compatible providers to evaluate; do not assume Stripe |
| F — Odds / LLM Explanations | Future | Deferred until product/legal/technical readiness |
| G — Platform Maturity | Future | Google Auth / i18n / staging / observability |

## C05–C07 Completion Details

C05 delivered the full Anonymous -> Registered Free foundation:

- registered free value wall;
- presentation boundary;
- server-side DTO shaping;
- saved matches/watchlist;
- saved matches dashboard surface.

C06 delivered World Cup package foundation without checkout or DB package catalog persistence.

C07 delivered entitled premium match projection with protected access gate/RPC and minimal authorized rendering.

## Supabase Milestone

Remote Supabase is applied through:

```txt
0016_premium_match_projection.sql
```

## Next Gate / Epic

```txt
C08 — Trust / Transparency Real v0.1
```



| Epic / Gate | Status | Notes |
|---|---:|---|
| Lab Admin Flow | ✅ Done | Internal Lab workflow operational |
| C01 — Public Predictions From DB | ✅ Done | `/predictions` reads public data from Supabase |
| C02 — Plans & Entitlements Backend | ✅ Done | Plans, subscriptions, entitlements, dashboard access summary |
| C03 — Match Detail Public From DB | ✅ Done | `/matches/[slug]` reads public views |
| C04 — Premium Access Enforcement Skeleton | ✅ Done | Pure server-side access resolver |
| C05 — Anonymous vs Registered Free Foundation | ✅ Done | Value wall, DTO boundary, saved matches/watchlist |
| C06 — World Cup Premium Package Foundation | ✅ Done | Package mapping, pricing preview, materialization simulation, canonical keys; DB package catalog deferred |
| C07 — Entitled Premium Match Projection | ✅ Done | Protected premium projection behind access gate/RPC; `prediction_results` excluded |
| C08 — Trust / Transparency Real v0.1 | ⏭ Next | Replace simulated transparency safely |
| D — Data Intake / Sports API | Future | Provider selection and integration |
| D/E — Workers Runtime | Future | Real workers and scheduled processing |
| E — Payments / Packages / Subscriptions | Future | PayPal/other Colombia-compatible providers to evaluate; do not assume Stripe |
| F — Odds / LLM Explanations | Future | Deferred until product/legal/technical readiness |
| G — Platform Maturity | Future | Google Auth / i18n / staging / observability |


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
