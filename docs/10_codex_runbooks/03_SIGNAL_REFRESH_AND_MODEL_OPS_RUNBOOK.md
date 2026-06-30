# Signal Refresh and Model Operations Runbook

_Last refreshed: 2026-06-29 after Task 2A and Task 2B completed. Task 2C is now the active V2 data phase._

## Purpose

Own the path from the preserved historical baseline through current source refresh, repeatable signals, and the first V2 shadow candidate.

Current model and release truth lives in:

```text
docs/00_chatgpt_sources/05_PREDICTION_INTELLIGENCE_V2_CURRENT.md
docs/00_chatgpt_sources/06_V2_STAGE_RELEASE_PLAN.md
docs/00_chatgpt_sources/08_MODEL_HISTORY_CALIBRATION.md
```

## Phase A - Historical signal baseline

Status: `Complete`

Prepared workspace:

```text
D:\Projects\ufo-predictor-source-snapshots\2026-06-20\prepared-v2
```

Accepted state:

```text
signal rows = 48
state = exact_complete
verification identical = 48
runtime fixture coverage = 72/72
candidate-ready fixtures = 0
```

The package is historical but approved as reproducible lineage evidence.

Do not rerun Task 2A without a concrete recovery requirement.

## Phase B1 - Fixture and result refresh

Status: `Complete`

Task 2B.1:

```text
fixture actions satisfied = 41/41
kickoff-conflict exclusions = 3
```

Task 2B.2:

```text
result actions satisfied = 69/69
evaluation actions satisfied = 24/24
evaluation pending = 45
excluded rows = 3
```

Preserved contracts:

- exact provider identity;
- reviewed-plan authorization;
- sanitized provider evidence;
- atomic result/evaluation apply;
- timestamp equality by instant;
- immutable predictions;
- post-state verification.

**Never rerun the accepted Task 2B.2 apply.**

## Phase B2 - Task 2C rankings and tournament context

Status: `Active next`

### Ratings and rankings

- effective-dated World Football Elo snapshots;
- latest available official FIFA ranking;
- no overwrite of history;
- source and capture time retained;
- canonical team resolution;
- explicit source disagreement.

### Tournament context

- standings and points;
- wins, draws, and losses;
- goals for/against and difference;
- scoring/conceding averages;
- opponent quality;
- qualification or pressure state;
- small-sample reliability controls.

### Required lineage

Each persisted row or derived context must retain:

- source identity;
- observed time;
- evidence cutoff;
- parser/feature version;
- canonical team/competition/season identity;
- missing optional inputs;
- contradiction and reliability metadata.

### First bounded step

No Task 2C runner exists yet.

Begin with:

1. repository schema/type/loader inventory;
2. source inventory and freshness review;
3. exact destination/natural-key design;
4. dry-run/apply/verification contract;
5. focused test plan;
6. stop before remote writes until approved.

## Phase B3 - Task 2D repeatable current signals

Status: `Pending`

Task 2D must:

- derive source-backed current signals;
- persist explicit pre-kickoff cutoffs;
- retain missing/contradictory inputs;
- apply reliability shrinkage;
- prove idempotent incremental refresh;
- produce candidate-ready fixture coverage.

## Phase C - First V2 shadow candidate

Status: `Blocked`

Generate only after Task 2C and Task 2D gates pass.

Candidate requirements:

- fixture not started;
- predecessor V1 linked;
- explicit calculation time and cutoff;
- source/signal snapshots linked;
- movement caps and reliability gates;
- missing and contradictory signals reported;
- coherent scenario families;
- unpublished development purpose.

Completed fixtures use `historical_replay` and pre-kickoff evidence only.

## Source families

- API-Football fixture/result state already persisted through Task 2B;
- World Football Elo;
- FIFA rankings;
- official World Cup schedule and tournament standings;
- preserved deterministic snapshots;
- derived tournament form and qualification context.

No secondary source has write authority when an official or approved primary source is required.

## Quality gates

- `observed_at < kickoff` for pre-match inputs;
- canonical aliases resolve;
- neutral/host context is correct;
- source disagreement is surfaced;
- no history overwrite;
- no full foundation bootstrap for ordinary refreshes;
- no prediction rewrite;
- no candidate from incomplete current-data coverage;
- no release claim from historical replay alone.

## Decision rule

**Decision:** baseline, fixture/result refresh, rankings/context, and derived signal snapshots remain separate bounded increments.

**Reason:** each layer has different sources, natural keys, cutoffs, and failure modes.

**Consequence:** completing Task 2B does not authorize candidate generation; Task 2C and Task 2D still must pass.

## Responsibility

- Codex implements bounded loaders, refreshers, tests, and reports.
- The operator authorizes stage applies and runs Git/Supabase/API operations.
- ChatGPT owns model-state interpretation, decisions, roadmap, and documentation.

## Process

Use one preflight, one apply, and one verification.

Add one exact rerun only when proving idempotency of a new loader.

Do not reopen legacy Task 3B, Task 1C, Task 2A, or Task 2B as part of Task 2C.
