# Fixture, Result, and Evaluation Operations

_Last refreshed: 2026-06-23._

## Operating model

API-Football is the operational source for fixture identity, kickoff, status, and final score. Official FIFA schedule data provides the canonical tournament schedule/venue reference where available.

The current flow is operator-driven and proven. MVP2 should reduce repetitive work without weakening exact-fixture guards, verified-result truth, or immutable prediction history.

## Public lifecycle

Public classification uses kickoff and verified-result truth:

1. Verified final result always wins and appears only in recent results/history.
2. Future kickoff without verified result appears in upcoming.
3. Kickoff passed and within three hours appears in progress.
4. After the three-hour active window, an unverified fixture appears as awaiting official update.
5. Explicit postponed/cancelled states remain visible with honest labels.

The displayed probabilities are always the pre-match publication and are not live-updated.

## Routine admin surfaces

- Prediction Review Gate for selected signal/model anomalies;
- Real Fixture Publish Queue for exact fixture publication;
- Result Review Queue for pending provider finals;
- Evaluation Queue for post-match persistence;
- Torneo Export for public-safe partner payloads.

Real Fixture Lab exact-detail remains optional deeper diagnostics, not a routine dependency.

## Current operator sequence

```text
1. Read API-Football fixture or league status.
2. Run exact ingest/apply for finished fixtures.
3. Review pending result rows.
4. Verify final results.
5. Confirm public recent results/history.
6. Persist internal evaluations.
```

Live exact apply is allowed only for an already-existing public API-Football World Cup row and does not create a result row.

## Immediate coverage objective

Before waiting for v2 model promotion:

- discover all remaining group-stage API-Football fixture IDs;
- reconcile them with the official schedule;
- persist canonical match/provider links in the application database;
- publish near-term fixtures using the current production model;
- keep an explicit manifest of not-started fixtures eligible for future v2 versions.

This prevents last-minute one-by-one ID discovery and avoids losing tournament coverage while model work continues.

## MVP2 batch operations target

### Fixture discovery batch

Input:

- competition/season/date or official schedule manifest.

Output:

- fixture ID;
- canonical teams;
- kickoff UTC;
- competition/stage/group;
- provider status;
- official schedule link;
- DB match/publication state;
- prediction eligibility.

### Status/result refresh batch

Run once or twice per day, with extra runs around dense kickoff windows:

- poll only relevant stored fixtures;
- update status/kickoff metadata idempotently;
- ingest terminal scores into `pending_review`;
- produce a concise run report;
- notify the admin when review is required.

### Verification and evaluation batch

Initially:

- human verification remains mandatory;
- verified rows may be selected and persisted in a bounded batch;
- no automatic final-score trust solely from a polling job;
- no automatic rewriting of predictions or scenarios.

Later, automation governance may allow trusted-provider auto-verification only after explicit owner approval and reconciliation safeguards.

## Required run logging

Every batch run should record:

- run ID and UTC cutoff;
- environment and target project;
- requested fixture scope;
- provider response timestamp;
- created/updated/skipped counts;
- terminal results discovered;
- verification/evaluation pending counts;
- failures and retryability;
- idempotency evidence.

Do not log credentials or raw sensitive payloads.

## Evaluation persistence

`Persist evaluation` stores the post-match comparison between the immutable prediction and verified outcome.

It supports:

- calibration and diagnostics;
- exact-score/scenario-family review;
- 1X2, goals, BTTS, margin, and surprise analysis;
- future challenger research;
- auditable learning without rewriting history.

It is an internal model-operations step, not a second public verification.

## Latest captured results

Recently verified/public results include:

- France 3-0 Iraq;
- Argentina 2-0 Austria;
- Norway 3-2 Senegal;
- Jordan 1-2 Algeria.

The associated pending evaluation queue was cleared in the latest operator pass.

## Automation guardrails

- exact competition/season/fixture scope;
- stage/production target guard;
- idempotent writes;
- immutable prediction versions;
- no post-kickoff generation;
- no unverified public final score;
- human-readable dry-run/report mode;
- bounded retries and observable failures;
- no broad silent apply.
