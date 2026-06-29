# V2 Stage and Release Plan

_Last refreshed: 2026-06-29 after the production Round-of-32 checkpoint and the declaration of a synchronized MVP 1.5 track._

## Goal

Build and evaluate Prediction Intelligence V2 in stage without disrupting the live V1-compatible commercial product.

## Current gate status

```text
production V1 product: live
stage environment: live and separate
V2 integration branch: active
V2 Draft PR: #114
V2 foundation: complete
stored V2 baseline: complete
current-data gate: still required
V2 public release: not approved
```

Production writes remain forbidden from V2 workflows.

## Stable stage checkpoint

Stage contains:

- V2 schema/data foundation;
- canonical aliases/localizations/links;
- source snapshots;
- historical facts and ratings;
- official schedule reference data;
- exact runtime linkage;
- immutable V1 comparison publications;
- stored V2 baseline signal rows;
- RLS and stage-only operational boundaries.

Do not rerun completed foundation/import work merely to restate idempotency.

## Active phase

Current V2 phase:

```text
current fixture/result refresh
-> current rankings/standings/context
-> repeatable current signal snapshots
-> first unpublished shadow candidate
```

Each task remains bounded.

## Current-data acceptance gate

Before a live V2 candidate:

- exact not-started fixture identity;
- current kickoff state;
- verified recent result state;
- current eligible ratings/rankings;
- pre-kickoff standings/pressure context;
- source snapshots and observed times;
- reliability metadata;
- conflict-free linking;
- idempotent persistence.

## First shadow candidate

Requirements:

- not-started target;
- exact cutoff;
- immutable development prediction;
- source/cutoff lineage;
- no public publication;
- no V1 mutation;
- stage-only storage;
- comparison artifact.

## Historical replay

Replay must:

- use only data available before the historical kickoff;
- remain labeled `historical_replay`;
- preserve the original V1 publication;
- exclude verified matches with no original prediction from accuracy;
- not convert South Africa vs Canada into a retrospective success/failure record.

## Evaluation gate

Evaluate:

- 1X2 calibration;
- score/scenario behavior;
- BTTS/totals families;
- confidence/risk usefulness;
- missing-source behavior;
- reliability;
- explanation coherence;
- regressions against V1.

Do not release based on one favorable match.

## Release decision gate

Required:

- stage candidate evidence;
- replay evidence;
- V1/V2 comparison;
- product compatibility;
- entitlement compatibility;
- public/admin query compatibility;
- rollback plan;
- owner approval;
- documentation refresh.

## Production promotion boundaries

A V2 promotion must not:

- rewrite V1 versions;
- change verified scores;
- regenerate completed matches as original predictions;
- expose internal source payloads;
- bypass Premium authorization;
- depend on stage Auth/payment rows;
- merge unrelated MVP 1.5 work accidentally.

## MVP 1.5 parallel work

MVP 1.5 may ship while V2 remains in stage.

Allowed:

- Free/Premium copy and hierarchy;
- Premium badge;
- conversion CTAs;
- price presentation;
- panel/pricing/Transparency polish;
- venue ingestion/display;
- kickoff time presentation;
- accessibility/mobile;
- public result-without-prediction surface.

Not allowed:

- V2 probability output;
- V2 signal consumption;
- calibration change;
- broad V2 table dependency.

## Synchronization plan

```text
MVP 1.5 branch from current main
-> bounded PR to main
-> production validation
-> merge updated main into V2 integration
-> rerun affected V1/public/V2 integration tests
```

Synchronization should happen after each accepted MVP 1.5 slice that touches shared code, not only at the end.

## Shared conflict zones

Expect review in:

- `lib/presentation/*`;
- public prediction query helpers;
- prediction cards;
- match detail;
- pricing/panel routes;
- navigation;
- shared database types if venue fields change.

Resolve manually against current production behavior.

## Validation after main synchronization

At minimum:

- public prediction query tests;
- match detail tests;
- Auth/entitlement regression;
- pricing route smoke;
- venue/time formatting tests when touched;
- V2 type/build tests;
- lint;
- production build;
- no production write from V2 branch.

## Process decisions

- stage is the V2 proving environment;
- `main` remains production authority;
- MVP 1.5 must not become a separate product line;
- no blanket cross-branch merges;
- small reviewed slices beat a final large reconciliation;
- canonical documentation is authored by ChatGPT.

## Responsibility

### ChatGPT

- gates, roadmap, documentation, release interpretation.

### Codex

- implementation and focused validation.

### Operator

- branch/remote operations, deployment, and approval.
