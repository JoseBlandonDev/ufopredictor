# Implementation, Validation, and Release Checklist

_Last refreshed: 2026-06-23._

## Every task

- start from the declared base branch/SHA;
- prove worktree status;
- declare environment/write scope;
- keep changes bounded to the requested concern;
- add focused tests;
- run lint/build/diff-check when applicable;
- report exact behavior and commit SHA.

## MVP1 microrelease

- branch from current `main`;
- no migration 0038 dependency;
- no regression to Auth/Wompi/entitlements/public history;
- mobile/basic accessibility smoke;
- production deploy only after PR validation.

## V2 branch normalization

- preserve old v2 branch and PR #106;
- create integration branch from current main;
- audit nine commits;
- port by bounded concern;
- exclude stale frontend/docs unless manually reconciled;
- run current MVP1 tests after each port group;
- capture preservation matrix;
- open replacement Draft PR.

## Task 3B

- read-only stage audit first;
- human-approved sync plan;
- stage-only migration/import;
- zero production writes;
- idempotency proof;
- RLS/localization/venue/public UI validation;
- immutable not-started development predictions;
- v1/v2 comparison.

## Ops automation

- dry-run/report mode;
- exact target/fixture scope;
- run logging;
- idempotent retries;
- terminal scores only to pending review;
- human verification retained;
- no prediction rewrite.

## Production promotion

- accepted stage state;
- selected probability mode;
- current-fixture cutoff audit;
- rollback plan;
- regression suite for commercial/public/admin flows;
- owner approval;
- docs refresh after merge.
