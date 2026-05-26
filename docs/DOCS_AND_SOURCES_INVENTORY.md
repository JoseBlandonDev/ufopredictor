# DOCS AND SOURCES INVENTORY — UFO Predictor

_Last updated: post PR #21 / C02 Plans & Entitlements Backend_

## Purpose

This file explains which docs are active sources of truth and which are secondary/historical references.

## Active Sources Of Truth

Prioritize these when starting a new ChatGPT/Codex conversation:

1. `START_HERE_FOR_NEW_CONVERSATIONS.md`
2. `CHATGPT_PROJECT_SOURCE_UFO_PREDICTOR_CURRENT.md`
3. `CURRENT_PROJECT_STATUS.md`
4. `CODEX_HANDOFF_CURRENT.md`
5. `EPIC_PROGRESS_MATRIX.md`
6. `NEXT_EPICS_PLAN.md`
7. `ROADMAP_AND_BACKLOG.md`
8. `OPEN_DECISIONS.md`
9. `DATA_DICTIONARY.md`
10. `CODEX_WORKFLOW.md`
11. `DOCS_AND_SOURCES_INVENTORY.md`

## Secondary / Historical References

These may be useful, but active sources override them if there is a conflict:

- `ARCHITECTURE_SUMMARY.md`
- `IMPLEMENTATION_PLAN.md`
- `MODEL_V01.md`
- `PROJECT_STATUS_FOR_MEETING.md`
- `PROJECT_CONTEXT_UFO_PREDICTOR.md`

## Current Baseline To Reflect Across Docs

Main includes through:

```txt
PR #21 — feat: add plans entitlements backend
```

Completed:

- C01 — Public Predictions From DB
- C02 — Plans & Entitlements Backend

Supabase remote manually applied through:

```txt
0012_plans_entitlements_backend.sql
```

## Operational Documentation Rules

Update docs when:

- starting a new long ChatGPT project conversation;
- a major epic changes project direction;
- current context is too heavy for safe continuation;
- Codex needs a new baseline to avoid stale assumptions.

Do not necessarily update the full docs after every PR.

For routine PRs, update only relevant technical docs if needed.

For conversation handoff PRs, update the full active set.

## Current Full Refresh Reason

This refresh is justified because the project completed:

- PR #20 / C01: public predictions from DB;
- PR #21 / C02: plans and entitlements backend;
- manual remote migrations through 0012;
- beta/freemium strategy clarification;
- Supabase manual migration rule clarification.

## Prompt Files

Prompt files may be included for handoff convenience:

- `PROMPT_NEW_CHATGPT_CONVERSATION_POST_C02.md`
- `PROMPT_CODEX_RECOGNITION_POST_C02.md`
- `PROMPT_CODEX_APPLY_SECOND_CONVERSATION_GUIDANCE.md`

These are operational handoff aids, not architectural sources.
