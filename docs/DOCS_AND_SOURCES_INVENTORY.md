# Docs and Sources Inventory - UFO Predictor

_Last refreshed: post PR #81 real fixture publish queue bypass / Data Ops 02 completion (2026-06-16)._

## Current docs baseline

This docs refresh aligns sources to:

- PR #81 real fixture publish queue operational bypass merged to `main`.
- Data Ops 01 and Data Ops 02 completed.
- 12 active/upcoming World Cup predictions published.
- Recent finished fixtures verified/evaluated.
- Real Fixture Lab exact-detail stack overflow documented as known follow-up.
- TM01 Torneo Mundialista export remains planned/next.
- Epic G updated to include dev/prod environment separation and Wompi payment direction.

## Primary project docs

- `START_HERE_FOR_NEW_CONVERSATIONS.md`
- `CHATGPT_PROJECT_SOURCE_UFO_PREDICTOR_CURRENT.md`
- `CODEX_HANDOFF_CURRENT.md`
- `CURRENT_PROJECT_STATUS.md`
- `ROADMAP_AND_BACKLOG.md`
- `EPIC_PROGRESS_MATRIX.md`
- `OPEN_DECISIONS.md`
- `ARCHITECTURE_SUMMARY.md`
- `DATA_DICTIONARY.md`
- `NEXT_EPICS_PLAN.md`

## Operational/support docs

- `TRACK_D_API_FOOTBALL_HANDOFF.md`
- `PROJECT_STATUS_FOR_MEETING.md`
- `MODEL_V01.md`
- `PROJECT_CONTEXT_UFO_PREDICTOR.md`
- `IMPLEMENTATION_PLAN.md`

## Parallel/Epic G docs

- `AUTH_SETUP.md`
- `PRODUCTION_READINESS.md`

## Workflow docs

- `CODEX_WORKFLOW.md`

## Notes

Docs should not claim payments, checkout, full entitlement automation, Wompi integration, Torneo integration, or public endpoint integration are implemented. Those remain pending/planned unless future PRs complete them.

Docs should also not treat Real Fixture Lab exact-detail as the reliable primary publication path while the stack overflow blocker remains open. Use `/admin/real-fixture-publish-queue` for publication operations.
