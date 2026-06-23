# UFO Predictor MVP2 Scope and Delivery Tracker

_Last refreshed: 2026-06-23._

The authoritative editable tracker is:

```text
docs/30_project_management/UFO_Predictor_MVP2_Backlog_Tracker.xlsx
```

## Track order

1. Branch/environment normalization.
2. Remaining group-stage fixture coverage and production continuity.
3. Stage Task 3B data foundation.
4. Model/release decision.
5. Operations automation.
6. Independent MVP1 UI/UX microreleases.
7. English internationalization after v2 stabilization.
8. Payment-provider abstraction later.
9. V3 signal research later.

## Status vocabulary

- `Backlog`
- `Ready`
- `In Progress`
- `Blocked`
- `Review`
- `Done`
- `Deferred`

## Rules

- Every row declares branch base and environment.
- `main` tasks must not depend on migration 0038 unless explicitly marked v2.
- A task can be parallel only when its acceptance criteria do not consume unfinished v2 contracts.
- No task may rewrite a published prediction after kickoff.
- Documentation is updated after each merged milestone.
