# V2 Branch and Environment Normalization Runbook

_Last refreshed: 2026-06-23._

## Goal

Rebuild the Prediction Intelligence v2 work on top of the current production baseline without losing the nine completed v2 commits and without rolling back MVP1 product changes.

## Known state

```text
main: e0191607d46484d13d0771b4508da3b05722dcb5
old v2 branch: feature/prediction-intelligence-v2-data-foundation
old v2 head: eefcff709e80209215b25b90fb870aa5c080d735
merge base: 1dca9bf91000c089927452941a009117b622103f
main-only commits: 12
v2-only commits: 9
```

## Required strategy

1. Preserve the old branch and PR #106 unchanged.
2. Start only after the docs refresh is merged and `origin/main` is current.
3. Create `integration/prediction-intelligence-v2` from current `origin/main`.
4. Produce a nine-commit/file preservation matrix.
5. Port changes in this order:
   - migration/types/contracts;
   - source data/manifests/parsers;
   - model/replay/calibration libraries;
   - scripts/artifact generation;
   - tests;
   - Task 3A/3B runbooks.
6. Do not port stale frontend/shared queries/docs blindly.
7. Resolve conflicts manually against current MVP1 behavior.
8. Validate after each group.
9. Open a replacement Draft PR.
10. Close/supersede #106 only after all required concerns are preserved.

## Suggested worktrees

```text
D:\Projects\ufo-predictor
D:\Projects\ufo-predictor-v2
D:\Projects\ufo-predictor-ui
```

## Validation after each group

- focused imported tests;
- current public query/lifecycle tests;
- Auth/pricing/entitlement tests if shared code was touched;
- lint;
- build;
- diff-check;
- no production write.

## Required output

- old commit -> new commit/file mapping;
- intentionally excluded files and rationale;
- conflicts and resolutions;
- tests/build evidence;
- replacement Draft PR URL;
- explicit confirmation PR #106 remained Draft/unchanged.
