# Roadmap, MVP2 Epics, and Open Decisions

_Last refreshed: 2026-06-26 after the Task 1C Matchday 3 fixture-linkage checkpoint._

## MVP2 objective

MVP2 is the shortest safe path from the sellable MVP1 to a product with:

- normalized football history and reference data;
- repeatable current-data operations;
- visible immutable V1 baselines in stage;
- explainable evidence and scenario output;
- fair V1/V2 comparison;
- immutable prediction versions;
- tournament and qualification context;
- lower manual operational burden;
- ES/EN/PT-ready contracts;
- continued production delivery during research.

The goal is a football-intelligence product, not a frontend rewrite and not a result-prediction oracle.

## MVP2 naming convention

MVP2 planning uses a simple convention:

```text
Epic 1, Epic 2, Epic 3...
Task 1A, 1B, 1C...
```

Rules:

- epic numbers identify owner-sized workstreams;
- task letters identify bounded deliverables;
- avoid a third identifier level unless absolutely necessary;
- PR checklists may contain smaller implementation steps without creating more roadmap codes;
- MVP1 historical naming is not changed;
- old `M2-01` to `M2-08` labels remain historical references only and are mapped below.

## Current status summary

```text
Epic 1  Foundation and Stage          - Task 1A and 1B done; Task 1C in progress, linkage complete
Epic 2  Current Football Data         - planned after Task 1C
Epic 3  V2 Candidate and Evaluation   - planned after current data
Epic 4  Expert Product Experience     - parallel, separate owner
Epic 5  Operations and Automation     - partially delivered, continuing
```

## Epic 1 - Foundation and Stage

Purpose: provide a safe, reproducible stage environment with V1 and V2 comparison foundations.

### Task 1A - Integration normalization

Status: `Done`

Delivered:

- current-main-based integration branch and Draft PR #114;
- selective Task 1, Task 2, and Task 3A integration;
- historical evidence preservation;
- local-run and production-denial guards;
- no remaining useful code to port from the old branch.

### Task 1B - Stage schema and data bootstrap

Status: `Done`

Delivered:

- stage identity and production denial;
- canonical 46-migration stage chain;
- migration 0038 applied to stage only;
- Task 3B importer;
- reference and historical foundation data;
- first apply and zero-write second apply;
- Auth/admin preservation;
- stage queue and predictions smoke checks.

Current stage remains empty of model and prediction rows.

### Task 1C - V1 visible baseline

Status: `In progress`

Completed:

- exact 24 Matchday 3 fixture allowlist;
- trusted API-Football identity verification;
- atomic stage-only linkage RPC;
- 24-row apply and exact post-state verification;
- zero production writes;
- `.env.stage.local` established as the sole active local stage environment file.

Remaining:

- one canonical V1 model import and activation;
- 24 original immutable V1 prediction versions;
- 240 required prediction-market rows;
- only frozen source child records, without semantic recalculation;
- public and admin visibility;
- second-run zero-growth proof;
- handoff to current-data refresh.

Operational note:

- migration `20260626220000` is applied and operational in stage;
- migration-history repair remains pending and does not block the remaining Task 1C work;
- fixture linkage must not be repeated.

## Epic 2 - Current Football Data

Purpose: make stage independently refreshable instead of relying on dated bootstrap files or production as an ongoing data source.

### Task 2A - Fixture and result refresh

- not-started fixture identity and kickoff refresh;
- verified recent results;
- exact provider links;
- idempotent reruns and exception reporting.

### Task 2B - Ranking refresh

- current World Football Elo snapshot and timeline;
- latest available official FIFA ranking;
- source, observed time, cutoff, and checksum;
- deterministic team mapping.

### Task 2C - Tournament form and standings

- played, wins, draws, losses, and points;
- goals for, goals against, and goal difference;
- scoring and conceding averages;
- group position and qualification pressure;
- opponent-quality context;
- small-sample reliability controls.

### Task 2D - Repeatable signal snapshots

- source-backed signal snapshot creation;
- explicit pre-kickoff cutoffs;
- missing-signal and reliability metadata;
- rerunnable current-data pipeline;
- no full bootstrap required for ordinary refreshes.

## Epic 3 - V2 Candidate and Evaluation

Purpose: produce, explain, compare, and release V2 honestly.

### Task 3A - Live V2 candidate

- create current V2 candidates for not-started fixtures;
- preserve V1 as predecessor/baseline;
- apply movement and reliability gates;
- produce source-backed scenarios and evidence.

### Task 3B - Historical replay

- create labeled V2 `historical_replay` versions for completed fixtures;
- use only evidence available before kickoff;
- never replace original V1 publications.

### Task 3C - V1/V2 evaluation

- compare probabilities, goals, scenarios, and explanation quality;
- use verified results;
- separate model error, data limitation, and football variance;
- record what V2 improved or worsened.

### Task 3D - Release decision

Choose and validate one of:

```text
v1 probabilities + V2 analysis
```

or:

```text
gated V2 probabilities + V2 analysis
```

Production release requires stage gates, rollback, and owner approval.

## Epic 4 - Expert Product Experience

Purpose: allow another owner to improve the current product in production and stage while the primary owner continues data and model work.

This epic does not change probabilities or build the V2 data pipeline.

### Task 4A - V1 information inventory

- identify data V1 stores but does not show;
- identify duplicated, unclear, or betting-centric presentation;
- define safe public, registered, premium, and admin display boundaries.

### Task 4B - Expert match summary

- explain who arrives stronger and why;
- translate V1 signals into ordinary football language;
- show confidence and uncertainty honestly;
- support missing data without empty placeholder boxes.

### Task 4C - Understandable scenario families

- controlled favorite win;
- tight balanced match;
- open match or upset path;
- representative exact scores as anchors, not the full explanation.

### Task 4D - Evidence and transparency

- supporting evidence;
- contradicting evidence;
- source and cutoff when available;
- data-quality and missing-data messages;
- no invented statistics.

### Task 4E - Locale-ready presentation

- locale-neutral fact contracts;
- translation keys and renderers;
- Spanish first;
- English and Portuguese ready as first-class targets;
- no model recalculation per language.

### Task 4F - Future-data receivers

Prepare UI and contracts, without requiring the data now, for:

- tournament form and standings;
- rankings and attack/defense profiles;
- squads and lineups;
- injuries and suspensions;
- top scorers;
- contribution to team goals;
- offensive dependency;
- likely scorer and key-absence impact.

Branch rule:

- production-safe work branches from current `main`;
- merges to `main` through normal PR review;
- then flows into `integration/prediction-intelligence-v2` through normal Git history;
- no duplicate manual implementation in both branches.

## Epic 5 - Operations and Automation

Purpose: reduce repetitive manual operations without weakening exact-scope safety.

Delivered:

- bounded fixture registry;
- exact allowlist apply;
- trusted result refresh;
- valid `FT` verification;
- idempotent result and evaluation persistence;
- exception-oriented review;
- Task 3B stage bootstrap and rerun proof.

Remaining:

- automatic selection of recent pending fixtures;
- retry and backoff for transient provider absence;
- scheduler around match windows;
- run summaries and notifications;
- persistent score-reconciliation workflow;
- operational metrics;
- recurring ranking and signal refresh after stage stabilization.

## Planned later extensions

These are intentionally not V2.0 blockers:

- canonical player and squad intelligence;
- likely and confirmed lineups;
- injuries, suspensions, rest, and rotation;
- tournament top scorers and player contribution;
- offensive dependency and replacement quality;
- classification probability including extra time and penalties;
- deeper multilingual rollout;
- second payment provider;
- larger holdout and stricter probability acceptance gates.

## Legacy MVP2 mapping

For historical continuity only:

| Old label | New location |
|---|---|
| M2-01 | Epic 1 Task 1A |
| M2-02 | completed production milestone, retained as history |
| M2-03 | Epic 1 Task 1B and 1C |
| M2-04 | Epic 2 and Epic 3 |
| M2-05 | Epic 5 |
| M2-06 | Epic 4 |
| M2-07 | Epic 4 Task 4E and later localization rollout |
| M2-08 | planned later commercial extension |

Do not use old labels for new MVP2 tasks.

## Decisions already made

- MVP1 remains live during MVP2 work;
- production and stage remain separate;
- `.env.stage.local` is the sole active local stage environment file;
- old V2 branch is preservation only;
- stage foundation bootstrap is complete and idempotent;
- Task 1C fixture linkage is complete for the exact 24 Matchday 3 rows;
- the linkage RPC is atomic, service-role-only, and must not be rerun without a concrete recovery need;
- migration-history repair for `20260626220000` is non-blocking;
- production writes remain denied from the integration task path;
- original V1 publications are immutable baselines;
- finished-fixture V2 comparison uses `historical_replay`;
- historical V2 artifacts do not authorize a current release;
- V2 probability superiority is not yet established;
- explanation, evidence, provenance, scenarios, and context are core product value;
- scenarios are match-script families, not prophecy;
- user-facing language should explain football rather than assume betting literacy;
- canonical identity and facts are locale-neutral;
- ES, EN, and PT are core language targets;
- API-Football is trusted for valid exact fixture identity and terminal-result operations under the approved checks;
- Torneo Mundialista continues to consume `torneo-ufo-export-v1`;
- Epic 4 is a parallel workstream for another owner and does not redirect the primary data/model work;
- bounded operations use one preflight, one apply, and one verification unless a concrete mismatch exists;
- the owner may directly operate Git, PowerShell, Supabase, Railway, SQL, and trusted APIs;
- Codex is primarily used for repository inspection, bounded code implementation, tests, and review.

## Decisions still required

- final immutable V1 import mapping and exact child-record scope after the frozen source is read;
- final current-data source set and refresh cadence;
- V1 probabilities plus V2 analysis versus gated V2 probabilities;
- final public, free, and premium signal matrix;
- deterministic narrative versus optional LLM polish;
- public proprietary boundary;
- scheduler and notification architecture;
- timing of broad EN/PT rollout;
- scope and source strategy for player and lineup intelligence;
- second payment-provider strategy.

## Exact next sequence

1. apply and commit the Task 1C linkage checkpoint documentation;
2. replace the shared ChatGPT source set;
3. start `Task 1C - V1 Model and Prediction Import`;
4. import and activate the canonical V1 model;
5. import 24 immutable prediction versions and 240 required market rows;
6. validate public/admin visibility and prove zero growth;
7. complete Epic 1 Task 1C;
8. execute Epic 2 current-data refresh;
9. execute Epic 3 live candidate and historical replay;
10. compare and decide release mode;
11. continue Epic 4 in parallel under a separate owner;
12. promote only after stage acceptance.

## Delivery rule

Every epic and task uses:

- explicit branch base;
- explicit environment;
- exact write scope;
- acceptance evidence;
- rollback boundary;
- one preflight, one apply, and one verification for a bounded operation;
- direct owner operation where Git, PowerShell, Supabase, Railway, SQL, or an approved API is the efficient path;
- documentation refresh at meaningful checkpoints.

Repeat an operation only after a concrete blocker, mismatch, or approved recovery need.

Avoid giant PRs that combine model, data, payments, UI, migrations, operations, and documentation.
