# V2 Stage and Release Plan

_Last refreshed: 2026-06-27 after Task 2A passed its exact stage acceptance gate and PR #119 was synchronized into the V2 integration branch at HEAD `4f758b2`._

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
| V2 signal baseline in real tables | Passed |
| Task 2A zero-growth verification | Passed |
| Current fixture and result refresh | Active next |
| Current ranking/standings/context refresh | Pending |
| Repeatable current signal snapshots | Pending |
| First V2 shadow candidate | Pending |
| V1/V2 evaluation | Pending |
| Production release decision | Pending |

## Stable stage checkpoint

```text
branch: integration/prediction-intelligence-v2
Draft PR: #114
production main HEAD: 9f89d62
V2 HEAD: 4f758b2
Task 2A commit: 9491fd8
stage: yfmklapgjrupctgxaako
production denied: gcpdffkgsdomzyoenalg
worktree/upstream divergence: clean, 0 0
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

Stage V2 signal state:

```text
signal rows = 48
state = exact_complete
runtime fixture coverage = 72/72
candidate-ready fixtures = 0
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

## Completed phase: V2 Signal Baseline Database Load

Prepared cutoff:

```text
2026-06-20
```

Task 2A completed:

```text
persisted signal rows = 48
manifest status = verified
post-state = exact_complete
verification inserts = 0
verification identical rows = 48
conflicts = 0
unexpected existing rows = 0
runtime fixtures = 72
baseline-ready fixtures = 72
candidate-ready fixtures = 0
production writes = 0
```

The load retains source identity, checksum, cutoff, signal version, canonical team linkage, missing/optional metadata, contradiction flags, sample sizes, and reliability metadata.

**No repetir:** Task 2A dry-run, apply, and verification are closed unless a concrete recovery requirement is approved.

## Baseline-load acceptance gate

Task 2A passed because:

- every inserted row maps to a canonical team and source-snapshot lineage;
- source and cutoff lineage are queryable;
- row accounting balances at 48 rows;
- the exact-complete verification returned 48 identical rows and zero inserts;
- no duplicate growth occurred;
- no production writes occurred;
- no Auth, Wompi, entitlement, webhook, session, or personal-data scope was touched;
- fixture signal coverage is 72/72;
- no V2 prediction or candidate was generated.

## Active phase: current-data incremental refresh

Start with:

```text
Task 2B - Current fixture and result refresh
```

Then refresh only changed or newer source families:

- future fixture identities and kickoffs;
- verified results;
- current World Football Elo;
- latest available official FIFA ranking;
- group standings and tournament form;
- qualification and pressure context;
- source-backed derived signals.

Each refresh records observed time and explicit cutoff. Historical snapshots and the 2026-06-20 baseline are preserved.

Ordinary refresh must not require another Task 3B bootstrap or Task 2A baseline apply.

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

Production-safe UI and V1 improvements continue from `main` under a separate owner and flow into the V2 branch through normal Git history.

Completed:

```text
Task 4A - V1 Information Inventory
Task 4B - Public Expert Read
PR #117 -> main 3aff0e4
Task 4C - Football-first premium terminology
PR #119 -> main 9f89d62
main -> V2 integration 4f758b2
```

Task 4C changed labels and explanations only. It did not change probabilities, premium authorization, payment/entitlement behavior, or V2 data/model logic.

No new parallel MVP1 task is declared active in this checkpoint.

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
