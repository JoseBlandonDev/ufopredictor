# UFO Predictor MVP2 Scope and Delivery Tracker

_Last refreshed: 2026-06-24 after Prediction Intelligence v2 Task 2 checkpoint approval._

## Authority

This Markdown file is a derived planning summary.

Canonical live scope and status are owned by:

```text
docs/00_chatgpt_sources/07_ROADMAP_EPICS_DECISIONS.md
```

The XLSX tracker may lag. Neither this file nor the workbook overrides the shared canonical roadmap.

## Current track order

1. finish M2-01 with Task 3A planner/dry-run;
2. run final M2-01 checkpoint and prepare PR #114 for review;
3. perform M2-03 Task 3B read-only stage audit;
4. apply approved stage migration/import plan and prove idempotency;
5. refresh current football and tournament data;
6. execute M2-04 fair current v1/v2 comparison;
7. select v2.0 Tournament Candidate;
8. implement v2.1 Knockout Context;
9. continue M2-05 scheduler/retry/notification hardening;
10. continue independent bounded MVP1 UI/UX work.

## Epic status snapshot

| Epic | Status | Current meaning |
|---|---|---|
| M2-01 | In Progress | Task 1 and Task 2 complete; Task 3A remains |
| M2-02 | Done | Matchday 3 registry/publication and Torneo JSON delivered |
| M2-03 | Ready after M2-01 | Read-only stage audit, migration reconciliation, import, signals, immutable versions |
| M2-04 | Planned | Current-data refresh, fair comparison, and v2.0 release decision |
| M2-05 | Partially Done | Registry/result automation delivered; scheduler/retry/alerts remain |
| M2-06 | Parallel | Bounded MVP1 UI/UX work independent of unfinished v2 schema |
| M2-07 | Contract design active | ES/EN/PT contracts now; public rollout later |
| M2-08 | Later | Provider-neutral payment abstraction |

## M2-01 milestone detail

Completed:

- integration branch and Draft PR #114;
- Task 1 data foundation;
- Task 1.1 replay readiness;
- Task 1.2 historical Elo reconstruction;
- Task 2A challenger/replay;
- Task 2B calibration stabilization;
- Task 2C gates/eligibility;
- Task 2D historical packaging;
- strict local-run output guards;
- accumulated Task 2 checkpoint.

Remaining:

- Task 3A planner/dry-run;
- final normalization checkpoint;
- PR #114 scope/description refresh and review preparation.

## M2-03 milestone detail

- read-only stage audit first;
- explicit owner approval before writes;
- migration 0038 only in stage;
- idempotent non-sensitive data import;
- second-run zero duplicates;
- signal snapshots and immutable dev/replay versions;
- RLS, aliases, localization, venue, and public-safe view validation.

## M2-04 milestone detail

- current Elo/FIFA/result/schedule/standings refresh;
- current tournament context and qualification pressure;
- fair identical-cutoff comparisons;
- choose v1 probability + v2 analysis or gated-v2 probability + v2 analysis;
- no promotion from dated historical artifacts;
- v2.0 release gate and rollback plan.

## Current MVP2 product scope

- v2.0 Tournament Candidate;
- v2.1 Knockout Context;
- structural, recent, and tournament-current signals;
- group/qualification pressure;
- evidence and contradictions;
- representative scenario families;
- reliability/provenance;
- immutable versions and `historical_replay`;
- ES/EN/PT-ready contracts;
- public-safe partner export compatibility.

## Operations policy

- valid exact API-Football `FT` results may be auto-verified;
- human review is exception-only;
- production apply requires exact allowlists;
- no prediction mutation;
- no broad silent apply;
- historical v2 candidates are not current release authority.

## Status vocabulary

- `Backlog`
- `Ready`
- `In Progress`
- `Blocked`
- `Review`
- `Done`
- `Deferred`
- `Partially Done`

## Rules

- every task declares branch base and environment;
- `main` tasks do not depend on migration 0038 unless explicitly v2;
- parallel tasks cannot consume unfinished v2 contracts;
- no task rewrites a published prediction after kickoff;
- documentation is refreshed at major checkpoints and after merged milestones;
- shared roadmap truth wins over this derived tracker and the XLSX.
