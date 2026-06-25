# Start Here - UFO Predictor Current

_Last refreshed: 2026-06-25 after Task 3A completion and final M2-01 implementation checkpoint approval._

## Current truth

UFO Predictor has a commercially usable production MVP1 and an active, unmerged Prediction Intelligence v2 integration track.

Production remains on the v1-compatible probability layer and currently supports:

- public World Cup prediction pages;
- anonymous, registered-free, premium, and admin experiences;
- Wompi checkout and approved-webhook entitlement activation;
- premium scenario, xG, BTTS, and over/under detail where available;
- exact fixture registration and prediction publication operations;
- trusted-provider result refresh, automatic verification, public history, and internal evaluation persistence;
- admin operational queues;
- a public-safe Torneo Mundialista JSON export.

Prediction Intelligence v2 is not live. Historical v2 artifacts, candidate names, release recommendations, and publication plans must not be described as current production decisions.

## Repository and PR baseline

Production baseline at the start of the current integration track:

```text
main: e771de3c39c480f05d026075e5e553fb75207468
PR #113: merged - documentation refresh after World Cup operations
```

Active v2 integration:

```text
branch: integration/prediction-intelligence-v2
Draft PR: #114
head: 0db9ac8867eae344e56237ac028cc32255ff1a3d
status: open, Draft, M2-01 implementation complete
```

Preserved historical source:

```text
branch: feature/prediction-intelligence-v2-data-foundation
Draft PR: #106
head: eefcff709e80209215b25b90fb870aa5c080d735
status: preservation/reference only
```

PR #106 and its branch remain unchanged. Do not continue implementation there and do not blanket-merge or blanket-cherry-pick it.

## M2-01 normalization progress

Implementation-complete on `integration/prediction-intelligence-v2`:

```text
76500de  Task 1   - data foundation
16fef9b  Task 1.1 - replay readiness
f411d60  Task 1.2 - historical Elo reconstruction
ca5fd01  Task 2A  - challenger and replay
bf13c21  Task 2B  - calibration stabilization
1d70412  Task 2C  - signal gates and candidate eligibility
de083c1  Task 2D  - historical release-candidate packaging
1b746f9  Task 2   - strict runner local-run output boundaries
0db9ac8  Task 3A  - local-only planner and dry-run
```

Checkpoint verdicts:

```text
TASK2_CHECKPOINT_READY
M2_01_IMPLEMENTATION_CHECKPOINT_READY
```

M2-01 is implementation-complete, not merged and not live. The normalized stack remains local-only, preserves historical artifacts byte-for-byte where declared, keeps protected MVP1 behavior unchanged, and contains no stage or production write path.
## Old v2 branch completion

No useful implementation remains to be ported from the old branch.

Task 3A was selectively normalized from:

```text
source: 6967fd6b22a49e23ab9963345f1a1437b1d6b668
integration commit: 0db9ac8
concern: local-only planner and dry-run
```

Task 3A now prepares descriptive plans for target classification, migration ordering, idempotent import, signal persistence, immutable prediction versions, and Torneo Mundialista export compatibility while explicitly denying execution.

It requires no `.env`, credentials, Supabase client, live API-Football read, network request, remote inspection, migration apply, import, persistence, publication, stage write, or production write.

The historical `supabase/.gitignore`, `supabase/config.toml`, and final old-branch documentation-only commit remain intentionally excluded. PR #106 and its branch are preservation/reference only.
## Environment map

```text
ufopredictor.com       -> Railway production  -> production Supabase
stage.ufopredictor.com -> Railway development -> separate Supabase stage
```

Stage already exists. Do not create another Railway service, Supabase project, or Docker replacement.

Production and stage have separate Auth, users, sessions, roles, entitlements, data, and secrets.

## Migration 0038 status

```text
0038_prediction_intelligence_v2_data_foundation.sql
```

Status:

- committed on the integration branch;
- structurally tested;
- not applied to stage;
- not applied to production.

Any remote migration work begins only after the Task 3B read-only stage audit, an owner-reviewed synchronization plan, and explicit owner approval.

## Historical artifact policy

Task 1, Task 2, and Task 3A preserved evidence is historical research.

Where declared by preservation manifests, artifacts are constrained by flags such as:

```text
historicalOnly: true
currentCandidateEligible: false
currentReleaseDecisionEligible: false
currentPublicationEligible: false
currentExecutionEligible: false   # Task 3A
```

Historical names containing `production`, `candidate`, `release`, `migration`, `import`, `persistence`, `publication`, or `export` do not authorize current use.

Task 2 and Task 3A runners may write only to strict descendants of their own runner-specific trees:

```text
artifacts/prediction-intelligence-v2/task2/local-run/
artifacts/prediction-intelligence-v2/task2-1/local-run/
artifacts/prediction-intelligence-v2/task2-2/local-run/
artifacts/prediction-intelligence-v2/task2-3/local-run/
artifacts/prediction-intelligence-v2/task3a/local-run/
```

External paths, sibling runner trees, arbitrary repository paths, preserved dated directories, traversal outside the allowed root, textual-prefix lookalikes, non-empty targets where prohibited, and the local-run root itself are rejected.
## World Cup production operations

Current production v1 continuity remains unchanged:

- 24/24 Matchday 3 fixtures stored;
- 24/24 Matchday 3 predictions published;
- exact publish queue empty at the recorded milestone;
- trusted API-Football `FT` results may be verified automatically when identity and score checks pass;
- internal evaluation persistence is idempotent;
- human review is exception-oriented;
- `torneo-ufo-export-v1` remains the approved partner contract;
- JSON remains the approved Torneo Mundialista delivery artifact.

Production fixture/result operations continue independently while v2 work remains in Draft PR #114.

## Exact next sequence

1. apply this final M2-01 documentation refresh to the integration branch;
2. replace the shared ChatGPT project source set with the exact refreshed 10 files;
3. optionally refresh the Draft PR #114 description after owner review while keeping it Draft;
4. start Task 3B with a read-only Supabase stage audit only;
5. prove the target is stage and inspect remote migration history, schema drift, RLS, views, functions, policies, and dependencies;
6. produce an ordered non-destructive synchronization plan;
7. stop for owner approval before any stage write;
8. apply migration 0038 in stage only after explicit approval;
9. import approved non-sensitive history/reference data idempotently and prove zero duplicates on rerun;
10. refresh current Elo, FIFA, results, schedule, standings, and tournament context;
11. generate current stage candidates under explicit cutoffs;
12. compare stored v1, v1-probability-plus-v2-analysis, and gated-v2 fairly;
13. decide the future v2.0 Tournament Candidate;
14. prepare v2.1 Knockout Context.
## Release framing

Possible future production modes remain:

```text
v1 probabilities + v2 analysis
```

or:

```text
gated v2 probabilities + v2 analysis
```

No current accuracy or production-readiness claim is allowed until current data, stage persistence, fair comparison, and release gates are complete.

## Required reading order

For a new engineering conversation, read:

1. `00_START_HERE_CURRENT.md`
2. `05_PREDICTION_INTELLIGENCE_V2_CURRENT.md`
3. `06_V2_STAGE_RELEASE_PLAN.md`
4. `07_ROADMAP_EPICS_DECISIONS.md`
5. `09_WORKFLOW_GUARDRAILS_DOC_POLICY.md`

For model/calibration history, also read:

- `08_MODEL_HISTORY_CALIBRATION.md`
