# CODEX WORKFLOW — UFO Predictor

_Last updated: post C05 Gate 2A / Presentation Boundary sin SQL_

Current baseline: main is post PR #27 (`docs: update project context after c05 gate 1`) and the active working tree includes C05 Gate 2A changes pending commit/PR. Do not assume a future PR number until it is created and merged.


## Core Rule

Codex may inspect and modify the repository only within the approved scope.

Codex must not commit, push, or open PRs unless explicitly instructed.

## Standard Start Commands

Before any recognition or implementation:

```bash
git checkout main
git pull origin main
git status
git branch
git log --oneline -5
```

If the task is intentionally continuing from an active feature branch, confirm the branch and do not switch unless the user asked.

## Recognition First

For new epics or sensitive gates, Codex should first perform recognition only.

Recognition means:

- inspect relevant files;
- report current branch/state;
- identify likely files/migrations;
- identify risks;
- propose scope;
- do not modify files.

Implementation starts only after ChatGPT/user review.

## Codex Usage Cost / Intensity Rule

Codex remains the main repository execution tool for UFO Predictor. It should not be used as a general consultant when the task is better handled by ChatGPT, Antigravity, OpenCode, or the user manually.

Every ChatGPT-generated Codex prompt must be split into two separate blocks:

```txt
EJECUCIÓN RECOMENDADA
- Herramienta:
- Modelo:
- Inteligencia:
- Tamaño:
- Riesgo:
- Motivo:
- Manual/PowerShell vs Codex:

PROMPT LIMPIO PARA CODEX
...
```

The execution card is for the user. The clean prompt is the copy/paste block for Codex. Do not merge tool recommendations into the Codex prompt unless explicitly needed.

### Tool Split

- ChatGPT: planning, product/technical scope, architecture review, Codex prompts, review of Codex responses, SQL conceptual review, commit/push/PR decisions, documentation, and handoff.
- Codex: repository inspection, file edits, SQL migration files, server queries, implementation, tests/lint/build, diffs, and git operations only when explicitly authorized.
- Antigravity: visual prototypes, UI/product exploration, isolated demos, Google stack experiments, and non-critical UX ideas.
- OpenCode: low-cost audit, second opinion, candidate tests, simple scripts, repetitive tasks, and non-critical support.
- Manual/user: Supabase SQL Editor, remote SQL validation, GitHub UI, final PR/merge confirmations, and sharing console/SQL results.

Antigravity and OpenCode are auxiliary tools. They do not replace Codex for controlled repository execution.

### Manual / PowerShell Is Enough For

- `git status`, `git diff`, `git log` checks;
- simple commit/push/branch cleanup when the user already knows the flow;
- local validation commands;
- sharing SQL validation output;
- visual QA screenshots.

Do not overuse Codex for tasks the user can safely run manually.

### Codex Bajo/Medio

Use lower/medium Codex intensity for:

- recognition;
- `git status`, branch, and log checks;
- file discovery;
- diff summaries;
- validation commands;
- commit message preparation;
- commit/push only after approval;
- documentation/simple mechanical edits;
- low-risk repetitive changes;
- UI/copy changes without data boundary implications.

### Codex Alto/Fuerte / GPT-5.5

Use high/strong Codex intensity or GPT-5.5 for:

- SQL migrations;
- RLS policies;
- Supabase server queries;
- auth;
- entitlements;
- premium filtering;
- access logic;
- security-sensitive changes;
- broad refactors;
- anything that could expose premium data or break authorization.

### Do Not Use Codex As General LLM For

- broad research;
- product strategy;
- brainstorming;
- tool comparisons;
- commercial decisions;
- long documentation if repo inspection is not required.

## Supabase Migration Rule

Supabase CLI local is not configured as the normal workflow.

Codex creates migration files but does not apply them remotely.

The user applies migrations manually in Supabase SQL Editor.

Codex must always:

1. create the migration file;
2. provide the complete SQL;
3. provide validation queries;
4. state that remote application is manual;
5. avoid claiming remote validation unless the user confirms it.

## Required Post-Implementation Commands

```bash
git diff --check
npm run test
npm run lint
npm run build
git status --short
git diff --name-only
git diff --stat
```

If `next-env.d.ts` changes:

```bash
git restore next-env.d.ts
```

## Branch Naming

Use clear branch names:

- `feature/<scope>` for code features;
- `docs/<scope>` for docs-only updates;
- `fix/<scope>` for fixes.

Recent branches:

- `feature/premium-access-enforcement-skeleton`
- `feature/registered-free-value-wall`

C05 Gate 2A branch may use:

```txt
feature/anonymous-free-presentation-boundary
```

## PR Discipline

Every PR should include:

- what changed;
- what did not change;
- validations run;
- manual Supabase validation if migration exists;
- explicit no-scope list.

## Protected Areas

Do not touch unless explicitly requested:

- `.env.local`;
- production secrets;
- unrelated migrations;
- Lab Admin code when working on public product surfaces;
- prediction engine logic unless epic requires it;
- model evaluation logic unless epic requires it.

## Premium Safety Rule

No premium data should reach the browser without backend filtering.

Visual locks, blur, and teaser cards are not authorization.

`premium_user` is not enough to unlock all content.

Active subscription is not enough to unlock content by itself.

Use current entitlements and match unlocks for effective access.

`quantity/match_pack` does not directly grant content access; packs should materialize explicit match unlocks.

`trustedBetaFreeMatchIds` must come from trusted server-side context.

`stageAccessKey` must be canonical and derived server-side.

Do not use service role for normal UI surfaces.

## Current Context For Codex

Main includes PR #27 and the active working branch may include C05 Gate 2A changes.

Completed:

- C01 — Public Predictions From DB.
- C02 — Plans & Entitlements Backend.
- C03 — Match Detail Public From DB.
- C04 — Premium Access Enforcement Skeleton.
- C05 Gate 0 — Anonymous vs Registered Free Product Audit.
- C05 Gate 1 — Registered Free Value Wall.
- C05 Gate 2A — Presentation Boundary sin SQL, pending commit/PR if in active branch.

Next likely decision:

```txt
C05 Gate 2B — Real Data Boundary / Projection Decision
```

Do not confuse Gate 2A with a true data-security boundary.
