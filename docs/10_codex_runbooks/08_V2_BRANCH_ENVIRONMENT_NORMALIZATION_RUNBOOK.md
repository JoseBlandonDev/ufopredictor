# V2 Branch and Environment Normalization Runbook

_Last refreshed: 2026-06-29 after Task 2B completion and the accepted `main` synchronization at `9672b55644d8a2bd3818ecd08086ab3ebf111398`._

## Goal

Keep the active V2 branch, environments, accepted `main` changes, and next-task handoff normalized without reopening historical work.

## Live-state source

Read first:

```text
docs/00_chatgpt_sources/00_START_HERE_CURRENT.md
docs/00_chatgpt_sources/05_PREDICTION_INTELLIGENCE_V2_CURRENT.md
docs/00_chatgpt_sources/06_V2_STAGE_RELEASE_PLAN.md
docs/00_chatgpt_sources/09_WORKFLOW_GUARDRAILS_DOC_POLICY.md
```

This runbook does not override those sources.

## Stable references

```text
active branch: integration/prediction-intelligence-v2
active Draft PR: #114
integrated checkpoint HEAD: 9672b55644d8a2bd3818ecd08086ab3ebf111398
accepted main source: 3d4b036d20df44027d8927a9a90cb546e7553e64
Task 2B implementation: 6d3fb7485b5a7dc1467812466107359daccdc902
Task 2B evidence: 1cdaa8b6384d02854c3bd2dce321b85ea71c869d
canonical stage env: .env.stage.local
stage project: yfmklapgjrupctgxaako
production project denied: gcpdffkgsdomzyoenalg
old branch: feature/prediction-intelligence-v2-data-foundation
old Draft PR: #106
```

Verify actual HEAD, upstream, and worktree before implementation. The checkpoint above precedes the documentation-only commit and push.

## Completed normalization map

Completed:

- selective old-V2 normalization;
- data foundation and replay readiness;
- historical Elo/challenger research;
- calibration, gates, eligibility, and packaging;
- legacy Task 3B stage synchronization;
- exact 24-fixture linkage;
- immutable V1 import/publication;
- Task 2A exact signal baseline;
- Task 2B.1 fixture refresh;
- Task 2B.2 result/evaluation refresh;
- public History smoke;
- accepted `main` product/documentation synchronization;
- full build/type/test integration fixes.

No useful implementation remains to be ported wholesale from the old branch.

## Environment rule

```text
production: ufopredictor.com -> gcpdffkgsdomzyoenalg
stage: stage.ufopredictor.com -> yfmklapgjrupctgxaako
```

Do not create another stage environment.

Do not use production credentials for stage.

Do not revive the Docker path for normal stage work.

## Current stage result

```text
runtime matches = 72
linked V1 fixtures = 24
active V1 models = 1
V1 predictions = 24
markets = 240
public fixtures = 24
Task 2A signals = 48
Task 2B fixture actions verified = 41/41
Task 2B result actions verified = 69/69
Task 2B evaluations verified = 24/24
evaluation pending = 45
kickoff-conflict exclusions = 3
candidate-ready fixtures = 0
```

Stage is not empty and Task 2B is not active work.

## Integrated parallel work

Accepted `main` product/documentation work was merged normally into the integration branch.

The integration included football-first premium scenario wording and did not change V2 probabilities, payment authority, or entitlements.

Do not reimplement those changes manually.

## Merge validation lessons

The accepted merge also fixed:

- Task 1C snake_case stable publication payload;
- sanitized provider fixture resolution;
- nullable timestamp comparison;
- canonical `verification` mode;
- isolated Task 2B test artifact directories.

Final validation passed focused tests, ESLint, TypeScript, and Next.js build.

## Migration notes

Operational stage migrations include foundation, Task 1C, and Task 2B result-core functions.

Manual migration-ledger reconciliation remains non-blocking housekeeping.

A migration file in Git is not proof of remote application.

Do not edit applied historical pricing migrations to force the US$10 target.

## Next transition

```text
Task 2C - Ranking, standings, and tournament context
```

Required first step:

1. inspect current relevant schema/types/loaders;
2. inventory official/approved sources;
3. define exact destinations and natural keys;
4. define lineage, cutoff, reliability, and conflict behavior;
5. design one dry-run/apply/verification path;
6. stop before candidate generation.

Then:

```text
Task 2D repeatable current signal snapshots
-> Task 3A first V2 shadow candidate
```

Do not redo normalization, legacy Task 3B, Task 1C, Task 2A, or Task 2B.

## Parallel branch rule

A separate owner may improve production-safe product work from current `main`.

Those changes:

- must not casually change model calculations;
- must not depend on unfinished V2 data;
- merge normally to `main`;
- flow into V2 through normal history;
- are not manually duplicated.

## Responsibility

- ChatGPT owns canonical branch/environment decisions and handoffs.
- Codex implements bounded technical slices.
- The operator handles Git, stage SQL, Railway, APIs, and remote operations.

## Validation

For each synchronization or task:

- branch/HEAD/upstream/worktree;
- exact target and deny refs;
- task-specific tests;
- protected regressions;
- lint, diff-check, and build when relevant;
- zero unresolved conflicts;
- no production write.
