# Fixture, Result, and Evaluation Operations

_Last refreshed: 2026-06-23._

## Operating model

API-Football is the operational source for fixture identity, kickoff, status, and final score. The current flow is intentionally operator-driven and proven across many fixtures.

The application does not require one-by-one surgical processing when a verified batch can be handled safely.

## Fixture lifecycle shown publicly

Public classification uses kickoff and verified-result truth:

1. Verified final result always wins and appears only in recent results/history.
2. Future kickoff without verified result appears in upcoming.
3. Kickoff passed and within three hours appears in progress.
4. After the three-hour active window, an unverified fixture appears as awaiting official update.
5. Explicit postponed/cancelled states remain visible with honest labels.

This protects the public UX from stale stored statuses.

## Current public labels

- `En vivo` for in-progress classification;
- `Esperando resultado oficial` after the active window without verification;
- `Partido suspendido` for postponed;
- `Partido cancelado` for cancelled;
- verified final score only after admin verification.

The displayed probabilities are always the pre-match publication and are not live-updated.

## Admin workflow boundaries

Use the smallest safe admin surface for each job:

- Prediction Review Gate for selected model/signal anomalies and recorded human decisions;
- Real Fixture Publish Queue for exact fixture publication;
- Result Review Queue for pending provider final results;
- Evaluation Queue for post-match persistence;
- Torneo Export for the public-safe partner payload.

Real Fixture Lab exact-detail is not required for routine operations. Do not make normal fixture publication, result verification, or evaluation depend on opening the heavier diagnostic page.

## Result refresh flow

Typical operator sequence:

```text
1. Read API-Football fixture/league status.
2. Run exact ingest/apply for finished fixtures.
3. Open the result review queue.
4. Verify the final result.
5. Confirm public recent results/history.
6. Persist the internal evaluation.
```

Live exact apply is allowed only for an already-existing public API-Football World Cup row and does not create a result row.

## Result verification

Verification converts a pending provider final score into trusted product truth.

It must not:

- overwrite the old prediction;
- expose an unverified score as final;
- invent a result from screenshots when provider truth is available;
- silently change historical publication timestamps.

## Evaluation persistence

`Persist evaluation` stores the post-match comparison between the immutable prediction and verified outcome.

It supports:

- model calibration and diagnostics;
- exact-score/scenario-family review;
- 1X2, goals, BTTS, margin, and surprise analysis;
- future challenger research;
- auditable learning without rewriting history.

It is an internal model-operations step, not a second public verification.

## Latest operational refresh captured here

Recently verified/public results include:

- France 3-0 Iraq;
- Argentina 2-0 Austria;
- Norway 3-2 Senegal;
- Jordan 1-2 Algeria.

The associated pending evaluation queue was cleared in the latest operator pass.

## Current limitation

Fixture status refresh, final-result ingestion, review, and evaluation persistence remain manual. This is acceptable for MVP1 but should become an automation epic.

## Automation target

A later safe scheduler should:

- poll only relevant published/target fixtures;
- update stored status without broad unsafe writes;
- ingest terminal scores into `pending_review`;
- notify admins when review is required;
- never auto-verify or auto-persist evaluation without the chosen governance rule;
- record provider timestamps and failure diagnostics;
- stay idempotent.
