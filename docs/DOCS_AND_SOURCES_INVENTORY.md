# DOCS AND SOURCES INVENTORY — UFO Predictor

_Last updated: post PR #23 / C03 Match Detail Public From DB_

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
PR #23 — feat: read public match detail from db
```

Completed:

- C01 — Public Predictions From DB
- C02 — Plans & Entitlements Backend
- C03 — Match Detail Public From DB

Supabase remote manually applied through:

```txt
0013_public_match_detail_projection_hardening.sql
```

## C03 Documentation Baseline

C03 added:

- DB-backed public/free-only `/matches/[slug]`;
- `public_match_details` public view;
- `public_prediction_summaries` public view;
- `/predictions` reading from public projection;
- public detail links from prediction cards;
- 404 for non-public or nonexistent slugs;
- empty state for public matches without public predictions.

C03 did not add:

- premium match detail;
- public `prediction_markets`;
- public `prediction_narratives`;
- public `prediction_results`;
- payments, Stripe, checkout, odds, LLM, workers, sports API, Google Auth, Supabase CLI, or staging.

## Operational Documentation Rules

Update docs when:

- starting a new long ChatGPT project conversation;
- a major epic changes project direction;
- current context is too heavy for safe continuation;
- Codex needs a new baseline to avoid stale assumptions.

Do not necessarily update the full docs after every PR.

For routine PRs, update only relevant technical docs if needed.

For conversation handoff PRs, update the full active set.

## Tool Usage Documentation Rule

Active docs must preserve the Codex Prompt Execution Card rule.

Every ChatGPT-generated Codex prompt must include:

```txt
USO RECOMENDADO:
- Herramienta:
- Modelo/intensidad:
- Modo:
- Motivo:
- Riesgo:
- Scope permitido:
- No tocar:
- Validaciones:
- Debo volver a ChatGPT cuando:

PROMPT PARA CODEX:
...
```

This rule belongs primarily in:

- `CODEX_WORKFLOW.md`
- `START_HERE_FOR_NEW_CONVERSATIONS.md`
- `CHATGPT_PROJECT_SOURCE_UFO_PREDICTOR_CURRENT.md`
- `CODEX_HANDOFF_CURRENT.md`

## Current Full Refresh Reason

This refresh is justified because the project completed:

- PR #23 / C03: public match detail from DB;
- manual remote migration through 0013;
- public projection hardening;
- Codex prompt execution card discipline;
- post-C03 handoff into C04.

## Prompt Files

Prompt files may be included for handoff convenience.

Suggested post-C03 prompt files:

- `PROMPT_NEW_CHATGPT_CONVERSATION_POST_C03.md`
- `PROMPT_CODEX_RECOGNITION_C04.md`

Prompt files are operational handoff aids, not architectural sources.
