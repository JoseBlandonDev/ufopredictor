# CHATGPT PROJECT SOURCE — UFO Predictor Current

_Last updated: post C05 Gate 2A / Presentation Boundary sin SQL_

Current baseline: main is post PR #27 (`docs: update project context after c05 gate 1`) and the active working tree includes C05 Gate 2A changes pending commit/PR. Do not assume a future PR number until it is created and merged.


This is the compact-but-complete source document for ChatGPT conversations inside the UFO Predictor project. It should be used together with `START_HERE_FOR_NEW_CONVERSATIONS.md`, `CURRENT_PROJECT_STATUS.md`, `CODEX_HANDOFF_CURRENT.md`, and the roadmap docs.

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

Current next decision:

```txt
C05 Gate 2B — Real Data Boundary / Projection Decision
```

## Current Funnel

```txt
Anonymous -> Registered Free -> World Cup premium packages -> post-World Cup monthly subscriptions
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
0013_public_match_detail_projection_hardening.sql
```

Supabase CLI local is not configured as the normal workflow.

Codex may create migration files. The user applies SQL manually in Supabase SQL Editor.

Public views:

- `public_match_details`
- `public_prediction_summaries`

Premium/internal tables remain closed:

- `prediction_markets`
- `prediction_narratives`
- `prediction_results`

## Route State

- `/`: landing/value surface; may still use static/mock featured cards.
- `/predictions`: real public predictions from `public_prediction_summaries`; Gate 2A presentation split.
- `/matches/[slug]`: real public/free match detail from public views; Gate 2A presentation split.
- `/pricing`: DB-backed plan catalog, no checkout.
- `/dashboard`: real access summary and free account value surface.
- `/admin/beta-lab`: operational internal Lab.
- `/transparency`: still simulated.

## Gate 2A Summary

C05 Gate 2A is presentation-only:

- Anonymous keeps metadata + full 1X2.
- Anonymous sees confidence/risk as signal/teaser.
- Registered Free sees confidence/risk complete with more context.
- Preview signals remain placeholder/teaser.
- No SQL/RLS/migration/new view/query change.
- No premium payload.

It is not a security/data boundary.

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

## How To Work

For new sensitive gates:

1. Recognition first.
2. Analyze Codex response in ChatGPT.
3. Decide scope.
4. Only then implement.

Manual/user handles:

- Supabase SQL Editor;
- remote SQL validation;
- GitHub UI;
- final PR/merge confirmation.
