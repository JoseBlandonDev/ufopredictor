# API-Football Fixture and Result Operations Runbook

_Last refreshed: 2026-06-23._

## Purpose

Maintain public World Cup coverage and verified results without requiring one-off manual discovery for every fixture.

## Immediate operational objective

Discover and store all remaining group-stage fixture IDs and official-schedule links before their prediction windows become urgent.

The current production model may publish them while v2 remains under stage validation.

## Safe batch phases

### 1. Discovery/read

- query exact competition/season/date ranges;
- output fixture IDs, teams, kickoff, provider status, stage/group;
- reconcile canonical aliases and official schedule rows;
- report DB/publication/prediction state;
- perform no writes.

### 2. Exact/bounded fixture apply

- use explicit competition, season/date, fixture IDs, and limits;
- preserve public slug/access scope for existing rows;
- allow live status sync only under existing exact guards;
- do not create result rows for live fixtures;
- capture a report.

### 3. Terminal-result ingest

- poll relevant stored fixtures;
- ingest finished scores to `pending_review`;
- never present them publicly as final until verified;
- no probability rewrite.

### 4. Human verification

- verify in Result Review Queue;
- confirm public recent results/history;
- retain the original pre-match publication/cutoff.

### 5. Evaluation persistence

- select verified rows;
- persist evaluations in bounded batches;
- confirm the queue clears;
- retain idempotency.

## MVP2 scheduler target

Frequency:

- normal: once or twice daily;
- dense match windows: before/after relevant kickoff blocks;
- on-demand retry after provider failure.

Initial scheduler scope:

- discovery/status refresh;
- terminal-result pending-review creation;
- run report/admin notification.

Human verification remains mandatory.

## Required report

- run ID/cutoff/environment;
- fixture scope;
- provider response time;
- create/update/skip counts;
- live/finished/pending-review counts;
- failures and retry status;
- post-run queue counts;
- no secrets.

## Guardrails

- production target confirmation;
- exact competition/fixture scope;
- idempotency;
- no broad silent apply;
- no unverified public final;
- no post-kickoff prediction generation;
- no manual probability rewrite;
- immutable prediction history.
