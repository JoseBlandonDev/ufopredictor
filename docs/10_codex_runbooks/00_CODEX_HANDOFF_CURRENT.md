# Codex Handoff Current

_Last refreshed: 2026-06-24._

## Canonical-source rule

Before implementation, read:

```text
docs/00_chatgpt_sources/00_START_HERE_CURRENT.md
docs/00_chatgpt_sources/07_ROADMAP_EPICS_DECISIONS.md
docs/00_chatgpt_sources/09_WORKFLOW_GUARDRAILS_DOC_POLICY.md
```

Those files own live product, branch, roadmap, and workflow truth.

This handoff contains the current immediate sequence and hard execution boundaries. Verify live SHAs rather than assuming this snapshot remains current.

## Reference baseline at this refresh

```text
main: 130ffc8b6728ccccfdb9f29ecc4244ec1cd019b6
PR #111: merged
PR #112: merged

old v2 branch:
feature/prediction-intelligence-v2-data-foundation

Draft PR #106 head:
eefcff709e80209215b25b90fb870aa5c080d735
```

PR #106 remains Draft and must not receive new implementation work.

## Immediate next sequence

1. Start from clean current `origin/main`.
2. Create `integration/prediction-intelligence-v2`.
3. Preserve the old branch and PR #106 unchanged.
4. Audit the nine v2-only commits by file and concern.
5. Selectively port valid data, migration, model, replay, script, artifact, and test work.
6. Exclude stale frontend, docs, and shared-runtime changes.
7. Validate MVP1 tests, lint, build, and diff-check after bounded groups.
8. Open a replacement Draft PR.
9. Perform Task 3B read-only stage audit.
10. Stop for owner approval before stage writes.

## Current production continuity

Already delivered:

- 24/24 Matchday 3 fixtures stored;
- 24/24 v1 predictions published;
- trusted World Cup result refresh;
- automatic valid `FT` verification/evaluation;
- validated 24-fixture Torneo JSON export.

Parallel production work should now focus on:

- relevant recent result/status polling;
- retry/backoff and scheduler hardening;
- bounded product fixes;
- independent UI/UX improvements;
- no re-opening of completed Matchday 3 registry/publication work.

## Source workspace

External prepared source workspace:

```text
D:\Projects\ufo-predictor-source-snapshots\2026-06-20\prepared-v2
```

Committed equivalents exist under `data/`, `artifacts/prediction-intelligence-v2/`, `lib/prediction-intelligence-v2/`, and `scripts/prediction-intelligence-v2/`.

Do not report the data as lost merely because the external path is unavailable in one environment.

## Environment contract

```text
ufopredictor.com       -> production Railway/Supabase
stage.ufopredictor.com -> development Railway/Supabase stage
```

Do not create another environment. Do not require Docker.

## Hard boundaries

- no production writes during v2 normalization or Task 3B;
- no merge of PR #106;
- no blanket merge/cherry-pick of all nine old commits;
- no production migration 0038;
- no production user/payment/entitlement cloning;
- no secrets in output;
- no post-kickoff prediction generation;
- no reopening completed MVP1 commercial work;
- no rewriting original v1 Matchday 3 publications;
- no claim that v2 is already more accurate.

## Reporting contract

Return:

- branch/status/base SHA;
- divergence/commit inventory;
- files inspected/changed;
- exact before/after behavior;
- tests/lint/build/diff-check;
- environment/write scope;
- blockers only when concrete;
- final verdict;
- commit SHA when committed.
