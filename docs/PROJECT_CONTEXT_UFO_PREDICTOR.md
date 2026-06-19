# Project Context - UFO Predictor

_Last refreshed: post PR #94 model closeout / Wompi production premium baseline / 28-fixture evaluation closeout (2026-06-19)._

## What the product is

UFO Predictor publishes probabilistic football predictions with public/free/premium access layers. It separates public product data from internal Lab/evaluation data and does not promise outcomes or provide betting execution.

## Current baseline

- PR #94 model/data refresh is merged.
- SIGNAL04 and DRAW01 are retained.
- Expected-goals formula is unchanged.
- 28 unique World Cup fixtures are fairly evaluated from stored pre-match predictions.
- Wompi production payment activation and premium entitlement flow are operational.
- Result Review, Evaluation, Publish Queue, and Torneo export admin paths exist.
- Four public fixtures remain upcoming.

## Model summary

Fair stored metrics:

- 1X2 16/28;
- exact 7/28;
- BTTS 16/27;
- O/U 16/28;
- average total-goal error 1.821.

The model improved modestly in 1X2/draw handling but still underestimates blowouts and exact-score tails.

## Working method

- Exact-fixture operations only.
- Verify provider final state before result apply/review/evaluation.
- Keep public and internal prediction scopes separate.
- Treat refreshed-signal historical recomputations as diagnostic, not fair backtests.
- Run model, UI, payments, and docs as separate coherent slices.

## Current next work

1. Merge refreshed project documentation.
2. Start the next conversation from refreshed sources.
3. Monitor the four public fixtures and publish the next approved runway.
4. Implement UIHISTORY01 and mobile/PWA launch tasks in isolated branches.
