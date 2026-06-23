# Signal Refresh and Model Operations Runbook

_Last refreshed: 2026-06-23._

## Source families

- API-Football fixtures/results;
- World Football Elo ratings/results/fixtures;
- FIFA rankings;
- official World Cup schedule/venues;
- deterministic prepared snapshots.

## Refresh triggers

- new verified results;
- rating source updates;
- newly published future fixtures;
- alias/link correction;
- model/feature version change;
- source disagreement requiring review.

## Incremental strategy

### Historical facts

- append or correct with lineage;
- score is not part of match identity;
- retain source snapshot and timestamps;
- avoid duplicate natural identity.

### Ratings

- append effective-dated snapshots;
- never overwrite history;
- preserve source and capture time.

### Signals

- derive with exact cutoff;
- record model/feature version;
- record source IDs and missing optional inputs;
- shrink/block weak samples;
- persist idempotently.

## Quality gates

- observed time strictly before kickoff;
- canonical aliases resolve;
- neutral/venue context correct;
- source disagreement surfaced;
- second run creates zero duplicates;
- replay parity maintained;
- immutable prediction publication.

## Current v2 policy

The gated probability candidate remains conservative and near parity. Signal refresh should prioritize evidence quality and explanation reliability rather than force probability movement.

## Operational sequence

```text
refresh sources
-> normalize/link
-> validate cutoff
-> derive signals
-> run candidate/replay diagnostics
-> review
-> persist stage signals
-> publish immutable development version
```
