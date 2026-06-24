# Prediction Intelligence v2 - Current Source

_Last refreshed: 2026-06-24 after production-continuity closeout and MVP2 scope expansion._

## Status

Prediction Intelligence v2 remains preserved on:

```text
branch: feature/prediction-intelligence-v2-data-foundation
Draft PR: #106
head: eefcff709e80209215b25b90fb870aa5c080d735
```

It is not merged and not live in production.

The branch is a reference/recovery source, not the base for continued feature development.

## Divergence from production

Latest read-only comparison:

- current `main` has 19 commits missing from the old v2 branch;
- the old v2 branch has 9 commits missing from `main`;
- merge base: `1dca9bf91000c089927452941a009117b622103f`.

The nine v2 commits must be audited and ported selectively onto a new integration branch from current `main`.

## Mission

Move UFO from a thin probability/score display toward a durable, explainable football-intelligence system that can answer:

- which team has stronger structural numbers;
- how recent and tournament form change the baseline;
- why a draw or upset remains plausible;
- what match scripts support each scenario;
- what evidence contradicts the favored view;
- how reliable each signal is;
- what the model got right or wrong afterward.

## Release framing

Planned sequence:

```text
Prediction Intelligence v2.0 Tournament Candidate
Prediction Intelligence v2.1 Knockout Context
MVP2 Tournament Release
```

The urgent target is to make v2 useful during the active tournament without sacrificing fair cutoffs, versioning, or production stability.

## Stable prepared coverage

Prepared and committed v2 work includes:

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

Provider linking is strongest for the group stage. Knockout placeholders remain unresolved until teams and paths are known.

## Source workspace and committed equivalents

Original external workspace:

```text
D:\Projects\ufo-predictor-source-snapshots\2026-06-20\prepared-v2
```

Committed equivalents exist under:

- `data/prediction-engine/national-team-signals/2026-06-19/`;
- `artifacts/prediction-intelligence-v2/`;
- `lib/prediction-intelligence-v2/`;
- `scripts/prediction-intelligence-v2/`;
- migration `0038_prediction_intelligence_v2_data_foundation.sql`;
- `types/database.ts`.

Keep the external workspace until stage persistence, checksum/lineage validation, and idempotent reruns prove it can be archived.

## Signal families

### Structural strength

- current and start-year Elo;
- FIFA ranking;
- long-term strength anchor;
- source agreement/disagreement.

### Recent performance

- last 5 and 10 matches;
- goals for/against and goal difference;
- scoring and failure-to-score rates;
- clean sheets, BTTS, and totals;
- attack, defense, and conversion indicators;
- opponent quality;
- Elo over/underperformance.

### Tournament-current context

Immediate MVP2 scope now includes:

- current World Cup form;
- performance in the first group matches;
- group standings;
- qualification/elimination pressure;
- draw/win/loss need scenarios;
- small-sample reliability controls;
- official/friendly and neutral/venue context.

Tournament form is an important current signal, but two matches must not erase the structural baseline.

### Reliability

Signals are shrunk or blocked when sample, timestamp, alias confidence, source coverage, or contextual reliability is weak.

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

The current product gain is the intelligence layer:

- evidence-backed statistical reading;
- recent and tournament form;
- opponent quality;
- representative scenario families;
- full score distribution;
- supporting and contradicting evidence;
- group/qualification context;
- provenance and cutoff;
- reliability and missing-signal disclosure;
- ES/EN/PT-ready structured signal keys;
- post-match family/path evaluation.

## Premium intelligence contract

Premium should expose useful evidence without exposing the proprietary formula.

Recommended sections:

- structural baseline;
- recent form;
- tournament-current form;
- opponent quality;
- expected goals and score distribution;
- principal scenario;
- coverage/risk scenario;
- alternate meaningful scenario;
- supporting evidence;
- contradicting evidence;
- reliability and missing inputs;
- post-match explanation.

Three exact scores are representative scenario anchors, not three independent guesses.

## Prediction version contract

Every advanced prediction version should carry:

- `modelVersion`;
- `featureVersion`;
- `calculatedAt`;
- `cutoffAt`;
- source snapshot IDs;
- signal snapshot IDs;
- purpose;
- publication state;
- predecessor/supersession lineage.

Permitted purposes include:

- production publication;
- development candidate;
- `historical_replay`.

## Historical replay

Finished fixtures may receive fair v2 replay only when:

- every feature respects the original pre-kickoff cutoff;
- no result-derived or post-kickoff evidence leaks in;
- the replay is labeled `historical_replay`;
- the original v1 publication remains unchanged;
- comparison is fixture/version/cutoff aligned.

Replay enables:

```text
original v1
vs fair v2 replay
vs verified result
```

without pretending v2 existed before the match.

## Completed work on the old branch

Nine v2 commits cover:

- Task 1 / 1.1 / 1.2: data foundation, fixture linking, replay readiness, Elo reconstruction;
- Task 2 / 2.1 / 2.2 / 2.3: challenger research, calibration, gated candidate, release packaging;
- Task 3A: safe dry-run operational layer;
- production-write denial;
- migration/import/signal/publication/export planners;
- focused tests and handoff documentation.

Task 3A is planning/dry-run evidence, not proof that remote stage writes occurred.

## Integration objective

Before Task 3B writes:

1. create `integration/prediction-intelligence-v2` from current `main`;
2. classify all nine old commits by concern;
3. port valid data/model/migration/test assets selectively;
4. reject stale frontend/docs/shared-runtime changes;
5. rerun current MVP1 tests, lint, and build after each bounded port;
6. reconcile scripts with the actual source workspace and current schema;
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

## Production release modes

After stage validation, choose:

- v1 probabilities + v2 analysis;
- gated v2 probabilities + v2 analysis.

The decision must be evidence-based.

For not-started fixtures, an approved v2 version may supersede the active public version while preserving v1 history. For finished fixtures, use replay only.

## Internationalization

Core targets:

```text
ES
EN
PT
```

Model outputs should use locale-neutral identifiers and structured signal keys. Narrative rendering is a separate localization layer.

## Later radar, not immediate MVP2 gate

Potential later inputs:

- confirmed lineups and major player absences;
- injuries, suspensions, rotation, rest, and travel;
- player/scorer propositions;
- tactical/news evidence with timestamp and source reliability;
- market odds only after legal/product review;
- French and German localization.

These must never leak post-kickoff information into a pre-match version.
