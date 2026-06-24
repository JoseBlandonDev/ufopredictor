# UFO Predictor MVP2 Scope and Delivery Tracker

_Last refreshed: 2026-06-24._

## Authority

This Markdown file is a derived planning summary.

Canonical live scope and status are owned by:

```text
docs/00_chatgpt_sources/07_ROADMAP_EPICS_DECISIONS.md
```

The XLSX tracker is a visual management aid and may lag behind. Neither this file nor the workbook overrides the shared canonical roadmap.

## Current track order

1. M2-01 Prediction Intelligence v2 branch/integration normalization.
2. M2-03 Task 3B read-only stage audit and data foundation.
3. M2-04 v2 model/replay comparison and v2.0 release decision.
4. M2-05 scheduler, retry/backoff, notifications, and reconciliation hardening.
5. v2.1 knockout-context release.
6. independent bounded MVP1 UI/UX microreleases.
7. ES/EN/PT public internationalization after stable contracts.
8. payment-provider abstraction later.
9. later player/news/odds research.

## Epic status snapshot

| Epic | Status | Current meaning |
|---|---|---|
| M2-01 | Ready | Create integration branch and selectively port nine v2-only commits. |
| M2-02 | Done | 24/24 Matchday 3 fixtures registered and predictions published; Torneo JSON validated. |
| M2-03 | Ready after M2-01 | Stage audit, migration reconciliation, import, signals, immutable versions. |
| M2-04 | Planned | Fair v1/v2 comparison and release-mode decision. |
| M2-05 | Partially Done | Registry and trusted result refresh delivered; scheduler/retry/alerts remain. |
| M2-06 | Parallel | Bounded MVP1 UI/UX work independent of v2 schema. |
| M2-07 | Contract design active | ES/EN/PT locale-neutral contracts now; public rollout later. |
| M2-08 | Later | Provider-neutral payment abstraction. |

## Current MVP2 product scope

- v2.0 Tournament Candidate;
- v2.1 Knockout Context;
- structural, recent, and tournament-current signals;
- group/qualification pressure;
- evidence and contradictions;
- scenario families;
- reliability/provenance;
- immutable versions and `historical_replay`;
- ES/EN/PT-ready contracts;
- public-safe partner export compatibility.

## Operations policy

- API-Football valid exact `FT` results may be auto-verified;
- human review is exception-only;
- production apply requires exact allowlists;
- no prediction mutation;
- no broad silent apply.

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
- documentation is refreshed after merged milestones;
- shared roadmap truth wins over this derived tracker and the XLSX.
