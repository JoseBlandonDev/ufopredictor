# Workflow Guardrails and Documentation Policy

_Last refreshed: 2026-06-29 after Task 2B completion and the integrated V2 checkpoint `9672b55644d8a2bd3818ecd08086ab3ebf111398`._

## Source hierarchy

### Shared canonical dynamic truth

The exact 10 files under:

```text
docs/00_chatgpt_sources/
```

are the canonical dynamic context shared by ChatGPT and Codex.

They own:

- current production, stage, branch, and PR truth;
- architecture and security boundaries;
- roadmap and epic status;
- model and release decisions;
- fixture/result/evaluation operations;
- payment/entitlement authority;
- documentation and workflow policy.

### Codex runbooks

Files under:

```text
docs/10_codex_runbooks/
```

own task execution, handoff, validation, and operator procedure.

Runbooks do not override canonical decisions.

### Archive and derived trackers

Archive and project-management files are historical or derived. They do not override the current 10 canonical sources.

## Documentation must preserve decisions

Each meaningful checkpoint records:

- what is true;
- what was decided;
- why;
- what alternative was rejected;
- what must not be repeated;
- what the next bounded transition is.

A status-only update is insufficient when the decision explains future behavior.

## Documentation refresh workflow

### ChatGPT authoring

ChatGPT:

- receives current sources, runbooks, implementation evidence, and owner decisions;
- authors replacement canonical files and affected runbooks;
- keeps cross-document terminology consistent;
- distinguishes repository truth, operational evidence, owner decisions, and unresolved drift.

### Codex role

Codex may:

- inspect the integrated repository read-only;
- identify stale sections and contradictions;
- review authored replacements once;
- report `ACCEPTED` or exact corrections;
- apply accepted files only when explicitly delegated;
- run diff and consistency checks.

Codex does not independently author canonical documentation unless explicitly delegated.

### Operator role

The operator:

- chooses final scope;
- supplies missing runbooks or evidence;
- reviews the package;
- places accepted files in the repository;
- runs Git actions;
- replaces the uploaded canonical source set.

## Branch discipline

```text
production branch: main
active V2 branch: integration/prediction-intelligence-v2
active Draft PR: #114
accepted main source merged into V2: 3d4b036d20df44027d8927a9a90cb546e7553e64
integrated V2 checkpoint: 9672b55644d8a2bd3818ecd08086ab3ebf111398
Task 2B implementation: 6d3fb7485b5a7dc1467812466107359daccdc902
Task 2B evidence: 1cdaa8b6384d02854c3bd2dce321b85ea71c869d
```

Rules:

- production-safe product changes branch from current `main`;
- accepted shared product changes flow normally into V2;
- do not manually duplicate the same feature in both branches;
- old V2 branch and PR #106 are preservation only;
- use worktrees when parallel owners require dirty workspaces;
- verify actual HEAD and worktree before every bounded task.

## Environment safety

```text
stage: yfmklapgjrupctgxaako
production: gcpdffkgsdomzyoenalg
stage env: .env.stage.local
```

Rules:

- no production writes from the V2 integration workflow;
- no production Auth, payment, entitlement, webhook, session, or personal-data cloning;
- no third stage environment;
- no service-role key in browser code;
- remote stage writes require exact target and production-deny refs;
- migration presence in Git is not proof of remote application.

## Closed checkpoints

Closed and not to be rerun ceremonially:

- legacy Task 3B foundation/stage synchronization;
- migration 0038 stage foundation apply;
- exact 24-fixture linkage;
- immutable V1 model/prediction/market import;
- V1 activation/publication and exact-complete verification;
- stage `/predictions` smoke;
- Task 2A baseline dry-run/apply/verification;
- Task 2B.1 reviewed fixture apply and verification;
- Task 2B.2 reviewed result/evaluation apply and verification;
- public History smoke for the accepted Task 2B state;
- Task 4A, 4B, and 4C product checkpoints;
- accepted `main` synchronization at `9672b556...`.

**Critical:** never rerun the accepted Task 2B.2 apply.

## Bounded-operation rule

Default:

```text
one preflight
one apply
one verification
```

Repeat only when:

- a concrete blocker or mismatch is observed;
- an apply result is ambiguous;
- an approved recovery path requires it.

After repeated equivalent tooling failure, switch once to a safe direct operator path instead of cycling through similar commands.

A local test, formatting, or output failure after a remotely confirmed atomic commit does not authorize repeating the apply. Inspect post-state once.

## Review sufficiency

- reconnaissance defines scope once;
- implementation receives one focused review;
- corrections address concrete findings;
- a correction does not restart full reconnaissance;
- successful evidence is not re-proved because the conversation changed;
- no review of the review unless new evidence contradicts the verdict.

## Routine result-operation rule

The established production result path is owner-operated:

```text
one provider dry-run
-> one exact API-Football fixture allowlist
-> one apply
-> one public/admin verification
```

Trusted terminal results may be persisted, verified, and evaluated by the apply itself.

The manual reconciliation form is an exception fallback.

Codex is not required for routine execution.

## Technical contracts learned from Task 1C, Task 2A, and Task 2B

### Semantic reviewed-plan binding

Stable authorization excludes only volatile execution/report metadata.

It binds semantic payload, target refs, source hashes, canonical identities, actions, prior state, blockers, conflicts, and expected counts.

A stored checksum is not trusted without recomputation.

### Sanitized provider evidence

Task 2B provider evidence uses a sanitized snapshot contract.

Canonical fixture resolution must consume only the minimal identity fields actually required. Do not rehydrate missing provider fields with invented placeholders or cast sanitized rows to full provider fixtures.

### Manifest and registry verification

Root package manifests and source registries verify against authoritative root hashes. Non-root required files must appear with exact matching hashes.

Blocked plans are ineligible for apply and exit non-zero.

### Timestamp semantic equality

Database timestamps compare by represented instant, not raw string form. Equivalent `Z` and offset strings compare equal. Invalid timestamps fail closed.

### TypeScript/SQL JSON contract

Canonical RPC payload keys must match SQL extraction exactly.

Task 1C publication payload uses snake_case. SQL validates missing, duplicate, unknown, and out-of-scope IDs before mutation.

### Atomicity

Multi-table imports and Task 2B result/evaluation writes use database transactions/RPCs. There is no client-side partial repair or automatic retry after ambiguity.

### Verification mode naming

Internal Task 2B mode is:

```text
verification
```

Do not reintroduce `verify` as an internal plan mode merely because it seems shorter.

### Test filesystem isolation

Tests writing artifacts must use unique per-test or per-suite directories. Shared fixed cleanup paths can create false `ENOENT`, `ENOTEMPTY`, and `EPERM` failures.

## Prediction immutability

- no post-result probability rewrite;
- no post-kickoff evidence in pre-match versions;
- every replacement receives a new immutable version and cutoff;
- verified results and evaluations reference the original version;
- completed-fixture V2 uses `historical_replay`;
- original V1 remains the baseline.

## Data and source governance

- preserve source manifests, provenance, checksums, observed times, cutoffs, and versions;
- external raw workspaces may stay outside Git;
- distinguish historical baseline from current data;
- update newer data incrementally;
- preserve source disagreements and kickoff conflicts;
- do not delete required snapshots before lineage/idempotency are proved;
- no secrets, personal data, or raw payment payloads in artifacts.

## Product and pricing truth labels

Always distinguish:

- implemented repository/runtime truth;
- externally observed runtime truth;
- owner-approved target;
- documentation-only statement;
- unresolved drift.

Current pricing example:

```text
owner-approved target = US$10
owner-observed Wompi display = COP 35,000
tracked repository fallback/tests = US$20 / COP 68,700
```

Do not collapse those into one claim.

## Ownership split

### ChatGPT

- canonical source and runbook authoring;
- roadmap and release interpretation;
- decision and process continuity;
- bounded implementation prompts.

### Codex

- repository inspection;
- bounded code/migration implementation;
- focused tests and static validation;
- exact changed-file and blocker reporting;
- one review of authored docs when requested.

### Operator

- Git and PowerShell;
- Supabase dashboard, SQL Editor, approved RPCs, and PostgREST;
- Railway and deployment surfaces;
- trusted external APIs;
- remote-write approval;
- commit, push, and source replacement.

## Active next-task rule

Primary V2 track:

```text
Task 2C - Ranking, standings, and tournament context
```

Task 2C must preserve completed Task 2A/2B state and stop before candidate generation.

Then:

```text
Task 2D repeatable current signal snapshots
-> Task 3A unpublished V2 shadow candidate
```

Do not turn Task 2C into another foundation rebuild, result-refresh rerun, all-source perfection exercise, or production write path.

## Documentation triggers

Refresh canonical docs after:

- major integration or stage checkpoint;
- branch/PR supersession or merge;
- schema, migration, or environment change;
- V1/V2 visibility milestone;
- source baseline or current-data milestone;
- model candidate, evaluation, or release decision;
- payment/entitlement authority change;
- major operations governance change.

Refresh at meaningful checkpoints, not after every command.
