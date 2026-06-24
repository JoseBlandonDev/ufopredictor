# Workflow Guardrails and Documentation Policy

_Last refreshed: 2026-06-24._

## Source hierarchy

### Shared canonical dynamic truth

The exact 10 files under:

```text
docs/00_chatgpt_sources/
```

are the canonical dynamic context shared by ChatGPT and Codex.

They own:

- current product/repository truth;
- current architecture and operations;
- current roadmap/epic status;
- active model/release decisions;
- current next sequence;
- documentation policy.

After every approved refresh:

1. remove superseded uploaded ChatGPT project copies;
2. upload the exact current 10-file set;
3. do not keep old and new canonical truth together.

### Codex runbooks

`docs/10_codex_runbooks/` contains stable execution procedures.

Runbooks should:

- reference the shared sources for live status;
- avoid unnecessary hardcoded SHAs and backlog state;
- preserve exact safety and validation procedures;
- not compete with shared sources as current product truth.

### Optional project sources

`docs/20_optional_project_sources/` contains specialized context that is not required for every engineering conversation.

### Project management

`docs/30_project_management/` contains derived planning and visual tracking assets.

The Markdown tracker and XLSX are non-canonical. If they conflict with:

```text
docs/00_chatgpt_sources/07_ROADMAP_EPICS_DECISIONS.md
```

the shared roadmap wins.

The XLSX may be refreshed less frequently and is not required for ChatGPT project context.

### Archive

`docs/90_archive/` is historical evidence, not current truth.

Do not rewrite archived snapshots merely to make them look current.

## Documentation refresh protocol

### Phase 1 - read-only recognition

Codex:

- starts from clean current `main`;
- reports branch, status, HEAD, and relevant merged PRs;
- inventories active documentation;
- searches for stale claims and contradictions;
- does not modify files;
- classifies files as update, reference-only, derived, or no-change.

### Phase 2 - ChatGPT authoring

ChatGPT:

- interprets implemented behavior and owner decisions;
- authors complete replacement files;
- preserves canonical structure and filenames;
- updates shared sources first;
- updates only the minimal non-shared active documents needed to remove contradictions;
- never edits archive evidence;
- produces an exact application map.

### Phase 3 - Codex apply-only

Codex:

- creates a docs-only branch from current `main`;
- copies the ChatGPT-authored files exactly;
- does not editorialize or rewrite them;
- confirms the diff is documentation-only;
- runs stale-reference searches;
- validates paths, counts, links, and internal consistency;
- runs `git diff --check`;
- commits, pushes, and opens a docs PR.

### Phase 4 - merge and source replacement

After merge:

1. update local `main`;
2. confirm a clean worktree;
3. replace the ChatGPT project source set with the exact refreshed 10 files;
4. preserve runbooks in the repo for Codex use;
5. start the next conversation from `00_START_HERE_CURRENT.md`;
6. do not carry superseded source files into the new conversation.

## Branch discipline

- `main` is the production baseline;
- production fixes and microreleases branch from current `main`;
- v2 integration branches from current `main`, not the stale v2 branch;
- old v2 branch/PR #106 remain preservation/reference until superseded;
- documentation-only branches do not change app code, migrations, environments, or secrets;
- use worktrees for parallel tracks rather than repeatedly switching a dirty directory.

## Change reporting

Every Codex implementation reports:

- starting branch/status and base SHA;
- files inspected/changed;
- behavior before/after;
- tests, lint, build, and diff-check;
- environment/write scope;
- commit SHA;
- concrete blockers;
- final verdict.

## Prediction immutability

- no post-result probability rewrite;
- no post-kickoff evidence in a pre-match version;
- every replacement prediction receives a new immutable version and cutoff;
- verified results and evaluations reference the original version;
- finished-fixture v2 comparison uses labeled `historical_replay`.

## Data/source governance

- retain source manifests, provenance, and checksums;
- raw external workspaces may remain ignored/outside Git;
- register their path and committed equivalents;
- do not delete snapshots until stage import and idempotency are proven;
- do not commit secrets, credentials, personal data, or raw payment payloads.

## Environment safety

- `ufopredictor.com` and production Supabase are production;
- `stage.ufopredictor.com` and separate Supabase stage are development;
- Task 3B writes only to confirmed stage after read-only audit and approval;
- no new stage/Docker environment;
- no production user/payment/entitlement cloning.

## Operations automation governance

Approved normal automation may:

- discover/register exact fixtures;
- synchronize bounded status metadata;
- trust API-Football for valid exact `FT` results;
- automatically verify normal trusted final scores;
- persist eligible evaluations idempotently;
- generate reports and partner exports.

Automation must:

- use dry-run first;
- require exact allowlists for production apply;
- never create post-kickoff predictions;
- never mutate published predictions;
- never silently overwrite a changed verified score;
- route unsupported, incomplete, missing, or contradictory data to exceptions;
- preserve observable audit evidence.

Routine polling should target recent pending/relevant fixtures, not completed historical batches.

## Internationalization governance

Core languages are ES, EN, and PT.

- canonical identity and signal contracts remain locale-neutral;
- localized narrative is rendered separately;
- partner IDs must not depend on translated names;
- French and German are later scope.

## Documentation update triggers

Refresh canonical docs after:

- production merge affecting product behavior;
- migration/schema or environment change;
- model candidate/release decision;
- payment/entitlement authority change;
- automation governance change;
- branch/PR supersession;
- source snapshot/import milestone;
- major tournament coverage/publication milestone;
- language/product scope decision.

A successful merge must not leave current docs describing the previous morning.
