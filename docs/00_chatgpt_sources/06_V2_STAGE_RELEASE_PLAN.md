# V2 Stage and Release Plan

_Last refreshed: 2026-06-27 after the complete Task 1C V1 stage baseline checkpoint._

## Goal

Move from a stable V1-visible stage to a fair, source-backed V2 shadow candidate without disrupting production or repeating completed foundation work.

## Current gate status

| Gate | Status |
|---|---|
| Separate stage and production identity | Passed |
| Prediction Intelligence schema in stage | Passed |
| Foundation data bootstrap | Passed |
| Bootstrap idempotency | Passed |
| Exact 24-fixture provider linkage | Passed |
| Immutable V1 model and prediction import | Passed |
| V1 market import | Passed |
| V1 activation and public visibility | Passed |
| Post-apply exact-complete verification | Passed |
| Stage `/predictions` visual smoke | Passed |
| V2 signal baseline in real tables | Next |
| Current-data incremental refresh | Pending |
| First V2 shadow candidate | Pending |
| V1/V2 evaluation | Pending |
| Production release decision | Pending |

## Stable stage checkpoint

```text
branch: integration/prediction-intelligence-v2
Draft PR: #114
HEAD: bce9999
stage: yfmklapgjrupctgxaako
production denied: gcpdffkgsdomzyoenalg
```

Stage V1 state:

```text
active models = 1
predictions = 24
markets = 240
narratives = 0
public fixtures = 24
state = exact_complete
pending publications = 0
```

## Completed phase: foundation and visible V1

Closed work:

- Task 3B schema/data foundation;
- exact fixture linkage;
- frozen V1 source selection;
- semantic reviewed-plan authorization;
- atomic V1 import;
- publication and activation;
- idempotency and visual smoke.

**No repetir:** do not rerun bootstrap, fixture linkage, V1 import, or SQL installation without a concrete recovery requirement.

## Active phase: V2 Signal Baseline Database Load

Prepared cutoff:

```text
2026-06-20
```

The active slice is intentionally bounded.

Required steps:

1. read the prepared workspace and committed equivalents;
2. map existing baseline records to current tables;
3. retain source, checksum, observed time, cutoff, and version lineage;
4. classify missing and optional signals explicitly;
5. run one dry-run/preflight;
6. apply once to stage under production denial;
7. verify counts, conflicts, and fixture coverage;
8. rerun once only to prove idempotency;
9. stop before candidate generation.

**Decision:** a one-week-old reproducible baseline is sufficient to establish the real database and pipeline.

**Motivo:** current data becomes an incremental refresh once the canonical storage and lineage path exists.

## Baseline-load acceptance gate

The task passes when:

- every inserted row maps to a canonical team, fixture, competition, season, or source snapshot;
- source and cutoff lineage are queryable;
- row accounting balances;
- no production writes occur;
- no Auth, Wompi, entitlement, webhook, session, or personal-data scope is touched;
- fixture signal coverage can be queried;
- a second exact run produces zero duplicate growth;
- no V2 prediction is published.

## Current-data incremental refresh

After baseline load, refresh only changed or newer source families:

- future fixture identities and kickoffs;
- verified results;
- current World Football Elo;
- latest available official FIFA ranking;
- group standings and tournament form;
- qualification and pressure context;
- source-backed derived signals.

Each refresh records observed time and explicit cutoff. Historical snapshots are preserved.

Ordinary refresh must not require another Task 3B bootstrap.

## First V2 shadow candidate

Generate only after baseline storage and minimum current-data coverage pass.

Required candidate properties:

- not-started fixture;
- explicit model and feature version;
- calculation timestamp and evidence cutoff;
- V1 predecessor reference;
- source and signal snapshot references;
- reliability and missing-signal report;
- bounded probability movement;
- coherent scenario families;
- unpublished/development state.

For completed fixtures, use labeled `historical_replay` with pre-kickoff evidence only.

## Evaluation gate

Compare separately:

- 1X2 probability and calibration;
- log loss and Brier;
- xG and total-goal error;
- BTTS and over/under;
- scenario-family quality;
- explanation and evidence usefulness;
- source freshness and reliability;
- data limitation, model error, and football variance.

A better explanation does not prove better probability calibration.

## Release decision gate

Choose explicitly between:

```text
V1 probabilities + V2 analysis
```

and:

```text
gated V2 probabilities + V2 analysis
```

Promotion requires:

- accepted stage state;
- immutable version and cutoff proof;
- no post-kickoff leakage;
- current sample comparison;
- rollback plan;
- Auth/Wompi/entitlement regression protection;
- public, premium, admin, and partner-export compatibility;
- owner approval.

## Parallel V1/product work

Production-safe UI and V1 improvements may continue from current `main` under a separate owner.

They flow into the V2 integration branch through normal Git history.

They must not:

- change probabilities without model governance;
- duplicate V2 data/model implementation;
- depend on unfinished stage-only V2 data for production availability.

## Process decisions

- one implementation review, not repeated general scrutiny;
- one preflight, one apply, one verification per bounded operation;
- direct owner-operated SQL/Git/Supabase is valid when it preserves scope and safety;
- a concrete defect permits a focused correction, not a restart of the whole audit;
- migration files in Git and remote migration application are separate facts;
- canonical docs record both state and decisions so future conversations do not reopen closed work.

## Responsibility

- ChatGPT defines and documents gates, decisions, and handoffs.
- Codex implements bounded slices and returns evidence.
- The operator authorizes and executes remote stage and Git actions.
