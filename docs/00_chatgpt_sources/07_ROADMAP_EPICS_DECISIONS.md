# Roadmap, MVP2 Epics, and Decisions

_Last refreshed: 2026-06-27 after Task 2A completed its exact stage baseline load, Task 4C merged through PR #119, and `main` synchronized into V2 at `4f758b2`._

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
Epic 2  Current Football Data         - ACTIVE (Task 2A DONE, Task 2B NEXT)
Epic 3  V2 Candidate and Evaluation   - NEXT AFTER CURRENT-DATA GATE
Epic 4  Expert Product Experience     - TASKS 4A-4C DONE
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

Status: `Done`

Delivered:

- prepared `2026-06-20` package mapped into the real stage signal table;
- 48 canonical team-signal rows persisted;
- source, checksum, cutoff, signal-version, and source-snapshot lineage retained;
- missing, optional, contradiction, sample-size, and reliability metadata persisted;
- manifest and source-registry verification;
- reviewed-plan semantic binding and fail-closed apply authorization;
- exact-complete verification with 48 identical rows and zero inserts;
- zero duplicate growth;
- 72/72 runtime fixtures baseline-ready;
- 0 candidate-ready fixtures;
- no production writes and no V2 candidate generation.

Implementation checkpoint:

```text
commit = 9491fd8
V2 integration HEAD after parallel sync = 4f758b2
```

**No repetir:** do not rerun Task 2A without a concrete recovery requirement.

### Task 2B - Current fixture and result refresh

Status: `Next`

- refresh not-started fixture identity and kickoff;
- persist new verified results;
- retain exact provider links;
- report conflicts and unsupported states;
- preserve prediction immutability;
- preserve the exact Task 2A baseline;
- stop before rankings/context synthesis or candidate generation.

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

### Task 4A - V1 Information Inventory

Status: `Done`

Delivered:

- inventory of public, free, premium, and admin prediction surfaces;
- inventory of persisted V1 probabilities, xG, confidence, risk, markets, scorelines, and narratives;
- authorization-boundary review;
- identification of hidden, duplicated, unclear, and betting-centric language;
- exclusion of unfinished V2-only data and causal claims.

### Task 4B - Public Expert Read

Status: `Done`

Delivered:

- deterministic `Lectura UFO` on `/predictions` cards;
- deterministic `Lectura UFO` on `/matches/[slug]`;
- `Probabilidad del resultado` label on the touched surfaces;
- anonymous reading based only on public home/draw/away probabilities;
- optional confidence/risk sentence only where already authorized;
- unchanged premium xG, scenarios, BTTS, totals, narratives, and entitlement behavior;
- focused tests and production smoke.

Release evidence:

```text
PR #117
feature commit = 3d647b2
main merge commit = 3aff0e4
PR #117-era V2 integration sync = 5007de7
production smoke = passed
```

### Task 4C - Football-first premium terminology

Status: `Done`

Delivered:

- football-first labels and explanatory copy for premium BTTS/totals-oriented information;
- unchanged underlying values and V1 calculations;
- unchanged premium gating and entitlement authority;
- deterministic presentation behavior independent of unfinished V2 tables;
- focused tests across match detail, predictions helpers, pricing, and public presentation.

Release evidence:

```text
feature commit = af7e260
PR #119 main merge = 9f89d62
V2 integration sync = 4f758b2
```

Task 4C is presentation work, not model or calibration progress.

## Epic 5 - Operations and Automation

Delivered:

- fixture registry;
- exact allowlists;
- trusted result refresh;
- idempotent result/evaluation persistence;
- manual reconciliation path applied to production and stage;
- canonical result-refresh aliases;
- stage bootstrap and V1 import operations;
- latest five-result API-Football batch persisted, verified, evaluated, and publicly checked.

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

- current source refresh cadence;
- minimum current-data gate for the first shadow candidate;
- final V1-probabilities versus gated-V2 release mode;
- public/free/premium V2 signal matrix;
- deterministic narrative versus optional LLM polish;
- scheduler and notification architecture;
- player, squad, lineup, and injury source strategy;
- timing of broad EN/PT rollout.

## Exact next sequence

Primary V2 track:

1. start Task 2B - Current fixture and result refresh;
2. complete Task 2C - current Elo, FIFA ranking, standings, form, and pressure context;
3. complete Task 2D - repeatable current signal snapshots;
4. produce the first unpublished V2 shadow candidate;
5. create fair historical replays;
6. compare V1/V2 and decide release mode;
7. promote only after stage acceptance.

Parallel MVP1 track:

```text
Task 4A: DONE
Task 4B: DONE
Task 4C: DONE
No new parallel task is active in this checkpoint.
```

Documentation/Git checkpoint:

1. replace the exact 10 canonical source files with this refreshed set;
2. run one consistency review;
3. commit and push the documentation-only checkpoint;
4. begin Task 2B from the synchronized V2 branch.

## Delivery rule

Every bounded task declares:

- branch and HEAD;
- environment and production denial;
- exact read/write scope;
- acceptance evidence;
- rollback boundary;
- concrete blockers only.

Avoid giant tasks that combine model, data, payments, UI, migrations, operations, and documentation.
