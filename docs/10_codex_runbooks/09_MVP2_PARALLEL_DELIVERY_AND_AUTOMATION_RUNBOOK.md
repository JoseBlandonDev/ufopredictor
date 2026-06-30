# Parallel Delivery and Operations Automation Runbook

_Last refreshed: 2026-06-29._

## Purpose

Allow production operations, MVP 1.5 product polish, and V2 development to move in parallel without becoming separate incompatible products.

## Tracks

### Production continuity

Base:

```text
main
```

Owns:

- current public product;
- API-Football operations;
- current predictions/results;
- payment/entitlement;
- bounded production fixes.

### MVP 1.5 product-polish

Base:

```text
current main
```

Owns:

- Free/Premium conversion;
- copy and hierarchy;
- Premium response presentation;
- panel/pricing/Transparency;
- venue ingestion/display;
- public time presentation;
- accessibility/mobile;
- product terms presentation.

Does not own:

- V2 probabilities;
- V2 signals;
- calibration;
- release decision.

### V2 integration

Base:

```text
integration/prediction-intelligence-v2
```

Owns:

- V2 data/model;
- current signal snapshots;
- shadow candidates;
- replay/evaluation;
- stage release evidence.

### Operations automation

Base:

```text
main
```

unless a task explicitly requires V2 schema.

Owns:

- recent-pending selection;
- provider polling;
- retry/backoff;
- run logs;
- alerts;
- reconciliation.

## Synchronization contract

### Create MVP 1.5

```text
current main
-> bounded MVP 1.5 branch
```

### Keep current

Merge/rebase current `main` into MVP 1.5:

- after meaningful production changes;
- before each MVP 1.5 PR;
- before release.

### Release MVP 1.5

```text
reviewed MVP 1.5 PR
-> main
-> production validation
```

### Preserve in V2

```text
updated main
-> integration/prediction-intelligence-v2
```

Do this after accepted shared-code product releases.

## Forbidden patterns

- long-lived unsynchronized MVP 1.5 branch;
- broad unfinished V2 merge into MVP 1.5;
- manual duplicate implementation in both branches;
- final mega-merge after weeks of divergence;
- model and commercial redesign in one PR.

## Operations increments

### Delivered

- exact fixture registry;
- exact result refresh;
- trusted terminal result verification/evaluation;
- exact publication queue;
- manual reconciliation exception;
- Round-of-32 publication batch.

### Pending

- scheduled recent-pending polling;
- retry/backoff;
- provider observability;
- official-result-without-prediction path;
- venue ingestion;
- reconciliation metrics.

## Routine provider execution

Operator path:

```text
PowerShell read
-> exact dry-run
-> exact allowlist apply
-> verification
-> admin/public smoke
```

Codex is not part of routine execution.

No Wikipedia/secondary-source write authority.

## MVP 1.5 release slices

Recommended order:

1. P0 copy/CTA/Premium badge;
2. pricing/pass/panel;
3. Premium response hierarchy;
4. venue ingestion/display;
5. time-zone display;
6. Transparency/history;
7. mobile/accessibility/analytics.

Each slice should be deployable independently.

## Main-to-V2 validation

After synchronization:

- public prediction tests;
- entitlement/pricing tests;
- fixture/result tests if touched;
- venue/time tests;
- V2 focused tests;
- lint/build;
- no production write.

## Documentation

ChatGPT authors:

- canonical sources;
- runbooks;
- roadmap updates.

Codex may inspect or apply accepted files exactly when delegated.

## Reporting

Every parallel release reports:

- source branch/HEAD;
- target branch;
- shared files;
- conflicts;
- tests;
- environment/write scope;
- deployment result;
- synchronization follow-up.
