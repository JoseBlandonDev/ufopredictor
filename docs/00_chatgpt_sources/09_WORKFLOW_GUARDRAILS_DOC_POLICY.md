# Workflow Guardrails and Documentation Policy

_Last refreshed: 2026-06-23._

## Source hierarchy

### ChatGPT shared core

Upload only the 10 files in `docs/00_chatgpt_sources/` to the primary engineering project.

After each approved docs refresh:

1. remove superseded uploaded copies;
2. upload the exact current 10-file set;
3. do not keep old/new canonical truth together.

### Codex runbooks

Detailed execution guidance belongs in `docs/10_codex_runbooks/`.

### Project management

MVP2 scope/backlog tracking belongs in `docs/30_project_management/` and is not required as a ChatGPT project source.

### Archive

Legacy source snapshots remain under `docs/90_archive/` and are historical evidence, not current truth.

## Branch discipline

- `main` is the production baseline;
- production fixes/microreleases branch from current `main`;
- v2 integration branches from current `main`, not the stale v2 branch;
- old v2 branch/PR #106 remain read-only reference until superseded;
- documentation-only branches must not change app code, migrations, environments, or secrets;
- use worktrees for parallel tracks rather than repeatedly switching a dirty directory.

## Change reporting

Every Codex implementation should report:

- starting branch/status and base SHA;
- files inspected/changed;
- exact behavior before/after;
- tests/lint/build/diff-check;
- environment/write scope;
- commit SHA;
- concrete blockers;
- final verdict.

## Prediction immutability

- no post-result probability rewrite;
- no post-kickoff evidence in a pre-match version;
- every replacement prediction needs a new immutable version and cutoff;
- verified results and evaluations reference the original version.

## Data/source governance

- retain source snapshot manifests, provenance, and checksums;
- raw external source workspaces may remain ignored/outside Git;
- register their path and committed equivalents in documentation;
- do not delete raw/prepared snapshots until stage import and idempotency are proven;
- do not commit secrets, credentials, personal data, or raw payment payloads.

## Environment safety

- `ufopredictor.com` and production Supabase are production;
- `stage.ufopredictor.com` and separate Supabase stage are development;
- Task 3B may write only to confirmed stage after read-only audit and approval;
- no new stage/Docker environment;
- no production data cloning for users/payments/entitlements.

## Operations automation governance

Initial automation may:

- discover fixtures;
- synchronize bounded status metadata;
- ingest terminal provider scores into pending review;
- generate reports/notifications;
- assist batch evaluation after verification.

Initial automation may not:

- auto-verify final scores without an approved governance decision;
- rewrite predictions;
- create post-kickoff prediction versions;
- run broad unguarded production writes.

## Documentation update triggers

Refresh canonical docs after:

- production merge affecting product behavior;
- migration/schema or environment change;
- model candidate/release decision;
- payment/entitlement authority change;
- automation governance change;
- branch/PR supersession;
- source snapshot/import milestone.

Do not let a successful PR turn the docs into archaeological fiction by the following morning.
