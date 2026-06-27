# Implementation, Validation, and Release Checklist

_Last refreshed: 2026-06-27 after Epic 1 completion._

## Every task

- verify branch, HEAD, and worktree;
- declare environment, read scope, write scope, and production denial;
- state the exact completed checkpoint that must not be reopened;
- identify source cutoff and freshness status;
- keep implementation bounded;
- add focused tests for code changes;
- run lint and diff-check;
- classify typecheck/build failures as task-local or preexisting;
- report exact behavior, evidence, changed files, and final state;
- record important technical/process decisions in the authoritative docs;
- do not mix unrelated cleanup, product work, payments, and broad documentation rewrites.

## Review and execution rule

```text
one reconnaissance
one focused implementation review
one preflight
one apply
one verification
```

Repeat only for a concrete defect, mismatch, ambiguous result, or approved recovery.

A focused correction does not restart reconnaissance.

After repeated equivalent tooling failure, switch once to a safe direct owner-operated path.

## Closed Epic 1 checkpoint

Confirmed:

- separate stage and production projects;
- migration 0038 and foundation data in stage;
- Task 3B idempotency;
- 24 exact fixture links;
- 1 active V1 model;
- 24 immutable predictions;
- 240 markets;
- 24 public fixtures;
- state `exact_complete`;
- `/predictions` smoke;
- production untouched.

Do not rerun Task 3B, fixture linkage, or V1 import without a recovery task.

## V2 Signal Baseline Database Load

Before apply:

- prepared 2026-06-20 package identified;
- baseline explicitly labeled historical;
- committed equivalents inspected;
- exact destination tables and natural keys defined;
- source/checksum/cutoff/version lineage mapped;
- optional and missing signals classified;
- stage and production-deny refs explicit;
- balanced dry-run;
- no candidate publication in scope.

After apply:

- exact counts verified;
- conflicts and rejects explained;
- fixture signal coverage query passes;
- lineage is queryable;
- no Auth/payment/entitlement scope;
- production untouched;
- second exact run produces zero duplicate growth.

## Current-data incremental refresh

- source and observed time recorded;
- explicit evidence cutoff;
- fixture/result scope bounded;
- Elo/FIFA mappings deterministic;
- standings and tournament form tested;
- source hashes/provenance retained;
- historical snapshots not overwritten;
- no later evidence used for earlier fixture.

## V2 shadow candidate

- predecessor V1 preserved;
- not-started fixture;
- model/feature/purpose/lineage stored;
- cutoff and calculation time explicit;
- source/signal snapshots linked;
- movement bounded;
- missing/contradictory signals reported;
- scenario families coherent;
- candidate unpublished.

## Historical replay

- completed fixture only;
- pre-kickoff evidence only;
- labeled `historical_replay`;
- original V1 publication untouched;
- no release claim from replay alone.

## Production microrelease

- branch from current `main`;
- no dependency on unfinished stage-only data;
- no regression to Auth, Wompi, entitlements, public history, or partner export;
- mobile/basic accessibility smoke;
- merge accepted `main` changes normally into the V2 integration branch.

## Production promotion

- accepted stage state;
- current-data cutoff audit;
- V1/V2 comparison;
- selected release mode;
- immutable version proof;
- rollback plan;
- commercial/public/admin/partner regressions covered;
- owner approval;
- documentation refresh after merge.

## Documentation ownership

- ChatGPT authors canonical sources and runbooks.
- Codex reviews once or applies exact accepted files when delegated.
- The operator commits, pushes, and replaces uploaded canonical sources.
