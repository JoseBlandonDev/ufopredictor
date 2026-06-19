# Codex Workflow - UFO Predictor

_Last refreshed: post PR #99 documentation rebaseline (2026-06-19)._

## Purpose

Use Codex for bounded engineering work with explicit scope, evidence, validation, and clean handoff.

## Standard branch ritual

```bash
git switch main
git pull --ff-only origin main
git fetch origin --prune
git status --short --branch
git switch -c <branch>
```

Stop if `main` is dirty or the expected baseline PRs are missing.

## Recognition first

Before editing:

1. inspect branch and status;
2. inspect relevant docs and code paths;
3. identify persistence, auth, and temporal boundaries;
4. list expected files;
5. state blockers and owner decisions;
6. confirm what will not be touched.

Recognition should be read-only unless the prompt explicitly authorizes implementation.

## Token-efficient operations

Prefer console/local scripts for:

- API reads;
- inventories;
- dry-run repetition;
- exact fixture checks;
- export generation;
- status commands;
- file copying and hashing.

Use Codex for:

- architecture reasoning;
- implementation;
- migration design;
- focused tests;
- diff review;
- complex debugging.

Do not consume large context windows observing repetitive commands that can be run directly in PowerShell.

## Required safety patterns

### Data and fixtures

- exact fixture or exact round selection;
- provider revalidation before writes;
- freeze live/finished/kickoff-passed fixtures;
- dry-run by default;
- write mode explicit;
- idempotence proof after write.

### Model

- stored pre-match prediction is the fair historical record;
- no post-result rewriting;
- signal refresh is not model recalibration;
- do not combine signal, xG, draw, and publication changes.

### Payments

- redirect never activates premium;
- client data never proves payment;
- no service-role app route;
- no secret exposure;
- entitlements, not subscriptions, authorize access.

### Public product

- no internal evaluation payloads;
- no raw Lab payloads;
- no provider predictions/odds;
- no Torneo picks as UFO model input.

## Validation

Typical code slice:

```bash
git diff --check
npx vitest run <focused-tests>
npm run lint
npm run build
git status --short
```

Signal changes also require:

```bash
npm run signal:check:national-team-pack
```

Docs slice:

- docs-only diff;
- stale-phrase search;
- cross-document consistency;
- no secret values;
- no unsupported production claims.

## Reporting format

Return:

1. branch/status;
2. files changed;
3. exact behavior;
4. tests;
5. boundaries preserved;
6. blockers;
7. final verdict.

## Commit rules

- no commit/push/PR unless explicitly authorized;
- separate operational code and documentation commits when practical;
- do not commit generated delivery artifacts unless the repository contract requires it.
