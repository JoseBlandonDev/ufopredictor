# Architecture, Data, and Security - UFO Predictor

_Last refreshed: 2026-06-23._

## System overview

```text
Public / registered / premium / admin UI
        |
Next.js server routes and protected projections
        |
Supabase Auth + Postgres + RLS
        |
Operational football data + analytical/model layers
        |
API-Football / FIFA / World Football Elo / official schedule snapshots
```

## Environment separation

```text
production: ufopredictor.com       -> production Supabase
stage:      stage.ufopredictor.com -> separate Supabase stage
```

Production and stage have separate users, sessions, profiles, roles, entitlements, data, and secrets. Do not clone production Auth or payment history into stage.

## Existing production architecture

### Authentication and access

- Supabase Auth;
- email/password and supported OAuth flows;
- public, registered-free, premium, and admin projections;
- entitlements authorize paid content;
- admin bypass is explicit and server-side.

### Payments

- canonical Pase Mundial price in USD;
- server converts to configured COP checkout amount;
- Wompi payment intent creation;
- validated approved webhook;
- idempotent entitlement grant and activation ledger;
- redirects never grant access by themselves.

### Prediction publication

- published predictions are immutable historical records;
- new publications create version/predecessor lineage;
- started or finished fixtures cannot be silently rewritten;
- public projections remain separate from internal review/evaluation payloads.

## Operational entities

Core production entities include:

- teams;
- competitions and seasons;
- matches and match results;
- predictions and prediction versions;
- public prediction projections;
- payment intents/events;
- products/pricing;
- entitlements and activation/revocation records;
- saved matches/watchlist;
- internal evaluations.

## Prediction Intelligence v2 foundation

Planned migration:

```text
0038_prediction_intelligence_v2_data_foundation.sql
```

Analytical entities include:

- `source_snapshots`;
- `canonical_team_aliases`;
- `canonical_team_localizations`;
- `canonical_team_links`;
- `team_rating_snapshots`;
- `historical_match_facts`;
- `historical_match_fact_links`;
- `schedule_snapshots`;
- `world_cup_venue_catalog`;
- `official_schedule_matches`;
- `official_schedule_match_links`;
- `signal_snapshots`.

## Identity rules

- canonical team identity is locale-neutral;
- Spanish/English names live in localization rows;
- historical match identity does not include score;
- corrections preserve lineage instead of inventing a new match;
- API-Football/product links remain explicit and auditable.

## Provenance and temporal safety

Every imported fact or rating must point to a source snapshot.

Signal snapshots record:

- exact cutoff;
- source snapshot IDs;
- model and feature versions;
- missing optional signals;
- sample/reliability metadata.

Pre-match evidence must satisfy:

```text
observed_at < fixture kickoff
```

No result or later fact may leak into a pre-match prediction.

## Source families

- API-Football: operational fixture identity, status, and final score;
- World Football Elo: ratings, timeline, historical results, expectancy;
- FIFA ranking snapshots;
- official World Cup schedule/venue data;
- deterministic prepared source snapshots when live pages are not reliably machine-readable.

## Security boundaries

- no service-role key in frontend or normal web runtime;
- RLS on analytical and protected tables;
- no secrets committed or printed;
- production-write authorization fails closed;
- Task 3B accepts only explicit stage credentials;
- public views expose only product-safe fields;
- payment webhook validation is server-side;
- started-fixture publication remains immutable.
