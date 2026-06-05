# IMPLEMENTATION PLAN — UFO Predictor

_Last updated: post C08 / Track D D04C (2026-06-05)_

Current baseline:

- `main` includes C08 Trust / Transparency Real v0.1 through PR #34.
- `feature/d02-api-football-read-spike` contains Track D read-only API-Football work through D04C.
- C01-C08 are functionally closed.
- D02-D04C are implemented locally on the Track D feature branch.
- API-Football Pro is validated as the initial football data provider.
- Next major block: D05 fixture ingestion/persistence design, unless D04D exportable shortlist/report is chosen first.


This is a secondary planning document. Active next-step planning lives in `NEXT_EPICS_PLAN.md` and `ROADMAP_AND_BACKLOG.md`, but this file preserves implementation sequence and constraints.

<!-- POST_C08_D04C_UPDATE -->
## Post C08 / Track D Implementation Update

### Completed Read-Only Provider Foundation

Track D has implemented a read-only API-Football provider path through D04C:

1. D02 — read-only API-Football client and CLI spike.
2. D03A — league/competition discovery.
3. D03B — fixture rounds diagnostics and safe provider response diagnostics.
4. D04A — target competition config and beta fixture selector.
5. D04B — prioritization with score/reasons.
6. D04C — shortlist report mode with upcoming/finished/active separation and summary counts.

### Current Files Added/Extended

- `lib/football-api/api-football-client.ts`
- `lib/football-api/api-football-types.ts`
- `lib/football-api/target-competitions.ts`
- `scripts/api-football-read-spike.ts`

### Lab v0.1 Target Competitions

Included:

- World Cup 2026 (`leagueId=1`) when tournament begins.
- Friendlies (`leagueId=10`), adults by default.
- Colombia Primera A (`leagueId=239`).

Excluded for initial Lab defaults:

- Copa Colombia (`leagueId=241`), despite successful validation.

### Next Implementation Choice

D04D, optional:

- export shortlist/report to a local file for manual operations;
- still no DB writes.

D05A, next major product step:

- design fixture persistence schema, RLS posture, upsert strategy, and validation queries;
- do not create SQL until design is approved.

### Hard Rules For D05

- No migration is remotely applied until the user manually runs it in Supabase SQL Editor.
- No service role for normal UI paths.
- Do not expose `prediction_results`.
- Do not use provider predictions as UFO predictions.
- Do not include odds unless explicitly scoped.

## Completed Implementation Blocks

### Lab Admin Flow

Completed:

- Lab fixture review actions;
- match result actions;
- internal Lab prediction markets;
- persisted Lab evaluations.

### C01 — Public Predictions From DB

Completed:

- public prediction listing from Supabase;
- public prediction card;
- `/predictions` from DB.

Current C01 data path is hardened through `public_prediction_summaries`.

### C02 — Plans & Entitlements Backend

Completed:

- public active plans;
- public plan features;
- own-row subscriptions;
- own-row entitlements;
- own-row match unlocks;
- pure access logic;
- tests;
- `/pricing` from DB;
- `/dashboard` from DB.

### C03 — Match Detail Public From DB

Completed:

- server-only match detail public query;
- real `/matches/[slug]` for public matches;
- safe 404/empty states;
- public prediction basics if available;
- `public_match_details` view;
- `public_prediction_summaries` view;
- anon public projection hardening;
- no premium data opened.

### C04 — Premium Access Enforcement Skeleton

Completed:

- premium match resource contract;
- server-side access resolver pattern;
- canonical `stageAccessKey` approach;
- entitlement/match unlock/admin/beta access decisions;
- pure tests;
- no SQL;
- no premium payload opened.

Important C04 rules:

- `premium_user` alone does not authorize protected content.
- Active subscription alone does not authorize protected content.
- `quantity/match_pack` does not authorize content directly.
- `trustedBetaFreeMatchIds` must be server-side trusted.
- `stageAccessKey` must be server-derived/canonical.

### C05 Gate 0 — Anonymous vs Registered Free Product Audit

Completed:

- audited current anonymous vs registered-free experience;
- decided funnel is Anonymous -> Registered Free -> World Cup premium packages -> post-World-Cup monthly subscriptions;
- rejected separate `beta/free expanded` plan concept;
- confirmed Registered Free is permanent.

### C05 Gate 1 — Registered Free Value Wall

Completed:

- UI/copy in Spanish;
- `/` value proposition;
- `/predictions` session-aware messaging;
- `/matches/[slug]` session-aware preview block;
- `/dashboard` free value block;
- `/pricing` roadmap/no-checkout framing;
- no SQL;
- no RLS;
- no data boundary change;
- no premium payload.

### C05 Gate 2A — Presentation Boundary sin SQL

Completed.

Implementation intent:

- differentiate Anonymous vs Registered Free at presentation level only;
- use already-public fields from existing queries/views;
- avoid SQL/RLS/migrations/new views/query changes.

Behavior:

- Anonymous keeps metadata + complete 1X2 probabilities.
- Anonymous sees confidence/risk as basic signal/teaser.
- Registered Free sees confidence/risk complete with more context.
- Preview signals remain placeholder/teaser.

### C05 Gate 2B — Server-side Anonymous Payload Shaping sin SQL

Completed in PR #28.

Behavior:

- Anonymous keeps metadata + complete 1X2 probabilities.
- Anonymous no longer receives `confidenceScore` / `riskLevel` in shaped UI DTO.
- Registered Free receives confidence/risk.
- No SQL/RLS/migrations/views/RPC.

### C05 Gate 3 — Saved Matches / Watchlist Foundation

Completed in PR #29.

Implementation:

- `0016_premium_match_projection.sql`;
- `public.user_saved_matches` table;
- own-row RLS;
- `authenticated`: SELECT, INSERT, DELETE;
- `anon`: no access;
- save/remove actions from `/matches/[slug]`;
- dashboard saved matches list;
- no `/predictions` button yet;
- no premium payload.

## Next Implementation Block

### C06 — World Cup Premium Package Foundation

Recommended next step.

Goal:

Prepare the World Cup package/pass/unlock foundation without serving premium match payload yet.

Potential scope:

- package candidates;
- product catalog representation;
- package-to-entitlement mapping;
- stage/team/group/match resource modeling;
- admin/seeding approach if approved;
- no checkout unless explicitly scoped.

Non-scope:

- no premium payload projection;
- no `prediction_markets` public/entitled serving;
- no `prediction_narratives` public/entitled serving;
- no `prediction_results` public/entitled serving;
- no payments/Stripe unless explicitly approved.

## Future Implementation Blocks

### C07 — Entitled Premium Match Projection

Potential scope:

- backend-filtered premium projection;
- safe server-only access checks;
- premium markets/narratives/results only for authorized users;
- tests and SQL/RLS/RPC if needed.

### C08 — Trust / Transparency Real v0.1

Potential scope:

- replace simulated transparency;
- separate Lab/internal vs beta calibration vs trust-eligible public predictions;
- avoid overclaiming performance.

## Migration Handling

If a future gate needs a migration, Codex creates SQL only.

The user applies it manually in Supabase SQL Editor.

No remote migration is assumed until manually confirmed.

## Validation Standard

Before commit:

```bash
git diff --check
npm run test
npm run lint
npm run build
git status --short
git diff --name-only
git diff --stat
```

Restore `next-env.d.ts` if changed.

## Completed Implementation Blocks — C06 and C07

### C06 — World Cup Premium Package Foundation

Completed via PR #31.

Delivered:

- package mapping helpers;
- pricing preview without checkout;
- materialization simulation;
- canonical access keys;
- explicit defer decision for DB package catalog / seeds / ledger.

### C07 — Entitled Premium Match Projection

Completed via PR #32.

Delivered:

- premium match resource contract/canonicalization;
- public-safe access context SQL;
- server-side access gate;
- premium projection DTO contract;
- allowed payload selectors;
- protected premium projection RPC;
- protected query integration and minimal authorized rendering.

## Next Implementation Block

### C08 — Trust / Transparency Real v0.1

Start with recognition/design. Do not expose `prediction_results` directly.


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
