# CODEX WORKFLOW — UFO Predictor

_Last updated: post PR #21 / C02 Plans & Entitlements Backend_

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
feature/match-detail-public-from-db
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
