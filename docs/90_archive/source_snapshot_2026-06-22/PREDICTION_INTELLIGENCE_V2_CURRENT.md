# Prediction Intelligence v2 - Current Technical and Product Source

_Last refreshed: 2026-06-22._

## Mission

Prediction Intelligence v2 moves UFO from a thin probability/score display toward a durable, explainable football-intelligence system.

It must answer:

- which team has stronger numbers;
- how current results modify structural expectations;
- why a draw or upset is plausible;
- what match scripts support each scenario;
- how reliable the evidence is;
- what the model got right or wrong afterward.

## Data foundation

### Sources

- API-Football operational fixtures/results;
- World Football Elo ratings/results/fixtures;
- FIFA men's ranking snapshots;
- official FIFA World Cup schedule/venues;
- deterministic prepared source snapshots.

### Normalization

- canonical locale-neutral teams;
- source aliases;
- Spanish/English localizations;
- score-free match identity;
- correction lineage;
- provider/product links;
- exact source/effective/capture timestamps.

### Stable coverage

- 1,392 historical facts;
- 3,028 Elo timeline entries;
- 244 Elo teams;
- 211 FIFA rows;
- 104 official schedule matches;
- 16 venues;
- 48 World Cup teams;
- 36 replay-ready product fixtures.

## Signal design

### Structural signals

- current Elo/FIFA;
- start-year Elo;
- long-term strength anchor;
- source agreement/disagreement.

### Current signals

- last 5/10/20 form;
- GF/GA and goal difference;
- scoring/failure-to-score;
- clean sheets;
- BTTS and totals;
- attack/defense/conversion;
- tournament-current form;
- opponent quality;
- performance versus Elo expectation;
- official/friendly and venue context.

### Reliability

Signals are shrunk or blocked when samples, timestamps, source coverage, or alias confidence are weak.

## Model research outcome

Initial broad challengers did not outperform v1. Corrections then addressed:

- neutral venue handling;
- larger historical windows;
- candidate-ranking bug;
- stored/runtime parity;
- gated residual logic;
- movement caps;
- scenario-family evaluation.

Selected candidates:

```text
Probability candidate: v1_plus_high_confidence_signals
Release candidate:     gated_v2_probability_v2_analysis
```

### Holdout truth

Exact v1 and gated v2 are effectively near parity. V2 is not a proven accuracy revolution.

The analysis layer is still valuable because it makes the prediction traceable, current, and useful.

## Scenario engine

### Why three exact scores alone are wrong

One exact score is one matrix cell. A favorite's win probability is the sum of many cells. Showing only three cells can make users think the highest one is “the prediction” or that UFO throws three darts.

### Required scenario model

1. **Principal scenario** - most supported match script/family.
2. **Risk/coverage scenario** - principal failure mode with concrete support.
3. **Alternate scenario** - another meaningful route, not automatic underdog theater.

Each scenario includes:

- representative exact score;
- exact probability;
- family probability;
- supporting facts;
- contradicting facts;
- required script;
- reliability;
- source cutoff.

Additional plausible scores reveal the wider distribution.

## Case-study interpretation

### Germany 7-1 Curaçao

Structural direction was correct; extreme total-goal volume was under-modeled.

### Spain 0-0 Cape Verde

Spain remained structurally stronger, but conversion failure and a closed draw family mattered. The result does not mean equal team strength.

### Brazil 1-1 Morocco

A competitive low-scoring draw family was plausible and should be explained through current/form/quality evidence.

### Germany 2-1 Ivory Coast

Germany's narrow-win family materialized after the match stayed 1-1 until late. Path evaluation is more informative than exact-score triumphalism.

### Ecuador 0-0 Curaçao

Ecuador's structural edge remained large; low conversion allowed the draw risk to materialize. One draw does not validate compressed pre-match xG.

## Post-match evaluation

Evaluate:

- exact terminal score;
- 1X2 family;
- winning margin;
- total-goal range;
- BTTS/O-U;
- path state at halftime/80/90;
- late-goal sensitivity;
- surprise severity;
- model error versus variance.

Use honest language. Do not retroactively rewrite or claim mystical accuracy.

## Product access design

- anonymous: teaser;
- registered free: basic probabilities/context;
- premium: full signals/scenarios/evidence;
- admin: provenance, diagnostics, review, publication.

## Internationalization

- canonical identities are not display strings;
- Spanish is required now;
- English uses the same localization/narrative-key architecture;
- future Portuguese requires new locale rows/templates, not schema redesign;
- do not store free-form Spanish as the only canonical explanation.

## Current operational state

- Tasks 1, 1.1, 1.2, 2, 2.1, 2.2, 2.3, and 3A complete;
- Task 3B pending;
- stage Auth works;
- stage schema/data not synchronized;
- production not migrated or published with v2.

## V3 direction

After a larger clean sample:

- stronger World Cup round weighting;
- UFO strength ranking;
- finishing/conversion state;
- over/undervaluation detection;
- path-aware evaluation;
- market odds as timestamped public-safe context, never certainty.
