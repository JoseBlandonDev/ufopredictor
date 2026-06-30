# Parallel Delivery and Operations Automation Runbook

_Last refreshed: 2026-06-29 after accepted `main` work was synchronized into V2 and Task 2B completed._

## Purpose

Allow production operations, MVP 1.5 product polish, and V2 development to move in parallel without becoming incompatible products.

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
- premium response presentation;
- panel/pricing/Transparency;
- venue ingestion/display;
- public time presentation;
- accessibility/mobile;
- product terms presentation.

Does not own V2 probabilities, V2 signals, calibration, or release decisions.

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

Current V2 state:

```text
Task 2A = complete
Task 2B = complete
Task 2C = next
```

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

Create product work:

```text
current main
-> bounded product branch
```

Release:

```text
reviewed product PR
-> main
-> production validation
```

Preserve in V2:

```text
updated main
-> integration/prediction-intelligence-v2
-> combined regressions
```

Accepted main checkpoint `3d4b036...` was integrated at V2 merge commit `9672b556...`.

## Forbidden patterns

- long-lived unsynchronized product branch;
- broad unfinished V2 merge into product work;
- manual duplicate implementation in both branches;
- final mega-merge after weeks of divergence;
- model and commercial redesign in one PR;
- treating documentation conflicts as permission to discard either implementation history.

## Operations increments

### Delivered

- exact fixture registry;
- exact result refresh;
- trusted terminal result verification/evaluation;
- exact publication queue;
- manual reconciliation exception;
- Round-of-32 production publication batch;
- Task 2B current fixture/result refresh;
- public History capability and smoke.

The Round-of-32 production publication batch does not mean V2 stage knockout participants are linked. Official schedule reference rows 73-104 remain deferred until participants are known.

### Pending

- scheduled recent-pending polling;
- retry/backoff;
- provider observability;
- official-result-without-prediction path;
- venue ingestion/display;
- reconciliation metrics;
- Task 2C ranking/context refresh;
- repeatable current signal automation.

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

No Wikipedia or secondary-source write authority.

## V2 current-data sequence

```text
Task 2A baseline - complete
-> Task 2B fixture/result refresh - complete
-> Task 2C rankings/context - next
-> Task 2D repeatable signals
-> Task 3A shadow candidate
```

Task 2C must not rerun Task 2B or rewrite the historical baseline.

## Product release slices

Recommended independent slices:

1. copy/CTA/Premium identity;
2. pricing/pass/panel;
3. premium response hierarchy;
4. venue ingestion/display;
5. time-zone display;
6. Transparency/history;
7. mobile/accessibility/analytics.

Pricing remains a separate unresolved implementation drift:

```text
owner target = US$10
observed Wompi display = COP 35,000
repo fallback/tests = US$20 / COP 68,700
```

## Main-to-V2 validation

After synchronization:

- public prediction and History tests;
- entitlement/pricing tests;
- fixture/result tests if touched;
- V2 focused tests;
- lint/diff-check;
- TypeScript/build;
- no production write.

The `9672b556...` integration passed the required combined validation.

## Documentation

ChatGPT authors:

- canonical sources;
- runbooks;
- roadmap updates.

Codex may:

- inspect repository truth;
- identify stale files;
- review authored replacements;
- apply accepted files exactly only when delegated.

## Reporting

Every parallel release reports:

- source branch/HEAD;
- target branch;
- shared files;
- conflicts and resolution method;
- tests/build;
- environment/write scope;
- deployment result;
- synchronization follow-up.
