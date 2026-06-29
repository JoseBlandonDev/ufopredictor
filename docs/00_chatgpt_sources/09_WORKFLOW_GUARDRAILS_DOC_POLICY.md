# Workflow Guardrails and Documentation Policy

_Last refreshed: 2026-06-27 after Task 2A reached `exact_complete`, PR #119 merged, and the synchronized V2 integration checkpoint moved to `4f758b2`._

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
- exact next sequence;
- technical, operational, and process decisions;
- responsibility ownership.

After an approved refresh, replace the complete 10-file uploaded source set. Do not keep superseded and current canonical copies together.

### Codex runbooks

```text
docs/10_codex_runbooks/
```

Runbooks own stable procedure. They reference canonical sources for live status and are updated only when a checkpoint makes an active procedure stale.

### Archive and derived trackers

Archives preserve historical evidence and are not rewritten to look current.

Derived trackers are non-canonical. If they conflict with `07_ROADMAP_EPICS_DECISIONS.md`, the canonical roadmap wins.

## Documentation must preserve decisions, not only outcomes

When a decision is important, record where it has authority:

- `Decision:` selected path;
- `Motivo:` why it was selected;
- `Alternativa descartada:` meaningful rejected path;
- `Consecuencia operativa:` what future work must do;
- `No repetir:` completed work or invalid loop;
- `Responsable:` ChatGPT, Codex, or operator;
- `Siguiente transición:` next bounded action.

Do not invent decisions that are not supported by conversation, repository evidence, or runtime evidence.

## Documentation refresh workflow

### ChatGPT authoring

ChatGPT:

- interprets implementation evidence and owner decisions;
- authors canonical sources and required runbooks;
- integrates decisions in the authoritative document rather than a detached summary;
- preserves exact filenames and canonical paths;
- distinguishes completed state, non-blocking debt, and future work.

### Codex role

Codex may:

- verify repository facts;
- review authored replacements once;
- report `ACCEPTED` or concrete corrections;
- apply accepted files exactly when delegated;
- run diff and consistency checks.

Codex does not need to perform a fresh general documentation audit when ChatGPT already has the files and full checkpoint context.

### Operator role

The operator:

- chooses the final scope;
- provides any runbook not available to ChatGPT;
- reviews the final package;
- places files in the repository;
- runs Git actions;
- replaces the uploaded canonical source set.

## Branch discipline

- `main` is the production baseline;
- production-safe V1/product changes branch from current `main`;
- active V2 work uses `integration/prediction-intelligence-v2` and Draft PR #114;
- production `main` checkpoint HEAD is `9f89d62`;
- V2 integration checkpoint HEAD is `4f758b2`;
- Task 2A implementation commit is `9491fd8`;
- old V2 branch and PR #106 are preservation only;
- accepted `main` changes flow into the integration branch through normal merge/rebase history;
- do not manually implement the same product change in both branches;
- use worktrees when two owners need parallel dirty workspaces;
- PR #117 and PR #119 are merged and synchronized into V2.

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
- stage remote writes require explicit target and production deny ref;
- migration presence in Git is not proof of remote application.

## Closed checkpoints

The following are closed:

- Task 3B foundation bootstrap;
- migration 0038 stage foundation apply;
- exact 24-fixture linkage;
- immutable V1 model/prediction/market import;
- V1 activation and publication;
- exact-complete verification;
- stage `/predictions` smoke;
- Task 2A V2 Signal Baseline Database Load;
- Task 2A reviewed apply and exact-complete zero-growth verification;
- Task 4A V1 information inventory;
- Task 4B Public Expert Read;
- PR #117 production checkpoint;
- Task 4C football-first premium terminology;
- PR #119 main merge and V2 synchronization;
- latest exact five-result production applies and public verification.

**No repetir:** do not reopen them without a concrete defect, mismatch, or approved recovery task. In particular, do not rerun Task 2A dry-run, apply, or verification ceremonially.

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

A local verification failure after a remotely confirmed atomic commit does not authorize repeating the apply. Read the remote state once.

## Review sufficiency

- reconnaissance defines scope once;
- implementation receives one focused review;
- corrections address concrete findings;
- a correction does not restart the full reconnaissance;
- successful evidence is not re-proved merely because the conversation changed;
- no review of the review unless new evidence contradicts the prior verdict.

## Routine result-operation rule

The established production result path is owner-operated:

```text
one provider dry-run
-> one exact API-Football fixture allowlist
-> one apply
-> one public/admin verification
```

Trusted terminal results may be persisted, verified, and evaluated by the apply itself. An empty pending-review queue is therefore expected.

The manual reconciliation form enabled by migration 0039 is an exception fallback, not the normal workflow.

Codex is not required for routine execution of this protocol.

## Technical contracts learned from Task 1C and Task 2A

### Semantic reviewed-plan binding

Stable authorization excludes only volatile execution/report metadata such as generated time, local paths, run mode, and zero-write display flags.

It still recomputes and binds semantic payload, target refs, source hashes, canonical identities, actions, prior state, blockers, conflicts, and expected counts.

A stored checksum is never trusted without independently recomputing the reviewed artifact and current canonical projections.

### Manifest and registry verification

Root package-manifest and source-registry files verify against authoritative root hashes and are not required to contain self-entries. Non-root required files must appear in the manifest contract with exact matching hashes.

Blocked plans print explicit blockers, are ineligible for apply, and exit non-zero.

### Timestamp semantic equality

Database-returned timestamp formatting must be compared by represented instant, not raw string form. `Z` and equivalent offsets compare equal. Invalid timestamps fail closed, and a genuinely different instant remains a conflict. Timestamp fields remain semantically bound.

### TypeScript/SQL JSON contract

Canonical RPC payload keys must match SQL extraction exactly. Publication payload uses snake_case and SQL validates null, missing, duplicate, unknown, and out-of-scope IDs before mutation.

### Atomicity

Multi-table model/prediction/market/publication imports use one PostgreSQL transaction. Task 2A uses one full-batch insert statement under exact-state authorization. There is no client-side partial repair, upsert overwrite, or automatic retry after ambiguity.

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
- committed equivalents must be documented;
- distinguish historical baseline from current data;
- do not wait for perfect freshness before proving storage and pipeline contracts;
- update newer data incrementally;
- do not delete required snapshots before lineage and idempotency are proved;
- no secrets, personal data, or raw payment payloads in artifacts.

## Ownership split

### ChatGPT

- canonical source and runbook authoring;
- roadmap and release interpretation;
- decision and process continuity;
- bounded implementation prompts and owner instructions.

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

Codex is not a required intermediary for routine operator actions.

## Active next-task rule

Primary V2 track:

```text
Task 2B - Current fixture and result refresh
```

It preserves the completed 48-row Task 2A baseline and refreshes only newer or changed fixture/result facts before Task 2C and Task 2D.

Parallel MVP1 track:

```text
Task 4A, Task 4B, and Task 4C are complete.
No new parallel task is active in this checkpoint.
```

Do not mix the tracks. Do not turn Task 2B into another foundation rebuild, all-source perfection exercise, candidate-generation task, or production write path.

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
