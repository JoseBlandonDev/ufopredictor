# Workflow Guardrails and Documentation Policy

_Last refreshed: 2026-06-26 after the Task 1C Matchday 3 fixture-linkage checkpoint and workflow simplification decision._

## Source hierarchy

### Shared canonical dynamic truth

The exact 10 files under:

```text
docs/00_chatgpt_sources/
```

are the canonical dynamic context shared by ChatGPT and Codex.

They own:

- current production and active-branch truth;
- architecture and operations;
- roadmap and epic status;
- active model and release decisions;
- exact next sequence;
- documentation policy.

A long-running integration branch may receive a checkpoint refresh before merge when a clean handoff is necessary.

After every approved source refresh:

1. remove superseded uploaded ChatGPT project copies;
2. upload the exact current 10-file set;
3. do not keep old and new canonical truth together.

### Codex runbooks

`docs/10_codex_runbooks/` contains execution procedures.

Runbooks:

- reference shared sources for live status;
- preserve exact safety and validation procedures;
- do not compete with shared sources as product truth;
- are updated only when a completed checkpoint makes an active procedure stale.

### Project management

Derived trackers are non-canonical.

If they conflict with:

```text
docs/00_chatgpt_sources/07_ROADMAP_EPICS_DECISIONS.md
```

the shared roadmap wins.

### Archive

Archived snapshots are historical evidence, not current truth.

Do not rewrite archives merely to make them look current.

## Documentation refresh protocol

### Phase 1 - recognition

Codex:

- verifies branch, HEAD, status, and environment scope;
- inventories active documentation and runbooks;
- searches for stale claims and contradictions;
- reports implemented facts and exact evidence;
- does not author canonical source truth unless explicitly delegated.

### Phase 2 - ChatGPT authoring

ChatGPT:

- interprets implemented behavior and owner decisions;
- authors complete replacement files;
- preserves canonical filenames and ownership;
- updates the 10 shared sources first;
- updates only runbooks needed to remove active contradictions;
- never rewrites archive evidence;
- records completed work separately from future roadmap decisions.

### Phase 3 - Codex review and apply-only

Codex:

- reviews authored replacements against repository and runtime evidence;
- reports `ACCEPTED` or exact required corrections;
- applies accepted replacements exactly when instructed;
- does not editorialize broad new content during apply-only work;
- confirms documentation-only paths;
- searches for stale active references;
- runs `git diff --check` and relevant consistency checks.

### Phase 4 - owner Git actions and source replacement

The owner normally:

- reviews final status and diff;
- stages exact implementation, evidence, and documentation files;
- commits and pushes;
- confirms final HEAD and clean status;
- replaces ChatGPT project sources with the accepted 10 files;
- starts the next conversation from `00_START_HERE_CURRENT.md`.

## Branch discipline

- `main` is the production baseline;
- production fixes and independent product improvements branch from current `main`;
- active V2 work uses `integration/prediction-intelligence-v2` and Draft PR #114;
- old V2 branch and PR #106 remain preservation only;
- no new implementation work enters PR #106;
- use normal merges or rebases to carry accepted `main` improvements into the integration branch;
- do not implement the same product change manually in both branches;
- use worktrees for parallel tracks rather than switching a dirty directory.

## MVP2 roadmap naming

New MVP2 planning uses:

```text
Epic 1, Epic 2, Epic 3...
Task 1A, 1B, 1C...
```

Do not create long compound identifiers or unnecessary third-level codes.

Old `M2-xx` names remain historical references only.

## Owner and Codex responsibility split

The owner may directly operate:

- Git;
- PowerShell and local scripts;
- Supabase dashboard, SQL Editor, PostgREST, and approved RPCs;
- Railway configuration and deployment surfaces;
- trusted external APIs;
- staging, commit, push, final log, and source replacement.

Codex normally handles:

- repository inspection;
- bounded implementation;
- tests and static validation;
- runbook inventory;
- authenticated stage smoke checks where appropriate;
- exact changed-file reports;
- concrete blockers and verdicts.

Codex is not a required intermediary for routine Git, Supabase, Railway, SQL, or API operations.

ChatGPT owns canonical shared-source authoring in the current project workflow.

For bounded operations, use:

```text
one preflight
one apply
one verification
```

Repeat only when a concrete blocker, mismatch, or approved recovery need exists.

After repeated CLI or tooling failure, switch once to a safe direct owner-operated path rather than cycling through equivalent retries.

A local verification-script failure after a remotely confirmed atomic commit does not authorize repeating the apply. Read the actual remote state once.

Trusted API-Football identity or terminal-result evidence that already passed the approved checks is not re-audited without a concrete conflict.

## Prediction immutability

- no post-result probability rewrite;
- no post-kickoff evidence in a pre-match version;
- every replacement prediction receives a new immutable version and cutoff;
- verified results and evaluations reference the original version;
- finished-fixture V2 comparison uses labeled `historical_replay`;
- original production V1 publications remain the baseline.

## Historical research eligibility

Preserved V2 research artifacts do not become current through naming alone.

Where declared:

```text
historicalOnly: true
currentCandidateEligible: false
currentReleaseDecisionEligible: false
currentPublicationEligible: false
```

Current candidate generation requires current data, explicit cutoffs, stage validation, and a release decision.

## Data and source governance

- retain source manifests, provenance, and checksums;
- raw external workspaces may remain ignored or outside Git;
- register their path and committed equivalents;
- do not delete required snapshots until import and idempotency are proved;
- do not commit secrets, credentials, personal data, or raw payment payloads;
- distinguish file-backed snapshots from explicit non-file-backed sentinels;
- historical artifacts are not automatically approved current input;
- structured facts remain locale-neutral;
- localized explanations do not change underlying model facts.

## Environment safety

- production project is `gcpdffkgsdomzyoenalg`;
- stage project is `yfmklapgjrupctgxaako`;
- `.env.stage.local` is the sole active local stage environment file;
- migration 0038 is applied in stage only;
- the prior stage migration history is externally verified at 46 entries;
- Task 3B foundation import is complete and idempotent;
- Task 1C fixture-linkage migration `20260626220000` is applied manually and operational in stage;
- migration-history repair for `20260626220000` remains pending and non-blocking;
- the exact 24 Matchday 3 rows are linked and verified;
- do not rerun the Task 1C linkage migration or apply;
- production writes remain forbidden from the V2 integration workflow;
- no production user, payment, entitlement, webhook, session, or personal-data cloning;
- stage Wompi and optional AI configuration remain out of scope until explicitly scheduled;
- authenticated browser automation may inspect stage, not production.

## Operations automation governance

Approved normal automation may:

- discover and register exact fixtures;
- synchronize bounded status metadata;
- trust API-Football for valid exact identity and terminal results;
- persist eligible evaluations idempotently;
- generate reports and partner exports;
- refresh approved stage reference and signal snapshots.

Automation must:

- use one preflight, one apply, and one verification for a bounded operation;
- require exact allowlists for production apply;
- use explicit target and deny boundaries;
- never create post-kickoff predictions;
- never mutate published predictions;
- never silently overwrite a changed verified score;
- preserve observable audit evidence;
- prove rerun idempotency for imports and publication baselines;
- avoid repeated equivalent retries after a tooling failure;
- escalate only concrete exceptions to human review.

Direct owner-operated PowerShell, SQL, Supabase, Railway, Git, or trusted API execution is an approved operating mode when it preserves the same scope and safety boundaries.

## Parallel product work governance

A separate owner may implement the Expert Product Experience epic while the main owner continues data and model work.

That parallel work:

- uses a branch from current `main` when production-safe;
- may improve use of existing V1 information;
- may prepare locale-neutral UI contracts;
- must tolerate absent future data;
- must not change model probabilities or fabricate statistics;
- must not depend on unfinished stage-only data for production availability;
- flows into the integration branch through normal Git history.

## Documentation update triggers

Refresh canonical docs after:

- major integration checkpoint;
- branch or PR supersession or merge;
- migration, schema, or environment change;
- stage import milestone;
- fixture-linkage milestone;
- visible V1 baseline milestone;
- current-data refresh milestone;
- model candidate or release decision;
- payment or entitlement authority change;
- automation governance change;
- major tournament coverage or publication milestone;
- language or product-scope decision.

Refresh at meaningful checkpoints, not after every command.

A successful checkpoint must not leave active documentation describing the completed phase as future work.
