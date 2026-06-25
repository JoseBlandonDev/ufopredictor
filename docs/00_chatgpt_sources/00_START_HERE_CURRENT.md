# Start Here - UFO Predictor Current

_Last refreshed: 2026-06-24 after Prediction Intelligence v2 Task 2 normalization and checkpoint approval._

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
head: 1b746f9d038ecfbd49068ecacf8d39c62d4a5fc9
status: open, Draft, Task 1 and Task 2 normalized
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

Completed on `integration/prediction-intelligence-v2`:

```text
76500de  Task 1   - data foundation
16fef9b  Task 1.1 - replay readiness
f411d60  Task 1.2 - historical Elo reconstruction
ca5fd01  Task 2A  - challenger and replay
bf13c21  Task 2B  - calibration stabilization
1d70412  Task 2C  - signal gates and candidate eligibility
de083c1  Task 2D  - historical release-candidate packaging
1b746f9  Task 2   - strict runner local-run output boundaries
```

Task 2 accumulated checkpoint verdict:

```text
TASK2_CHECKPOINT_READY
```

The integrated stack is local-only, preserves historical artifacts byte-for-byte where declared, keeps MVP1 behavior protected, and contains no Task 3 stage or production writes.

## What remains from the old v2 branch

One useful implementation slice remains to be selectively ported:

```text
Task 3A source: 6967fd6b22a49e23ab9963345f1a1437b1d6b668
concern: planner and dry-run only
```

Task 3A prepares:

- safe target authorization guards;
- migration planning;
- idempotent import planning;
- signal persistence planning;
- immutable prediction-version planning;
- Torneo Mundialista export dry-run;
- explicit production-write denial.

Task 3A must remain local-only. It does not apply migration 0038 and does not write to stage or production.

The final old-branch documentation commit is historical handoff material and should not be ported as implementation.

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

Any remote migration work begins only after Task 3A and a read-only stage audit.

## Historical artifact policy

Task 1 and Task 2 preserved evidence is historical research.

Where declared by preservation manifests, artifacts are:

```text
historicalOnly: true
currentCandidateEligible: false
currentReleaseDecisionEligible: false
currentPublicationEligible: false   # Task 2.3 where applicable
```

Historical names containing `production`, `candidate`, `release`, or `publication` do not authorize current use.

Task 2 runners may write only to strict descendants of their own runner-specific trees:

```text
artifacts/prediction-intelligence-v2/task2/local-run/
artifacts/prediction-intelligence-v2/task2-1/local-run/
artifacts/prediction-intelligence-v2/task2-2/local-run/
artifacts/prediction-intelligence-v2/task2-3/local-run/
```

External paths, sibling runner trees, preserved dated directories, traversal outside the allowed root, and the local-run root itself are rejected.

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

1. apply this checkpoint documentation refresh to the integration branch;
2. replace the shared ChatGPT project source set with the exact refreshed 10 files;
3. start the next conversation from this file;
4. selectively port Task 3A from `6967fd6b22a49e23ab9963345f1a1437b1d6b668`;
5. run a Task 3A checkpoint and finish M2-01 normalization;
6. perform a read-only stage audit;
7. stop for owner approval before any stage write;
8. apply migration 0038 in stage only after approval;
9. import non-sensitive history/reference data idempotently;
10. refresh current Elo, FIFA, results, schedule, standings, and tournament context;
11. generate current stage candidates under explicit cutoffs;
12. compare v1, v1-probability-plus-v2-analysis, and gated-v2 fairly;
13. decide the v2.0 Tournament Candidate;
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
