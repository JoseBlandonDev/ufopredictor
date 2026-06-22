# Data Dictionary - UFO Predictor

_Last refreshed: Prediction Intelligence v2 foundation (2026-06-22)._

## Existing operational entities

### `teams`

Product/runtime team identity used by fixtures and public prediction flows.

### `competitions`, `seasons`, `matches`, `match_results`

Operational competition, season, fixture, and verified-result records. API-Football remains the preferred provider identity for current operational fixtures.

### `predictions` and prediction versions

Immutable pre-match prediction records. A refresh creates a new version with lineage; it does not rewrite history.

### Access/payment entities

- `profiles`;
- `subscriptions`;
- `user_entitlements`;
- `user_match_unlocks`;
- `entitlement_grants`;
- Wompi payment/event tables.

Entitlements authorize protected content.

## Prediction Intelligence v2 entities

### `source_snapshots`

Metadata for one captured source state.

Important fields/concepts:

- provider/source type;
- source URL or external identifier;
- captured/effective timestamps;
- content hash;
- parser/version;
- access mode (`live`, `local_fallback`, `prepared_seed`);
- provenance metadata.

No secret values belong here.

### `canonical_team_aliases`

Maps source-specific names to a canonical locale-neutral team key.

Examples of alias problems:

- Cape Verde / Cabo Verde / Islas de Cabo Verde;
- Ivory Coast / Côte d'Ivoire / Costa de Marfil;
- DR Congo / Congo DR;
- Curaçao / Curacao.

### `canonical_team_localizations`

Localized team display names.

Conceptual key:

```text
canonical_team_key + locale
```

Initial locales:

- `es` required;
- `en` prepared;
- future `pt` and others without changing canonical identities.

### `canonical_team_links`

Links canonical analytical teams to product `teams` and provider identities.

### `team_rating_snapshots`

Dated FIFA/Elo observations.

Typical fields:

- canonical team key;
- rating system;
- rank;
- rating/points;
- observed/effective timestamp;
- source snapshot ID;
- optional movement/trend fields.

### `historical_match_facts`

Durable national-team result facts.

Identity excludes score. Typical dimensions:

- canonical home/away teams;
- kickoff/date;
- competition bucket;
- official/friendly;
- neutral/home/away context;
- goals;
- status;
- source snapshot;
- correction lineage.

### `historical_match_fact_links`

Links analytical history to API-Football/product matches where identity can be proven.

### `schedule_snapshots`

One captured official schedule state.

### `world_cup_venue_catalog`

Canonical stadium/city/country metadata. A confirmed venue should never render as `Por definir`.

### `official_schedule_matches`

Official World Cup match numbers 1-104, kickoff, stage/group, teams/placeholders, city, and venue.

### `official_schedule_match_links`

Links official schedule rows to API-Football/product fixtures.

### `signal_snapshots`

Team feature snapshots at an exact pre-match cutoff.

Conceptual fields:

- team/cutoff;
- feature/model version;
- current Elo/FIFA;
- recent windows;
- attack/defense/conversion;
- opponent quality;
- tournament form;
- venue context;
- reliability/sample flags;
- source snapshot IDs.

## Derived signal definitions

### Recent form

Windowed W/D/L, GF/GA, scoring, clean-sheet, failed-to-score, BTTS, totals, and goal-difference features using only pre-cutoff matches.

### Opponent quality

Average opponent pre-match Elo and performance relative to Elo expectation. Prevents treating a result against a weak opponent as equivalent to the same result against an elite opponent.

### Structural strength

Longer-horizon FIFA/Elo anchor. It must not erase current tournament evidence.

### Tournament-current form

Current World Cup group-stage evidence. V2 uses bounded influence; v3 may increase round-sensitive weight.

### Reliability

A function of sample size, source completeness, exact timestamp availability, alias confidence, and source agreement.

## Public prediction concepts

### 1X2

Home/local, draw, away/visitor probabilities from the full score matrix.

### Exact score probability

Probability of one matrix cell. It is not the same as the probability that a favorite wins.

### Scenario family

A grouped match script represented by one exact score plus a broader family probability. Roles:

- principal;
- risk/coverage;
- alternate.

### Evidence keys

Structured facts used to render explanations. Keep `signals_used` separate from `context_only`.

## Temporal rule

No row observed at or after kickoff may enter a pre-match prediction. Post-match event timelines are evaluation data only.
