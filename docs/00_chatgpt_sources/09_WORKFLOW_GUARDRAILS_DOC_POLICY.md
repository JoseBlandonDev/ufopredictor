# Workflow Guardrails and Documentation Policy

_Last refreshed: 2026-06-24 after the Prediction Intelligence v2 Task 2 checkpoint._

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
- active model/release decisions;
- exact next sequence;
- documentation policy.

A long-running integration branch may receive a checkpoint refresh before merge when a clean handoff is necessary. Such a refresh must clearly distinguish:

- production `main` truth;
- active integration-branch truth;
- historical branch/reference truth.

After a final merge, refresh again from updated `main` if branch-local status has become merged production/repository truth.

After every approved source refresh:

1. remove superseded uploaded ChatGPT project copies;
2. upload the exact current 10-file set;
3. do not keep old and new canonical truth together.

### Codex runbooks

`docs/10_codex_runbooks/` contains execution procedures.

Runbooks should:

- reference shared sources for live status;
- avoid stale hardcoded backlog assumptions;
- preserve exact safety and validation procedures;
- not compete with shared sources as current product truth.

### Project management

`docs/30_project_management/` contains derived planning assets.

The Markdown tracker and XLSX are non-canonical. If they conflict with:

```text
docs/00_chatgpt_sources/07_ROADMAP_EPICS_DECISIONS.md
```

the shared roadmap wins.

### Archive

`docs/90_archive/` is historical evidence, not current truth.

Do not rewrite archived snapshots merely to make them look current.

## Documentation refresh protocol

### Phase 1 - recognition

Codex:

- verifies the correct branch and clean worktree;
- reports relevant HEAD/PR state;
- inventories active documentation;
- searches for stale claims and contradictions;
- classifies files as update, reference-only, derived, or no-change;
- performs no unrelated implementation work.

For a branch-local checkpoint refresh, recognition uses the active integration branch, not `main`, and records the production baseline separately.

### Phase 2 - ChatGPT authoring

ChatGPT:

- interprets implemented behavior and owner decisions;
- authors complete replacement files;
- preserves canonical filenames and directory ownership;
- updates shared sources first;
- updates only the minimal active runbooks/trackers needed to remove contradictions;
- never rewrites archive evidence;
- produces an exact application map.

### Phase 3 - Codex apply-only

Codex:

- applies the authored replacements exactly on the approved target branch;
- does not editorialize or rewrite them;
- confirms the diff is documentation-only;
- searches for stale active references;
- validates paths, counts, links, and internal consistency;
- runs `git diff --check`;
- commits and pushes only after owner review.

For this checkpoint, the approved target is `integration/prediction-intelligence-v2` so the branch and its handoff stay self-describing. A final post-merge refresh will later originate from updated `main`.

### Phase 4 - source replacement

After the documentation commit is accepted:

1. replace the ChatGPT project source set with the exact refreshed 10 files;
2. preserve Codex runbooks in the repository;
3. start the next conversation from `00_START_HERE_CURRENT.md`;
4. do not carry superseded source files into the new conversation.

After PR #114 eventually merges, repeat the final canonical refresh from `main`.

## Branch discipline

- `main` is the production baseline;
- production fixes and microreleases branch from current `main`;
- active v2 work uses `integration/prediction-intelligence-v2` and Draft PR #114;
- old v2 branch/PR #106 remain preservation/reference;
- no new implementation work enters PR #106;
- documentation-only commits do not change app code, migrations, environments, or secrets;
- use worktrees for parallel tracks rather than switching a dirty directory.

## Owner/Codex responsibility split

Owner terminal work normally includes:

- branch/status verification;
- staging review;
- commit;
- push;
- final log/status confirmation.

Codex work normally includes:

- repository inspection;
- implementation or apply-only documentation changes;
- tests and static validation;
- exact changed-file report;
- concrete blockers and verdict.

Do not spend implementation tokens narrating routine Git commands already handled by the owner.

## Prediction immutability

- no post-result probability rewrite;
- no post-kickoff evidence in a pre-match version;
- every replacement prediction receives a new immutable version and cutoff;
- verified results and evaluations reference the original version;
- finished-fixture v2 comparison uses labeled `historical_replay`.

## Historical research eligibility

Preserved v2 research artifacts must not become current through naming alone.

Where declared by manifests:

```text
historicalOnly: true
currentCandidateEligible: false
currentReleaseDecisionEligible: false
currentPublicationEligible: false
```

Current candidate generation requires current data, current cutoffs, stage validation, and an explicit release decision.

## Local-only output governance

Task 2 runners may write only to strict descendants of their own runner-specific `local-run` roots.

Guards must use normalized/resolved filesystem containment, not textual prefix matching.

Reject:

- preserved historical paths;
- arbitrary repository paths;
- external absolute paths;
- sibling runner roots;
- traversal outside the allowed root;
- the local-run root itself.

Task 3A must use equivalent fail-closed local-only principles.

## Data/source governance

- retain source manifests, provenance, and checksums;
- raw external workspaces may remain ignored/outside Git;
- register their path and committed equivalents;
- do not delete snapshots until stage import and idempotency are proven;
- do not commit secrets, credentials, personal data, or raw payment payloads;
- historical artifacts do not automatically become approved stage seed data.

## Environment safety

- `ufopredictor.com` and production Supabase are production;
- `stage.ufopredictor.com` and separate Supabase stage are development;
- migration 0038 is committed but not applied;
- Task 3A is planner/dry-run only;
- Task 3B begins read-only;
- stage writes require explicit owner approval after audit;
- no production user/payment/entitlement cloning;
- no production writes during M2-01 or M2-03.

## Operations automation governance

Approved normal production automation may:

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

## Documentation update triggers

Refresh canonical docs after:

- major integration checkpoint;
- branch/PR supersession or merge;
- migration/schema or environment change;
- stage import milestone;
- model candidate/release decision;
- payment/entitlement authority change;
- automation governance change;
- major tournament coverage/publication milestone;
- language/product scope decision.

A successful checkpoint or merge must not leave active documentation describing the prior phase as future work.
