# V2 Branch and Environment Normalization Runbook

_Last refreshed: 2026-06-24 after Task 2 normalization and checkpoint approval._

## Goal

Finish rebuilding Prediction Intelligence v2 on top of the current production baseline without losing historical research or regressing MVP1 behavior.

## Live-state source

Before work, read and verify:

```text
docs/00_chatgpt_sources/00_START_HERE_CURRENT.md
docs/00_chatgpt_sources/05_PREDICTION_INTELLIGENCE_V2_CURRENT.md
docs/00_chatgpt_sources/06_V2_STAGE_RELEASE_PLAN.md
```

Verify live SHAs before implementation.

## Current stable references

```text
production main at integration base: e771de3c39c480f05d026075e5e553fb75207468
active integration branch: integration/prediction-intelligence-v2
active Draft PR: #114
active head at this refresh: 1b746f9d038ecfbd49068ecacf8d39c62d4a5fc9
old v2 branch: feature/prediction-intelligence-v2-data-foundation
old Draft PR: #106
old v2 head: eefcff709e80209215b25b90fb870aa5c080d735
```

## Completed port map

| Historical concern | Integrated commit | Status |
|---|---|---|
| Task 1 data foundation | `76500de` | Complete |
| Task 1.1 replay readiness | `16fef9b` | Complete |
| Task 1.2 historical Elo | `f411d60` | Complete |
| Task 2 challenger/replay | `ca5fd01` | Complete |
| Task 2 calibration stabilization | `bf13c21` | Complete |
| Task 2 gates/eligibility | `1d70412` | Complete |
| Task 2 release packaging | `de083c1` | Complete |
| Task 2 local-run guard | `1b746f9` | Complete |

Task 2 checkpoint passed.

## Remaining normalization strategy

Port only Task 3A from:

```text
6967fd6b22a49e23ab9963345f1a1437b1d6b668
```

Task 3A must be separated from later stage execution and from the old handoff documentation.

Expected Task 3A scope:

- target authorization guard;
- migration plan;
- idempotent import plan;
- signal-persistence plan;
- immutable prediction-version plan;
- Torneo export dry-run;
- production-write denial;
- focused tests.

Do not port stale frontend, shared queries, docs, or environment-specific paths blindly.

## Task 3A safety

- local-only;
- no `.env` requirement unless the implementation explicitly uses safe optional local configuration without remote access;
- no Supabase client;
- no network;
- no remote migration;
- no stage or production write;
- no current candidate generation;
- no publication;
- no modification of preserved historical evidence;
- fail closed for any production target.

## Post-Task 3A checkpoint

Confirm:

- all useful old-branch implementation concerns are ported or intentionally excluded;
- no Task 3B remote behavior entered early;
- migration 0038 remains unapplied;
- MVP1 protected behavior remains intact;
- local-only output boundaries are enforced;
- PR #114 can move toward review after documentation and final scope update.

## Stage transition

Task 3B begins only after the M2-01 checkpoint.

First phase is read-only:

- identify stage target safely;
- inspect remote migration history/schema;
- compare against repository migrations;
- inspect RLS, functions, views, and dependencies;
- produce an ordered non-destructive synchronization plan;
- stop for owner approval.

Only a later approved phase may apply migration 0038 and import non-sensitive data.

## Validation after bounded work

- focused imported tests;
- relevant Task 1/2/3 local runners;
- protected MVP1 regression tests when shared code is touched;
- lint;
- production build when warranted;
- typecheck classification with zero new diagnostics;
- diff-check;
- generated-noise cleanup;
- no production write.

## Current production concerns that must survive

- PR #111 fixture registry behavior;
- PR #112 trusted result refresh behavior;
- immutable v1 Matchday 3 publications;
- `torneo-ufo-export-v1` compatibility;
- Wompi/Auth/entitlement behavior;
- public lifecycle and history.

## Required output

- source commit and exact changed-file boundary;
- old concern -> integrated concern mapping;
- intentionally excluded files and rationale;
- conflicts and resolutions;
- safety and write-scope review;
- tests/build/diff evidence;
- final verdict;
- no Git commit/push unless the owner explicitly delegates it.
