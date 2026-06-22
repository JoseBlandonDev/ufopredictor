# Codex Workflow - UFO Predictor

_Last refreshed: 2026-06-22._

## Principle

Use Codex for bounded engineering with explicit target, scope, safety, validation, and handoff. Do not spend token windows narrating mechanical command output or rediscovering the whole repository.

## Branch ritual

For the current Prediction Intelligence v2 work, remain on:

```text
feature/prediction-intelligence-v2-data-foundation
```

Do not automatically switch to `main`; the current branch contains unmerged work.

Before a task:

```bash
git branch --show-current
git status --short --branch
```

## Recognition rule

Recognition must be proportional:

- inspect only relevant files/objects;
- reuse existing Task 1/2/3 modules and artifacts;
- report concrete blockers;
- avoid broad repo audits unless requested;
- no edits during read-only recognition.

## Data safety

- exact fixture/round scope;
- strict pre-kickoff cutoff;
- freeze started/live/finished;
- dry-run before write;
- explicit write authorization;
- second-run idempotency proof;
- no secret output.

## Environment safety

For Task 3B:

- load `.env.task3b.development.local`;
- use only `DEV_SUPABASE_*` variables;
- require development target/write flags;
- fail closed on mismatch;
- deny production ref/host;
- never print keys/password/DB URL;
- no Docker debugging.

## Model safety

- stored prediction is historical evidence;
- no post-result rewrite;
- no recalibration inside migration/UI tasks;
- no claim of v2 superiority unsupported by metrics;
- separate probability engine from analysis/presentation.

## Validation

Typical code:

```bash
git diff --check
npx vitest run <focused-tests>
npm run lint
npm run build
git status --short
```

Task 3B also requires physical DB validation, row counts, RLS checks, idempotency, immutable lineage, and production-denial proof.

## Reporting

Return:

1. initial/final status;
2. files changed;
3. target/cutoff;
4. behavior/results;
5. tests;
6. safety boundaries;
7. blockers;
8. commit SHA only when authorized.
