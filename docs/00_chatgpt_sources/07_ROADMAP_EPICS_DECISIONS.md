# Roadmap, MVP2 Epics, and Decisions

_Last refreshed: 2026-06-27 after Epic 1 completion._

## MVP2 objective

MVP2 is the shortest safe path from the sellable MVP1 to an explanation-first football-intelligence product with:

- normalized football history and reference data;
- repeatable source and signal operations;
- immutable V1/V2 comparison;
- current and historical candidate evaluation;
- tournament context;
- lower manual operational burden;
- ES/EN/PT-ready structured facts;
- uninterrupted production delivery.

It is not a frontend rewrite and not a promise of result certainty.

## Naming convention

Use:

```text
Epic 1, Epic 2, Epic 3...
Task 1A, 1B, 1C...
```

Old `M2-xx` labels remain historical only.

## Current status

```text
Epic 1  Foundation and Stage          - DONE
Epic 2  Current Football Data         - ACTIVE
Epic 3  V2 Candidate and Evaluation   - NEXT
Epic 4  Expert Product Experience     - PARALLEL
Epic 5  Operations and Automation     - PARTIALLY DELIVERED
```

## Epic 1 - Foundation and Stage

Status: `Done`

### Task 1A - Integration normalization

Delivered:

- active integration branch and Draft PR #114;
- selective normalization from the old V2 branch;
- preserved historical evidence;
- production-denial and local-run guards.

### Task 1B - Stage schema and data bootstrap

Delivered:

- separate stage identity;
- migration 0038;
- analytical foundation;
- reference and historical data;
- Auth/admin preservation;
- idempotent rerun.

### Task 1C - Visible immutable V1 baseline

Delivered:

- exact 24-fixture API-Football linkage;
- frozen immutable V1 source;
- 1 active model;
- 24 prediction versions;
- 240 markets;
- 0 narratives;
- 24 public fixtures;
- atomic import and publication;
- exact-complete verification;
- stage `/predictions` smoke;
- checkpoint commit `bce9999`.

**No repetir:** Epic 1 is closed. Reopen only for a concrete recovery or schema defect.

## Epic 2 - Current Football Data

Purpose: turn the preserved foundation into a repeatable, independently refreshable V2 signal database.

### Task 2A - V2 Signal Baseline Database Load

Status: `Next`

Use the prepared `2026-06-20` package as a reproducible baseline.

Deliver:

- bounded source inventory;
- mapping to existing V2 tables;
- source/cutoff/version lineage;
- idempotent stage load;
- balanced row accounting;
- fixture-level signal coverage query.

Do not generate a V2 candidate in this task.

### Task 2B - Current fixture and result refresh

- refresh not-started fixture identity and kickoff;
- persist new verified results;
- retain exact provider links;
- report conflicts and unsupported states;
- preserve prediction immutability.

### Task 2C - Ranking, standings, and tournament context

- current World Football Elo;
- latest available official FIFA ranking;
- group standings and points;
- goals for/against and goal difference;
- tournament form and opponent quality;
- qualification/pressure context;
- source, observed time, cutoff, and reliability.

### Task 2D - Repeatable signal snapshots

- derive source-backed signals;
- persist explicit pre-kickoff cutoffs;
- record missing and contradictory inputs;
- apply reliability shrinkage;
- prove idempotent incremental refresh;
- hand off a candidate-ready fixture set.

## Epic 3 - V2 Candidate and Evaluation

Purpose: generate, compare, and release V2 honestly.

### Task 3A - First live V2 shadow candidate

- not-started fixture;
- V1 predecessor;
- current source/signal snapshots;
- movement and reliability gates;
- structured evidence and scenario families;
- unpublished development state.

### Task 3B - Historical replay

- completed fixtures only;
- pre-kickoff evidence only;
- labeled `historical_replay`;
- original V1 remains immutable.

### Task 3C - V1/V2 evaluation

- probability metrics;
- goals and markets;
- scenario quality;
- explanation quality;
- freshness and reliability;
- model error versus football variance.

### Task 3D - Release decision

Choose:

```text
V1 probabilities + V2 analysis
```

or:

```text
gated V2 probabilities + V2 analysis
```

Production requires stage acceptance, rollback, and owner approval.

## Epic 4 - Expert Product Experience

Status: `Parallel, separate owner`

Purpose:

- improve use of existing V1 information;
- translate betting-centric fields into football language;
- support confidence, uncertainty, scenarios, and evidence;
- prepare locale-neutral ES/EN/PT contracts;
- tolerate missing future data.

This epic does not own V2 data pipelines or probability changes.

Production-safe work branches from current `main` and flows normally into the integration branch.

## Epic 5 - Operations and Automation

Delivered:

- fixture registry;
- exact allowlists;
- trusted result refresh;
- idempotent result/evaluation persistence;
- manual reconciliation path in Git;
- canonical result-refresh aliases;
- stage bootstrap and V1 import operations.

Remaining:

- scheduler around match windows;
- retry/backoff;
- run summaries and notifications;
- persistent reconciliation workflow;
- recurring ranking and signal refresh;
- operational metrics.

## Decisions already made

### Architecture and model

- V1 remains live and immutable during V2 work.
- V2 runs in shadow before promotion.
- Stage is the same product surface, not a separate prototype.
- Production and stage remain separate.
- No third environment is created.
- Finished-fixture comparison uses `historical_replay`.
- Historical research does not authorize current release.
- V2 probability superiority is not yet established.

### Data

- The 2026-06-20 workspace is an approved reproducible baseline.
- It is not described as current.
- Baseline load precedes broad current refresh.
- Current refresh is incremental and versioned.
- Source, observed time, cutoff, version, checksum, and reliability are preserved.
- No post-kickoff leakage.

### Process

- One bounded review is sufficient unless a concrete defect appears.
- One preflight, one apply, and one verification is the default.
- After repeated equivalent tooling failure, use one safe direct owner-operated path.
- A focused defect correction does not reopen completed reconnaissance.
- A migration file in Git is not proof of remote application.
- Completed Task 3B, linkage, and V1 import are not rerun ceremonially.

### Ownership

- ChatGPT owns canonical sources, runbooks, roadmap, and decision wording.
- Codex owns repository inspection, bounded implementation, tests, and evidence.
- The operator owns approved remote operations, Git, SQL, and deployment actions.

## Decisions still required

- exact Task 2A destination coverage after inspecting the prepared package;
- current source refresh cadence;
- minimum current-data gate for the first shadow candidate;
- final V1-probabilities versus gated-V2 release mode;
- public/free/premium V2 signal matrix;
- deterministic narrative versus optional LLM polish;
- scheduler and notification architecture;
- player, squad, lineup, and injury source strategy;
- timing of broad EN/PT rollout.

## Exact next sequence

1. apply this documentation checkpoint;
2. replace the shared ChatGPT source set;
3. start Task 2A - V2 Signal Baseline Database Load;
4. prove lineage, counts, coverage, and idempotency;
5. perform incremental current-data refresh;
6. produce the first V2 shadow candidate;
7. create fair historical replays;
8. compare V1/V2 and decide release mode;
9. continue Epic 4 in parallel;
10. promote only after stage acceptance.

## Delivery rule

Every bounded task declares:

- branch and HEAD;
- environment and production denial;
- exact read/write scope;
- acceptance evidence;
- rollback boundary;
- concrete blockers only.

Avoid giant tasks that combine model, data, payments, UI, migrations, operations, and documentation.
