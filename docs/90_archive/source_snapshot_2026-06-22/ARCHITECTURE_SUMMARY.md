# Architecture Summary - UFO Predictor

_Last refreshed: Prediction Intelligence v2 Task 3A handoff (2026-06-22)._

## System overview

```text
Public/registered/premium/admin UI
        |
Next.js server routes and protected projections
        |
Supabase Auth + Postgres + RLS
        |
Operational football data + Prediction Intelligence v2 analytical layer
        |
API-Football / FIFA / World Football Elo / official schedule snapshots
```

## Environment separation

```text
ufopredictor.com       -> Railway production  -> production Supabase
stage.ufopredictor.com -> Railway desarrollo  -> Supabase stage
```

Production and stage are separate Auth and database universes. Users, sessions, profiles, and entitlements do not automatically copy between them.

## Existing product architecture

### Auth and access

- Supabase Auth;
- public, registered-free, premium, and admin projection layers;
- entitlements authorize premium access;
- subscriptions/payment rows alone do not reveal protected content;
- admin bypass is explicit and server-side.

### Payments

- Wompi checkout;
- approved webhook validation;
- entitlement activation ledger;
- idempotent grants;
- redirect is informational only.

### Prediction publication

- predictions are immutable historical records;
- new publication creates a new version and predecessor lineage;
- live/finished/kickoff-passed fixtures are frozen;
- public-safe projections stay separate from internal evaluation/review payloads.

## Prediction Intelligence v2 data foundation

Migration:

```text
0038_prediction_intelligence_v2_data_foundation.sql
```

Analytical tables:

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

### Identity rules

Canonical team identity is locale-neutral. Display names live in localization rows.

Historical match identity does not include score. Natural identity is based on date/kickoff, canonical home/away teams, competition bucket, and venue/neutral context. Corrections preserve lineage rather than creating fake new matches.

### Provenance rules

Every imported fact or rating is linked to a source snapshot. Signal snapshots record:

- exact cutoff;
- source snapshot IDs;
- model/feature version;
- missing optional signals;
- reliability metadata.

### Temporal safety

Pre-match features must satisfy:

```text
observed_at < fixture kickoff
```

The current fixture and all later facts are excluded. Same-day earlier facts may be included only when exact timestamps prove they occurred before kickoff.

## Source layer

Primary source families:

- API-Football for operational fixture identity/status/results;
- World Football Elo for current/start-year ratings, results, fixture expectancy;
- FIFA ranking snapshots;
- official FIFA World Cup schedule PDF for match numbers, cities, venues, and kickoff times;
- prepared deterministic source snapshots when live pages are not reliably machine-readable.

Raw source files remain outside runtime. Runtime consumes normalized database rows or deterministic generated artifacts.

## Signal layer

Signal families include:

- structural strength;
- recent form;
- tournament-current form;
- scoring and defensive form;
- conversion deterioration;
- opponent quality;
- Elo over/underperformance;
- venue/neutral context;
- reliability and sample quality;
- source disagreement diagnostics.

Future v3 may promote a continuously updated UFO Effective Strength/ranking with stronger tournament-round weighting. V2 keeps changes bounded.

## Probability engine

Selected development candidate:

```text
v1_plus_high_confidence_signals
```

Architecture:

```text
v1-compatible baseline xG
+ zero-centered reliability-shrunk residuals
+ high-confidence gates
+ movement caps
-> score matrix
-> 1X2 / BTTS / O-U / score distribution
```

The engine is near parity with v1 and must not be described as decisively more accurate.

## Analysis/scenario engine

The analysis layer converts structured features and the score matrix into public-safe explanations.

Featured scenarios are representative families, not arbitrary exact scores:

- principal;
- risk/coverage;
- alternate.

Each stores evidence keys, contradiction keys, reliability, source IDs, and cutoff. Natural-language output should be rendered from locale-aware templates rather than stored as one canonical Spanish paragraph.

## Operational Task 3A/3B flow

```text
refresh current statuses
-> determine not-started release set
-> authorize target
-> plan migration/import/signals/publication/export
-> dry-run
-> stage audit
-> human approval
-> stage write
-> idempotency and RLS validation
-> development review
-> later production promotion
```

Task 3A is implemented. Task 3B stage execution is pending.

## Security boundaries

- no service-role key in web runtime;
- no unqualified production credentials in Task 3B;
- no secrets in artifacts/docs/logs;
- RLS enabled on analytical tables;
- internal-only tables are not public API surfaces;
- production writes fail closed;
- immutable publication rejects started fixtures.
