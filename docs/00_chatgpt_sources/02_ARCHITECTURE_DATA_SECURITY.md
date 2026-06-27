# Architecture, Data, and Security - UFO Predictor

_Last refreshed: 2026-06-26 after the Task 1C Matchday 3 fixture-linkage checkpoint._

## System overview

```text
Public / registered / premium / admin UI
        |
Next.js server routes and protected projections
        |
Supabase Auth + Postgres + RLS
        |
Operational fixture/result/publication layer
        |
Prediction/model/evaluation layers
        |
Source snapshots and football intelligence data
        |
API-Football / FIFA / World Football Elo / official schedule sources
```

## Environment separation

```text
production: ufopredictor.com       -> production Supabase gcpdffkgsdomzyoenalg
stage:      stage.ufopredictor.com -> stage Supabase yfmklapgjrupctgxaako
```

Production and stage have separate users, sessions, profiles, roles, entitlements, data, and secrets.

Canonical local stage environment:

```text
.env.stage.local
```

It is the sole active local stage variable file. Task-specific stage env files are not active configuration sources.

Never clone production Auth, payment history, webhook payloads, subscriptions, entitlements, or personal data into stage.

## Existing production architecture

### Authentication and access

- Supabase Auth;
- email/password and supported OAuth flows;
- public, registered-free, premium, and admin projections;
- entitlements authorize paid content;
- admin bypass is explicit and server-side.

### Payments

- canonical Pase Mundial price in USD;
- configured COP conversion for Wompi checkout;
- Wompi payment intent creation;
- validated approved webhook;
- idempotent entitlement grant and activation ledger;
- redirects never grant access by themselves.

### Prediction publication

- published predictions are immutable historical records;
- new publications create version and predecessor lineage;
- started or finished fixtures cannot be silently rewritten;
- public projections remain separate from internal review and evaluation payloads;
- advanced versions carry explicit model, feature, cutoff, purpose, and provenance metadata.

### Fixture registry

```text
npm run ops:world-cup-group-stage-fixture-registry
```

Properties:

- dry-run by default;
- selection by matchday or date range;
- exact allowlist-gated apply;
- canonical/provider reconciliation;
- no result or prediction creation;
- conflict and duplicate reporting;
- idempotent rerun behavior.

### Trusted result refresh

```text
npm run ops:world-cup-result-refresh
```

Properties:

- dry-run by default;
- exact bounded scope;
- allowlist-gated apply;
- stored World Cup fixtures only;
- normal valid API-Football `FT` scores may be verified;
- existing predictions are never mutated;
- evaluation persistence is idempotent;
- exceptions remain visible for reconciliation.

## Partner export architecture

The Torneo Mundialista export is an admin-generated, public-safe JSON projection.

Current contract:

```text
torneo-ufo-export-v1
```

It exposes approved fixture, public URL, kickoff, status, probability, confidence, score, and xG summary fields.

It must not expose internal review payloads, secrets, raw private sources, private evaluations, or proprietary calculation internals.

Future fields should be added compatibly rather than breaking the v1 contract.

## Prediction Intelligence v2 stage foundation

Foundation migration:

```text
0038_prediction_intelligence_v2_data_foundation.sql
```

Current foundation status:

- committed on `integration/prediction-intelligence-v2`;
- structurally tested;
- applied to stage;
- not applied to production;
- prior stage migration history externally verified at 46 entries;
- Task 3B foundation import complete and idempotent.

Task 1C atomic fixture-linkage migration:

```text
20260626220000_task1c_stage_v1_atomic_fixture_linkage_apply.sql
```

It installs:

```text
public.apply_task1c_stage_v1_fixture_linkage(jsonb)
```

RPC properties:

- `security invoker`;
- exactly 24 reviewed rows;
- validates the complete prior state before mutation;
- updates only `matches.external_id` and `matches.intake_source`;
- all 24 updates commit or all roll back;
- execution granted only to `service_role`;
- `public`, `anon`, and `authenticated` execution revoked.

The migration was applied manually through the stage SQL Editor. The function is operational and the 24-row apply was verified. Migration-history repair for version `20260626220000` remains pending and is non-blocking. Do not rerun the migration or linkage apply.

The Task 3B importer remains stage-only, explicit-target, production-denied, checksum-aware, and idempotent.

## Populated stage analytical state

Verified counts:

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

Official knockout rows 73-104 remain reference schedule rows without fabricated runtime participants.

Within the 72 runtime matches, the exact 24 Matchday 3 fixtures are now linked to their approved API-Football IDs:

```text
external_id = api-football:fixture:<id>
intake_source = api_football
```

No provider identity was invented for rows outside the reviewed Task 1C scope.

## Identity and localization rules

- canonical team and player identity is locale-neutral;
- ES/EN/PT labels live outside canonical identity;
- historical match identity does not include score;
- corrections preserve lineage instead of inventing a new match;
- API-Football/product links remain explicit and auditable;
- integrations join by stable IDs, not translated names;
- normalized aliases may collapse equivalent Unicode or punctuation variants while preserving source provenance.

## Prediction version contract

Every advanced prediction version should carry:

- model version;
- feature version;
- calculation timestamp;
- evidence cutoff;
- purpose, including production candidate or `historical_replay`;
- publication status;
- source and provenance references;
- predecessor and supersession relationship.

Finished fixtures may receive fair historical replay versions, but the original V1 publication remains the historical product record.

## Provenance and temporal safety

Every imported fact or rating points to a source snapshot or an explicit non-file-backed sentinel treatment.

Signal snapshots record:

- exact cutoff;
- source snapshot IDs;
- model and feature versions;
- missing optional signals;
- sample and reliability metadata.

Pre-match evidence must satisfy:

```text
observed_at < fixture kickoff
```

No result or later fact may leak into a pre-match prediction or replay.

## Current source families

- API-Football: operational fixture identity, status, final score, and future bounded fixture refresh;
- World Football Elo: ratings, timeline, historical results, and expectancy;
- FIFA ranking snapshots;
- official World Cup schedule and venue data;
- deterministic prepared snapshots when live sources are not reliably machine-readable.

Current imported source cutoff is `2026-06-20`. A repeatable current-data refresh is still required.

## Explanation-first intelligence contract

Model facts should be stored as structured, locale-neutral information. User-facing explanations are rendered separately.

Planned structured concepts include:

- tournament record and points;
- goals for, goals against, and averages;
- ranking and rating position;
- attack and defense profile;
- opponent strength;
- scenario family and representative score anchors;
- supporting and contradicting evidence;
- confidence, reliability, source, and cutoff.

This allows the same facts to be rendered in ES, EN, or PT without recalculating the prediction.

Betting-style markets remain quantitative internals or secondary display fields, not the only explanation layer.

## Future squad and player extension

The architecture must be able to add, without rewriting canonical team and match identity:

- canonical players and tournament squad membership;
- call-up and availability snapshots;
- likely and confirmed lineups;
- injuries, suspensions, doubts, and expected minutes;
- player roles and set-piece responsibility;
- tournament goals, assists, shots, and xG when reliable;
- contribution to team goals and offensive dependency;
- replacement quality and estimated absence impact;
- likely scorer candidates;
- source, observed time, cutoff, and confidence.

These are planned extensions. They are not required for the first V2.0 release.

## Current stage application boundary

Task 3B populated foundation data and Task 1C completed the exact 24-fixture linkage.

Stage still has:

```text
model_versions = 0
active_model_versions = 0
prediction_versions = 0
public_prediction_summaries = 0
```

The next slice reuses the verified 24-match mapping to import and activate the immutable V1 model, 24 V1 prediction versions, and required child records. It does not repeat fixture linkage or generate V2.

## Security boundaries

- no service-role key in frontend or normal web runtime;
- RLS on analytical and protected tables;
- no secrets committed or printed;
- production-write authorization fails closed;
- stage writes require explicit stage identity and production denial;
- `.env.stage.local` is the sole active local stage variable source;
- public views expose only product-safe fields;
- payment webhook validation is server-side;
- started-fixture publication remains immutable;
- broad production apply is forbidden;
- trusted result verification never authorizes prediction mutation;
- a changed verified score becomes a reconciliation event, not a silent overwrite;
- the Task 1C linkage RPC is service-role-only and exact-count atomic;
- a remotely confirmed atomic commit is never repeated merely because a later local verification script failed;
- browser automation may inspect authenticated stage only and must not carry production sessions into the stage workflow.
