# Track D / API-Football Handoff

_Last refreshed: 2026-06-22. Historical production behavior retained; Prediction Intelligence v2 does not change this runbook._

## Operating model

Use exact fixture or exact round workflows.

Avoid broad unknown apply.

## Console-first rule

Use local PowerShell/scripts for:

- provider reads;
- fixture inventories;
- round counts;
- dry-runs;
- repeated status checks;
- export generation.

Use Codex only when implementation, architecture, or complex debugging is required.

## Exact upcoming fixture

1. read provider fixture;
2. dry-run ingest/generation;
3. confirm identity, kickoff, status, and scope;
4. apply exact fixture if missing;
5. revalidate immediately before write;
6. generate/publish immutable prediction;
7. verify public surfaces/export.

## Exact finished fixture

1. confirm provider final status;
2. dry-run exact result;
3. apply exact result;
4. Result Review Queue;
5. Evaluation Queue;
6. verify public final result;
7. confirm no pending queue residue.

## Matchday batch

PR #99 proved the round workflow:

- API-Football returned exactly 24 Group Stage - 2 fixtures;
- database already contained 24;
- live/finished/kickoff-passed fixtures were frozen;
- future fixtures were regenerated or reused by provenance;
- writes were idempotent;
- export validated to 24 unique fixtures.

## Production configuration

`API_FOOTBALL_KEY` is configured in production for provider revalidation.

Never expose the key in screenshots, logs, docs, or client runtime.

## Model gating

Accepted baseline:

- PR #94 model closeout;
- PR #97 signal snapshot;
- no expected-goals change.

Inspect future fixtures for:

- favorite compression;
- modal score inconsistency;
- xG compression;
- extreme signal priors;
- Elo favorite inversion.

Use Review Gate for selected anomalies. Do not manually rewrite probabilities.

## Frozen fixture rule

Finished, live, halftime, kickoff-passed, or provider-mismatched fixtures are not regenerated or republished.

## Admin paths

Preferred:

- Prediction Review Gate;
- Publish Queue;
- Result Review Queue;
- Evaluation Queue;
- Torneo Export.

Real Fixture Lab exact-detail is not required for routine operations.
## Prediction Intelligence v2 integration

API-Football remains the operational fixture/status identity source. V2 adds historical/rating/schedule facts around it. Exact provider final status gates result ingestion; not-started status gates immutable publication.
