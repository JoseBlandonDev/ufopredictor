# Docs and Sources Inventory - UFO Predictor

_Last refreshed: post PR #71 plus parallel work planning._

## Source docs purpose

The `docs/` folder contains project-state sources used by ChatGPT/Codex handoffs. These docs should stay concise, current, and scoped.

## Documentation refresh ownership

Project-source refresh workflow:

1. ChatGPT generates refreshed Markdown sources using cross-conversation context.
2. User manually copies generated files into `docs/`.
3. Codex performs docs-only verification.
4. User commits after verification.

Codex verifies docs. It is not the default author of broad project-state refresh docs unless explicitly instructed.

## Current refreshed source set

Core files:

- `START_HERE_FOR_NEW_CONVERSATIONS.md`
- `CHATGPT_PROJECT_SOURCE_UFO_PREDICTOR_CURRENT.md`
- `CURRENT_PROJECT_STATUS.md`
- `CODEX_HANDOFF_CURRENT.md`
- `CODEX_WORKFLOW.md`
- `ARCHITECTURE_SUMMARY.md`
- `ROADMAP_AND_BACKLOG.md`
- `EPIC_PROGRESS_MATRIX.md`
- `PRODUCTION_READINESS.md`
- `OPEN_DECISIONS.md`
- `NEXT_EPICS_PLAN.md`

Supporting files:

- `MODEL_V01.md`
- `DATA_DICTIONARY.md`
- `PROJECT_STATUS_FOR_MEETING.md`
- `PROJECT_CONTEXT_UFO_PREDICTOR.md`
- `TRACK_D_API_FOOTBALL_HANDOFF.md`

## Recent source changes captured

- PR #66 E10C signal enrichment.
- PR #68 E10D xG/scoreline calibration.
- PR #69 finished fixture prelaunch refresh.
- PR #70 public prediction priority and verified results.
- PR #71 Real Fixture Lab active filters/usability.
- Planned Epic G parallel product platform/monetization track.
- Epic G G02 dev/prod environment separation and production config checklist.

## Encoding note

Docs should be saved as UTF-8. If copied through a tool that corrupts accents, prefer ASCII-safe spellings in docs rather than committing broken mojibake text.

## Refresh cadence

Refresh docs after meaningful project state changes:

- completed epic/sub-epic;
- multiple merged PRs that change current state;
- before a major new conversation;
- before a substantial handoff.

Do not refresh docs after every microchange.
