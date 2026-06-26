# Start Here - UFO Predictor Current

_Last refreshed: 2026-06-26 after the Prediction Intelligence v2 Task 3B stage bootstrap and idempotency checkpoint._

## Current truth

UFO Predictor has a commercially usable production MVP1 and an active, unmerged Prediction Intelligence v2 integration track.

Production remains on the v1-compatible probability layer and continues to support:

- public World Cup prediction pages;
- anonymous, registered-free, premium, and admin experiences;
- Wompi checkout and approved-webhook entitlement activation;
- premium scenario, xG, BTTS, and over/under detail where available;
- exact fixture registration and prediction publication operations;
- trusted-provider result refresh, verification, public history, and internal evaluation persistence;
- admin operational queues;
- a public-safe Torneo Mundialista JSON export.

Prediction Intelligence v2 is not live in production. Its stage data foundation is now operational, but stage still has no active model version and no visible public predictions.

Historical v2 artifacts, candidate names, release recommendations, and publication plans remain research evidence. They are not current production decisions.

## Repository and PR baseline

Production baseline used for the current integration track:

```text
main: e771de3c39c480f05d026075e5e553fb75207468
```

Active v2 integration:

```text
branch: integration/prediction-intelligence-v2
Draft PR: #114
last reviewed pre-checkpoint HEAD: 27782c25bb4dc752fe335f0b2515feec264f8a6d
status: open, Draft
```

Always verify the actual current HEAD before implementation. The SHA above is the reviewed base before the owner commits the Task 3B implementation, evidence, and this documentation refresh.

Preserved historical source:

```text
branch: feature/prediction-intelligence-v2-data-foundation
Draft PR: #106
head: eefcff709e80209215b25b90fb870aa5c080d735
status: preservation/reference only
```

Do not continue implementation on PR #106 and do not blanket-merge or blanket-cherry-pick it.

## Environment map

```text
ufopredictor.com       -> Railway production  -> production Supabase
stage.ufopredictor.com -> Railway development -> separate Supabase stage
```

Supabase project references:

```text
stage:      yfmklapgjrupctgxaako
production: gcpdffkgsdomzyoenalg
```

Production and stage have separate Auth, users, sessions, roles, entitlements, data, and secrets.

Do not create another stage environment. Do not revive the abandoned Docker path for normal stage work.

## Prediction Intelligence v2 progress

Completed on the integration track:

- Task 1 data foundation;
- Task 1.1 replay readiness;
- Task 1.2 historical Elo reconstruction;
- Task 2 challenger, calibration, signal gates, eligibility, and historical packaging;
- Task 3A local-only planner and target-safety preparation;
- Task 3B stage schema synchronization and bounded data bootstrap.

Task 3B is technically complete and proved idempotent.

## Stage Task 3B checkpoint

Stage now has the canonical migration chain, including migration 0038, applied in stage only.

Migration history was externally verified as:

```text
46 migrations
```

The current importer cannot read `supabase_migrations` through PostgREST, so it records an explicit external operator attestation instead of misreporting zero migrations.

Verified stage foundation counts:

| Table or entity | Count |
|---|---:|
| competitions | 1 |
| seasons | 1 |
| teams | 48 |
| venues | 16 |
| runtime matches | 72 |
| source snapshots | 8 |
| canonical team aliases | 309 |
| canonical team localizations | 488 |
| canonical team links | 48 |
| team rating snapshots | 699 |
| historical match facts | 1,392 |
| schedule snapshots | 1 |
| World Cup venue catalog | 16 |
| official schedule matches | 104 |
| official schedule/runtime links | 72 |

Official knockout match numbers 73-104 remain intentionally deferred from runtime linkage until participants are deterministically known.

Task 3B safety proof:

- stage-only target proved;
- production project explicitly denied;
- first apply succeeded;
- second apply planned zero inserts and zero updates;
- all destination counts remained unchanged;
- existing stage Auth user remained present;
- existing profile remained `admin`;
- no production, Wompi, payment, entitlement, webhook, session, or personal-data write occurred.

## Current stage product state

Stage application and admin Auth work.

Authenticated smoke checks show:

- `/admin/real-fixture-publish-queue` loads without the previous competition-resolution server error;
- the queue reports no active model version;
- the queue has no currently eligible exact fixtures;
- `/predictions` loads and reports no public predictions;
- no production prediction content appears in stage.

Current stage counts:

```text
model_versions = 0
active_model_versions = 0
prediction_versions = 0
public_prediction_summaries = 0
```

The empty queue is expected. Its query requires a scheduled, not-started, API-Football-linked, admin-only fixture inside the bounded queue window, plus an active model version before saving a prediction.

## Data freshness boundary

The imported foundation uses source material with cutoff:

```text
2026-06-20
```

The current Elo, FIFA, schedule, historical-result, and reference snapshots must not be described as current truth on 2026-06-26.

The stage foundation is ready to receive repeatable refreshes. It does not yet constitute current tournament data operations.

## Production World Cup continuity

Production v1 continuity remains unchanged:

- 24/24 Matchday 3 fixtures stored;
- 24/24 Matchday 3 v1 predictions published;
- original v1 publications remain immutable;
- trusted API-Football `FT` results may be verified when identity and score checks pass;
- evaluation persistence is idempotent;
- human review is exception-oriented;
- `torneo-ufo-export-v1` remains the approved partner contract.

Task 3B did not modify production.

## Exact next task

The next bounded conversation is:

```text
Stage V1 Visible Predictions Slice
```

Its goal is to:

1. preserve the exact immutable Matchday 3 V1 baseline;
2. link all 24 Matchday 3 fixtures to API-Football in stage;
3. import and activate the canonical V1 model version;
4. map the original V1 prediction records to stage fixtures by stable identity;
5. make those predictions visible in stage public and admin surfaces;
6. rerun the importer and prove zero duplicate growth;
7. prepare the current-data and V2 historical-replay handoff.

Do not regenerate historical V1 predictions with newer data.

## Sequence after V1 is visible

1. refresh current fixtures and verified results;
2. refresh Elo and the latest available FIFA ranking;
3. persist current standings, tournament form, points, goal difference, and attack/defense summaries;
4. create source-backed signal snapshots under explicit pre-kickoff cutoffs;
5. generate live V2 candidates for not-started fixtures;
6. generate labeled V2 `historical_replay` versions for completed fixtures using only pre-kickoff evidence;
7. compare original V1, V2 replay/candidate, and verified results;
8. choose between `v1 probabilities + v2 analysis` and `gated v2 probabilities + v2 analysis`;
9. validate stage and prepare an explicit production promotion decision.

## MVP2 product direction

UFO Predictor should evolve from a thin probability display into an explanation-first football-intelligence product.

The public experience should explain, where reliable data exists:

- tournament form, points, wins, draws, and losses;
- goals scored and conceded and their averages;
- FIFA and Elo position;
- offensive and defensive profile;
- opponent quality and contextual pressure;
- plausible match scripts;
- evidence supporting and contradicting the main reading;
- confidence, data quality, source, and cutoff.

Betting-style labels such as 1X2, BTTS, and over/under may remain available, but they are not the primary user language.

Future architecture must also be able to receive squads, likely and confirmed lineups, injuries, suspensions, top scorers, player contribution to team goals, offensive dependency, replacement quality, and estimated absence impact. These are planned capabilities, not V2.0 blockers.

Core language targets remain:

```text
ES
EN
PT
```

Facts and model outputs should remain locale-neutral. Presentation and explanations should be localizable.

## Required reading order

For a new engineering conversation, read:

1. `00_START_HERE_CURRENT.md`
2. `05_PREDICTION_INTELLIGENCE_V2_CURRENT.md`
3. `06_V2_STAGE_RELEASE_PLAN.md`
4. `07_ROADMAP_EPICS_DECISIONS.md`
5. `09_WORKFLOW_GUARDRAILS_DOC_POLICY.md`

For model and calibration history, also read:

- `08_MODEL_HISTORY_CALIBRATION.md`
