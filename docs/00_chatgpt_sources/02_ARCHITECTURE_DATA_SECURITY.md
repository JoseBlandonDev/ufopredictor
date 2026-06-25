# Architecture, Data, and Security - UFO Predictor

_Last refreshed: 2026-06-24 after Prediction Intelligence v2 Task 2 normalization._

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
API-Football / FIFA / World Football Elo / official schedule snapshots
```

## Environment separation

```text
production: ufopredictor.com       -> production Supabase
stage:      stage.ufopredictor.com -> separate Supabase stage
```

Production and stage have separate users, sessions, profiles, roles, entitlements, data, and secrets.

Do not clone production Auth, payment history, webhook payloads, or entitlements into stage.

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
- public projections remain separate from internal review/evaluation payloads;
- future v2 publications must include explicit model, feature, cutoff, and purpose metadata.

### Fixture registry

PR #111 added a bounded World Cup group-stage registry flow:

```text
npm run ops:world-cup-group-stage-fixture-registry
```

Properties:

- dry-run by default;
- selection by matchday/date range;
- exact allowlist-gated apply;
- canonical/provider reconciliation;
- no result or prediction creation;
- conflict/duplicate reporting;
- idempotent rerun behavior.

### Trusted result refresh

PR #112 added:

```text
npm run ops:world-cup-result-refresh
```

Properties:

- dry-run by default;
- bounded by match IDs, external IDs, provider fixture IDs, manifest, date, or matchday;
- apply requires an exact allowlist;
- operates only on stored World Cup fixtures;
- normal valid API-Football `FT` scores may be auto-verified;
- existing predictions are never mutated;
- evaluation persistence is idempotent;
- exceptions remain visible for reconciliation.

Current schema limitations:

- no dedicated `verification_method` column;
- no dedicated provider-response timestamp column on `match_results`;
- trusted-provider provenance is stored in `source_note`;
- `reviewed_at` is used as the verification timestamp;
- unsupported states such as abandoned/suspended remain exception paths rather than lossy status writes.

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

## Partner export architecture

The Torneo Mundialista export is an admin-generated, public-safe JSON projection.

Current contract:

```text
torneo-ufo-export-v1
```

The projection exposes only approved fields such as:

- stable fixture/provider identity;
- public URL;
- kickoff/stage/status;
- 1X2 probabilities;
- confidence/risk;
- score/xG summaries;
- display guidance.

It must not expose internal review payloads, secrets, raw sources, private evaluations, or proprietary calculation internals.

Future prediction version fields should be added compatibly rather than breaking the v1 contract.

## Prediction Intelligence v2 foundation

Integration migration:

```text
0038_prediction_intelligence_v2_data_foundation.sql
```

Current status:

- committed on `integration/prediction-intelligence-v2`;
- structurally tested;
- not applied to stage;
- not applied to production;
- remote apply remains blocked until Task 3A planning and a read-only stage audit are complete.

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

## Identity and localization rules

- canonical team identity is locale-neutral;
- ES/EN/PT labels live outside canonical identity;
- historical match identity does not include score;
- corrections preserve lineage instead of inventing a new match;
- API-Football/product links remain explicit and auditable;
- partner integrations join by stable IDs, not translated names.

## Prediction version contract

Every future advanced prediction version should carry:

- model version;
- feature version;
- calculation timestamp;
- evidence cutoff;
- purpose, such as production candidate or `historical_replay`;
- publication status;
- source/provenance references;
- predecessor/supersession relationship.

Finished fixtures may receive fair historical replay versions, but the original publication remains the historical product record.

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

No result or later fact may leak into a pre-match prediction or replay.

## Source families

- API-Football: operational fixture identity, status, and final score;
- World Football Elo: ratings, timeline, historical results, expectancy;
- FIFA ranking snapshots;
- official World Cup schedule/venue data;
- deterministic prepared snapshots when live sources are not reliably machine-readable.

## Integrated local research pipeline

The normalized integration branch now contains:

- Task 1 data contracts, parsers, manifests, and preservation evidence;
- Task 1.1 replay readiness;
- Task 1.2 historical Elo reconstruction;
- Task 2 challenger, calibration, gates, candidate eligibility, and historical packaging;
- local-only runners and focused tests.

Historical Task 1/2 artifacts are not current database seed authority by themselves. Current stage import requires Task 3A planning, read-only schema audit, explicit approval, provenance checks, and idempotency proof.

Task 2 runners enforce runner-specific output containment under strict descendants of their own `local-run` roots. Arbitrary repository paths, external absolute paths, sibling runner trees, traversal outside the allowed root, and preserved historical directories are rejected.

## Task 3 boundary

Task 3A is planner/dry-run only. It may prepare migration, import, signal-persistence, immutable-publication, and partner-export plans, but may not perform remote writes.

Task 3B begins with a read-only audit of the existing Supabase stage environment. Any authorized stage synchronization is a later owner-approved phase.

## Security boundaries

- no service-role key in frontend or normal web runtime;
- RLS on analytical and protected tables;
- no secrets committed or printed;
- production-write authorization fails closed;
- Task 3B accepts only explicit stage credentials;
- public views expose only product-safe fields;
- payment webhook validation is server-side;
- started-fixture publication remains immutable;
- broad production apply is forbidden;
- trusted auto-verification never authorizes prediction mutation;
- a changed previously verified score must become a reconciliation event, not a silent overwrite.
