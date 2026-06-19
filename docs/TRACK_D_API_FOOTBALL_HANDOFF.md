# Track D / API-Football Handoff

_Last refreshed: post PR #94 model closeout / Wompi production premium baseline / 28-fixture evaluation closeout (2026-06-19)._

## Operating model

Use exact fixture workflow. Avoid broad unknown apply.

### Upcoming scheduled fixture

1. Read exact provider fixture.
2. Run exact ingest dry-run.
3. Confirm one expected fixture and no unintended result write.
4. Apply exact fixture only.
5. Save/publish through Publish Queue.
6. Verify `/predictions` and `/matches/[slug]`.
7. Run model sanity review before publication/export.

### Finished fixture

1. Confirm provider final status.
2. Run exact ingest dry-run.
3. Apply exact result.
4. Verify through Result Review Queue.
5. Persist internal evaluation through Evaluation Queue.
6. Verify public final-result projection.
7. Confirm both queues are clear.

## Latest closure

| Fixture | Match | Result | State |
|---:|---|---:|---|
| 1489387 | Canada vs Qatar | 6-0 | verified / evaluated / public |
| 1489388 | Mexico vs South Korea | 1-0 | verified / evaluated / public |

Pending result-review rows: 0.

Pending evaluation rows: 0.

## Current public upcoming runway

Count: 4.

- United States vs Australia
- Scotland vs Morocco
- Brazil vs Haiti
- Türkiye vs Paraguay

## Model gating

PR #94 model state is accepted:

- SIGNAL04;
- DRAW01;
- unchanged expected-goals formula.

Before publication, inspect fixture outputs for:

- implausibly flat favorite probabilities;
- modal `1-1` against large strength gaps;
- compressed xG;
- extreme attack/defense priors;
- blowout underestimation risk.

Do not change the model inside an ingest/publication slice.

## Admin paths

Preferred:

- Publish Queue;
- Result Review Queue;
- Evaluation Queue.

Real Fixture Lab exact-detail remains a separate blocker and is not required for normal operations.

## Boundaries

No broad apply, no live/unfinal verification, no provider odds/predictions as model inputs, no public evaluation payloads, no `prediction_results` exposure, and no historical prediction rewriting.
