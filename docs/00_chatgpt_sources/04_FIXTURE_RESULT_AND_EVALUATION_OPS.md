# Fixture, Result, and Evaluation Operations

_Last refreshed: 2026-06-26 after the Prediction Intelligence v2 Task 3B stage bootstrap._

## Operating model

API-Football is the operational source for fixture identity, kickoff, status, and final score.

Official World Cup schedule data provides canonical tournament schedule and venue reference where available.

Production combines:

- exact bounded fixture registration;
- V1 prediction publication;
- trusted result verification;
- idempotent evaluation persistence;
- exception-oriented review;
- public-safe partner export.

Stage now has the foundational schedule, team, venue, rating, and historical data needed for the V1/V2 path, but it does not yet have model or prediction rows.

## Public lifecycle

Public classification uses kickoff and verified-result truth:

1. verified final result appears in history;
2. future kickoff without verified result appears in upcoming;
3. kickoff passed inside the conservative active window appears in progress;
4. outside that window without a verified result appears as awaiting official update;
5. postponed and cancelled states remain honestly labeled.

Displayed probabilities remain the immutable pre-match publication and are not live-updated.

## Routine admin surfaces

- Prediction Review Gate for selected model and signal anomalies;
- Real Fixture Publish Queue for exact fixture publication;
- Result Review Queue for exceptions and reconciliation;
- Evaluation Queue for exceptional or manual persistence paths;
- Torneo Export for public-safe partner payloads.

Real Fixture Lab remains deeper diagnostics, not a routine dependency.

## Fixture registry command

```text
npm run ops:world-cup-group-stage-fixture-registry
```

Behavior:

- dry-run by default;
- bounded selection by matchday or date;
- exact allowlist manifest for apply;
- canonical/provider link reporting;
- create, update, already-stored, conflict, and duplicate counts;
- no prediction, result, or evaluation creation;
- idempotent second apply.

Production Matchday 3 result:

- 24/24 fixtures stored;
- 20 fixtures created in exact bounded batches;
- 4 already stored;
- 0 Matchday 3 conflicts;
- idempotency proved.

## Production prediction publication state

Matchday 3:

- 24/24 V1 internal predictions saved;
- 24/24 public products published;
- original V1 publications remain immutable.

A later V2 candidate may become a new version before kickoff. A completed fixture may receive a labeled `historical_replay`, but the replay does not replace the original publication.

## Trusted result refresh command

```text
npm run ops:world-cup-result-refresh
```

Behavior:

- dry-run by default;
- bounded selection by exact identifiers, manifest, date range, or matchday;
- apply requires an exact allowlist;
- stored World Cup fixtures only;
- never generates or mutates predictions;
- verifies supported trusted-provider finals;
- persists eligible evaluations idempotently;
- reports exceptions separately.

## Trusted verification policy

API-Football `FT` may be verified when:

- provider linkage matches the stored fixture;
- home and away identity match;
- both scores are present;
- terminal status is supported;
- no duplicate, linkage, identity, or stored-score conflict exists.

A changed previously verified score must never be silently overwritten.

## Exception policy

Examples:

- provider fixture not found;
- unsupported or incomplete state;
- missing score;
- identity or linkage mismatch;
- incompatible duplicate;
- stored verified score differs from provider;
- evaluation persistence failure.

Human review is reserved for exceptions.

## Evaluation persistence

Evaluation compares an immutable prediction with the verified outcome.

It supports:

- calibration and diagnostics;
- exact-score and scenario-family review;
- 1X2, goals, BTTS, margin, and surprise analysis;
- future challenger research;
- auditable learning without rewriting history.

Future V1/V2 comparison must preserve:

```text
original V1 publication
V2 live candidate or historical_replay
verified result
```

A replay may use only evidence available before the original kickoff.

## Torneo Mundialista export

Current partner artifact:

```text
schemaVersion: torneo-ufo-export-v1
```

The production contract remains unchanged by Task 3B.

## Stage Task 3B operations state

Task 3B completed:

- World Cup competition and season resolution;
- 72 runtime group-stage matches;
- 104 official schedule rows;
- 72 official-to-runtime links;
- 32 deferred knockout links;
- source, rating, historical-match, venue, alias, and localization bootstrap;
- first apply and zero-write second apply;
- Auth/admin preservation;
- production denial.

Current authenticated stage smoke result:

- `/admin/real-fixture-publish-queue` loads;
- the prior competition-resolution error is gone;
- no active model version exists;
- no exact fixture is currently eligible for the bounded queue;
- `/predictions` loads and reports no public predictions.

The queue is not a generic view of all 72 matches. It requires eligible scheduled API-Football-linked admin-only fixtures in its bounded future window.

## Next operational slice

`Stage V1 Visible Predictions Slice` should:

1. reconcile all 24 Matchday 3 fixture identities in stage;
2. preserve and import the original immutable V1 model and prediction records;
3. map records by stable provider identity or verified canonical slug;
4. activate the canonical V1 model in stage;
5. verify public and admin projections;
6. rerun and prove zero growth.

Do not recalculate historical V1 probabilities using newer evidence.

## Current-data refresh after V1 visibility

The next repeatable operations should cover:

- not-started fixture linkage and status;
- verified recent results;
- current Elo;
- latest available FIFA ranking;
- group standings, points, goals, and goal difference;
- tournament form and attack/defense summaries;
- source manifests, cutoffs, and hashes;
- signal snapshots for V2 candidates.

The imported source cutoff remains `2026-06-20` until an approved refresh replaces it.

## Automation guardrails

- exact competition and fixture scope;
- explicit stage or production target guard;
- dry-run before apply;
- exact allowlist for production apply;
- idempotent writes;
- immutable prediction versions;
- no post-kickoff prediction generation;
- no silent score correction;
- observable exceptions;
- no broad silent apply;
- no production write from the V2 integration branch without an explicit promotion task.
