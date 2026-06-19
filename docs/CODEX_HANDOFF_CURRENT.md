# Codex Handoff Current - UFO Predictor

_Last refreshed: post PR #99 Data Ops 06 / PR #98 Prediction Review Gate / PR #97 reproducible signal refresh (2026-06-19)._

## Repo baseline

Start from updated `main`:

```bash
git switch main
git pull --ff-only origin main
git fetch origin --prune
git status --short --branch
```

Expected status: clean.

Latest relevant merged PRs:

- PR #94: model closeout;
- PR #96: prediction list/history pagination;
- PR #97: reproducible national-team signal refresh;
- PR #98: Prediction Review Gate;
- PR #99: complete Matchday 2 export workflow.

Do not recreate or reuse deleted feature branches.

## Accepted model boundary

Do not reopen calibration by default.

Accepted:

- SIGNAL04;
- DRAW01;
- unchanged `expected-goals.ts`;
- generated national-team signal pack from the 2026-06-19 source snapshot.

Fair stored metrics remain:

- 1X2 16/28;
- exact 7/28;
- BTTS 16/27;
- O/U 16/28;
- average total-goal error 1.821.

Historical current-signal recomputations are diagnostic only.

## Signal source architecture

Tracked source snapshot:

```text
data/prediction-engine/national-team-signals/2026-06-19/
```

Generator/check commands:

```bash
npm run signal:generate:national-team-pack
npm run signal:check:national-team-pack
```

Runtime consumes the generated static TypeScript pack. Do not import raw HTML/CSV or quality-report files at runtime.

## Review Gate baseline

Route:

```text
/admin/prediction-refresh-review
```

Capabilities:

- provider revalidation;
- shadow prediction;
- model-delta alerts;
- Elo coherence alerts;
- human decisions;
- immutable lineage.

AI is not configured. Do not fake AI output.
Reviewed-xG is preview-only. Do not enable publication without a new approved slice.

## Data Ops 06 baseline

Group Stage - 2 is complete:

- 24 fixtures;
- 5 frozen;
- 9 new public versions;
- idempotent batch;
- final export delivered.

Relevant code:

- `lib/world-cup-2026/matchday2-ops.ts`;
- `scripts/world-cup-matchday2-final-export.ts`;
- `scripts/regenerate-torneo-matchday2-export.ts`;
- `lib/supabase/torneo-export-core.ts`;
- `lib/supabase/torneo-export-queries.ts`.

Do not rerun write mode unless there is a specific operational reason.

## Current preferred work modes

Use local console for:

- API-Football reads;
- fixture inventories;
- repeatable dry-runs;
- export regeneration;
- simple status checks.

Use Codex for:

- architecture inspection;
- code changes;
- migrations;
- tests;
- diff review;
- non-trivial debugging.

Do not spend large token windows narrating mechanical command output.

## Current next slices

### Data operations

- monitor Matchday 2;
- verify/apply final results only after exact provider final status;
- persist internal evaluation;
- prepare the next batch.

### Review Gate UI patch

Docs-approved small scope:

- missing markets show `No disponible`;
- pre-shadow state shows `Sin comparación todavía`;
- translate provider/status/alert labels;
- optionally compact filters/sections.

No model or schema changes.

### Frontend commercial readiness

See `G09_FRONTEND_COMMERCIAL_READINESS_PLAN.md`.

P0 items:

- verify/fix USDT-COP pricing coherence;
- remove stale home fixture messaging;
- correct transparency model-status copy;
- simplify duplicated World Cup Pass catalog presentation.

## Hard boundaries

Do not:

- expose internal evaluations or `prediction_results`;
- use provider odds/predictions as model inputs;
- use Torneo picks as model inputs;
- rewrite frozen predictions;
- mix model, publication, payments, and broad UI work in one slice;
- expose secrets;
- modify Wompi or entitlement logic from a frontend polish task;
- claim AI is connected;
- claim Real Fixture Lab exact-detail is repaired.
