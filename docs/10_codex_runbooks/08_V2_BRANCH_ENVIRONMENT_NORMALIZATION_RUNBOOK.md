# V2 Branch and Environment Normalization Runbook

_Last refreshed: 2026-06-24._

## Goal

Rebuild Prediction Intelligence v2 on top of the current production baseline without losing the nine v2-only commits or rolling back MVP1 product and operations changes.

## Live-state source

Before work, read and verify:

```text
docs/00_chatgpt_sources/00_START_HERE_CURRENT.md
docs/00_chatgpt_sources/05_PREDICTION_INTELLIGENCE_V2_CURRENT.md
```

Do not trust hardcoded SHAs or divergence counts from an old prompt. Recompute them read-only.

Stable references:

```text
old v2 branch: feature/prediction-intelligence-v2-data-foundation
Draft PR: #106
known old v2 head at last refresh: eefcff709e80209215b25b90fb870aa5c080d735
known merge base: 1dca9bf91000c089927452941a009117b622103f
```

## Required strategy

1. Verify clean current `main` and `origin/main`.
2. Preserve the old branch and PR #106 unchanged.
3. Create `integration/prediction-intelligence-v2` from current `origin/main`.
4. Produce a nine-commit/file preservation matrix.
5. Port changes in this order:
   - migration/types/contracts;
   - source data/manifests/parsers;
   - model/replay/calibration;
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

Additional worktrees are optional. Do not create duplicate source snapshots merely to run parallel conversations.

## Validation after each group

- focused imported tests;
- current public query/lifecycle tests;
- result/fixture operation tests if shared code is touched;
- Auth/pricing/entitlement tests if shared code is touched;
- lint;
- production build;
- diff-check;
- no production write.

## Current production concerns that must survive

- PR #111 fixture registry behavior;
- PR #112 trusted result refresh behavior;
- immutable v1 Matchday 3 publications;
- Torneo `torneo-ufo-export-v1` compatibility;
- Wompi/Auth/entitlement behavior;
- public lifecycle and history.

## Required output

- old commit -> new commit/file mapping;
- intentionally excluded files and rationale;
- conflicts and resolutions;
- tests/build evidence;
- replacement Draft PR URL;
- confirmation PR #106 remained Draft/unchanged;
- confirmation no production write occurred.
