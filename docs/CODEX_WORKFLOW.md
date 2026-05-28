# CODEX WORKFLOW — UFO Predictor

_Last updated: post PR #26 / C05 Gate 1 Registered Free Value Wall_

This file defines how ChatGPT should prepare Codex work for UFO Predictor.

## Golden rule

Do not ask Codex to improvise product/security decisions. ChatGPT should define scope first, Codex executes or inspects.

## Codex prompt format rule

ChatGPT must separate execution guidance from the copyable Codex prompt.

### EJECUCIÓN RECOMENDADA

This block is for the user. It should include:

- tool
- model
- intelligence level
- task size
- risk
- reason
- whether PowerShell/manual work is enough

### PROMPT LIMPIO PARA CODEX

This block is the only block intended to be copied into Codex. It should contain the task instructions and must not be polluted with model/tool meta-commentary.

Use manual PowerShell for simple `git status`, `git diff`, validations, commit, push, and PR flow when the user is already comfortable doing it. Use Codex for code/doc changes, and reserve GPT-5.5 or high intelligence for SQL, RLS, auth, entitlements, server-side access, premium filtering, and other sensitive security work.


## Tool/model guidance

### Manual PowerShell is enough for

- `git status`
- `git diff`
- `git diff --stat`
- `git diff --check`
- running tests/lint/build
- commit/push/PR flow when the user is comfortable doing it

### Codex 5.3-Codex / medium is enough for

- reconnaissance
- diff review
- UI/copy changes
- docs changes
- small TypeScript changes without SQL/RLS
- build/lint/test feedback loops

### High intelligence / GPT-5.5 or equivalent should be used for

- SQL migrations
- RLS/grants/policies
- auth-sensitive changes
- entitlements and access enforcement
- server-only premium filtering
- data boundary changes that could expose premium payload

### Antigravity

Use for isolated UX/visual prototypes, not enforcement/security.

### OpenCode

Use for cheap secondary review, smell-checks, or diff audits.

## Required Codex guardrails

Every Codex prompt must state what is out of scope:

- no SQL unless explicitly requested;
- no Supabase remote unless explicitly requested;
- no premium tables opened;
- no service role for normal UI;
- no commit/push/PR unless explicitly requested;
- no `.env.local` changes;
- no premium payload unless the task is specifically about authorized premium serving.

## Current project-sensitive areas

- `prediction_markets`
- `prediction_narratives`
- `prediction_results`
- RLS/grants/policies
- `lib/permissions/entitlements.ts`
- `lib/supabase/viewer-access-queries.ts`
- public projections/views
- any future anon vs Registered Free data boundary

## Current next task category

C05 Gate 2 is a data boundary recognition/planning task. It may lead to SQL/RLS later, but the first prompt should be recognition only.
