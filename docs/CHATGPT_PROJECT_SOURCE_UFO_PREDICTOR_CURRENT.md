# ChatGPT Project Source - UFO Predictor Current

_Last refreshed: post PR #71 plus parallel work planning._

## Purpose

This is the compact current source of truth for ChatGPT conversations inside the UFO Predictor project. It summarizes product state, model state, architecture boundaries, recent PRs, operational state, documentation workflow, and next work.

## Product state

UFO Predictor is a probabilistic football prediction product focused on World Cup 2026 real fixtures. MVP 1 basic public fixture operations are functional for selected fixtures.

Current public surface:

- `/predictions` shows public basic 1X2 predictions.
- Active/upcoming fixtures are prioritized above finished history.
- Finished fixtures can display verified final results.
- Match detail pages can display verified final results.
- Free users see public-safe basic context.
- Premium detail is still not implemented.

The app is not a betting product. It does not accept bets, guarantee outcomes, or use provider predictions/odds as hidden model inputs.

## Recent merged PRs

| PR | Scope | Current meaning |
|---:|---|---|
| #66 | E10C national-team strength signals | Real signal enrichment for 48 canonical World Cup teams. |
| #67 | Docs | Rebaseline after E10C. |
| #68 | E10D scoreline expected goals | xG/scoreline calibration improved with E10C metadata. |
| #69 | Finished fixture refresh | Admin-only exact refresh for already-public finished fixtures during prelaunch. |
| #70 | Public predictions/results UX | Active predictions prioritized; verified final results projected publicly. |
| #71 | Real Fixture Lab usability | Active filters, legacy collapse, loading UX, Spanish copy cleanup. |

## Model state

### E10C complete

The 48 canonical World Cup 2026 teams now have enriched static signals:

- FIFA rank / points;
- Elo rank / rating;
- Elo average rank / rating;
- derived historical goals for per match;
- derived historical goals against per match;
- recentMatchCount;
- neutral `marketScore: 50`;
- neutral `lineupContextScore: 50`.

These are runtime-safe generated signals, not runtime reads from `codex-inputs/`.

### E10D complete

Expected-goals and scoreline calibration now use enriched metadata more meaningfully. The goal was to reduce the fallback/default `1-1` attractor for clear mismatches while preserving realistic low-score/draw outcomes for balanced fixtures.

E10D is a better MVP baseline, not an accuracy claim.

## Operational fixture state

### First four completed fixtures

| Fixture | Result | Status |
|---|---:|---|
| Mexico vs South Africa | 2-0 | result verified, public prediction refreshed |
| South Korea vs Czechia | 2-1 | result verified, public prediction refreshed |
| Canada vs Bosnia & Herzegovina | 1-1 | result verified, public prediction refreshed |
| USA vs Paraguay | 4-1 | result verified/evaluated, public prediction refreshed |

The prelaunch refresh regenerated public predictions with the current model/data that should have existed at initial publication time. It did not use final scores as hidden prediction inputs.

### Upcoming published fixtures

- Qatar vs Switzerland
- Brazil vs Morocco
- Haiti vs Scotland
- Australia vs Turkiye
- Germany vs Curacao
- Netherlands vs Japan
- Ivory Coast vs Ecuador
- Sweden vs Tunisia

## Architecture state

### Public-safe data

Public pages can show:

- match metadata;
- public 1X2 probabilities;
- confidence/risk labels;
- public probable score where available;
- verified final result fields;
- public-safe explanation/copy.

Public pages must not show:

- `prediction_results`;
- admin/Lab payloads;
- raw evaluation payloads;
- service-role data;
- provider predictions;
- betting odds as model input.

### Relevant migrations

- `0033_real_fixture_lab_finished_public_refresh_prediction_policies.sql`
  - narrow refresh permission path for exact scheduled/finished public API-Football fixtures;
  - append-only refresh;
  - no result/evaluation mutation.
- `0034_public_verified_match_results_projection.sql`
  - public-safe verified final result projection;
  - verified final goals/status only;
  - no `prediction_results` or internal evaluation fields.

Migrations are applied manually in Supabase SQL Editor.

### Real Fixture Lab

Real Fixture Lab now supports active operations more cleanly:

- active World Cup fixtures prioritized;
- legacy/pilot fixtures secondary/collapsed;
- operational filters by state;
- pointer/disabled UX;
- pending/loading submit states;
- exact lookup unchanged;
- backend action semantics unchanged.

## Documentation ownership

ChatGPT generates project documentation refreshes because it holds the broad cross-conversation context. The user manually copies generated Markdown files into `docs/`. Codex then verifies docs-only consistency.

Codex should not be treated as the primary author of project-state docs unless explicitly asked for a repo-only reconstruction.

## Parallel work track

**Epic G - Product Platform and Monetization Foundations** is now planned as a parallel-safe track for a second contributor.

Purpose: advance account, plans, billing, entitlement, and product shell work without blocking model/data/fixture operations.

Candidate tasks:

- G01 Auth/account UX - done.
- G02 Dev/Prod Environment Separation and Production Config Audit - documented in `docs/PRODUCTION_READINESS.md`.
- G03 Production Smoke Test on `ufopredictor.com` - pending.
- G04 Plans/pricing page MVP.
- G05 Payment provider spike.
- G06 Subscription/entitlement model proposal.
- G07 Premium gate UI shell.
- G08 Trust/legal/responsible use copy.

G02 production config baseline:

- MVP web production target is Vercel + `https://ufopredictor.com`.
- Supabase Auth is the auth system.
- Resend is used only as Supabase Auth SMTP, not from the Next.js app.
- Vercel web runtime requires `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_APP_URL`.
- Production `NEXT_PUBLIC_APP_URL` must be `https://ufopredictor.com`.
- Vercel preview auth is not part of formal MVP smoke testing unless preview callback URLs are configured separately.

Boundaries:

- do not touch `lib/prediction-engine/`;
- do not touch API-Football ingest/apply paths;
- do not touch signal packs or `codex-inputs/`;
- do not expose `prediction_results`;
- do not alter public prediction projections unless explicitly scoped;
- do not implement real payments without an approved provider decision.

## Current open product gaps

1. Premium prediction detail MVP.
2. Venue/stadium metadata.
3. Signal refresh strategy for FIFA/Elo/recent form.
4. Lineup/injury context.
5. Market context without hidden odds/provider predictions.
6. Product platform foundations: G02 documented, G03 smoke test pending, G04-G08 planned.

## Recommended next branches

Premium:

```powershell
git checkout main
git pull origin main
git status --short
git checkout -b feature/premium-prediction-detail-mvp
```

Parallel platform:

```powershell
git checkout main
git pull origin main
git status --short
git checkout -b feature/product-platform-foundations
```
