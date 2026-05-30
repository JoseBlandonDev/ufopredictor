# DOCS AND SOURCES INVENTORY — UFO Predictor

_Last updated: post C05 / pre C06_

Current baseline: `main` is post PR #29 (`Feature/registered free saved matches`). C05 is functionally closed. Next major block: C06 — World Cup Premium Package Foundation.


This inventory lists active documentation sources and how they should be used.

## Source Priority

Use these as active sources:

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
11. `IMPLEMENTATION_PLAN.md`
12. `ARCHITECTURE_SUMMARY.md`
13. `MODEL_V01.md`
14. `PROJECT_CONTEXT_UFO_PREDICTOR.md`
15. `PROJECT_STATUS_FOR_MEETING.md`

Older prompt files should be treated as historical if they contradict active sources.

## Active Documents

### `START_HERE_FOR_NEW_CONVERSATIONS.md`

Primary onboarding document for new ChatGPT/Codex/handoff sessions.

Should contain:

- current baseline;
- Supabase remote state;
- workflow rules;
- current route state;
- next recommended block.

### `CHATGPT_PROJECT_SOURCE_UFO_PREDICTOR_CURRENT.md`

Compact-but-complete project source for ChatGPT context.

Should contain:

- project identity;
- current funnel;
- key security rules;
- active route/data state;
- next block.

### `CURRENT_PROJECT_STATUS.md`

Status snapshot.

Should contain:

- latest PRs;
- completed blocks;
- current Supabase state;
- current product/user states;
- next block.

### `CODEX_HANDOFF_CURRENT.md`

Operational handoff for Codex.

Should contain:

- current repo baseline;
- what Codex may or may not touch;
- Supabase workflow;
- route/data state;
- validation expectations.

### `CODEX_WORKFLOW.md`

Tool/process rules.

Should contain:

- ChatGPT vs Codex vs manual PowerShell split;
- prompt format;
- Git/PR discipline;
- documentation refresh discipline;
- Supabase migration workflow.

### `DATA_DICTIONARY.md`

Current data objects and views.

Should include:

- public views;
- `user_saved_matches`;
- entitlement tables;
- premium/internal tables;
- key access concepts.

### `EPIC_PROGRESS_MATRIX.md`

Epic/gate completion matrix.

Should show C01–C05 done and C06 next.

### `NEXT_EPICS_PLAN.md`

Forward plan.

Should prioritize C06 and identify C07/C08 and later tracks.

### `ROADMAP_AND_BACKLOG.md`

Roadmap and backlog.

Should preserve future tracks D/E/F/G and avoid destructive summarization.

### `OPEN_DECISIONS.md`

Active and closed decisions.

Should preserve decisions around freemium, packages, permissions, saved matches, providers, payments, staging, i18n.

### `IMPLEMENTATION_PLAN.md`

Implementation sequencing.

Should preserve completed blocks and future implementation constraints.

### `ARCHITECTURE_SUMMARY.md`

Architecture-level overview.

Should describe current public product, Supabase boundaries, entitlements, saved matches, and future premium projection.

### `MODEL_V01.md`

Prediction model principles.

Should preserve that the statistical model calculates and AI explains.

### `PROJECT_CONTEXT_UFO_PREDICTOR.md`

Human-readable project context.

Useful for collaborators and broad overview.

### `PROJECT_STATUS_FOR_MEETING.md`

Meeting-ready status brief.

Should stay concise and non-technical enough for stakeholder discussion.

## Documentation Refresh Rule

Do not update docs after every small step.

Refresh docs when:

- closing a stage;
- changing conversation;
- preparing handoff;
- changing architecture/product decisions.

## Preservation Rule

Do not replace broad docs with tiny summaries.

When refreshing:

- update baseline;
- add new decisions;
- correct obsolete state;
- preserve historical/operational context;
- avoid deleting useful future backlog.

## Current Refresh Context

This refresh closes C05 and prepares C06.

It includes:

- PR #28;
- PR #29;
- C05 complete;
- Supabase up to 0014;
- saved matches foundation;
- updated workflow rules from C05.
