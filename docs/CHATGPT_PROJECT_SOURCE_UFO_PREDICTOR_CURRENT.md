# CHATGPT PROJECT SOURCE — UFO Predictor Current

_Last updated: post C07 / pre C08_

Current baseline: `main` is post PR #32 (`Feature/c07 premium match projection`). C01–C07 are functionally closed. Next major block: C08 — Trust / Transparency Real v0.1.


This is the compact-but-complete source document for ChatGPT conversations inside the UFO Predictor project. Use it together with `START_HERE_FOR_NEW_CONVERSATIONS.md`, `CURRENT_PROJECT_STATUS.md`, `CODEX_HANDOFF_CURRENT.md`, and roadmap docs.

## Project Identity

UFO Predictor is a football prediction product for probabilistic match analysis.

It is not a sportsbook, does not accept bets, and must not guarantee results.

Product principle:

```txt
The statistical model calculates.
The AI explains.
```

## Current State

Completed:

- Lab Admin Flow.
- Public predictions from Supabase.
- Plans and entitlements backend.
- Public/free match detail from Supabase.
- Premium access enforcement skeleton.
- Registered Free value wall.
- Presentation boundary between Anonymous and Registered Free.
- Server-side Anonymous DTO shaping for confidence/risk.
- Registered Free saved matches/watchlist foundation.

Current next block:

```txt
C08 — Trust / Transparency Real v0.1
```

## Current Funnel

```txt
Anonymous -> Registered Free -> World Cup premium packages -> post-World-Cup monthly subscriptions
```

Registered Free is permanent.

There is no separate temporary `beta/free expanded` plan.

## Current Public UI Language

Current public UI is Spanish.

Future i18n EN/ES is planned but not implemented.

Internal identifiers, keys, entitlement types, types, and slugs should prefer canonical English.

No accidental Spanglish in public copy.

## Supabase / Data State

Remote Supabase has migrations manually applied through:

```txt
0016_premium_match_projection.sql
```

Supabase CLI local is not configured as the normal workflow.

Codex may create migration files. The user applies SQL manually in Supabase SQL Editor.

Public views:

- `public_match_details`
- `public_prediction_summaries`

Important view note:

- `public_match_details` exposes `match_id` for server-side saved-match resolution on public matches.
- `public_prediction_summaries` does not expose `match_id`.

Premium/internal tables remain closed:

- `prediction_markets`
- `prediction_narratives`
- `prediction_results`

Registered Free capture table:

- `user_saved_matches`

`user_saved_matches` has own-row RLS. `authenticated` has `SELECT`, `INSERT`, and `DELETE`; `anon` has no access; no `UPDATE` policy exists.

## Route State

- `/`: landing/value surface; may still use static/mock featured cards.
- `/predictions`: real public predictions from `public_prediction_summaries`; Anonymous DTO excludes confidence/risk; Registered Free DTO includes confidence/risk.
- `/matches/[slug]`: real public/free match detail; save/remove match toggle for Registered Free; Anonymous sees CTA.
- `/pricing`: DB-backed plan catalog, no checkout.
- `/dashboard`: real access summary and saved matches list.
- `/admin/beta-lab`: operational internal Lab.
- `/transparency`: still simulated.

## C05 Summary

C05 is complete.

Anonymous:

- sees metadata + full 1X2;
- receives teaser presentation for confidence/risk;
- does not receive `confidenceScore` / `riskLevel` in shaped UI DTO;
- sees CTA to create account for saved matches.

Registered Free:

- receives confidence/risk DTO fields;
- sees richer context;
- can save/remove public matches from match detail;
- can see saved matches in dashboard.

Premium payload remains closed.

## Security Rules

- Visual locks/blur/teasers are not authorization.
- No premium payload should reach the browser without server-side authorization.
- `premium_user` alone does not unlock protected content.
- Active subscription alone does not unlock protected content.
- `quantity/match_pack` does not grant access without explicit unlocks.
- `trustedBetaFreeMatchIds` must come from trusted server-side context.
- `stageAccessKey` must be canonical and server-derived.
- Do not use service role for normal UI.

## World Cup Commercial Direction

World Cup premium should use packages/passes/unlocks:

- World Cup Full Pass;
- 10 Match Pack;
- Single Match Unlock;
- Country/Team Pass;
- Group Pass;
- Stage/Semifinals/Final Pass.

Monthly subscriptions should come after the World Cup for recurring league coverage.

## Tool / Prompt Rule

ChatGPT must provide Codex work as:

```txt
EJECUCIÓN RECOMENDADA
...

PROMPT LIMPIO PARA CODEX
...
```

Do not put model/tool recommendations inside the clean Codex prompt unless necessary.

## Operational Rules From C05

- Use manual PowerShell/Git for simple commands and validation output collection.
- Use Codex for repo inspection, code edits, implementation, migrations, and non-trivial technical reports.
- Do not merge every micro-step to `main`.
- Prefer coherent feature branches with multiple commits for one functional block.
- Refresh docs at stage close, conversation handoff, or important decision changes, not after every small step.

## How To Work

For sensitive gates:

1. Recognition first.
2. Analyze Codex response in ChatGPT.
3. Decide scope.
4. Implement only after scope approval.
5. Apply Supabase migrations manually if required.
6. Validate locally and remotely.
7. Commit/PR only when the functional block is complete enough.

Manual/user handles:

- Supabase SQL Editor;
- remote SQL validation;
- GitHub UI;
- simple PowerShell/Git commands;
- final PR/merge confirmation.

## ChatGPT Current Source Addendum — Post C07

When starting a new conversation, treat the project as post C07 and pre C08.

Important current facts:

- C06 and C07 are merged.
- Supabase remote has been manually updated through `0016_premium_match_projection.sql`.
- Premium match projection exists behind an authorized gate.
- `prediction_results` remains excluded.
- C06C package persistence is deferred.
- Payment provider is open: PayPal likely, Stripe not assumed.
- Next work is C08 — Trust / Transparency Real v0.1.


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
