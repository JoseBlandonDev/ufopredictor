# Codex Handoff Current

_Last refreshed: 2026-06-23._

## Baselines

```text
Production main:
e0191607d46484d13d0771b4508da3b05722dcb5

Documentation refresh branch:
docs/adopt-2026-06-23-project-source-refresh
commit: 43fb1dc3957afd0b8356edd4766396f7338e9afb

Old Prediction Intelligence v2 branch:
feature/prediction-intelligence-v2-data-foundation
Draft PR #106 head:
eefcff709e80209215b25b90fb870aa5c080d735
```

PR #106 must remain Draft and should not receive new implementation work.

## Branch divergence

Latest audited comparison:

- `main` has 12 commits missing from the old v2 branch;
- old v2 has 9 commits missing from `main`;
- merge base: `1dca9bf91000c089927452941a009117b622103f`.

## Exact next sequence

1. Finish/review/merge the updated documentation branch.
2. From current clean `origin/main`, create `integration/prediction-intelligence-v2`.
3. Preserve the old branch and PR #106 unchanged.
4. Audit the nine v2 commits by file/concern.
5. Selectively port valid data/model/migration/test work.
6. Exclude stale frontend/docs/shared-runtime changes.
7. Validate current MVP1 tests/lint/build throughout.
8. Open a replacement Draft PR.
9. Perform Task 3B read-only stage audit.
10. Stop for human approval before stage writes.

## Parallel production work

Short branches from current `main` may continue for:

- fixture/result operations;
- remaining group-stage fixture discovery/publication;
- bounded UI/UX/accessibility improvements;
- stable-contract ops automation;
- admin workflow ergonomics.

Do not make these depend on migration 0038.

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

- no production writes during v2 normalization/Task 3B;
- no merge of PR #106;
- no blanket merge/cherry-pick of all nine old commits;
- no production migration 0038;
- no production user/payment/entitlement cloning;
- no secrets in output;
- no post-kickoff prediction generation;
- no reopening completed MVP1 commercial work.

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
- commit SHA when changes are committed.
