# Workflow, Guardrails, and Documentation Policy

_Last refreshed: 2026-06-23._

## Branch ritual

Before implementation:

```text
git fetch origin
confirm branch and clean status
confirm the intended base SHA
create one bounded branch from updated origin/main or the explicit feature branch
```

Do not mix MVP1 production fixes into Prediction Intelligence v2.

## Recognition rule

Codex should inspect repository truth before changing files:

- current branch and status;
- recent commits and relevant PRs;
- canonical docs;
- exact code paths;
- schema/migration state;
- environment boundaries.

## Safety rules

- production writes require explicit production-scoped authorization;
- Task 3B production writes are forbidden;
- secrets remain in Git-ignored local/runtime stores;
- no secret values in prompts or reports;
- no destructive stage reset;
- no post-result prediction rewrite;
- no started-fixture republish;
- no broad refactor during bounded operational fixes.

## Validation baseline

For code changes:

- focused tests;
- lint;
- production build;
- `git diff --check`;
- exact changed-file and behavior report;
- manual smoke where the behavior depends on production services.

## Documentation structure

### `docs/00_chatgpt_sources/`

Core shared canonical files. These are the only default files to upload to the ChatGPT project.

### `docs/10_codex_runbooks/`

Detailed operational steps, implementation checklists, and repo-specific handoffs for Codex.

### `docs/20_optional_project_sources/`

Specialized material that should not pollute the main engineering ChatGPT context unless needed.

### `docs/90_archive/`

Read-only historical snapshots and superseded documents. Archive preserves information but is not current truth.

## Source limit policy

Keep the ChatGPT core under 15 files when possible and always under 25.

A source belongs in the core only when it is:

- current;
- cross-cutting;
- repeatedly useful in conversations;
- not already fully represented by another core document.

Detailed one-task runbooks belong in Codex-only docs.

The primary engineering ChatGPT project should contain one current copy of each core source. Superseded uploaded copies must be removed after a reviewed documentation refresh so stale context does not compete with current truth.

## Refresh policy

After a meaningful production or v2 milestone:

1. update `00_START_HERE_CURRENT.md`;
2. update the relevant domain source;
3. update roadmap/decisions;
4. update Codex handoff/runbook if execution state changed;
5. archive, do not silently erase, superseded truth;
6. record date, PR/commit, and explicit deferred items;
7. after the docs PR is merged, replace obsolete uploaded ChatGPT project sources with the exact current core set instead of keeping old and new copies together.

## Current source families

- repository code and migrations;
- GitHub PR/commit state;
- production/stage operator evidence;
- API-Football operational data;
- World Football Elo;
- FIFA ranking snapshots;
- official World Cup schedule/venue material;
- deterministic prepared snapshots.

## Documentation truth hierarchy

1. current repository/code/schema;
2. current environment evidence;
3. current shared canonical docs;
4. Codex runbooks;
5. archived historical docs.

When sources disagree, report the discrepancy instead of blending them into a comforting fiction.
