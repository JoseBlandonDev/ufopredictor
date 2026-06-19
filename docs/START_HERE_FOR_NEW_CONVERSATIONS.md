# Start Here for New Conversations - UFO Predictor

_Last refreshed: post PR #99 Data Ops 06 and documentation rebaseline (2026-06-19)._

## Start from clean `main`

```bash
git switch main
git pull --ff-only origin main
git fetch origin --prune
git status --short --branch
```

Expected:

```text
## main
```

## Current merged baseline

- PR #94: model closeout.
- PR #96: public prediction pagination/history.
- PR #97: reproducible national-team signal refresh.
- PR #98: Prediction Review Gate.
- PR #99: complete Matchday 2 export workflow.

## Model state

Closed unless a new explicit research epic is approved:

- SIGNAL04 retained;
- DRAW01 retained;
- expected-goals unchanged.

Fair stored metrics:

| Metric | Result |
|---|---:|
| 1X2 | 16/28 |
| Exact score | 7/28 |
| BTTS | 16/27 |
| O/U 2.5 | 16/28 |
| Average total-goal error | 1.821 |

Current-signal historical recomputation is diagnostic, not a fair backtest.

## Current production capabilities

- public predictions/upcoming/history;
- verified results;
- premium detail;
- Wompi payment;
- entitlement activation;
- premium-active UI;
- admin pricing;
- Result/Evaluation/Publish queues;
- Prediction Review Gate;
- Torneo export.

## Signal refresh state

The 2026-06-19 source snapshot is tracked and reproducible.

Use:

```bash
npm run signal:check:national-team-pack
```

Do not edit raw sources into runtime.

## Review Gate state

Operational:

- provider revalidation;
- shadow;
- alerts;
- human decisions.

Not operational:

- AI provider;
- reviewed-xG publication.

## Data Ops 06 closure

- Group Stage - 2: 24/24;
- 5 frozen;
- 9 new public versions;
- batch idempotent;
- final partner JSON delivered.

## Immediate next tasks

1. Matchday 2 result monitoring/evaluation.
2. Next fixture runway.
3. P0 pricing truth.
4. Home/transparency refresh.
5. Review Gate UI polish.
6. G08/G03/refund operations.
7. G09/G12/G13 launch readiness.

## Important frontend findings

See `G09_FRONTEND_COMMERCIAL_READINESS_PLAN.md`.

Do not market aggressively until the visible COP/USDT pricing inconsistency is resolved.

## Work-mode rule

Use console for repetitive API and batch operations.
Use Codex for architecture, implementation, tests, and complex review.

## Hard boundaries

No post-result prediction rewrite, no provider predictions/odds as model inputs, no Torneo picks as model inputs, no public internal evaluation, no client secrets, and no broad unknown fixture apply.
