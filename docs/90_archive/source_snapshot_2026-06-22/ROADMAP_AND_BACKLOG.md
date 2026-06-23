# Roadmap and Backlog - UFO Predictor

_Last refreshed: 2026-06-22._

## Now - Task 3B

### P0 Stage schema/data synchronization

- read-only migration parity audit;
- preserve stage Auth user;
- apply missing migrations and 0038;
- import non-sensitive datasets idempotently;
- validate RLS/counts/links/localizations/venues;
- persist signals;
- create immutable development predictions;
- generate Torneo development export.

### P0 Safety

- production target hard denial;
- no secrets in artifacts/logs;
- reject started fixtures;
- second-run idempotency;
- no overwrite of original versions.

## Next - user-facing Prediction Intelligence v2

### Premium detail

- overall statistical reading;
- main advantage/risk;
- three scenario families;
- exact and family probabilities;
- evidence and contradictions;
- recent form and opponent quality;
- attack/defense/conversion;
- FIFA/Elo;
- sample reliability and source cutoff;
- additional scorelines.

### Access segmentation

- anonymous: teaser and registration CTA;
- registered free: basic 1X2/context;
- premium: full scenarios/evidence;
- admin: diagnostics/provenance/review.

### Localization

- Spanish display names immediately;
- English supported by same data model;
- later Portuguese/other locales;
- structured narrative keys, not one-language stored prose.

### Venue truth

- official known venues/cities displayed;
- no `Por definir` where schedule data exists.

## Production readiness backlog

- stage-to-production migration plan;
- stage smoke across roles;
- payment/entitlement regression;
- public prediction query validation;
- premium projection validation;
- responsive/accessibility pass;
- export contract validation;
- rollback/backup plan.

## Model/data operations backlog

- refresh after completed result batches, not every surprise;
- update only affected teams/signals;
- preserve snapshot lineage;
- maintain fair stored metrics;
- distinguish current prediction from historical replay;
- monitor gate/cap activation and drift.

## Future v3 research

- UFO own strength ranking;
- stronger tournament-round recency;
- overvalued/undervalued detection;
- confederation results learned from evidence, not manual continent bonuses;
- finishing/conversion persistence;
- match-path evaluation;
- market odds with margin removal and timestamped pre/live separation.

## Deferred or separate

- AI provider in Review Gate;
- Real Fixture Lab exact-detail refactor;
- offline service worker;
- broad payment redesign;
- production user-data cloning into stage.
