# Prediction Intelligence v2 - Current Source

_Last refreshed: 2026-06-23._

## Status

Prediction Intelligence v2 is isolated in:

```text
branch: feature/prediction-intelligence-v2-data-foundation
Draft PR: #106
head: eefcff709e80209215b25b90fb870aa5c080d735
```

It is not merged and not live in production.

## Mission

Move UFO from a thin probability/score display toward a durable, explainable football-intelligence system that can answer:

- which team has stronger structural numbers;
- how current form changes the baseline;
- why a draw/upset remains plausible;
- what match scripts support each scenario;
- how reliable the evidence is;
- what the model got right or wrong afterward.

## Stable data coverage

- 1,392 historical match facts;
- 3,028 Elo timeline entries;
- 244 Elo teams;
- 211 FIFA ranking rows;
- 104 official World Cup matches;
- 72/72 group-stage links;
- 32 knockout placeholders;
- 16/16 venues;
- 48/48 World Cup runtime teams;
- 36/36 completed product fixtures replay-ready.

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

## Model research result

Selected bounded probability candidate:

```text
v1_plus_high_confidence_signals
```

Selected development release candidate:

```text
gated_v2_probability_v2_analysis
```

Holdout result: exact v1 and gated v2 are near statistical parity. The candidate must not be marketed as a decisive accuracy improvement.

Representative Task 2.2 comparison:

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

## Completed work

- Task 1 / 1.1 / 1.2: data foundation and replay readiness;
- Task 2 / 2.1 / 2.2 / 2.3: challenger research and release planning;
- Task 3A: safe dry-run operational layer;
- production-write denial;
- migration/import/signal/publication/export planners;
- focused tests and handoff documentation.

## Pending work

Task 3B remains pending:

- read-only remote stage audit;
- human-reviewed migration synchronization;
- migration 0038 in stage;
- idempotent non-sensitive data load;
- signal persistence;
- immutable development prediction versions;
- RLS/public/localization/venue/stage UI validation.

## Production release decision later

After stage validation choose between:

- v1 probability + v2 analysis;
- gated v2 probability + v2 analysis.

The choice must be evidence-based, not marketing-driven.
