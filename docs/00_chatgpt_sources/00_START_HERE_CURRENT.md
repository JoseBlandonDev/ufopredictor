# Start Here - UFO Predictor Current

_Last refreshed: 2026-06-26 after the Task 1C Matchday 3 fixture-linkage checkpoint._

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

Prediction Intelligence v2 is not live in production.

Stage now has:

- the Task 3B analytical foundation;
- 72 runtime group-stage matches;
- the exact 24 Matchday 3 fixtures linked to approved API-Football fixture IDs;
- no active model version and no visible public predictions yet.

Historical v2 artifacts, candidate names, release recommendations, and publication plans remain research evidence. They are not current production decisions.

## Repository and PR baseline

Production baseline used for the current integration track:

```text
main: e771de3c39c480f05d026075e5e553fb75207468
```

Active v2 integration checkpoint:

```text
branch: integration/prediction-intelligence-v2
Draft PR: #114
reviewed checkpoint HEAD: dba63d8cc3d6d9235295abb4fe8834db44caf519
status: open, Draft
```

Always verify the actual current HEAD and worktree before implementation. The reviewed checkpoint includes the atomic Task 1C fixture-linkage implementation; the documentation package may be applied and committed afterward.

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

Canonical local stage environment file:

```text
.env.stage.local
```

`.env.stage.local` is the sole active local source for stage variables. The former task-specific stage environment file was consolidated, backed up outside the repository, and retired from active code and runbooks. Historical archive references remain unchanged.

Production and stage have separate Auth, users, sessions, roles, entitlements, data, and secrets.

Do not create another stage environment. Do not revive the abandoned Docker path for normal stage work.

## Prediction Intelligence v2 progress

Completed on the integration track:

- Task 1 data foundation;
- Task 1.1 replay readiness;
- Task 1.2 historical Elo reconstruction;
- Task 2 challenger, calibration, signal gates, eligibility, and historical packaging;
- Task 3A local-only planner and target-safety preparation;
- Task 3B stage schema synchronization and bounded data bootstrap;
- Task 1C exact Matchday 3 fixture-linkage subblock.

Task 3B is technically complete and proved idempotent.

Task 1C is in progress. Its fixture-linkage subblock is complete; model and prediction import remains.

## Stage Task 3B and Task 1C linkage checkpoint

Stage retains the Task 3B foundation:

- the prior migration history was externally verified at 46 entries;
- migration 0038 is applied in stage only;
- foundation import and zero-growth rerun are complete;
- existing Auth user and admin profile were preserved;
- production, Wompi, payment, entitlement, webhook, session, and personal-data writes did not occur.

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

Task 1C fixture-linkage result:

```text
selected Matchday 3 fixtures = 24
atomic RPC requestedCount = 24
atomic RPC updatedCount = 24
post-state rows verified = 24
external_id exact matches = 24
intake_source exact matches = 24
production writes = 0
```

The installed stage-only RPC is:

```text
public.apply_task1c_stage_v1_fixture_linkage(jsonb)
```

It may execute only as `service_role`; `anon` and `authenticated` execution are revoked.

Migration `20260626220000_task1c_stage_v1_atomic_fixture_linkage_apply.sql` was applied manually through the stage SQL Editor. It is operational. Supabase migration-history repair for version `20260626220000` remains pending and does not block the V1 import slice. Do not rerun the SQL migration or fixture-linkage apply.

## Current stage product state

Stage application and admin Auth work.

The exact 24 Matchday 3 runtime rows now carry their approved API-Football fixture identity. Stage still has no active prediction product:

```text
model_versions = 0
active_model_versions = 0
prediction_versions = 0
public_prediction_summaries = 0
```

Authenticated smoke checks previously showed:

- `/admin/real-fixture-publish-queue` loads without the old competition-resolution error;
- `/predictions` loads and reports no public predictions;
- no production prediction content appears in stage.

The empty prediction state is expected until the canonical V1 model and immutable V1 publications are imported and activated.

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
Task 1C - V1 Model and Prediction Import
```

The verified 24-fixture linkage is an accepted prerequisite and must not be repeated.

Required result:

1. select and preserve the exact immutable V1 source;
2. import one canonical V1 model version;
3. map and import 24 original V1 prediction versions to the already linked stage matches;
4. import the required 240 prediction-market rows and only the frozen child records that actually exist;
5. activate the canonical V1 model in stage;
6. validate `/predictions`, match detail, and relevant admin surfaces;
7. rerun and prove zero duplicate growth;
8. preserve Auth/admin state and production read-only/no-write boundaries;
9. prepare the current-data and V2 historical-replay handoff.

Do not regenerate historical V1 probabilities, markets, timestamps, or narratives with newer evidence.

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
