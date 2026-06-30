# Codex Handoff Current

_Last refreshed: 2026-06-29 after Task 2B completion, publication of the V2 closeout at `bd580c8baaa230def78f9d72de066bb453d7f9ff`, and adaptation of this handoff for project-wide use from `main`._

## Canonical-source rule

Before implementation read:

```text
docs/00_chatgpt_sources/00_START_HERE_CURRENT.md
docs/00_chatgpt_sources/05_PREDICTION_INTELLIGENCE_V2_CURRENT.md
docs/00_chatgpt_sources/06_V2_STAGE_RELEASE_PLAN.md
docs/00_chatgpt_sources/07_ROADMAP_EPICS_DECISIONS.md
docs/00_chatgpt_sources/09_WORKFLOW_GUARDRAILS_DOC_POLICY.md
```

For operations also read:

```text
docs/00_chatgpt_sources/04_FIXTURE_RESULT_AND_EVALUATION_OPS.md
docs/10_codex_runbooks/03_SIGNAL_REFRESH_AND_MODEL_OPS_RUNBOOK.md
```

Canonical sources own live truth. This runbook owns the immediate technical handoff.

## Current baseline

```text
repo: D:\Projects\ufo-predictor
canonical docs may be read from: main
active implementation branch: integration/prediction-intelligence-v2
Draft PR: #114
published V2 checkpoint HEAD: bd580c8baaa230def78f9d72de066bb453d7f9ff
main source merged into V2: 3d4b036d20df44027d8927a9a90cb546e7553e64
Task 2B implementation: 6d3fb7485b5a7dc1467812466107359daccdc902
Task 2B evidence: 1cdaa8b6384d02854c3bd2dce321b85ea71c869d
main-to-V2 merge: 9672b55644d8a2bd3818ecd08086ab3ebf111398
V2 documentation closeout: bd580c8baaa230def78f9d72de066bb453d7f9ff
stage project: yfmklapgjrupctgxaako
production deny project: gcpdffkgsdomzyoenalg
stage env: .env.stage.local
runtime Git state: verify branch, HEAD, upstream, staged state, tracked changes, and untracked artifacts before acting
```

Verify actual HEAD, upstream, and worktree before implementation. When this runbook is read from `main`, do not infer that the V2 implementation, migration, or accepted artifact paths exist in the current checkout. Task 2C implementation work must begin from the published V2 branch unless a later approved merge changes that rule.

## Closed checkpoints

Do not repeat:

- legacy Task 3B stage foundation bootstrap;
- exact 24-fixture linkage;
- immutable V1 import/publication;
- Task 2A baseline dry-run/apply/verification;
- Task 2B.1 reviewed fixture apply/verification;
- Task 2B.2 reviewed result/evaluation apply/verification;
- accepted public History smoke;
- accepted main-to-V2 integration.

Task 2B verified state:

```text
fixture actions satisfied = 41/41
result actions satisfied = 69/69
evaluation actions satisfied = 24/24
evaluation pending = 45
kickoff-conflict exclusions = 3
```

**Never rerun the accepted Task 2B.2 apply.**

## Immediate next task

```text
Task 2C - Ranking, standings, and tournament context
```

There is no dedicated Task 2C runner or implementation file yet.

The first bounded step is read-only repository/source-contract reconnaissance and an implementation plan.

### Bounded goal

1. inspect existing V2 tables, types, loaders, and snapshot contracts;
2. identify exact destinations and natural keys for Elo, FIFA ranking, standings, form, and pressure context;
3. inventory current source options and freshness;
4. distinguish official, derived, cached, and external-only evidence;
5. define observed time, cutoff, reliability, missing-data, and contradiction behavior;
6. define dry-run/apply/verification boundaries;
7. preserve Task 2A/2B state;
8. stop before candidate generation.

## Source direction

Expected source families:

- World Football Elo;
- latest available official FIFA ranking;
- official tournament schedule/standings where available;
- trusted fixture/result state already persisted;
- deterministic derived tournament context.

Do not treat the 2026-06-20 baseline workspace as current Task 2C data. It remains historical provenance.

## Hard boundaries

- no production writes;
- no Auth, Wompi, payment, entitlement, webhook, session, or personal-data scope;
- no new environment;
- no rerun of Task 1C, Task 2A, or Task 2B;
- no V2 publication;
- no candidate generation;
- no post-kickoff leakage into pre-match evidence;
- no invented source values or checksums;
- no documentation rewrite by Codex;
- no commit or push unless explicitly delegated.

## Technical contracts to preserve

- semantic reviewed-plan binding;
- minimal sanitized provider evidence contract;
- exact canonical identity;
- snake_case RPC payloads;
- timestamp equality by represented instant;
- atomic apply;
- `verification` internal mode;
- isolated test artifact directories;
- immutable V1 predecessor and prediction versions.

## Process contract

Use:

```text
one reconnaissance
one reviewed implementation
one preflight
one apply
one verification
```

A second exact run is allowed only when explicitly proving idempotency of a new Task 2C loader.

If a concrete defect appears, fix that defect without restarting the full audit.

## Responsibility

- Codex: inspect, implement, test, and report exact evidence.
- ChatGPT: owns canonical documentation, roadmap, and process decisions.
- Operator: owns Git, PowerShell, Supabase, SQL, Railway, APIs, and remote-write approval.

## Operator command contract

For each bounded operator step, prefer one self-contained PowerShell block rather than a loose sequence of commands. The block should:

- set `$ErrorActionPreference = 'Stop'`;
- enable `Set-StrictMode -Version Latest`;
- set and validate the expected repository path, branch, HEAD, upstream, environment, and target identifiers;
- inspect preconditions before staging, committing, applying, verifying, or pushing;
- throw a clear exception immediately when a precondition fails;
- avoid continuing into destructive or remote actions after a mismatch;
- print the exact files, commits, or actions under review;
- finish with one unambiguous sentinel token such as `TASK2C_PREFLIGHT_PASSED`;
- wait for the operator to return the real output before issuing the next bounded block.

Keep reconnaissance, implementation review, preflight, remote apply, verification, commit, and push as separate steps unless a reviewed procedure explicitly proves they are safe to combine.

## Required response for the first Task 2C inspection

Return:

- branch, HEAD, upstream, and worktree;
- existing relevant tables/types/loaders;
- exact destination tables and natural keys;
- source inventory and freshness;
- source/cutoff/reliability contract;
- conflicts and unsupported states;
- proposed dry-run/apply/verification design;
- exact files likely to change;
- focused test plan;
- production no-write boundary;
- unresolved decisions requiring owner/ChatGPT judgment;
- final readiness verdict.
