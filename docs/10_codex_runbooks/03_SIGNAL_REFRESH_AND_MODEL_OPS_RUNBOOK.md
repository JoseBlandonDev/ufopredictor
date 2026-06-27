# Signal Refresh and Model Operations Runbook

_Last refreshed: 2026-06-27 for the active V2 data phase._

## Purpose

Own the active path from the preserved 2026-06-20 source package to a real V2 signal database, incremental current refresh, and the first V2 shadow candidate.

Current model and release truth lives in:

```text
docs/00_chatgpt_sources/05_PREDICTION_INTELLIGENCE_V2_CURRENT.md
docs/00_chatgpt_sources/06_V2_STAGE_RELEASE_PLAN.md
docs/00_chatgpt_sources/08_MODEL_HISTORY_CALIBRATION.md
```

## Phase A - V2 Signal Baseline Database Load

Prepared workspace:

```text
D:\Projects\ufo-predictor-source-snapshots\2026-06-20\prepared-v2
```

The package is historical but approved as a reproducible baseline.

### Required sequence

1. inventory the prepared and committed source artifacts;
2. classify raw, normalized, derived, and report-only content;
3. map approved data to existing stage tables;
4. define exact natural keys and conflict behavior;
5. retain source snapshot, checksum, observed time, cutoff, parser version, feature version, and reliability;
6. dry-run under exact stage and production-deny refs;
7. apply once if approved;
8. verify counts, conflicts, and fixture coverage;
9. rerun once to prove zero duplicate growth;
10. stop before candidate generation.

### Acceptance

- balanced source/insert/update/skip/reject/conflict accounting;
- no invented source values;
- no post-kickoff leakage;
- lineage queryable from destination rows;
- canonical identities resolve;
- second run creates zero duplicates;
- production writes remain zero;
- no V2 publication.

## Phase B - Incremental current-data refresh

After the baseline is stored, update only changed source families.

### Fixture and result state

- future fixture identities and kickoffs;
- trusted terminal results;
- exact provider mapping;
- exception reporting.

### Ratings and rankings

- effective-dated World Football Elo snapshots;
- latest available official FIFA ranking;
- no overwrite of history;
- source and capture time retained.

### Tournament context

- standings and points;
- wins, draws, and losses;
- goals for/against and difference;
- scoring/conceding averages;
- opponent quality;
- qualification or pressure state;
- small-sample reliability controls.

### Derived signals

- explicit cutoff;
- source IDs;
- model/feature version;
- missing optional inputs;
- contradiction and reliability metadata;
- idempotent persistence.

## Phase C - First V2 shadow candidate

Generate only after minimum current-data coverage is accepted.

Candidate requirements:

- fixture not started;
- predecessor V1 linked;
- explicit calculation time and cutoff;
- source/signal snapshots linked;
- movement caps and reliability gates;
- missing and contradictory signals reported;
- scenario families and representative scores coherent;
- unpublished development purpose.

Completed fixtures use `historical_replay` and pre-kickoff evidence only.

## Source families

- API-Football fixtures/results;
- World Football Elo;
- FIFA rankings;
- official World Cup schedule and venues;
- prepared deterministic snapshots;
- current tournament standings and qualification context.

## Decision rule

**Decision:** do not block Phase A on perfect current freshness.

**Motivo:** storage, lineage, idempotency, and coverage must exist before refresh becomes routine.

**Consequence:** baseline rows are historical and versioned; Phase B appends newer truth.

## Quality gates

- `observed_at < kickoff` for pre-match inputs;
- canonical aliases resolve;
- neutral/host context correct;
- source disagreement surfaced;
- no full foundation bootstrap for ordinary refreshes;
- no prediction rewrite;
- no release claim from historical replay alone.

## Responsibility

- Codex implements bounded loaders, refreshers, tests, and reports.
- The operator authorizes stage applies and runs Git/Supabase/API operations.
- ChatGPT owns model-state interpretation, decisions, roadmap, and documentation.

## Process

Use one preflight, one apply, one verification. Add one exact rerun only when proving idempotency of a new loader.

Do not reopen Task 3B or Task 1C as part of signal refresh.
