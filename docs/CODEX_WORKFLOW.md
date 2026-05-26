# CODEX WORKFLOW — UFO Predictor

_Last updated: post PR #23 / C03 Match Detail Public From DB_

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

## Recognition First

For new epics, Codex should first perform recognition only.

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

Every ChatGPT-generated prompt for Codex must begin with an execution card:

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

The card exists to control cost, reduce unnecessary Codex usage, and make scope/risk explicit before execution. Human beings invented budgets and then made machines obey them. Here we are.

### Tool Split

- ChatGPT: planning, product/technical scope, architecture review, Codex prompts, review of Codex responses, SQL conceptual review, commit/push/PR decisions, documentation, and handoff.
- Codex: repository inspection, file edits, SQL migration files, server queries, implementation, tests/lint/build, diffs, and git operations only when explicitly authorized.
- Antigravity: visual prototypes, UI/product exploration, isolated demos, Google stack experiments, and non-critical UX ideas.
- OpenCode: low-cost audit, second opinion, candidate tests, simple scripts, repetitive tasks, and non-critical support.
- Manual/user: Supabase SQL Editor, remote SQL validation, GitHub UI, final PR/merge confirmations, and sharing console/SQL results.

Antigravity and OpenCode are auxiliary tools. They do not replace Codex for controlled repository execution.

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
- low-risk repetitive changes.

### Codex Alto/Fuerte

Use high/strong Codex intensity for:

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

Supabase CLI local is not configured.

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

Current next recommended branch:

```txt
feature/premium-access-enforcement-skeleton
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

Visual locks are not authorization.

`premium_user` is not enough to unlock all content.

Active subscription is not enough to unlock content by itself.

Use current entitlements and match unlocks for effective access.

## Current Context For Codex

Main includes PR #23 / C03.

C03 completed:

- `/matches/[slug]` reads DB-backed public/free-only match detail;
- `/predictions` reads `public_prediction_summaries`;
- `0013_public_match_detail_projection_hardening.sql` created explicit public views;
- `anon` reads approved public views only;
- premium/internal tables remain closed.

Next likely epic: C04 Premium Access Enforcement Skeleton.
