# Architecture, Data, and Security - UFO Predictor

_Last refreshed: 2026-06-26 after the Prediction Intelligence v2 Task 3B stage bootstrap._

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

Integration migration:

```text
0038_prediction_intelligence_v2_data_foundation.sql
```

Current status:

- committed on `integration/prediction-intelligence-v2`;
- structurally tested;
- applied to stage;
- not applied to production;
- included in an externally verified 46-migration stage chain.

The Task 3B importer is stage-only, explicit-target, production-denied, checksum-aware, and idempotent.

It requires explicit external migration-history attestation because PostgREST does not expose `supabase_migrations` through the current read path.

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

API-Football provider linkage was not invented for rows without a trustworthy provider identity.

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

Task 3B populated foundation data only.

Stage still has:

```text
model_versions = 0
active_model_versions = 0
prediction_versions = 0
public_prediction_summaries = 0
```

The next slice imports the immutable V1 baseline and links current fixture identity before V2 candidate generation.

## Security boundaries

- no service-role key in frontend or normal web runtime;
- RLS on analytical and protected tables;
- no secrets committed or printed;
- production-write authorization fails closed;
- stage writes require explicit stage identity and production denial;
- public views expose only product-safe fields;
- payment webhook validation is server-side;
- started-fixture publication remains immutable;
- broad production apply is forbidden;
- trusted result verification never authorizes prediction mutation;
- a changed verified score becomes a reconciliation event, not a silent overwrite;
- browser automation may inspect authenticated stage only and must not carry production sessions into the stage workflow.
