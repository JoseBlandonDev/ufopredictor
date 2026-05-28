# DOCS AND SOURCES INVENTORY — UFO Predictor

_Last updated: post C05 Gate 2A / Presentation Boundary sin SQL_

Current baseline: main is post PR #27 (`docs: update project context after c05 gate 1`) and the active working tree includes C05 Gate 2A changes pending commit/PR. Do not assume a future PR number until it is created and merged.


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

## Prompt Files

Prompt files are operational handoff aids, not architectural sources.

Old prompt files such as:

- `PROMPT_NEW_CHATGPT_CONVERSATION_POST_C03.md`
- `PROMPT_CODEX_RECOGNITION_C04.md`

should be treated as historical if they still exist. They are useful artifacts, not current instructions.

## Current Baseline To Reflect Across Docs

Main includes through:

```txt
PR #27 — docs: update project context after c05 gate 1
```

Completed:

- C01 — Public Predictions From DB
- C02 — Plans & Entitlements Backend
- C03 — Match Detail Public From DB
- C04 — Premium Access Enforcement Skeleton
- C05 Gate 0 — Anonymous vs Registered Free Product Audit
- C05 Gate 1 — Registered Free Value Wall
- C05 Gate 2A — Presentation Boundary sin SQL, if current branch docs are being committed with Gate 2A

Supabase remote manually applied through:

```txt
0013_public_match_detail_projection_hardening.sql
```

## C05 Gate 2A Documentation Baseline

C05 Gate 2A added:

- presentation-level anonymous vs registered-free differentiation;
- anonymous keeps metadata + full public 1X2;
- anonymous sees confidence/risk as basic signal/teaser;
- registered free sees confidence/risk fully rendered with more context;
- preview signals remain placeholder/teaser;
- dashboard reinforces free account value.

C05 Gate 2A did not add:

- SQL;
- RLS;
- migrations;
- new views;
- query changes;
- premium tables;
- premium payload;
- real data boundary;
- payments, Stripe, checkout, odds, LLM, workers, sports API, Google Auth, Supabase CLI, staging, or i18n.

## Operational Documentation Rules

Update docs when:

- starting a new long ChatGPT project conversation;
- a major epic changes project direction;
- current context is too heavy for safe continuation;
- Codex needs a new baseline to avoid stale assumptions;
- a gate changes product strategy or data boundary assumptions.

Do not necessarily update the full docs after every PR.

For routine PRs, update only relevant technical docs if needed.

For conversation handoff PRs, update the full active set.

Do not destructively summarize active docs. The point of docs is to preserve context, not to make future-you solve the same mystery again with worse clues.

## Tool Usage Documentation Rule

Active docs must preserve the Codex prompt split rule.

Every ChatGPT-generated Codex instruction should be presented as:

```txt
EJECUCIÓN RECOMENDADA
...

PROMPT LIMPIO PARA CODEX
...
```

This rule belongs primarily in:

- `CODEX_WORKFLOW.md`
- `START_HERE_FOR_NEW_CONVERSATIONS.md`
- `CHATGPT_PROJECT_SOURCE_UFO_PREDICTOR_CURRENT.md`
- `CODEX_HANDOFF_CURRENT.md`

## Current Repair Reason

This refresh is justified because:

- older docs were post C03;
- C04, C05 Gate 0, C05 Gate 1, and C05 Gate 2A changed project state;
- previous Gate 2A docs became too destructive/short;
- active docs must preserve historical detail and update incrementally.
