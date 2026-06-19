# Docs and Sources Inventory - UFO Predictor

_Last refreshed: post PR #94 model closeout / Wompi production premium baseline / 28-fixture evaluation closeout (2026-06-19)._

## Current docs baseline

This refresh aligns canonical sources to:

- PR #94 merged;
- SIGNAL04 + DRAW01 accepted;
- expected-goals formula unchanged;
- 31 raw evaluation rows / 28 unique fair fixtures;
- Canada 6-0 Qatar and Mexico 1-0 South Korea verified/evaluated;
- Result Review and Evaluation queues empty;
- current public runway of 4 fixtures;
- Wompi payment/premium activation operational;
- Torneo admin export implemented;
- UIHISTORY01 recognized, pending;
- G09-G14 launch tasks defined.

## Primary project docs

- `START_HERE_FOR_NEW_CONVERSATIONS.md`
- `CHATGPT_PROJECT_SOURCE_UFO_PREDICTOR_CURRENT.md`
- `CODEX_HANDOFF_CURRENT.md`
- `CURRENT_PROJECT_STATUS.md`
- `PROJECT_CONTEXT_UFO_PREDICTOR.md`
- `PROJECT_STATUS_FOR_MEETING.md`
- `ROADMAP_AND_BACKLOG.md`
- `EPIC_PROGRESS_MATRIX.md`
- `NEXT_EPICS_PLAN.md`
- `IMPLEMENTATION_PLAN.md`
- `OPEN_DECISIONS.md`

## Model/data docs

- `MODEL_V01.md`
- `MODEL_CALIBRATION_CLOSEOUT_PR94.md`
- `SIGNAL_REFRESH_PLAYBOOK.md`
- `DATA_DICTIONARY.md`
- `ARCHITECTURE_SUMMARY.md`
- `TRACK_D_API_FOOTBALL_HANDOFF.md`

## Launch/workflow docs

- `PRODUCTION_READINESS.md`
- `CODEX_WORKFLOW.md`

## Existing SIGNAL04 source/audit workspace

Normal local audit/Codex-input workspace:

- `codex-inputs/signal-refresh/ufo-national-team-signal-refresh-post-md1-v1.json`
- `codex-inputs/signal-refresh/ufo-national-team-signal-refresh-post-md1-v1.csv`
- `codex-inputs/signal-refresh/ufo-signal-refresh-source-manifest-post-md1-v1.json`
- `codex-inputs/signal-refresh/prompts/codex-signal-refresh-recognition-post-md1-prompt.txt`
- `codex-inputs/signal-refresh/prompts/codex-signal-refresh-implementation-post-md1-prompt.txt`
- `codex-inputs/signal-refresh/raw/ranking-fifa-raw.csv`
- `codex-inputs/signal-refresh/raw/ranking-elo-raw.html`
- `codex-inputs/signal-refresh/raw/results-elo-raw.html`

Original inputs:

- `Ranking FIFA - Hoja 2.csv`
- `ranking ELO.html`
- `results.html`

These are local ignored audit/Codex inputs, not runtime dependencies and not required tracked repository assets.

## Protected/sensitive docs

The following dedicated runbooks may be owned by parallel payment/auth work and were not rewritten by this package:

- `AUTH_SETUP.md`
- `G05_WOMPI_INTEGRATION_RUNBOOK.md`
- `G06_ENTITLEMENT_ACTIVATION_PREFLIGHT.sql`
- `G06_ENTITLEMENT_ACTIVATION_RUNBOOK.md`

General status docs may reference their operational outcome, but dedicated implementation details remain authoritative in those files.

## Future source artifact

Every future signal refresh must generate:

- `ufo-signal-refresh-quality-report-<date>-vN.json`

A failing report blocks implementation unless explicitly approved. The report is a generated per-refresh artifact, not a static tracked template file.
