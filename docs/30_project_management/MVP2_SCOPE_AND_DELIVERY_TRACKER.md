# UFO Predictor MVP2 Scope and Delivery Tracker

_Last refreshed: 2026-06-25 after Task 3A completion and final M2-01 implementation checkpoint approval._

## Authority

This Markdown file is a derived planning summary.

Canonical live scope and status are owned by:

```text
docs/00_chatgpt_sources/07_ROADMAP_EPICS_DECISIONS.md
```

The XLSX tracker may lag. Neither this file nor the workbook overrides the shared canonical roadmap.

## Current track order

1. apply the final M2-01 documentation refresh and replace shared ChatGPT sources;
2. optionally refresh Draft PR #114 description while keeping it Draft;
3. perform M2-03 Task 3B read-only stage audit;
4. produce a non-destructive synchronization plan and stop for owner approval;
5. apply the approved stage migration/import plan and prove idempotency;
6. refresh current football and tournament data;
7. execute M2-04 fair current v1/v2 comparison;
8. select v2.0 Tournament Candidate;
9. implement v2.1 Knockout Context;
10. continue M2-05 scheduler/retry/notification hardening;
11. continue independent bounded MVP1 UI/UX work.

## Epic status snapshot

| Epic | Status | Current meaning |
|---|---|---|
| M2-01 | Implementation Complete | Task 1 through Task 3A normalized; final checkpoint approved; PR #114 still Draft |
| M2-02 | Done | Matchday 3 registry/publication and Torneo JSON delivered |
| M2-03 | Ready for Task 3B read-only audit | Audit stage first; writes require a later explicit owner approval |
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
- strict Task 2 local-run output guards;
- Task 3A local-only planner/dry-run;
- Task 3A historical preservation manifest and byte-exact evidence;
- accumulated Task 2 checkpoint;
- final M2-01 implementation checkpoint;
- proof that no useful old-branch implementation remains.

Remaining outside M2-01 implementation:

- final documentation refresh and shared-source replacement;
- optional Draft PR #114 description refresh;
- PR review and later merge decision after stage evidence.

## M2-03 milestone detail

- read-only stage audit first;
- explicit owner approval before writes;
- migration/schema reconciliation plan;
- migration 0038 only in stage after approval;
- idempotent approved non-sensitive data import;
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
- historical v2 candidates are not current release authority;
- Task 3B begins read-only;
- stage writes require explicit owner approval;
- production writes remain unauthorized for v2 work.

## Status vocabulary

- `Backlog`
- `Ready`
- `In Progress`
- `Implementation Complete`
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
