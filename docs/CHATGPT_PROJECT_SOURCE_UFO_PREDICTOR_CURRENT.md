# CHATGPT PROJECT SOURCE — UFO Predictor Current

_Last updated: post C05 / pre C06_

Current baseline: `main` is post PR #29 (`Feature/registered free saved matches`). C05 is functionally closed. Next major block: C06 — World Cup Premium Package Foundation.


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
C06 — World Cup Premium Package Foundation
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
0014_user_saved_matches.sql
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
