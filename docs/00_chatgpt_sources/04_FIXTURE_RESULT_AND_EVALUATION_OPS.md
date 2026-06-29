# Fixture, Result, and Evaluation Operations

_Last refreshed: 2026-06-27 after Task 2A established the exact stage signal baseline, PR #119 was synchronized, and the next V2 operation moved to current fixture/result refresh._

## Operational truth

UFO Predictor has bounded, auditable flows for:

- fixture registration;
- fixture/provider identity linkage;
- trusted result refresh;
- manual result reconciliation;
- immutable prediction publication;
- idempotent evaluation persistence;
- stage V1 baseline publication.

Prediction operations and result operations remain separate. A verified score never authorizes rewriting a published prediction.

## Fixture registry

```text
npm run ops:world-cup-group-stage-fixture-registry
```

Properties:

- dry-run by default;
- exact date or matchday scope;
- exact allowlist for apply;
- canonical and provider reconciliation;
- no prediction creation;
- no result fabrication;
- idempotent rerun;
- conflict reporting instead of silent overwrite.

## Trusted result refresh

```text
npm run ops:world-cup-result-refresh
```

Properties:

- dry-run by default;
- stored World Cup fixtures only;
- API-Football exact identity checks;
- supported terminal `FT` scores only;
- bounded apply;
- idempotent result and evaluation persistence;
- changed verified scores routed to reconciliation;
- prediction versions remain immutable.

## Canonical team aliases

PR #116 added canonical World Cup team-alias handling for result refresh, including known naming variants such as Czech Republic/Czechia and Côte d'Ivoire/Ivory Coast.

**Decision:** fixture/result matching uses canonical identity and explicit aliases, never localized display names alone.

**Problema evitado:** a source naming variant cannot silently create a second team or attach a result to the wrong fixture.

## Manual public-result reconciliation

PR #115 added the repository path for manual public-result reconciliation, including:

```text
supabase/migrations/0039_manual_world_cup_result_reconciliation.sql
```

This migration exists in Git and is part of the integrated branch history.

The migration was applied successfully to both production and stage.

Manual reconciliation is for exact, reviewed exceptions. It is not a replacement for trusted automated refresh and must not mutate predictions.

The admin queue may show a manual form for started fixtures without a result. That form is a fallback. A blank pending-review queue after an automatic apply is expected because trusted API-Football results may be persisted, verified, and evaluated in the apply itself.

## Latest production result checkpoint

A matchday-wide dry-run found:

```text
selected_fixtures = 24
provider_terminal_results = 12
results_created = 3
results_already_identical = 9
results_verified = 12
evaluations_created = 3
evaluations_already_stored = 9
exceptions_or_conflicts = 8
skipped_rows = 4
zero_write_confirmation = true
```

The operator then applied only exact safe allowlists.

First apply:

```text
API-Football IDs = 1489414,1489415,1489417
selected = 3
results_created = 3
results_verified = 3
evaluations_created = 3
exceptions_or_conflicts = 0
evaluation_failures = 0
```

Second apply:

```text
API-Football IDs = 1489403,1489413
selected = 2
results_created = 2
results_verified = 2
evaluations_created = 2
exceptions_or_conflicts = 0
evaluation_failures = 0
```

Publicly verified finals:

```text
Egypt 1-1 Iran
New Zealand 1-5 Belgium
Uruguay 0-1 Spain
Panama 0-1 Croatia
Cape Verde 0-0 Saudi Arabia
```

The exact apply commands are closed and must not be repeated.

The remaining conflict rows from the broad dry-run were intentionally not forced. They require a future exact read only when they become operationally relevant.

## Stage fixture linkage checkpoint

The exact 24 Matchday 3 rows were linked in stage to reviewed API-Football fixture IDs.

```text
requested = 24
updated = 24
verified = 24
production writes = 0
```

RPC:

```text
public.apply_task1c_stage_v1_fixture_linkage(jsonb)
```

**No repetir:** fixture-linkage discovery, migration installation, and 24-row apply are closed unless a concrete mismatch or recovery task is approved.

## Stage V1 publication checkpoint

Stage now contains the immutable V1 comparison baseline:

```text
active models = 1
prediction versions = 24
market rows = 240
narratives = 0
public fixture publications = 24
post-state = exact_complete
```

RPC:

```text
public.apply_task1c_stage_v1_import(jsonb)
```

The importer is atomic, exact-state, service-role-only, and idempotent.

The `/predictions` smoke passed on stage.

## Stage Task 2A signal-baseline checkpoint

Task 2A completed the baseline signal persistence path in stage:

```text
prepared cutoff = 2026-06-20
persisted signal rows = 48
state = exact_complete
verification inserts = 0
verification identical rows = 48
conflicts = 0
unexpected existing rows = 0
runtime fixture coverage = 72/72
candidate-ready fixtures = 0
production writes = 0
```

The operation did not mutate fixtures, results, prediction publications, evaluations, Auth, payments, or entitlements. It generated no V2 candidate.

The 72 covered fixtures remain baseline-ready only. They require incremental current fixture/result, ranking, standings, form, and context refreshes before candidate eligibility.

## Evaluation contract

A persisted evaluation references:

- the original immutable prediction version;
- the exact fixture and verified result;
- evaluation timestamp;
- supported market and scenario outcomes;
- model and feature identity;
- evidence or replay purpose where applicable.

Evaluation may classify:

- 1X2 direction;
- probability quality;
- BTTS and totals;
- exact score and scenario-family behavior;
- margin and surprise severity;
- data limitation, model error, and football variance.

A future V2 `historical_replay` is compared with the original V1 publication and the verified result. It never replaces either.

## Result and publication immutability

- no post-result probability rewrite;
- no post-kickoff evidence in a pre-match version;
- no silent score overwrite;
- no result-based update to xG, confidence, markets, or narratives;
- every replacement prediction receives a new version and cutoff;
- human review is exception-oriented.

## Current operational sequence

For production fixture/result operations:

```text
discover/read
-> exact identity validation
-> one dry-run
-> one exact provider-fixture allowlisted apply
-> one public/admin verification
-> exception reconciliation only when necessary
```

Codex is not required for routine executions of this established runbook.

For the V2 stage track:

```text
Task 2A baseline persistence - complete
-> Task 2B current fixture/result refresh
-> Task 2C rankings, standings, form, and pressure context
-> Task 2D current source-backed signal snapshots
-> shadow candidate or historical replay
-> evaluation
```

## Responsibility split

- Codex implements and tests bounded fixture/result/evaluation code.
- The operator runs approved provider, Supabase, SQL, and Git operations.
- ChatGPT records canonical operational decisions and creates the next bounded handoff.

## No-repeat and escalation rules

Use one preflight, one apply, and one verification.

Repeat only when:

- a concrete source conflict appears;
- a target identity changed;
- an atomic apply returned ambiguous state;
- a reviewed recovery is approved.

A local script or formatting failure after a confirmed remote commit does not authorize another apply. Read the remote state once.

## Next transition

Routine production result operations remain available under the established exact-allowlist protocol.

Primary V2 transition:

```text
Task 2B - Current fixture and result refresh
```

Task 2B must preserve the immutable V1 publications and the exact Task 2A baseline while refreshing only newer or changed fixture/result facts.

Parallel MVP1 checkpoint:

```text
Task 4A, Task 4B, and Task 4C are complete.
No new parallel product task is declared active here.
```
