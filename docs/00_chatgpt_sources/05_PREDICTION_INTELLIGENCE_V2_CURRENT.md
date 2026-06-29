# Prediction Intelligence V2 - Current

_Last refreshed: 2026-06-29 to preserve the V2 stage baseline while declaring the parallel MVP 1.5 synchronization contract._

## Current model state

Production continues to publish the V1-compatible model output.

V2 is not released to production.

Current V2 work is intended to improve:

- data lineage;
- current football context;
- reliability;
- explanation;
- replay/evaluation;
- candidate comparison.

It must not rewrite existing V1 publications.

## Active branch checkpoint

Last confirmed shared-project checkpoint:

```text
branch: integration/prediction-intelligence-v2
Draft PR: #114
last confirmed HEAD: dc0187e31770e7a03d57db25d3887967bdaef09a
stage domain: stage.ufopredictor.com
stage Supabase: yfmklapgjrupctgxaako
production writes: forbidden
```

Verify live Git state before implementation.

Historical branch/PR #106 remain preservation only.

## Completed V2 foundation

Completed foundations include:

- current-main-based integration branch;
- separate stage environment;
- V2 schema/data foundation;
- prepared source package preservation;
- immutable V1 stage comparison baseline;
- exact fixture linkage;
- source snapshots and aliases;
- stored V2 signal baseline;
- exact-complete idempotency proof.

The preserved baseline is a reproducible historical cutoff, not a claim of currentness.

## V1 comparison baseline

V1 remains necessary because:

- it is the actual published predecessor;
- results must evaluate the original publication;
- V2 needs a fair comparison target;
- product/UI changes do not constitute model improvement.

The 15 Round-of-32 predictions published in production remain V1-compatible publications and must be preserved for future evaluation.

South Africa vs Canada has no prediction baseline and must not be added to accuracy through retrospective generation.

## Honest performance position

No current evidence authorizes the statement that V2 is more accurate than V1.

Release decisions require:

- current-data candidate generation;
- exact pre-kickoff cutoffs;
- historical replay;
- calibration review;
- scenario coherence;
- regression review;
- owner approval.

Do not force probability movement simply to make V2 appear different.

## Current data decision

The preserved source package remains the reproducible baseline.

Newer data is appended/versioned through bounded current-data tasks.

Do not rebuild the entire foundation merely because current fixtures/results have advanced.

## Exact next V2 sequence

```text
Task 2B - Current fixture and result refresh
Task 2C - Ranking, standings, and tournament context
Task 2D - Repeatable current signal snapshots
Task 3A - First unpublished V2 shadow candidate
Task 3B - Historical replay
Task 3C - V1/V2 evaluation
Task 3D - Release decision
```

Task 2B must:

- use exact provider identity;
- refresh not-started fixture state;
- ingest new verified results safely;
- preserve V1 publications;
- preserve the stored baseline;
- report conflicts;
- stop before V2 candidate generation.

## First V2 candidate contract

A valid first shadow candidate must:

- target a not-started fixture;
- use an explicit cutoff;
- use current eligible source snapshots;
- record model and feature version;
- preserve source lineage;
- remain unpublished;
- not alter the V1 public product;
- support replay and comparison.

## Output direction

V2 should produce structured explanation rather than more decorative text.

Desired families:

- main reading;
- supporting evidence;
- contradictory evidence;
- risk/uncertainty;
- alternate scenarios;
- source/cutoff/reliability;
- post-match evaluation.

MVP 1.5 may improve how existing V1 fields are presented, but it must not pretend to expose V2 evidence that does not yet exist.

## Parallel MVP 1.5 synchronization

MVP 1.5 is allowed to ship bounded product changes from `main`.

Synchronization contract:

1. create MVP 1.5 work from current `main`;
2. merge current `main` into the MVP 1.5 branch at defined checkpoints;
3. merge reviewed MVP 1.5 slices into `main`;
4. merge updated `main` into the V2 integration branch;
5. resolve shared frontend conflicts manually;
6. do not merge unfinished V2 model work into MVP 1.5.

Shared surfaces likely to conflict:

- public display helpers;
- prediction cards;
- match detail;
- public queries/projections;
- pricing/panel navigation;
- Transparency.

Prefer small MVP 1.5 PRs.

## Venue/time interaction with V2

Venue persistence and kickoff formatting are not model changes.

They may be implemented in MVP 1.5 if:

- UTC kickoff identity is preserved;
- provider venue lineage is preserved;
- V2 snapshots are not rewritten;
- shared type changes are synchronized into the V2 branch.

If V2 later uses venue as a model feature, it must consume versioned pre-kickoff venue/context data rather than the public display label.

## Release modes

Possible release modes remain:

- no release;
- explanation-only product change;
- shadow comparison only;
- limited candidate release;
- selected market/family release;
- full V2 release.

No mode is selected merely because MVP 1.5 is polished.

## Decisions that must persist

- V1 is the immutable published baseline;
- V2 is stage/shadow until approved;
- current-data freshness is required;
- original predictions are never rewritten;
- no post-kickoff candidate presented as original;
- source/cutoff/reliability are first-class;
- UI polish is not calibration;
- main changes must be synchronized into V2.

## Responsibility split

### ChatGPT

- model roadmap and canonical documentation;
- bounded task definition;
- release interpretation.

### Codex

- V2 code/data implementation;
- focused tests;
- exact evidence reporting;
- no canonical-document ownership.

### Operator

- stage/production boundary approval;
- Git operations;
- remote writes;
- release decision.
