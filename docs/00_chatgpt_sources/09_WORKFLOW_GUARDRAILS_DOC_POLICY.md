# Workflow Guardrails and Documentation Policy

_Last refreshed: 2026-06-27 after Task 1C completion and the transition to active V2 data work._

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
- current checkpoint HEAD is `bce9999`;
- old V2 branch and PR #106 are preservation only;
- accepted `main` changes flow into the integration branch through normal merge/rebase history;
- do not manually implement the same product change in both branches;
- use worktrees when two owners need parallel dirty workspaces.

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
- stage `/predictions` smoke.

**No repetir:** do not reopen them without a concrete defect, mismatch, or approved recovery task.

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

## Technical contracts learned from Task 1C

### Semantic reviewed-plan binding

Stable authorization excludes only volatile report metadata such as generated time, local paths, and run mode.

It still recomputes and binds semantic payload, target refs, source checksums, stage IDs, publication actions, prior state, and expected counts.

### TypeScript/SQL JSON contract

Canonical RPC payload keys must match SQL extraction exactly. Publication payload uses snake_case and SQL validates null, missing, duplicate, unknown, and out-of-scope IDs before mutation.

### Atomicity

Multi-table model/prediction/market/publication imports use one PostgreSQL transaction. No client-side partial write chain, upsert repair, or automatic retry after ambiguous failure.

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

The active next task is:

```text
V2 Signal Baseline Database Load
```

It uses the preserved 2026-06-20 package as a reproducible baseline, then hands off to incremental current-data refresh and the first V2 shadow candidate.

Do not turn this into another environment-normalization, full-repository audit, or all-source perfection task.

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
