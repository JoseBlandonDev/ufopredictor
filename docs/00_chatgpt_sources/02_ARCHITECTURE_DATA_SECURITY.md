# Architecture, Data, and Security - UFO Predictor

_Last refreshed: 2026-06-27 after the Task 2A stage signal-baseline load reached `exact_complete`, PR #119 was merged, and `main` was synchronized into the V2 integration branch at `4f758b2`._

## System overview

```text
Public / registered / premium / admin UI
        |
Next.js server routes and protected projections
        |
Supabase Auth + Postgres + RLS
        |
Fixture, result, publication, and evaluation operations
        |
Immutable V1 baseline + shadow V2 versions
        |
Prediction Intelligence tables and source snapshots
        |
API-Football / FIFA / World Football Elo / official schedule sources
```

## Environment separation

```text
production: ufopredictor.com       -> gcpdffkgsdomzyoenalg
stage:      stage.ufopredictor.com -> yfmklapgjrupctgxaako
```

Canonical local stage environment:

```text
.env.stage.local
```

Production and stage have separate Auth, users, sessions, profiles, roles, entitlements, data, and secrets.

Never copy production Auth, payment history, webhook payloads, subscriptions, entitlements, sessions, or personal data into stage.

**Decision:** V2 is built in the existing stage application and database, not in another parallel product or a third environment.

**Motivo:** comparison must happen against the real V1-compatible product surface and the same normalized fixture identities.

## Production architecture that remains authoritative

Production continues to provide:

- Supabase Auth and role-aware projections;
- Wompi checkout and approved-webhook entitlement activation;
- immutable prediction publications;
- exact fixture registration;
- trusted result refresh and verification;
- idempotent evaluations;
- admin operational queues;
- public-safe `torneo-ufo-export-v1`;
- a deterministic public presentation helper for `Lectura UFO` that consumes only viewer-authorized V1 fields.

No stage V2 task authorizes production writes.

## Public presentation architecture checkpoint

PR #117 added a deterministic presentation-only helper:

```text
lib/presentation/public-expert-read.ts
```

The helper contract is intentionally narrower than the prediction contract.

Anonymous base input:

```text
home team name
away team name
home win probability
draw probability
away win probability
```

Optional registered/premium augmentation:

```text
confidence score
risk level
```

The optional augmentation is rendered only where those values are already authorized and visible.

PR #119 added football-first premium terminology on existing product surfaces. It changes labels and explanatory copy only; it does not change stored values, projections, or authorization.

The helper:

- does not query premium markets;
- does not read xG or scorelines for anonymous/free interpretation;
- does not change persisted probabilities;
- does not change entitlement resolution;
- does not create a new model version;
- is shared by prediction cards and public match detail;
- is now present in both `main` and the V2 integration branch.

## Prediction Intelligence stage foundation

Foundation migration:

```text
0038_prediction_intelligence_v2_data_foundation.sql
```

Verified state:

- applied to stage;
- not promoted to production by this track;
- foundation import complete;
- second bootstrap apply produced zero inserts and zero updates;
- stage Auth/admin preserved.

Populated foundation counts:

| Table | Count |
|---|---:|
| `competitions` | 1 |
| `seasons` | 1 |
| `teams` | 48 |
| `venues` | 16 |
| `matches` | 72 |
| `source_snapshots` | 8 |
| `canonical_team_aliases` | 309 |
| `canonical_team_localizations` | 488 |
| `canonical_team_links` | 48 |
| `team_rating_snapshots` | 699 |
| `historical_match_facts` | 1,392 |
| `schedule_snapshots` | 1 |
| `world_cup_venue_catalog` | 16 |
| `official_schedule_matches` | 104 |
| `official_schedule_match_links` | 72 |

## Task 2A V2 signal baseline in stage

Task 2A persisted the prepared `2026-06-20` team-signal baseline into the real stage table.

Verified state:

```text
signal rows = 48
state = exact_complete
manifest status = verified
blockers = 0
conflicts = 0
verification inserts = 0
verification identical rows = 48
unexpected existing rows = 0
runtime fixtures = 72
baseline-ready fixtures = 72
candidate-ready fixtures = 0
production writes = 0
```

Each row retains canonical team identity, signal version, cutoff, source-snapshot lineage, persisted missing/optional-signal metadata, contradiction flags, sample sizes, and reliability metadata.

Task 2A generated no prediction candidate, changed no result, and touched no Auth, payment, entitlement, webhook, session, or personal-data scope.

**No repetir:** do not rerun the Task 2A dry-run, reviewed apply, or verification without a concrete recovery requirement.

## V1 baseline architecture in stage

The exact 24 Matchday 3 fixtures are linked by stable provider identity:

```text
external_id = api-football:fixture:<id>
intake_source = api_football
```

The immutable V1 baseline now contains:

```text
1 active model version
24 prediction versions
240 prediction-market rows
0 narratives
24 public fixtures
```

The original V1 probabilities, xG, confidence, risk, market probabilities, timestamps, and source identity were preserved rather than recomputed.

**Decision:** stage primary and foreign keys are stage-native. Production UUIDs may appear only as evidence references, never as copied stage relationships.

## Atomic Task 1C RPCs

Fixture linkage migration:

```text
20260626220000_task1c_stage_v1_atomic_fixture_linkage_apply.sql
```

RPC:

```text
public.apply_task1c_stage_v1_fixture_linkage(jsonb)
```

V1 import migration:

```text
20260626233000_task1c_stage_v1_import_apply.sql
```

RPC:

```text
public.apply_task1c_stage_v1_import(jsonb)
```

Shared properties:

- stage-only use;
- `security invoker`;
- service-role execution only;
- public, anonymous, and authenticated execution revoked;
- complete prior-state validation before mutation;
- single PostgreSQL transaction;
- advisory transaction lock where required;
- no upsert or partial-repair path;
- all-or-nothing rollback.

## Import state machine

The V1 importer recognizes only:

```text
fresh
exact_complete
partial_or_conflicting
```

Behavior:

- `fresh`: insert the exact reviewed baseline;
- `exact_complete`: zero writes;
- `partial_or_conflicting`: block and report.

There is no automatic repair, overwrite, or order-dependent duplicate selection.

## Reviewed-plan authorization contract

The stable plan checksum uses a canonical semantic projection.

Excluded as execution-only or report-only:

- `generatedAt` and other run timestamps;
- local artifact paths and filenames;
- dry-run/apply/verification mode metadata;
- coverage artifact paths;
- zero-write reporting flags such as `summary.zeroWriteConfirmation`.

Still bound and independently recomputed:

- target stage ref and denied production ref;
- source manifests, registries, and authoritative checksums;
- model/signal version and cutoff instant;
- canonical team and source-snapshot identities;
- all persisted row payloads, including missing and reliability metadata;
- row actions and idempotency identities;
- expected prior state;
- expected insert, identical, conflict, and unexpected-existing counts;
- blockers and conflicts.

A stored checksum is never trusted without recomputing the reviewed artifact and current semantic projections independently.

Persisted timestamp equality is semantic, not formatting-based. Equivalent encodings such as:

```text
2026-06-21T00:00:00Z
2026-06-21T00:00:00+00:00
```

represent the same instant and compare equal. Invalid timestamps fail closed, and a genuinely different instant remains a conflict. The cutoff is canonicalized, not omitted.

## TypeScript-to-SQL JSON contract

RPC publication payload keys use snake_case:

```text
match_id
current_access_scope
next_access_scope
```

The SQL validates required keys, nulls, duplicates, unknown IDs, exact fixture set, and allowed access-scope transitions before any real-table mutation.

Legacy camelCase reviewed artifacts may be normalized only through the approved compatibility path; outbound RPC payloads use the canonical snake_case contract.

**No repetir:** do not introduce untested JSON key drift between TypeScript and PL/pgSQL.

## V1 and V2 version architecture

V1 remains the immutable published predecessor.

V2 versions must carry:

- model version;
- feature version;
- calculation time;
- evidence cutoff;
- purpose, including live candidate or `historical_replay`;
- source and signal snapshot references;
- predecessor lineage;
- publication/release state.

For completed fixtures, V2 uses labeled `historical_replay` and never replaces the original V1 publication.

For future fixtures, V2 runs in shadow until an explicit release decision.

## Baseline-first source architecture

Prepared workspace cutoff:

```text
2026-06-20
```

The preserved package is now loaded as the first real V2 signal baseline in stage.

Each stored row retains:

- source family and identity;
- source snapshot references and checksums;
- acquisition or observed time where available;
- evidence cutoff;
- signal/feature version;
- canonical team linkage;
- missing, contradiction, sample-size, and reliability metadata.

Root package-manifest and source-registry files verify against authoritative root hashes and are not required to contain self-entries. Every non-root required file must remain present in the manifest contract with an exact matching hash.

Later current data is appended or versioned incrementally. Historical rows are not overwritten to appear current.

**Decision:** Task 2A closes baseline persistence. Task 2B begins current fixture/result refresh without rebuilding the foundation.

## Temporal safety

Pre-match evidence must satisfy:

```text
observed_at < fixture kickoff
```

No result, later lineup, later injury, or later table state may leak into a live candidate or historical replay.

## Security boundaries

- no service-role key in frontend or ordinary web runtime;
- RLS remains authoritative for protected analytical tables;
- public views expose only product-safe fields;
- secrets are never committed or printed;
- stage writes require exact target and explicit production denial;
- production apply fails closed;
- started-fixture publications remain immutable;
- changed verified results become reconciliation events, not silent overwrites;
- trusted result applies use exact provider fixture allowlists and are verified publicly after the write;
- Auth, payments, entitlements, Wompi, webhooks, and sessions are outside V2 data tasks;
- migration presence in Git does not prove remote application.

## Operational debt

Manually installed Task 1C migrations are operational. Formal migration-ledger reconciliation remains a separate, non-blocking maintenance task.

Migration `0039_manual_world_cup_result_reconciliation.sql` is present in the integrated repository and was applied successfully to both production and stage. It remains an admin-only exception path; ordinary trusted API-Football results use exact allowlisted refresh and automatic verification.

## Responsibility split

- ChatGPT owns canonical architecture and decision documentation.
- Codex owns bounded repository implementation, tests, and evidence reports.
- The operator owns approved remote operations, Git, SQL Editor, and release actions.

## Next architecture transition

```text
completed 2026-06-20 signal baseline (48 rows, exact_complete)
-> Task 2B current fixture/result refresh
-> Task 2C current Elo, FIFA ranking, standings, form, and pressure context
-> Task 2D repeatable current signal snapshots
-> first unpublished V2 shadow candidate
```
