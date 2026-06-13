# Track D API-Football Handoff - UFO Predictor

_Last refreshed: post PR #71 plus parallel work planning._

## Current ingest posture

API-Football operations remain controlled and exact-fixture scoped.

Current safe flow:

```text
discovery -> exact dry-run -> exact apply -> admin review/save/publish -> verify result -> persist evaluation
```

Do not run broad blind apply flows.

## Current known operations

First four selected World Cup fixtures have verified results and refreshed public predictions.

Upcoming selected fixtures have been ingested/published for current operations.

## Result verification

Finished results should be attached through exact fixture apply and then verified through admin flow.

Public pages only show verified final results through public-safe projections.

## Parallel work warning

Epic G platform/monetization work should not touch API-Football ingest/apply logic.

If another contributor needs fixture data for UI, use existing public-safe/query boundaries and avoid changing Track D operations.

## Open Track D items

- Continue exact fixture discovery/loading.
- Define safe cadence for result checks.
- Later: worker/cron design for controlled checks.
- Keep rollback/manual review posture until automation is deliberately designed.
