# UFO Predictor — Model Notes

Last refreshed: post-E10C / PR #66 real national-team signal enrichment.

## Model status

The active MVP 1 model is best described as:

```text
v0.2-prelaunch with E10C enriched national-team strength inputs
```

E10C changed the **input/snapshot layer**, not the final expected-goals or scoreline calibration. This distinction matters, because otherwise someone will ask why one merged PR did not magically make the universe deterministic. Again.

## Historical model context

### v0.1

Historical baseline. Useful for context only.

### v0.2-prelaunch

MVP 1 prelaunch model family. It powered the initial World Cup public fixture path after Real Fixture Lab validation and fallback signal improvements.

### E10C enriched snapshot layer

Current model input enhancement.

Delivered in PR #66:

- 48 canonical World Cup team signal coverage;
- FIFA ranking and points;
- Elo ranking and rating;
- historical Elo match stats;
- historical goals for/against;
- recent-form fields;
- neutral placeholders for market and lineup context.

## Current signal fields

Representative fields now available through the national-team snapshot layer:

| Field | Meaning | Status |
|---|---|---:|
| `fifaRank` | FIFA ranking position | active |
| `fifaPoints` | FIFA ranking points | active |
| `eloRank` | Elo ranking position | active |
| `eloRating` | Elo rating | active |
| `historicalGoalsForPerMatch` | historical attacking proxy | active |
| `historicalGoalsAgainstPerMatch` | historical defensive proxy | active |
| `recentMatchCount` | number of recent matches used | active |
| `recentFormScore` | derived recent-form signal | active |
| `marketScore` | market/odds placeholder | neutral `50` |
| `lineupContextScore` | lineup/injury placeholder | neutral `50` |

## How E10C should be interpreted

E10C gives the prediction engine better team-strength context.

It does **not** mean:

- scorelines are fully calibrated;
- expected goals are final;
- market context exists;
- lineups/injuries exist;
- model accuracy can be claimed from a tiny World Cup sample.

It does mean:

- the 48 World Cup teams no longer depend on thin fallback-only inputs;
- calibration can now be done on a more credible base;
- tests can assert real signal coverage.

## Current scoreline limitation

The model has tended to overproduce conservative outcomes such as `1-1`.

Potential causes to inspect in E10D:

- expected-goals compression;
- draw probability too strong;
- attack/defense differentials not moving xG enough;
- recent-form fields present but not weighted strongly enough;
- modal-score mapping too conservative.

Do not “fix” this by hardcoding examples or overfitting to one live result. If the model starts chasing today’s match like a golden retriever chasing a laser pointer, we have failed.

## E10D target

E10D should calibrate:

- xG baseline;
- home/neutral/host context effects;
- strength differential effects;
- attack/defense scaling;
- recent-form scaling;
- draw/modal-score distribution;
- scoreline tests for mismatches vs balanced matches.

Non-goals for E10D unless explicitly added:

- UI changes;
- publication flow changes;
- API-Football ingest changes;
- Supabase migrations;
- odds/provider prediction input;
- public exposure of internal evaluation.

## Market and lineup signals

Current placeholders:

```text
marketScore = 50
lineupContextScore = 50
```

Future market signal must be explicitly decided. Default is no betting odds or provider predictions as hidden model input.

Future lineup signal could be manual/admin/editorial or sourced from structured availability data, but should include provenance.

## Source/provenance posture

The E10C pack was generated from reviewed local data sources and committed as a static source module.

Runtime must use:

```text
lib/prediction-engine/national-team-strength-signal-pack.ts
```

Runtime must not use:

```text
codex-inputs/
raw HTML
raw CSV
local scratch JSON
```

## Model communication rules

Public copy should frame predictions as:

- probabilistic;
- data-driven;
- uncertain;
- non-betting;
- no guarantees.

Do not claim:

- guaranteed winners;
- betting edge;
- insider certainty;
- provider-derived authority.
