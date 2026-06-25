# Prediction Intelligence v2 - Current Source

_Last refreshed: 2026-06-24 after Task 1/2 normalization and the accumulated Task 2 checkpoint._

## Current status

Prediction Intelligence v2 is actively normalized on:

```text
branch: integration/prediction-intelligence-v2
Draft PR: #114
head: 1b746f9d038ecfbd49068ecacf8d39c62d4a5fc9
base: main at e771de3c39c480f05d026075e5e553fb75207468
```

It is not merged and not live in production.

The old source remains preserved on:

```text
branch: feature/prediction-intelligence-v2-data-foundation
Draft PR: #106
head: eefcff709e80209215b25b90fb870aa5c080d735
```

The old branch is reference/recovery evidence only. New implementation work belongs on the integration branch.

## Normalization result so far

Completed integration commits:

| Commit | Slice | Meaning |
|---|---|---|
| `76500de` | Task 1 | Data foundation, migration 0038, additive database types, historical artifacts |
| `16fef9b` | Task 1.1 | Replay readiness and coverage reconciliation |
| `f411d60` | Task 1.2 | Historical Elo reconstruction with pre-kickoff resolution |
| `ca5fd01` | Task 2A | Challenger and replay foundation |
| `bf13c21` | Task 2B | Calibration stabilization and candidate-selection correction |
| `1d70412` | Task 2C | Signal gates and candidate eligibility |
| `de083c1` | Task 2D | Historical release-candidate packaging |
| `1b746f9` | Task 2 guard | Strict runner-specific local-run output containment |

Task 2 checkpoint:

```text
TASK2_CHECKPOINT_READY
```

## Mission

Move UFO from a thin probability/score display toward a durable, explainable football-intelligence system that can answer:

- which team has stronger structural numbers;
- how recent and tournament form modify the baseline;
- why a draw or upset remains plausible;
- what representative match scripts support each scenario family;
- what evidence contradicts the favored interpretation;
- how reliable each signal is;
- what the model read correctly or missed afterward.

## Stable prepared coverage

The normalized historical foundation preserves work including:

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
- canonical aliases, localizations, rating snapshots, source manifests, and lineage evidence.

These counts describe the preserved historical workspace. They are not a substitute for the coming current-data refresh.

## Source workspace and committed equivalents

External prepared workspace:

```text
D:\Projects\ufo-predictor-source-snapshots\2026-06-20\prepared-v2
```

Committed equivalents exist under:

- `data/`;
- `artifacts/prediction-intelligence-v2/`;
- `lib/prediction-intelligence-v2/`;
- `scripts/prediction-intelligence-v2/`;
- migration `0038_prediction_intelligence_v2_data_foundation.sql`;
- `types/database.ts`.

Keep the external workspace until stage import, checksums, lineage, and idempotency are proven.

## Task 1 foundation

Task 1 established:

- source snapshot and provenance contracts;
- canonical team aliases and localization records;
- FIFA/Elo/history/schedule/venue prepared data;
- score-independent fixture identity;
- product/provider linking;
- migration 0038 and additive analytical database types;
- historical preservation manifests.

Task 1.1 and Task 1.2 added replay readiness and historical Elo resolution with strict pre-kickoff intent.

## Task 2 research stack

### Task 2A - challenger and replay

- v1-compatible baseline reconstruction;
- challenger prediction generation;
- scenario families and evidence bundles;
- replay and future-shadow artifacts;
- historical promotion-gate evidence.

### Task 2B - calibration stabilization

- corrected candidate selection;
- expanded historical calibration rows;
- explicit row inclusion/exclusion audit;
- neutral-context correction;
- deterministic train/validation/holdout separation;
- scenario-definition and anomaly review.

### Task 2C - gated signals and eligibility

- bounded high-confidence signal activation;
- reliability and contradiction penalties;
- movement caps;
- production-eligible versus diagnostic-only candidate classes;
- blocked time-series validation;
- stored v1 parity audit.

### Task 2D - historical packaging

- stored v1 versus regenerated v1 versus gated-v2 comparison;
- drift classification;
- fixture publication review;
- distinct safe-analysis and gated-probability packages;
- historical Torneo candidate artifacts;
- historical publication plan and release decision.

Task 2D packages evidence only. It does not publish or approve a current release.

## Historical artifact interpretation

Preserved Task 1/2 artifacts are dated research evidence.

Preservation manifests mark, where applicable:

```text
historicalOnly: true
currentCandidateEligible: false
currentReleaseDecisionEligible: false
currentPublicationEligible: false
```

Historical artifacts named `production-candidate-selection`, `release-decision`, `publication-plan`, or similar remain non-current.

## Local-only runner contract

Task 2 runners:

- require no `.env`;
- use no Supabase client;
- perform no network request;
- use no credential;
- refuse preserved dated artifact directories;
- may write only below their own strict runner-specific `local-run` roots.

`--artifacts-dir` remains allowed only when the resolved path is a strict descendant of the matching runner root. External paths, sibling runner trees, path traversal, textual-prefix lookalikes, and the root itself are rejected.

## Model findings preserved from historical research

Initial unrestricted challengers did not beat v1.

Subsequent work corrected:

- neutral-site handling;
- historical windows;
- candidate-selection logic;
- stored/runtime replay parity;
- reliability shrinkage and gates;
- movement caps;
- scenario-family evaluation.

Historical selected bounded probability candidate:

```text
v1_plus_high_confidence_signals
```

Historical development package:

```text
gated_v2_probability_v2_analysis
```

Honest interpretation:

- gated v2 was near parity with exact v1 on the preserved historical sample;
- no material outcome-accuracy advantage was established;
- no current release decision may be inferred from the dated artifacts;
- evidence, provenance, scenarios, reliability, localization, and tournament context remain the main product value under evaluation.

## Remaining old-branch implementation

One code slice remains:

```text
Task 3A
source: 6967fd6b22a49e23ab9963345f1a1437b1d6b668
```

Task 3A is the last useful implementation concern to port from the old branch. It prepares safe plans and dry runs for:

- target authorization;
- migration ordering;
- idempotent import;
- signal persistence;
- immutable prediction versions;
- Torneo export compatibility;
- production-write denial.

It must not apply a migration or write remotely.

## After Task 3A

After Task 3A and its checkpoint:

1. M2-01 normalization can be considered implementation-complete;
2. the old branch remains preserved but no longer supplies new code;
3. Task 3B begins with a read-only stage audit;
4. stage synchronization requires explicit owner approval;
5. current Elo, FIFA, results, schedule, standings, and tournament context must be refreshed;
6. current stage candidates can then be generated and compared fairly;
7. a v2.0 release mode can be selected only after stage gates.

## Release framing

Planned sequence:

```text
Prediction Intelligence v2.0 Tournament Candidate
Prediction Intelligence v2.1 Knockout Context
MVP2 Tournament Release
```

Possible future release modes:

- v1 probabilities + v2 analysis;
- gated v2 probabilities + v2 analysis.

Prediction Intelligence v2 remains Draft research until current-data and stage evidence justify promotion.
