# Start Here for New Conversations - UFO Predictor

_Last refreshed: post PR #71 plus parallel work planning._

## Read this first

UFO Predictor is a probabilistic football prediction product focused on World Cup 2026 real fixtures. The current project state is MVP 1 controlled public fixture operations, not the old MVP 0 fallback-only Lab.

Use this file to quickly understand where the project is, what is safe to touch, and what should happen next. Do not assume older docs or old conversation context are current unless they agree with this source set.

## Current baseline

Recent merged work:

| PR | Status | Meaning |
|---:|---|---|
| #66 | merged | E10C real national-team signal enrichment for 48 canonical World Cup teams. |
| #67 | merged | Docs rebaseline after E10C. |
| #68 | merged | E10D expected-goals / scoreline calibration. |
| #69 | merged | Exact prelaunch refresh for already-public finished fixtures. |
| #70 | merged | Public predictions priority plus public verified final results. |
| #71 | merged | Real Fixture Lab active filters, legacy collapse, and admin action UX. |

The repo should normally start from updated `main` before any new feature branch:

```powershell
git checkout main
git pull origin main
git status --short
```

## Model state

E10C is complete. The 48 canonical World Cup teams have runtime-safe enriched signals:

- FIFA rank / points;
- Elo rank / rating;
- Elo average rank / rating;
- historical goals for per match;
- historical goals against per match;
- recentMatchCount;
- neutral `marketScore: 50`;
- neutral `lineupContextScore: 50`.

E10D is complete. Expected goals and scoreline behavior now use the enriched context more meaningfully. The old blind `1-1` attractor has been reduced for clear mismatches, while balanced fixtures can still naturally produce low-score draws.

Do not claim the model is final or professionally calibrated. It is a better MVP baseline, not prophecy with a UI.

## Public product state

Current public behavior:

- `/predictions` shows selected public World Cup predictions.
- Active/upcoming fixtures are prioritized.
- Finished fixtures move to a recent results / history section.
- Public cards and match detail pages can show verified final result fields.
- Public pages remain public-safe.

Public pages must not expose:

- `prediction_results`;
- internal evaluation payloads;
- Lab/admin payloads;
- service-role data;
- provider predictions;
- betting odds as hidden model input.

## Admin / operations state

Real Fixture Lab now prioritizes current World Cup operations:

- active World Cup fixtures first;
- finished fixtures needing result verification/evaluation surfaced;
- legacy/pilot fixtures secondary/collapsed;
- lightweight operational filters;
- pointer/disabled UX on controls;
- pending/loading labels on submit actions.

Exact fixture lookup behavior remains unchanged.

## Current fixture operations state

First four selected fixtures:

| Fixture | Result | Current state |
|---|---:|---|
| Mexico vs South Africa | 2-0 | verified result, public prediction refreshed. |
| South Korea vs Czechia | 2-1 | verified result, public prediction refreshed. |
| Canada vs Bosnia & Herzegovina | 1-1 | verified result, public prediction refreshed. |
| USA vs Paraguay | 4-1 | verified/evaluated result, public prediction refreshed. |

Published upcoming fixtures:

- Qatar vs Switzerland
- Brazil vs Morocco
- Haiti vs Scotland
- Australia vs Turkiye
- Germany vs Curacao
- Netherlands vs Japan
- Ivory Coast vs Ecuador
- Sweden vs Tunisia

Controlled operational flow remains:

```text
fixture discovery -> exact dry-run -> exact apply -> save internal prediction -> publish public prediction -> verify result -> persist internal evaluation
```

Avoid broad batch writes unless explicitly scoped and reviewed.

## Documentation refresh workflow

This project uses a split responsibility for documentation refreshes:

1. ChatGPT prepares refreshed Markdown project-source docs because it holds the cross-conversation project context.
2. The user manually copies the generated Markdown files into `docs/`.
3. Codex verifies the copied docs with a docs-only audit.
4. Codex checks branch/status, docs-only diff, internal consistency, and accidental code/migration/test changes.
5. The user commits the docs refresh after verification.

Codex should not be the default author of project-state refresh docs. Codex can verify, audit, and propose corrections after manual copy.

Docs refreshes should happen after meaningful project-state transitions, not after every microchange.

## Parallel work planning

A new parallel-safe track has been defined:

**Epic G - Product Platform and Monetization Foundations**

Purpose: let another contributor work on account, plan, billing, and product shell tasks while the main model/data/operator work continues separately.

Parallel-safe areas:

- G01 Auth/account UX - Done;
- G02 dev/prod environment separation and production config audit - documented in `docs/PRODUCTION_READINESS.md`;
- G03 production smoke test on `ufopredictor.com` - pending;
- G04 plans/pricing page MVP;
- G05 payment provider spike;
- G06 subscription/entitlement design proposal;
- G07 premium gate UI shell;
- G08 trust/legal/product copy.

Production readiness notes:

- MVP web production target is Vercel + `https://ufopredictor.com`.
- Supabase Auth is the auth system; Resend is configured only as Supabase Auth SMTP.
- Vercel web runtime needs `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_APP_URL`.
- In production, `NEXT_PUBLIC_APP_URL` must be `https://ufopredictor.com`.
- Vercel preview auth is not part of formal MVP smoke testing unless preview callback URLs are configured separately.

Do not let parallel work touch prediction engine, ingest, signal packs, result verification, public prediction projections, or `prediction_results` unless explicitly scoped.

## Recommended next main work

Primary product track:

```powershell
git checkout -b feature/premium-prediction-detail-mvp
```

Goal: top 3 scorelines, expected goals, BTTS, Over/Under 2.5, key factors, and public-safe explanation for paid/authenticated contexts.

Parallel track:

```powershell
git checkout -b feature/product-platform-foundations
```

Goal: continue Epic G from G03 production smoke test or G04 plans/pricing, isolated from model/data operations.

## Hard boundaries

- `prediction_results` remains internal.
- No betting odds or provider predictions as hidden inputs.
- Do not commit `codex-inputs/`.
- Supabase migrations are applied manually through SQL Editor.
- Keep API-Football operations exact-fixture scoped unless a task explicitly authorizes otherwise.
- Do not refresh or recalibrate to fit final scores.
- Do not use public UI to expose internal Lab/evaluation state.
