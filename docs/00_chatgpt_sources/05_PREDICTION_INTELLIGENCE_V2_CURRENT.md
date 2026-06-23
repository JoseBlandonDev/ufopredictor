# Prediction Intelligence v2 - Current Source

_Last refreshed: 2026-06-23 after branch and source-workspace recognition._

## Status

Prediction Intelligence v2 is preserved in:

```text
branch: feature/prediction-intelligence-v2-data-foundation
Draft PR: #106
head: eefcff709e80209215b25b90fb870aa5c080d735
```

It is not merged and not live in production.

The branch is now a reference/recovery source, not the recommended base for continued feature development.

## Divergence from production

As of the latest comparison:

- current `main` has 12 commits missing from the old v2 branch;
- the old v2 branch has 9 commits missing from `main`;
- merge base: `1dca9bf91000c089927452941a009117b622103f`.

The nine v2 commits must be audited and ported selectively onto a new integration branch from current `main`.

## Mission

Move UFO from a thin probability/score display toward a durable, explainable football-intelligence system that can answer:

- which team has stronger structural numbers;
- how current form changes the baseline;
- why a draw/upset remains plausible;
- what match scripts support each scenario;
- how reliable the evidence is;
- what the model got right or wrong afterward.

## Stable prepared coverage

- 1,392 historical match facts;
- 3,028 Elo timeline entries;
- 244 Elo teams;
- 211 FIFA ranking rows;
- 104 official World Cup matches;
- 72/72 group-stage links;
- 32 knockout placeholders;
- 16/16 venues;
- 48/48 World Cup runtime teams;
- 36/36 completed product fixtures replay-ready;
- 45 fixture Elo coherence rows;
- 312 canonical aliases;
- 488 localized team-name rows planned;
- 699 rating snapshot rows planned.

Provider linking is strongest for the group stage. Some later knockout placeholders remain unresolved until teams/paths are known.

## Source workspace and committed equivalents

Original external workspace:

```text
D:\Projects\ufo-predictor-source-snapshots\2026-06-20\prepared-v2
```

Its major content groups are:

- contracts;
- normalized snapshots;
- parsing assets;
- references;
- reports;
- source registry/access matrix/manifest.

Committed repo equivalents exist under:

- `data/prediction-engine/national-team-signals/2026-06-19/`;
- `artifacts/prediction-intelligence-v2/`;
- `lib/prediction-intelligence-v2/`;
- `scripts/prediction-intelligence-v2/`;
- migration `0038_prediction_intelligence_v2_data_foundation.sql`;
- `types/database.ts`.

The external workspace must remain retained until stage persistence, checksum/lineage validation, and idempotent reruns prove it can be archived safely.

## Signal families

### Structural

- current/start-year Elo;
- FIFA ranking;
- long-term strength anchor;
- source agreement/disagreement.

### Current

- last 5/10/20 form;
- GF/GA and goal difference;
- scoring/failure-to-score;
- clean sheets, BTTS, totals;
- attack/defense/conversion;
- tournament-current form;
- opponent quality;
- Elo over/underperformance;
- official/friendly and neutral/venue context.

### Reliability

Signals are shrunk or blocked when sample, timestamp, alias confidence, or source coverage is weak.

## Research result

Selected bounded probability candidate:

```text
v1_plus_high_confidence_signals
```

Selected development release candidate:

```text
gated_v2_probability_v2_analysis
```

Exact v1 and gated v2 are near statistical parity. The candidate must not be marketed as a decisive accuracy improvement.

| Metric | Exact v1 | Gated v2 |
|---|---:|---:|
| Multiclass Brier | 0.188394 | 0.188427 |
| Log loss | 0.952495 | 0.951756 |
| Outcome accuracy | 0.611111 | 0.583333 |
| Favorite accuracy | 0.583333 | 0.583333 |
| Total-goals MAE | 1.495881 | 1.497097 |
| Goal-difference MAE | 1.445492 | 1.468792 |

## Strongest v2 gain

The analysis layer is the main product improvement:

- evidence-backed statistical reading;
- current form and opponent quality;
- representative scenario families;
- full score distribution;
- supporting and contradicting evidence;
- provenance and cutoff;
- localization and venue metadata;
- post-match family/path evaluation.

## Scenario contract

Three exact scores are not three guesses.

The product should present:

1. principal scenario;
2. risk/coverage scenario;
3. alternate meaningful route.

Each includes:

- representative exact score and probability;
- family probability;
- required match script;
- supporting/contradicting evidence;
- reliability and source cutoff.

## Completed work on the old branch

Nine v2 commits cover:

- Task 1 / 1.1 / 1.2: data foundation, fixture linking, replay readiness, Elo reconstruction;
- Task 2 / 2.1 / 2.2 / 2.3: challenger research, calibration, gated candidate, release packaging;
- Task 3A: safe dry-run operational layer;
- production-write denial;
- migration/import/signal/publication/export planners;
- focused tests and handoff documentation.

Task 3A is a planning/dry-run milestone, not proof that remote stage writes occurred.

## New integration objective

Before Task 3B remote writes:

1. create `integration/prediction-intelligence-v2` from current `main`;
2. classify all nine old commits by concern;
3. port data/model/migration/test assets selectively;
4. reject stale frontend/docs changes from the old branch;
5. rerun current MVP1 tests/build after each bounded port;
6. reconcile Task 3B scripts with the actual external/committed source workspace;
7. open a replacement Draft PR.

## Pending Task 3B

- read-only remote stage audit;
- human-reviewed migration synchronization;
- migration 0038 in stage;
- idempotent non-sensitive data load;
- signal persistence;
- immutable development prediction versions;
- RLS/public/localization/venue/stage UI validation;
- v1/v2 stage comparison.

## Production release decision later

After stage validation choose between:

- v1 probability + v2 analysis;
- gated v2 probability + v2 analysis.

The choice must be evidence-based, not marketing-driven.

## Later radar, not immediate MVP2 gate

Potential v3-grade inputs include:

- confirmed lineups and major player absences;
- tournament qualification/need context in final group games;
- injuries, suspensions, rotation, and travel/rest;
- tactical/news evidence with timestamp and source reliability;
- market odds only after legal/product review.

These must never leak post-kickoff information into a pre-match version.
