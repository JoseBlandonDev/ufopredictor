# Architecture, Data, and Security - UFO Predictor

_Last refreshed: 2026-06-27 after the complete Task 1C V1 stage baseline checkpoint._

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
- public-safe `torneo-ufo-export-v1`.

No stage V2 task authorizes production writes.

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

Excluded as non-semantic:

- `generatedAt`;
- local artifact paths and filenames;
- dry-run/apply mode metadata;
- zero-write report flags.

Still bound and recomputed:

- target stage ref and denied production ref;
- frozen source checksums;
- model, prediction, and market payloads;
- exact stage match UUIDs and provider identities;
- publication actions;
- expected prior state;
- expected mutation counts.

**Decision:** a stored checksum is never trusted without recomputing the semantic projection.

**Problema evitado:** a reviewed plan cannot be invalidated merely because time passed or an artifact path changed, while semantic tampering still fails closed.

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

**Decision:** load this preserved baseline into the real V2 data model before requiring current refreshes.

Each stored source or derived signal must retain:

- source family and identity;
- acquisition or observed time;
- evidence cutoff;
- parser/feature version;
- checksum or explicit non-file-backed treatment;
- missing and reliability metadata;
- fixture/team linkage.

Later current data is appended or versioned incrementally. Historical rows are not overwritten to appear current.

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
- Auth, payments, entitlements, Wompi, webhooks, and sessions are outside V2 data tasks;
- migration presence in Git does not prove remote application.

## Operational debt

Manually installed Task 1C migrations are operational. Formal migration-ledger reconciliation remains a separate, non-blocking maintenance task.

Migration `0039_manual_world_cup_result_reconciliation.sql` is present in the integrated repository. This checkpoint does not assert its remote application state.

## Responsibility split

- ChatGPT owns canonical architecture and decision documentation.
- Codex owns bounded repository implementation, tests, and evidence reports.
- The operator owns approved remote operations, Git, SQL Editor, and release actions.

## Next architecture transition

```text
prepared 2026-06-20 baseline
-> V2 table load with lineage
-> fixture coverage query
-> current-data incremental refresh
-> first shadow V2 candidate
```
