# Docs and Sources Inventory - UFO Predictor

_Last refreshed: post PR #99 documentation rebaseline (2026-06-19)._

## Shared-source rule

The canonical Markdown files in repository `docs/` and the files uploaded as ChatGPT project sources are the same logical source set.

After a documentation PR is merged:

1. update local `main`;
2. upload the refreshed canonical files to the ChatGPT project;
3. remove obsolete prior copies where project storage requires replacement;
4. do not maintain parallel documents with slightly different names and states.

## Primary onboarding sources

- `START_HERE_FOR_NEW_CONVERSATIONS.md`
- `CHATGPT_PROJECT_SOURCE_UFO_PREDICTOR_CURRENT.md`
- `CODEX_HANDOFF_CURRENT.md`
- `CURRENT_PROJECT_STATUS.md`
- `PROJECT_CONTEXT_UFO_PREDICTOR.md`

## Architecture and planning

- `ARCHITECTURE_SUMMARY.md`
- `IMPLEMENTATION_PLAN.md`
- `ROADMAP_AND_BACKLOG.md`
- `NEXT_EPICS_PLAN.md`
- `EPIC_PROGRESS_MATRIX.md`
- `OPEN_DECISIONS.md`
- `PRODUCTION_READINESS.md`
- `PROJECT_STATUS_FOR_MEETING.md`

## Operational runbooks

- `TRACK_D_API_FOOTBALL_HANDOFF.md`
- `SIGNAL_REFRESH_PLAYBOOK.md`
- `G05_WOMPI_INTEGRATION_RUNBOOK.md`
- `G06_ENTITLEMENT_ACTIVATION_RUNBOOK.md`
- `AUTH_SETUP.md`

## Frontend and launch readiness

- `G09_FRONTEND_COMMERCIAL_READINESS_PLAN.md`
- `PRODUCTION_READINESS.md`

## Historical model records

Do not rewrite as current-state documents:

- `MODEL_CALIBRATION_CLOSEOUT_PR94.md`
- `MODEL_V01.md`

These preserve the PR #94 closeout and accepted V0.1 model interpretation.

## Current milestone references

- PR #94: model closeout.
- PR #96: public prediction pagination/history.
- PR #97: reproducible signal refresh.
- PR #98: Prediction Review Gate.
- PR #99: Data Ops 06 and complete Matchday 2 export.

## Source packages

Signal source packages and raw downloads are audit/implementation inputs. Runtime import is forbidden unless a future approved architecture explicitly changes that boundary.

## Refresh discipline

When updating docs:

- search for stale status phrases globally;
- keep metrics identical across files;
- distinguish operational completion from polish;
- distinguish model calibration from signal refresh;
- never include secrets;
- never claim production behavior that was not verified.
