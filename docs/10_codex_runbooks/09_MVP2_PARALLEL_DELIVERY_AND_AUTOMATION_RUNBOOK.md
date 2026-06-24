# MVP2 Parallel Delivery and Operations Automation Runbook

_Last refreshed: 2026-06-24._

## Purpose

Allow production, model, operations, and bounded product work to advance simultaneously without forcing production to wait for v2.

Live epic status belongs in:

```text
docs/00_chatgpt_sources/07_ROADMAP_EPICS_DECISIONS.md
```

## Track ownership

### Production continuity track

Base: current `main`

- relevant fixture/result operations;
- current-model publications;
- trusted result refresh;
- partner export continuity;
- bounded production fixes.

### V2 integration track

Base: `integration/prediction-intelligence-v2`

- normalized data/schema;
- model/replay/calibration;
- tournament-context signals;
- stage sync;
- development predictions;
- release decision.

### UI/UX track

Base: current `main`

- independent microreleases;
- no migration 0038 dependency;
- no v2 table consumption until approved.

### Operations automation track

Base: current `main` unless a task requires v2 schema.

- recent-pending selection;
- status/result polling;
- trusted auto-verification;
- run logs/notifications;
- retry/backoff;
- reconciliation alerts.

## Automation increments

### Increment 1 - fixture registry

Status: `Delivered in PR #111`

- canonical/provider discovery;
- exact allowlist apply;
- conflict reporting;
- idempotency;
- Matchday 3 24/24 coverage.

### Increment 2 - trusted bounded result refresh

Status: `Delivered in PR #112`

- exact stored-fixture selection;
- dry-run/report/apply;
- exact allowlist requirement;
- trusted valid `FT` auto-verification;
- idempotent evaluation;
- exception path;
- no prediction mutation.

### Increment 3 - scheduled relevant polling

Status: `Pending`

- automatically select recent relevant fixtures;
- run once/twice daily and around kickoff blocks;
- retry transient provider absence with backoff;
- avoid historical completed batches;
- emit concise operator notification.

### Increment 4 - reconciliation and observability

Status: `Pending`

- changed-score reconciliation;
- persistent exception classification;
- provider-failure metrics;
- retry history;
- evaluation failure reporting;
- audit-safe operator actions.

### Increment 5 - recurring signal refresh

Status: `After v2 stage stabilization`

- refresh current structural/recent/tournament signals;
- persist provenance/reliability;
- generate only not-started immutable versions;
- create labeled historical replay where approved;
- compare v1/v2.

## Torneo Mundialista continuity

Current production partner contract:

```text
torneo-ufo-export-v1
```

- JSON is the delivery artifact;
- 24 Matchday 3 fixtures were validated;
- future v2 fields must be added compatibly;
- partner identity uses stable IDs.

## Internationalization track

- canonical contracts prepare ES/EN/PT now;
- full public translation rollout follows stable v2 contracts;
- do not block v2 data/model integration on complete UI translation.

## Release discipline

Each increment must be independently deployable and useful.

Do not bundle worker infrastructure, new model, internationalization, payment providers, and frontend redesign into one PR.
