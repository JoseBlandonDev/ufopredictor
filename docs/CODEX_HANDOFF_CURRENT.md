# Codex Handoff Current - UFO Predictor

_Last refreshed: post PR #71 plus parallel work planning._

## Baseline ritual

Before implementation work:

```powershell
git checkout main
git pull origin main
git status --short
```

Never implement directly on `main`. Create a scoped feature branch unless the user explicitly says otherwise.

## Current project state

Merged recent work:

- PR #66: E10C real national-team signal enrichment.
- PR #68: E10D scoreline expected-goals calibration.
- PR #69: exact finished fixture prelaunch refresh.
- PR #70: public prediction priority and verified result display.
- PR #71: Real Fixture Lab active filters/usability.

MVP 1 basic public World Cup fixture operations are functional for selected fixtures.

## Hard boundaries

Do not:

- expose `prediction_results` publicly;
- expose raw evaluation or Lab payloads;
- use betting odds or provider predictions as hidden model inputs;
- commit `codex-inputs/`;
- run broad API-Football apply flows without explicit approval;
- change Supabase manually unless the user explicitly instructs SQL Editor work;
- implement premium by leaking admin/internal fields.

## Documentation refresh ownership

ChatGPT is responsible for generating project-state documentation refreshes because it has broader cross-conversation context.

User manually copies the generated Markdown files into `docs/`.

Codex role after that is verification/audit:

- confirm current branch/status;
- confirm changed files are docs-only;
- detect accidental app/code/migration/test changes;
- detect stale or contradictory statements;
- detect mojibake/encoding corruption;
- recommend a commit message.

Do not independently rewrite full project-state docs unless the user explicitly asks for a repo-only reconstruction.

## Operational fixture state

Completed first four fixtures:

- Mexico vs South Africa: 2-0, verified, public prediction refreshed.
- South Korea vs Czechia: 2-1, verified, public prediction refreshed.
- Canada vs Bosnia & Herzegovina: 1-1, verified, public prediction refreshed.
- USA vs Paraguay: 4-1, verified/evaluated, public prediction refreshed.

Published upcoming fixtures:

- Qatar vs Switzerland
- Brazil vs Morocco
- Haiti vs Scotland
- Australia vs Turkiye
- Germany vs Curacao
- Netherlands vs Japan
- Ivory Coast vs Ecuador
- Sweden vs Tunisia

## Parallel work track

Epic G - Product Platform and Monetization Foundations is planned as parallel-safe work for a second contributor.

Good Codex scopes for Epic G:

- G01 Auth/account UX - done;
- G02 Dev/Prod Environment Separation and Production Config Audit - documented in `docs/PRODUCTION_READINESS.md`;
- G03 Production Smoke Test on `ufopredictor.com` - pending;
- G04 plans/pricing page MVP;
- G05 payment provider research/spike;
- G06 subscription/entitlement proposal;
- G07 premium gate shell;
- G08 trust/legal copy.

Production config baseline:

- MVP web production target is Vercel with `https://ufopredictor.com`.
- Supabase Auth handles auth; Resend is only Supabase Auth SMTP.
- Current Vercel web runtime should need only `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_APP_URL`.
- `SUPABASE_SERVICE_ROLE_KEY` belongs to scripts/ops/admin local contexts, not the current Vercel web runtime.
- Preview auth is not formally supported unless preview callback URLs are designed separately.

Avoid touching model/data/fixture operations unless specifically scoped:

- `lib/prediction-engine/`;
- `lib/football-api/`;
- ingest scripts;
- signal packs;
- public prediction SQL/views;
- result verification flows;
- `prediction_results`.

## Recommended next implementation scopes

### Premium prediction detail MVP

Use a scoped branch such as:

```powershell
git checkout -b feature/premium-prediction-detail-mvp
```

Goal: public-safe premium outputs like top scorelines, xG, BTTS, Over/Under, and factors.

### Product platform foundations

Use a scoped branch such as:

```powershell
git checkout -b feature/product-platform-foundations
```

Goal: continue Epic G from G03 production smoke test or G04 plans/pricing while avoiding core model/data operations.

## Validation expectations

Typical validation:

```powershell
git diff --check
npm run lint
npm run build
git status --short
```

Run targeted tests relevant to touched files.
