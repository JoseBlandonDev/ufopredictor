# Prediction Intelligence v2 - Current Source

_Last refreshed: 2026-06-26 after the Task 1C Matchday 3 fixture-linkage checkpoint._

## Current status

Prediction Intelligence v2 is active on:

```text
branch: integration/prediction-intelligence-v2
Draft PR: #114
reviewed checkpoint HEAD: dba63d8cc3d6d9235295abb4fe8834db44caf519
production base: main at e771de3c39c480f05d026075e5e553fb75207468
```

Verify the actual current HEAD and worktree before implementation.

Prediction Intelligence v2 is not merged and not live in production.

Historical source remains preserved on:

```text
branch: feature/prediction-intelligence-v2-data-foundation
Draft PR: #106
head: eefcff709e80209215b25b90fb870aa5c080d735
```

The old branch is recovery and research evidence only.

## Completed integration foundation

The normalized integration branch includes:

- Task 1 data foundation and migration 0038;
- Task 1.1 replay readiness;
- Task 1.2 historical Elo reconstruction;
- Task 2 challenger and replay research;
- Task 2 calibration stabilization;
- Task 2 signal gates and candidate eligibility;
- Task 2 historical release packaging;
- Task 2 local-run output safety;
- Task 3A local planner, target guard, and dry-run contracts;
- Task 3B stage bootstrap importer, tests, apply evidence, and idempotency proof;
- Task 1C atomic Matchday 3 fixture-linkage implementation and verified stage apply.

No useful implementation remains to be ported from the old branch.

## Mission

Move UFO from a thin probability and score display toward a durable, explainable football-intelligence system that can answer:

- which team has stronger structural numbers;
- how recent and tournament form modify the baseline;
- why a draw or upset remains plausible;
- what match scripts support each scenario family;
- what evidence contradicts the favored interpretation;
- how reliable and current each signal is;
- what the model read correctly or missed afterward.

## Historical research foundation

The prepared historical workspace preserves:

- historical match facts;
- Elo timelines and historical Elo resolution;
- FIFA ranking rows;
- official World Cup schedule and venue references;
- canonical aliases and localizations;
- product and provider links;
- scenario, evidence, calibration, and release-research artifacts.

Historical artifacts remain non-current unless an explicit current-data task refreshes and approves them.

## Stage foundation and fixture-linkage result

Target:

```text
stage project: yfmklapgjrupctgxaako
production deny project: gcpdffkgsdomzyoenalg
canonical local stage env: .env.stage.local
```

Task 3B migration state:

- prior stage migration history externally verified at 46 entries;
- migration 0038 applied in stage;
- migration 0038 not applied in production;
- Task 3B importer did not modify migration history.

Verified destination counts:

| Table | Count |
|---|---:|
| competitions | 1 |
| seasons | 1 |
| teams | 48 |
| venues | 16 |
| matches | 72 |
| source snapshots | 8 |
| canonical aliases | 309 |
| localizations | 488 |
| canonical links | 48 |
| rating snapshots | 699 |
| historical match facts | 1,392 |
| schedule snapshots | 1 |
| venue catalog | 16 |
| official schedule matches | 104 |
| official schedule links | 72 |

The remaining 32 knockout schedule rows are intentionally deferred from runtime linkage.

Task 3B first apply succeeded and its exact rerun planned:

```text
inserts = 0
updates = 0
blockers = 0
```

Task 1C fixture-linkage result:

```text
selected = 24
RPC requestedCount = 24
RPC updatedCount = 24
verified exact post-state = 24
production writes = 0
```

The RPC `public.apply_task1c_stage_v1_fixture_linkage(jsonb)` is installed in stage and service-role-only.

Migration `20260626220000` was applied manually in the stage SQL Editor. Migration-history repair remains pending and non-blocking. Do not rerun the SQL migration or linkage apply.

Auth user and admin profile were preserved. Production remained untouched.

## Current stage limitation

Stage foundation data and exact Matchday 3 provider linkage exist, but product predictions do not.

```text
model_versions = 0
active_model_versions = 0
prediction_versions = 0
public_prediction_summaries = 0
```

The publish queue and `/predictions` load correctly, but both remain empty for valid reasons.

Task 1C is therefore in progress rather than complete.

## Current data freshness

Imported reference and historical data has cutoff:

```text
2026-06-20
```

It is suitable as a structured bootstrap and historical reference. It is not sufficient for a current V2 tournament candidate without refresh.

## Preserved model findings

Historical unrestricted challengers did not beat V1.

Subsequent research corrected:

- neutral-site handling;
- historical windows;
- candidate selection;
- stored/runtime replay parity;
- reliability shrinkage and gates;
- movement caps;
- scenario-family evaluation.

Historical bounded probability label:

```text
v1_plus_high_confidence_signals
```

Historical development package label:

```text
gated_v2_probability_v2_analysis
```

Honest interpretation:

- gated V2 was near parity with exact V1 on the preserved sample;
- no material probability-accuracy advantage was established;
- no current release decision may be inferred from dated artifacts;
- evidence, provenance, scenarios, reliability, localization, and tournament context remain the main product gain under evaluation.

## Immutable V1 baseline decision

Production Matchday 3 has 24 original V1 publications.

They remain immutable and should be preserved into stage as the comparison baseline.

Do not regenerate historical V1 predictions using newer data.

For finished fixtures:

```text
original V1 publication
vs V2 historical_replay using pre-kickoff evidence only
vs verified result
```

For not-started fixtures:

```text
original V1 publication
vs current V2 candidate at an explicit shared cutoff
```

## Exact next slice

```text
Task 1C - V1 Model and Prediction Import
```

Completed prerequisite:

- all 24 Matchday 3 fixtures are deterministically linked in stage and their exact post-state is verified.

Required result:

- one canonical V1 model imported and activated;
- 24 original immutable V1 prediction versions imported without semantic recalculation;
- 240 required prediction-market rows imported;
- only frozen source child records imported, with no invented narratives or detail;
- stable mapping to the verified stage match IDs;
- stage public and admin surfaces validated;
- second run proves zero row growth;
- Auth/admin preserved;
- production remains read-only and untouched.

## V2 current-data path

After V1 visibility:

1. refresh fixture identity, status, and results;
2. refresh Elo and latest available FIFA ranking;
3. persist standings, tournament form, goals, points, and opponent-quality context;
4. create current signal snapshots with source, cutoff, and reliability;
5. generate live candidates for not-started fixtures;
6. generate fair `historical_replay` versions for completed fixtures;
7. compare V1, V2, and verified outcomes;
8. decide release mode.

## Explanation-first output

V2 should explain football signals in ordinary language rather than relying only on 1X2, BTTS, totals, or exact scores.

Expected analytical concepts include:

- group performance and points;
- goals for and against and their averages;
- structural FIFA and Elo strength;
- attack and defense profile;
- opponent quality;
- controlled, tight, open, and upset match scripts;
- evidence for and against the main conclusion;
- source, cutoff, confidence, and missing-data limitations.

Scenario families aggregate plausible paths. Exact scores are representative anchors, not three independent prophecies.

## Future squad and player capability

The data and presentation contracts should be able to add later:

- squads, call-ups, likely and confirmed lineups;
- injuries, suspensions, doubts, and expected minutes;
- tournament top scorers and assists;
- contribution to team goals;
- individual shots and xG when trustworthy;
- offensive dependency;
- replacement quality and absence impact;
- likely scorer candidates.

This capability is planned for later increments and does not block V2.0.

## Release framing

Possible first production modes remain:

```text
v1 probabilities + v2 analysis
```

or:

```text
gated v2 probabilities + v2 analysis
```

A production decision requires current data, stage persistence, fair comparison, regression protection, and owner approval.
