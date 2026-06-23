# Implementation, Validation, and Release Checklist

_Last refreshed: 2026-06-23._

## Scope discipline

- define one bounded objective;
- inspect exact code/data paths;
- avoid unrelated refactors;
- keep production and v2 branches separate;
- document deferred work explicitly.

## Code validation

- focused tests for changed behavior;
- affected page/query/component tests;
- lint;
- production build;
- `git diff --check`;
- restore generated files not meant for commit;
- confirm `.env*` remains ignored.

## Data/operations validation

- target environment proven;
- exact fixture IDs/date bounds;
- dry-run reviewed before apply;
- idempotency checked;
- public/internal projections checked;
- verification/evaluation queues checked;
- no secrets in output.

## MVP1 regression gates

- anonymous/free/premium/admin segmentation;
- Auth safe redirect;
- pricing/checkout for authenticated user;
- webhook-driven entitlement;
- public upcoming/in-progress/awaiting/results lifecycle;
- immutable historical prediction;
- admin route protection;
- mobile/basic usability.

## V2 stage gates

- migration/schema audit;
- migration 0038 stage-only;
- data counts and duplicate-free rerun;
- cutoff/provenance;
- signal snapshots;
- immutable development predictions;
- RLS/localization/venue/UI;
- probability regression and scenario review.

## PR report format

1. branch/base/status;
2. root cause/objective;
3. files changed;
4. exact behavior before/after;
5. tests and results;
6. lint/build/diff-check;
7. environment/data safety confirmation;
8. commit SHA;
9. concrete blockers;
10. final verdict.
