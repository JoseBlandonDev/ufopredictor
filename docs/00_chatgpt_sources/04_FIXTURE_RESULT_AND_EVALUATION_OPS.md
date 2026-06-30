# Fixture, Result, and Evaluation Operations

_Last refreshed: 2026-06-29 after Task 2B.1 and Task 2B.2 completed and the accepted `main` checkpoint was integrated at `9672b55644d8a2bd3818ecd08086ab3ebf111398`._

## Operational truth

UFO Predictor has bounded, auditable flows for:

- fixture registration and provider linkage;
- trusted result refresh;
- manual exact-result reconciliation;
- immutable prediction publication;
- atomic result verification and evaluation persistence;
- public History queries over verified results;
- stage V1 comparison publication;
- V2 current-fixture/result refresh.

Prediction operations and result operations remain separate. A verified score never authorizes rewriting a published prediction.

## Established production operations

Fixture registry:

```text
npm run ops:world-cup-group-stage-fixture-registry
```

Trusted result refresh:

```text
npm run ops:world-cup-result-refresh
```

Shared properties:

- dry-run by default;
- exact date, matchday, or reviewed fixture scope;
- exact API-Football identity;
- explicit apply allowlist;
- supported terminal results only;
- idempotent persistence;
- conflict reporting instead of silent overwrite;
- immutable prediction versions.

Manual reconciliation remains an exact reviewed exception path through:

```text
supabase/migrations/0039_manual_world_cup_result_reconciliation.sql
```

It was applied to production and stage. It is not the normal provider flow.

## Canonical identity rules

Fixture/result matching uses:

- canonical competition and season;
- canonical home/away team identity;
- explicit aliases;
- kickoff semantics;
- exact provider fixture ID where linked.

Localized display names alone are never write authority.

Known aliases such as Czech Republic/Czechia and Côte d'Ivoire/Ivory Coast are resolved through canonical identity.

## Historical production result checkpoint

The previously accepted production applies persisted and publicly verified:

```text
Egypt 1-1 Iran
New Zealand 1-5 Belgium
Uruguay 0-1 Spain
Panama 0-1 Croatia
Cape Verde 0-0 Saudi Arabia
```

Those exact apply commands are closed and must not be repeated.

## Closed Task 1C and Task 2A checkpoints

Task 1C:

```text
linked Matchday 3 fixtures = 24
active V1 models = 1
immutable V1 predictions = 24
market rows = 240
public fixture publications = 24
post-state = exact_complete
```

Task 2A:

```text
prepared cutoff = 2026-06-20
persisted signal rows = 48
state = exact_complete
verification identical rows = 48
runtime fixture coverage = 72/72
candidate-ready fixtures = 0
production writes = 0
```

Do not rerun legacy Task 3B stage synchronization, Task 1C linkage/import, or Task 2A merely to restate evidence.

## Task 2B.1 - Current fixture refresh

### Contract

Task 2B.1:

- reads the reviewed provider snapshot;
- sanitizes evidence before persistence;
- resolves only the minimal canonical fixture identity fields;
- binds apply authorization to the reviewed semantic plan;
- rechecks current pre-apply state;
- writes only reviewed safe provider-link changes;
- preserves kickoff conflicts as exclusions;
- verifies post-state without requiring the pre-apply semantic plan to remain the post-state.

Internal modes are:

```text
dry_run
apply
verification
```

### Accepted state

Reviewed dry-run:

```text
selected fixtures = 72
safe actions = 41
already identical = 2
blocked kickoff conflicts = 3
provider-only unknown = 1
terminal-result-ready fixtures = 24
```

Final verification:

```text
reviewed actions = 41
satisfied actions = 41
missing = 0
mismatched = 0
ambiguous = 0
verification passed = true
```

Accepted evidence:

```text
artifacts/prediction-intelligence-v2/task2b-1/local-run/2026-06-27/final-terminal-linkage-rerun/task2b-1-provider-snapshot-2026-06-28T00-58-59-344Z.json
artifacts/prediction-intelligence-v2/task2b-1/local-run/2026-06-27/final-terminal-linkage-rerun/task2b-1-fixture-refresh-dry_run-2026-06-28T00-59-01-097Z.json
artifacts/prediction-intelligence-v2/task2b-1/local-run/2026-06-27/reviewed-linkage-apply/task2b-1-fixture-refresh-apply-2026-06-28T01-20-35-547Z.json
artifacts/prediction-intelligence-v2/task2b-1/local-run/2026-06-28/post-apply-verify/task2b-1-fixture-refresh-verification-2026-06-28T02-34-38-122Z.json
```

## Task 2B.2 - Result and evaluation refresh

### Contract

Task 2B.2:

- consumes reviewed trusted-provider terminal rows;
- preserves three kickoff-conflict exclusions;
- binds apply to the reviewed artifact and stable plan;
- persists result core and eligible evaluations atomically;
- records trusted-provider verification metadata;
- preserves rows that are evaluation-pending;
- verifies post-state by represented timestamp instant, not raw timestamp string;
- never rewrites prediction probabilities or markets.

Relevant migration:

```text
supabase/migrations/20260628010000_task2b_stage_result_core_apply.sql
```

### Accepted state

Reviewed dry-run:

```text
selected fixtures = 72
safe result actions = 69
result create-and-verify actions = 69
evaluation create actions = 24
evaluation-pending rows = 45
excluded kickoff-conflict rows = 3
```

Final verification:

```text
reviewed result actions satisfied = 69/69
reviewed evaluation actions satisfied = 24/24
pending evaluations preserved = 45
excluded rows preserved = 3
verification passed = true
```

Accepted evidence:

```text
artifacts/prediction-intelligence-v2/task2b-2/local-run/2026-06-29/post-exclusion-evidence-fix-dry-run/task2b-2-provider-snapshot-2026-06-29T08-17-58-779Z.json
artifacts/prediction-intelligence-v2/task2b-2/local-run/2026-06-29/post-exclusion-evidence-fix-dry-run/task2b-2-result-refresh-dry_run-2026-06-29T08-18-00-522Z.json
artifacts/prediction-intelligence-v2/task2b-2/local-run/2026-06-29/reviewed-result-apply-final/task2b-2-result-refresh-apply-2026-06-29T08-43-36-824Z.json
artifacts/prediction-intelligence-v2/task2b-2/local-run/2026-06-29/post-state-comparison-fixed-verification-attempt-2/task2b-2-result-refresh-verification-2026-06-29T22-22-56-332Z.json
```

**Critical no-repeat rule:** never rerun the accepted Task 2B.2 apply.

## Evaluation contract

A persisted evaluation references:

- the original immutable prediction version;
- the exact fixture and verified result;
- evaluation timestamp;
- supported market and scenario outcomes;
- model and feature identity;
- evidence or replay purpose.

Evaluation may classify:

- 1X2 direction and probability quality;
- BTTS and totals;
- exact-score and scenario-family behavior;
- margin and surprise severity;
- data limitation, model error, and football variance.

A future V2 `historical_replay` is compared with the original V1 publication and verified result. It replaces neither.

## Public History contract

Code-proven behavior:

- `/predictions/history` paginates;
- history queries include verified-result entries;
- match detail separates the immutable prediction from the verified final result;
- registered-free historical preview is distinct from premium access;
- an unverified result does not unlock premium historical content.

Accepted operational smoke confirmed populated History, active pagination, a working public detail, separated final result, and entitlement-respecting premium visibility.

## Result and publication immutability

- no post-result probability rewrite;
- no post-kickoff evidence in a pre-match version;
- no silent verified-score overwrite;
- no result-based mutation of xG, confidence, markets, or narratives;
- replacement predictions receive a new immutable version and cutoff;
- evaluations reference original versions.

## Integration corrections that remain contractual

The integrated checkpoint includes:

- snake_case Task 1C publication RPC payloads;
- canonical fixture resolution from sanitized provider evidence;
- timestamp comparison by represented instant;
- canonical `verification` mode naming;
- isolated per-test artifact directories.

These are not cosmetic fixes. They protect reviewed authorization, evidence boundaries, SQL/TypeScript compatibility, and deterministic tests.

## Current operational sequence

Routine production fixture/result operations:

```text
read/discover
-> exact identity validation
-> one dry-run
-> one reviewed allowlisted apply
-> one public/admin verification
-> exact exception reconciliation only when needed
```

V2 sequence:

```text
Task 2A baseline persistence - complete
-> Task 2B fixture/result refresh - complete
-> Task 2C rankings, standings, form, and pressure context
-> Task 2D repeatable current source-backed signal snapshots
-> first V2 shadow candidate
-> replay/evaluation
```

## No-repeat and escalation rules

Default:

```text
one preflight
one apply
one verification
```

Repeat only when:

- a concrete source conflict appears;
- target identity changed;
- an atomic apply returned ambiguous state;
- a reviewed recovery was approved.

A local formatting, test, or display failure after a confirmed atomic remote commit does not authorize another apply. Inspect post-state once.

## Responsibility split

- Codex implements and tests bounded fixture/result/evaluation code.
- The operator runs approved provider, Supabase, SQL, and Git operations.
- ChatGPT records canonical operational decisions and prepares bounded handoffs.
