# Signal Refresh and Model Operations Runbook

_Last refreshed: 2026-06-24._

## Canonical current-model sources

Read current candidate, release, and calibration truth from:

```text
docs/00_chatgpt_sources/05_PREDICTION_INTELLIGENCE_V2_CURRENT.md
docs/00_chatgpt_sources/08_MODEL_HISTORY_CALIBRATION.md
```

This runbook owns stable procedure, not the current performance claim or roadmap status.

## Source families

- API-Football fixtures/results;
- World Football Elo ratings/results/fixtures;
- FIFA rankings;
- official World Cup schedule/venues;
- deterministic prepared snapshots;
- current tournament standings and pre-kickoff qualification context.

## Refresh triggers

- new trusted verified results;
- rating source updates;
- newly published future fixtures;
- alias/link correction;
- group-table or qualification-state change before cutoff;
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

### Tournament context

- capture standings and need-state at an explicit timestamp;
- compute only from information available before kickoff;
- shrink small tournament samples;
- do not replace structural strength with two-match noise.

### Signals

- derive with exact cutoff;
- record model/feature version;
- record source IDs and missing optional inputs;
- record reliability/sample metadata;
- shrink or block weak signals;
- persist idempotently.

## Quality gates

- observed time strictly before kickoff;
- canonical aliases resolve;
- neutral/venue context correct;
- source disagreement surfaced;
- group/qualification context reflects the pre-kickoff table;
- second run creates zero duplicates;
- replay parity maintained;
- immutable prediction publication.

## Operational sequence

```text
refresh sources
-> normalize/link
-> capture pre-kickoff tournament context
-> validate cutoff
-> derive signals
-> run candidate/replay diagnostics
-> review
-> persist stage signals
-> publish immutable development version
```

## Versioning

Every output records:

- model version;
- feature version;
- calculated timestamp;
- cutoff;
- source/signal snapshots;
- purpose;
- predecessor lineage.

Finished-fixture comparison uses `historical_replay` and never replaces the original publication.

## Release discipline

Do not force probability movement merely to make v2 look different.

Prioritize:

- evidence quality;
- reliability;
- scenario coherence;
- tournament-context usefulness;
- explanation quality;
- regression safety.
