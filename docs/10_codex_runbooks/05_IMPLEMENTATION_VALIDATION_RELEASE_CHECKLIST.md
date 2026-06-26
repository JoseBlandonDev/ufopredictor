# Implementation, Validation, and Release Checklist

_Last refreshed: 2026-06-26 after Task 3B stage bootstrap completion._

## Every task

- start from the declared branch and reviewed base;
- prove worktree status;
- declare environment and write scope;
- identify production deny boundaries;
- keep changes bounded to the requested concern;
- add focused tests;
- run lint and diff-check;
- classify typecheck or build failures as task-local or preexisting;
- report exact behavior, evidence, and final HEAD;
- do not mix implementation, unrelated cleanup, and broad documentation rewrites.

## Production microrelease

- branch from current `main`;
- no dependency on unfinished stage-only data;
- no regression to Auth, Wompi, entitlements, public history, or partner export;
- mobile and basic accessibility smoke;
- production deploy only after PR validation;
- merge accepted `main` changes into the V2 integration branch through normal Git history.

## V2 integration branch

- preserve old V2 branch and PR #106;
- use `integration/prediction-intelligence-v2` and Draft PR #114;
- no blanket old-branch cherry-pick;
- protect production behavior;
- no production writes;
- verify actual HEAD before work.

## Task 3B completed checkpoint

Required proof, now satisfied:

- explicit stage project and production deny ref;
- 46 migrations externally verified;
- migration 0038 applied to stage only;
- required analytical tables readable;
- idempotent non-sensitive import;
- balanced accounting and zero conflicts;
- second apply with zero inserts and zero updates;
- Auth/admin preservation;
- public/admin stage smoke;
- selected non-sensitive evidence artifacts;
- no production, Wompi, payment, entitlement, webhook, session, or personal-data write.

Do not reopen Task 3B unless a concrete schema, source, or recovery need exists.

## Stage V1 Visible Predictions Slice

Before apply:

- exact 24-fixture Matchday 3 allowlist;
- deterministic mapping by provider ID, external ID, or verified canonical slug;
- complete immutable V1 source identified;
- production source access read-only and exact-scope;
- no probability, xG, score, confidence, risk, market, narrative, or timestamp recomputation;
- canonical V1 model identity resolved;
- per-table balanced dry-run;
- no Auth/payment/entitlement scope.

After apply:

- exactly 24 expected V1 fixture baselines available in stage;
- active V1 model version present;
- public prediction projection populated;
- `/predictions` and match detail load;
- admin queue and review surfaces remain coherent;
- second run produces zero row growth;
- Auth/admin unchanged;
- production untouched.

## Current-data refresh

- source and observed time recorded;
- explicit evidence cutoff;
- current fixture/result scope;
- Elo and FIFA source mapping;
- standings and tournament-form calculation tested;
- source hashes and provenance retained;
- idempotent refresh;
- no later evidence used for an earlier fixture.

## V2 live candidate and historical replay

- original V1 baseline preserved;
- current candidate uses a not-started fixture and explicit cutoff;
- historical replay uses pre-kickoff evidence only;
- model, feature, purpose, and predecessor metadata stored;
- probability movement bounded;
- missing and contradictory signals reported;
- scenario families and representative scores coherent;
- explanation facts trace to structured evidence;
- no release claim from historical artifacts alone.

## Parallel expert product work

- branch from current `main` when production-safe;
- use existing V1 information without changing calculations;
- do not invent absent statistics;
- support missing data gracefully;
- keep facts locale-neutral and render text separately;
- prepare ES/EN/PT contracts;
- do not duplicate V2 data/model implementation.

## Ops automation

- dry-run and report mode;
- exact target and fixture scope;
- run logging;
- idempotent retries;
- terminal scores only to supported verification flow;
- human exception handling retained;
- no prediction rewrite.

## Production promotion

- accepted stage state;
- visible V1 baseline;
- current-data cutoff audit;
- V1/V2 comparison evidence;
- selected probability mode;
- rollback plan;
- regression suite for commercial, public, admin, and partner flows;
- owner approval;
- documentation refresh after merge.
