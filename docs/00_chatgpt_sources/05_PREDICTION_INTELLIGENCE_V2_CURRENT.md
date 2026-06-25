# Prediction Intelligence v2 - Current Source

_Last refreshed: 2026-06-25 after Task 3A completion and final M2-01 implementation checkpoint approval._

## Current status

Prediction Intelligence v2 is actively normalized on:

```text
branch: integration/prediction-intelligence-v2
Draft PR: #114
head: 0db9ac8867eae344e56237ac028cc32255ff1a3d
base: main at e771de3c39c480f05d026075e5e553fb75207468
```

It is not merged and not live in production. M2-01 implementation is complete, but PR #114 remains open and Draft.

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
| `0db9ac8` | Task 3A | Local-only planner and dry-run with explicit execution denial |

Checkpoint verdicts:

```text
TASK2_CHECKPOINT_READY
M2_01_IMPLEMENTATION_CHECKPOINT_READY
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

Task 2 and Task 3A runners:

- require no `.env`;
- use no Supabase client;
- perform no network request;
- use no credential;
- refuse preserved dated artifact directories;
- may write only below their own strict runner-specific `local-run` roots.

`--artifacts-dir` remains allowed only when the resolved path is a strict descendant of the matching runner root. External paths, arbitrary repository paths, sibling runner trees, path traversal, textual-prefix lookalikes, preserved historical directories, and the root itself are rejected.

Task 3A additionally rejects non-empty output targets and produces only inert local planner artifacts. Its historical command, migration, import, signal, publication, and export evidence is explicitly non-authorizing.
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

## Old-branch implementation completion

No useful old-branch implementation remains unported.

Task 3A was normalized from:

```text
historical source: 6967fd6b22a49e23ab9963345f1a1437b1d6b668
integration commit: 0db9ac8
```

It prepares local descriptive plans for:

- target/environment classification;
- migration ordering;
- idempotent import;
- current-cutoff release review;
- signal persistence;
- immutable prediction versions;
- Torneo export compatibility;
- explicit production, stage, and remote execution denial.

The historical `supabase/.gitignore`, `supabase/config.toml`, and final old-branch docs-only commit remain intentionally excluded. The old branch and PR #106 are now preservation/reference only and must not supply new implementation.
## After Task 3A

M2-01 implementation is complete.

The next sequence is:

1. apply the final M2-01 documentation refresh;
2. replace the shared ChatGPT source set with the refreshed exact 10 files;
3. optionally refresh the Draft PR #114 description while keeping it Draft;
4. begin Task 3B with a read-only stage audit;
5. stop for owner approval before any stage synchronization;
6. refresh current Elo, FIFA, results, schedule, standings, and tournament context only after the approved stage foundation is ready;
7. generate current stage candidates and compare them fairly;
8. select a v2.0 release mode only after stage gates.

No current release, publication, migration, or accuracy decision may be inferred from the dated artifacts or from M2-01 completion alone.
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
