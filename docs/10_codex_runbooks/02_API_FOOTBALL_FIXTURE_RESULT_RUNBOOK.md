# API-Football Fixture, Result, and Evaluation Runbook

_Last refreshed: 2026-06-23._

## Purpose

Operate published World Cup fixtures safely from provider status through verified final result and internal evaluation.

## Read-only discovery

Use exact fixture or bounded league/date reads. Confirm:

- fixture ID;
- kickoff UTC;
- teams;
- provider status;
- score.

Warnings from deprecated Node internals do not invalidate a successful provider response by themselves.

## Apply rules

### Scheduled exact fixture

May create/update only under the existing exact World Cup guards.

### Live exact fixture

Allowed only when:

- exact single-fixture/date/limit guards hold;
- match already exists;
- action is update, not create;
- existing slug is preserved;
- access remains public;
- intake source is API-Football;
- competition matches the World Cup row;
- no result row is created.

### Finished exact fixture

May update match and create/update pending-review result under the existing guards.

Broad unsafe apply remains blocked.

## Batch result workflow

1. Read the date range.
2. Build an explicit fixture list.
3. Exclude exceptions such as abandoned/incomplete fixtures.
4. Run exact apply for each finished fixture.
5. Stop the batch on nonzero exit.
6. Review the result queue.
7. Verify scores.
8. Confirm public history.
9. Persist internal evaluations.

## Public lifecycle

Do not manually set `live` merely for display.

Classification is derived from kickoff/verified result using a three-hour active window.

## Verification rule

Only verified final results appear as final public truth.

## Evaluation rule

Persisting evaluation compares the immutable prediction with the verified result and supports calibration. It does not alter the public prediction.

## Anomaly review and admin boundaries

- Use Prediction Review Gate for selected anomalies, provider revalidation, shadow comparison, and recorded human decisions.
- Do not manually rewrite published probabilities.
- Use Real Fixture Publish Queue for routine exact publication.
- Use Result Review Queue and Evaluation Queue for the verified-result lifecycle.
- Real Fixture Lab exact-detail is optional diagnostic context and is not required for routine operations.

## Current automation backlog

- scheduled polling of relevant fixtures;
- exact status sync;
- terminal-score ingest to pending review;
- admin notification;
- idempotent retries;
- no automatic historical rewrite;
- governance decision before auto-verification or auto-evaluation.
