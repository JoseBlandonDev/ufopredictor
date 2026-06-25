# Fixture, Result, and Evaluation Operations

_Last refreshed: 2026-06-24 after PR #111/#112 operations and Prediction Intelligence v2 Task 2 checkpoint approval._

## Operating model

API-Football is the operational source for fixture identity, kickoff, status, and final score.

Official World Cup schedule data provides canonical tournament schedule and venue reference where available.

The production path now combines:

- exact bounded fixture registration;
- current-model publication;
- trusted result auto-verification;
- idempotent evaluation persistence;
- exception-oriented review;
- public-safe partner export.

## Public lifecycle

Public classification uses kickoff and verified-result truth:

1. Verified final result wins and appears in recent results/history.
2. Future kickoff without verified result appears in upcoming.
3. Kickoff passed and inside the conservative active window appears in progress.
4. Outside the active window without verified final result appears as awaiting official update.
5. Explicit postponed/cancelled states remain honestly labeled.

Displayed probabilities remain the immutable pre-match publication and are not live-updated.

## Routine admin surfaces

- Prediction Review Gate for selected signal/model anomalies;
- Real Fixture Publish Queue for exact fixture publication;
- Result Review Queue for exceptions/reconciliation;
- Evaluation Queue for exceptional or manual persistence paths;
- Torneo Export for public-safe partner payloads.

Real Fixture Lab exact detail remains deeper diagnostics, not a routine dependency.

## Fixture registry command

```text
npm run ops:world-cup-group-stage-fixture-registry
```

Behavior:

- dry-run by default;
- bounded selection by matchday or date;
- exact allowlist manifest for apply;
- canonical/provider link reporting;
- create/update/already-stored counts;
- no prediction, result, or evaluation creation;
- idempotent second apply.

Matchday 3 result:

- 24/24 fixtures stored;
- 20 new fixtures created in four exact five-fixture batches;
- 4 already stored;
- 0 Matchday 3 conflicts;
- all four batches proved idempotent.

## Prediction publication state

Matchday 3:

- 24/24 v1 internal predictions saved;
- 24/24 public products published;
- publish queue empty;
- original v1 publications remain immutable.

A later v2 publication may be created only before kickoff as a new version.

## Trusted result refresh command

```text
npm run ops:world-cup-result-refresh
```

Behavior:

- dry-run by default;
- bounded selection by exact identifiers, manifest, date range, or matchday;
- apply requires an exact allowlist;
- touches only stored World Cup fixtures;
- never creates fixtures;
- never generates or mutates predictions;
- auto-verifies supported trusted-provider finals;
- persists eligible evaluations idempotently;
- reports exceptions separately.

## Trusted auto-verification policy

API-Football `FT` may be auto-verified when:

- provider linkage matches the stored fixture;
- home and away identity match;
- both scores are present;
- terminal status is supported;
- no duplicate, linkage, identity, or stored-score conflict exists.

Normal flow:

```text
provider FT
-> status sync if needed
-> verified result create/already-identical
-> evaluation create/already-stored
```

The owner has approved trusted-provider automatic verification. Human review is no longer mandatory for normal valid finals.

## Exception policy

The Result Review Queue is now exception-oriented.

Examples:

- provider fixture not found;
- unsupported or incomplete state;
- missing score;
- identity/link mismatch;
- incompatible duplicate;
- stored verified score differs from provider;
- evaluation persistence failure.

A changed previously verified score must never be silently overwritten.

`provider_fixture_not_found` may be transient and is not automatically a data conflict.

## Real production result-refresh evidence

Successful exact Matchday 2 apply:

- selected fixtures: 15;
- provider terminal results: 15;
- results already identical: 14;
- results created: 1;
- results verified in apply: Colombia 1-0 Congo DR;
- evaluations already stored: 14;
- evaluations created: 1;
- conflicts/exceptions in successful apply: 0.

Second apply produced:

- results created: 0;
- results updated: 0;
- evaluations created: 0;
- evaluations updated: 0.

Provider availability varied between repeated calls. Existing verified rows remained safe and unchanged.

## Current run cadence

Routine production refresh should focus on:

- fixtures whose kickoff recently passed;
- stored rows without verified final result;
- scheduled/started rows needing status update;
- unresolved recent exceptions;
- a bounded recent correction window.

Do not routinely poll entire completed historical matchdays merely to reconfirm identical data.

## Next automation increments

Still pending:

- automatic selection of recent pending fixtures;
- retry/backoff for transient provider absence;
- scheduler once/twice daily and around dense kickoff windows;
- run summaries and notifications;
- persistent reconciliation workflow for changed official scores;
- operational metrics for provider failures.

## Required run logging

Every batch should capture:

- run ID and UTC cutoff;
- environment and target;
- exact requested fixture scope;
- provider response timestamp where available;
- create/update/already-identical/skip counts;
- verification/evaluation counts;
- exceptions and retryability;
- idempotency evidence.

Do not log credentials or raw sensitive payloads.

## Evaluation persistence

Evaluation compares an immutable prediction with the verified outcome.

It supports:

- calibration and diagnostics;
- exact-score and scenario-family review;
- 1X2, goals, BTTS, margin, and surprise analysis;
- future challenger research;
- auditable learning without rewriting history.

## Torneo Mundialista export

Current partner artifact:

```text
schemaVersion: torneo-ufo-export-v1
```

Validated Matchday 3 export:

- range: 2026-06-24 to 2026-06-30;
- fixtures: 24;
- unique fixture IDs: 24;
- duplicates: 0;
- public-safe URLs and prediction fields;
- JSON approved as the delivery artifact;
- PDF not required.

## Prediction Intelligence v2 operational boundary

The current integration branch does not alter production fixture registration, trusted result refresh, verification, evaluation persistence, publication queues, or the `torneo-ufo-export-v1` runtime.

Historical Task 2 Torneo candidate artifacts are research packaging only. They are not the production partner export and cannot replace it.

Task 3A may generate plans and dry-run artifacts only. Current result operations continue on the production v1 path until a later stage-validated release decision.

## Automation guardrails

- exact competition/fixture scope;
- stage/production target guard;
- dry-run before apply;
- exact allowlist for production apply;
- idempotent writes;
- immutable prediction versions;
- no post-kickoff prediction generation;
- no silent score correction;
- observable exceptions;
- no broad silent apply.
