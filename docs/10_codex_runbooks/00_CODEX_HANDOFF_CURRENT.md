# Codex Handoff Current

_Last refreshed: 2026-06-27 after Task 1C completion._

## Canonical-source rule

Before implementation read:

```text
docs/00_chatgpt_sources/00_START_HERE_CURRENT.md
docs/00_chatgpt_sources/05_PREDICTION_INTELLIGENCE_V2_CURRENT.md
docs/00_chatgpt_sources/06_V2_STAGE_RELEASE_PLAN.md
docs/00_chatgpt_sources/07_ROADMAP_EPICS_DECISIONS.md
docs/00_chatgpt_sources/09_WORKFLOW_GUARDRAILS_DOC_POLICY.md
```

These own live truth. This runbook owns the immediate technical handoff.

## Current baseline

```text
repo: D:\Projects\ufo-predictor
branch: integration/prediction-intelligence-v2
Draft PR: #114
checkpoint HEAD: bce9999
stage project: yfmklapgjrupctgxaako
production deny project: gcpdffkgsdomzyoenalg
stage env: .env.stage.local
```

Verify actual HEAD and worktree before implementation.

## Completed checkpoint

Closed and not to be repeated:

- Task 3B stage foundation bootstrap;
- migration 0038 stage apply;
- exact 24-fixture linkage;
- frozen V1 source verification;
- one active V1 model import;
- 24 immutable V1 prediction imports;
- 240 market imports;
- 24 fixture publications;
- exact-complete readback;
- stage `/predictions` smoke;
- checkpoint push.

Stage current product state:

```text
active V1 models = 1
prediction versions = 24
market rows = 240
narratives = 0
public fixtures = 24
post-state = exact_complete
```

Production writes remained zero.

## Immediate next task

```text
V2 Signal Baseline Database Load
```

Do not begin with another general reconnaissance of Task 1, Task 3B, fixture linkage, or V1 import.

### Bounded goal

1. inspect the prepared 2026-06-20 workspace and committed equivalents;
2. identify only the records required for the first V2 signal baseline;
3. map them to existing Prediction Intelligence tables;
4. preserve source, checksum, observed time, cutoff, parser/feature version, and reliability;
5. implement a dry-run-first idempotent stage load;
6. prove balanced counts and fixture signal coverage;
7. stop before candidate generation.

## Source workspace

```text
D:\Projects\ufo-predictor-source-snapshots\2026-06-20\prepared-v2
```

Committed equivalents include:

```text
data/prediction-engine/national-team-signals/2026-06-19/
artifacts/prediction-intelligence-v2/
lib/prediction-intelligence-v2/
scripts/prediction-intelligence-v2/
supabase/migrations/0038_prediction_intelligence_v2_data_foundation.sql
types/database.ts
```

The cutoff is historical. Do not describe it as current and do not reject it merely because a later refresh is needed.

## Decision to preserve

**Decision:** load the preserved baseline first, then perform current-data incremental refresh.

**Do not:** turn the task into a complete refresh of every external source before storage and lineage are proven.

## Hard boundaries

- no production writes;
- no Auth, Wompi, payment, entitlement, webhook, session, or personal-data scope;
- no new stage environment;
- no rerun of Task 3B, linkage, or V1 import;
- no V2 publication;
- no post-kickoff evidence;
- no fabricated source values or checksums;
- no broad documentation rewrite;
- no commit or push unless the owner delegates it.

## Process contract

Use:

```text
one preflight
one apply
one verification
```

A second exact run may be used only to prove idempotency of the new baseline load.

If a concrete defect appears, fix that defect without restarting the full audit.

## Responsibility

- Codex: inspect, implement, test, and report exact evidence.
- ChatGPT: owns canonical documentation, roadmap, and process decisions.
- Operator: owns Git, PowerShell, Supabase, SQL, Railway, APIs, and remote-write approval.

## Required response

Return:

- branch, HEAD, and worktree;
- source inventory used and excluded;
- exact destination tables and natural keys;
- source/cutoff/version lineage;
- dry-run counts;
- apply counts if authorized;
- conflicts and blockers;
- fixture coverage query/result;
- idempotency proof;
- production no-write proof;
- exact changed files;
- focused test and lint results;
- next transition only.
