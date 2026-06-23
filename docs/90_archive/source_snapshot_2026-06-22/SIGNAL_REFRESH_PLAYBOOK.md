# Signal Refresh Playbook - UFO Predictor

_Last refreshed: Prediction Intelligence v2 foundation (2026-06-22)._

## Purpose

Maintain current, reproducible football signals without rewriting historical predictions or reprocessing the entire universe after every result.

## Source families

- API-Football: fixture identity/status/results;
- World Football Elo: current/start-year ratings, results, expectancy;
- FIFA ranking snapshots;
- official World Cup schedule/venues;
- normalized prepared snapshots where live extraction is unreliable.

## Refresh triggers

Use bounded operational triggers:

- completed World Cup result batch;
- official FIFA ranking release;
- meaningful Elo snapshot refresh;
- next round/fixture runway;
- source correction.

Do not refresh merely because one result was surprising.

## Incremental strategy

### Historical results

- import new finished matches;
- update only proven corrections;
- preserve source/correction lineage;
- never include score in match identity;
- avoid full-history replacement.

### Ratings

- store dated snapshots;
- current rating is an observation, not an in-place eternal truth;
- use the latest valid pre-kickoff snapshot;
- preserve official effective date and capture date.

### Signals

Recompute only affected teams and dependent fixture analyses where practical.

Affected signals may include:

- recent W/D/L and goals;
- failed-to-score/clean-sheet;
- BTTS/totals;
- conversion trend;
- opponent quality;
- Elo over/underperformance;
- current tournament form;
- UFO effective strength preview;
- sample reliability.

## Strict cutoff

For a fixture at `kickoff_at`:

```text
include evidence only when evidence_timestamp < kickoff_at
```

Exclude:

- current fixture;
- later same-day facts;
- live odds/events;
- final result;
- post-match Elo changes not known before kickoff.

## Snapshot/version requirements

Each persisted signal snapshot records:

- team;
- cutoff;
- feature version;
- source snapshot IDs;
- resolution methods;
- missing optional signals;
- reliability/sample metadata.

## Quality gates

- alias coverage;
- impossible dates;
- duplicate natural identities;
- orientation mismatch;
- source contradiction;
- Elo/FIFA availability;
- provider link coverage;
- stage/competition/neutral context;
- exact timestamp reliability.

## Current v2 policy

The gated candidate permits bounded probability movement only when high-confidence gates activate. Signal refresh does not automatically authorize recalibration or production publication.

## Operational sequence

```text
provider/status refresh
-> normalize new facts/ratings
-> resolve aliases/links
-> determine affected teams
-> rebuild signal snapshots
-> review candidate deltas/scenarios
-> immutable publish only for not-started fixtures
-> export after completeness validation
```

## V3 note

A future v3 may use stronger round-aware tournament weighting and an official UFO strength ranking. That is research, not part of routine refresh.
