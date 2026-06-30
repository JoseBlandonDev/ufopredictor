# Codex Handoff Current

_Last refreshed: 2026-06-29._

## Canonical-source rule

Before implementation, read:

```text
docs/00_chatgpt_sources/00_START_HERE_CURRENT.md
docs/00_chatgpt_sources/07_ROADMAP_EPICS_DECISIONS.md
docs/00_chatgpt_sources/09_WORKFLOW_GUARDRAILS_DOC_POLICY.md
```

Those files own live product, branch, roadmap, and workflow truth.

Verify live SHAs before work.

## Last confirmed reference baseline

```text
production main HEAD:
6e43cb0e6575bff42372d021c8c35628e912a1e7

active V2 branch:
integration/prediction-intelligence-v2

active V2 Draft PR:
#114

last confirmed V2 HEAD:
dc0187e31770e7a03d57db25d3887967bdaef09a
```

Old branch and PR #106 remain preservation only.

## Production checkpoint

The following is operator-confirmed production evidence supported by local operational artifacts, not tracked-Git proof by itself.

Completed:

- 15 future Round-of-32 fixtures ingested;
- 15 internal predictions saved;
- 15 public predictions published;
- publish queue cleared;
- Croatia 2-1 Ghana verified/evaluated/idempotent;
- South Africa 0-1 Canada verified without a retrospective prediction;
- tracked `main` worktree clean.

Do not reopen this checkpoint without a concrete defect.

## Routine provider boundary

Do not use Codex for:

- fixture discovery;
- schedule lookup;
- score lookup;
- venue lookup;
- routine provider dry-runs;
- routine exact applies;
- admin publication;
- admin verification.

These are operator PowerShell/admin tasks.

Do not consult Wikipedia or secondary pages as write authority.

Use Codex only for:

- code defects;
- missing supported paths;
- bounded implementation;
- migrations;
- tests;
- complex debugging.

## Pricing reconciliation note

Owner-approved commercial target and operator-observed production presentation are US$10 / COP 35,000; tracked repository implementation remains unreconciled.

The repository still contains stale US$20 / COP 68,700 references in migration history, pricing fallback, and tests. Treat pricing reconciliation as a bounded implementation task. Do not rewrite canonical documentation independently.

## MVP 1.5 track

Future MVP 1.5 work:

- starts from current `main`;
- ships in small bounded PRs;
- regularly receives `main`;
- merges accepted work to `main`;
- is then synchronized into V2.

Do not build MVP 1.5 independently until the end.

Expected early tasks:

- Free/Premium copy cleanup;
- US$10 offer presentation;
- Premium badge;
- venue ingestion/display;
- viewer-local and compact reference times;
- Premium response hierarchy;
- pricing/panel/Transparency polish.

## V2 sequence

```text
Task 2B current fixture/result refresh
-> Task 2C rankings/standings/context
-> Task 2D repeatable current signals
-> first unpublished V2 shadow candidate
```

Production writes are forbidden from V2 tasks.

## Hard boundaries

- no post-kickoff public prediction generation;
- no original V1 rewrite;
- no broad merge of old PR #106;
- no production migration from V2 without approved release;
- no secrets in output;
- no canonical-document authorship by Codex;
- no `git add artifacts/`;
- no broad cross-branch copy without review.

## Reporting contract

Return:

- branch/status/base SHA;
- target environment/write scope;
- exact files changed;
- exact behavior before/after;
- tests/lint/build;
- conflicts/blockers;
- commit SHA when committed;
- no unsupported claims.
