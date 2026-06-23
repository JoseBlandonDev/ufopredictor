# Roadmap, MVP2 Epics, and Open Decisions

_Last refreshed: 2026-06-23._

## MVP2 objective

MVP2 is not merely “a new model.” It is the shortest safe path from the current sellable MVP1 to a product with:

- first-party normalized football history/reference data;
- reliable fixture coverage and provider links;
- explainable evidence/scenario output;
- reproducible v1/v2 comparison;
- stage-validated immutable prediction versions;
- lower manual operational burden;
- continued production delivery during research.

## P0 - immediate

### Epic M2-01 - branch and environment normalization

- preserve old v2 branch and PR #106;
- create integration branch from current `main`;
- selectively port nine v2 commits;
- use separate worktrees;
- open replacement Draft PR;
- prevent regression to current MVP1.

### Epic M2-02 - remaining World Cup fixture coverage

- discover all remaining group-stage fixture IDs;
- reconcile provider/official schedule links;
- store canonical fixtures in the application database;
- publish near-term predictions with v1 while v2 is pending;
- maintain a not-started eligibility manifest for later v2 versions.

### Epic M2-03 - stage data foundation and Task 3B

- read-only stage audit;
- migration reconciliation;
- migration 0038 in stage;
- idempotent source/history import;
- signal snapshots and immutable development versions;
- RLS/localization/venue validation.

### Epic M2-04 - model integration and release decision

- restore v2 replay/challenger tooling on current main;
- compare v1 and gated v2 under identical cutoffs;
- validate scenario families/evidence/reliability;
- choose v1 probability + v2 analysis or gated v2 + v2 analysis;
- promote only after stage exit gates.

## P1 - parallel and near-term

### Epic M2-05 - operations efficiency and automation

- batch fixture discovery/import;
- relevant-fixture status polling;
- terminal score ingest to `pending_review`;
- once/twice-daily operator run;
- admin notifications;
- bounded batch evaluation persistence;
- run logs, retries, and idempotency proof.

Initial release keeps human result verification mandatory.

### Epic M2-06 - independent MVP1 UI/UX microreleases

Can run from `main` while model work continues:

- mobile/accessibility polish;
- loading/empty/error states;
- visual hierarchy, motion, blur/glow restraint;
- CTA and conversion measurement;
- venue display when trusted;
- admin workflow ergonomics;
- copy deduplication.

These tasks must not depend on v2 analytical tables.

## P2 - after v2 stabilization

### Epic M2-07 - English internationalization foundation

- locale-aware routing/selection;
- translation-key extraction;
- English public/product copy;
- locale-neutral team/competition identity;
- localized metadata fallback;
- Spanish regression protection.

Portuguese is optional and later.

### Epic M2-08 - commercial platform abstraction

- provider-neutral payment event/entitlement adapter;
- evaluate PayPal Business;
- define refund/revocation/reconciliation;
- preserve Wompi as current production provider.

This is not an immediate MVP2 blocker.

## V3 radar

- lineups and major player absences;
- injuries/suspensions/rotation;
- final-group-game qualification pressure;
- rest/travel and tactical context;
- timestamped news evidence;
- market odds only after legal/product review;
- larger holdout and stricter acceptance gates.

## Decisions already made

- MVP1 remains live during v2 work;
- production and stage remain separate;
- no new Docker dependency;
- no new stage environment;
- old v2 branch is preserved, not used as the new base;
- Task 3B starts read-only;
- production writes denied;
- v2 probability is near parity;
- v2 analysis is the main gain;
- scenarios are representative families, not prophecy;
- predictions are immutable after publication/kickoff;
- canonical identity is locale-neutral;
- English comes after v2 stabilization;
- result automation begins with human verification.

## Decisions still required

- exact nine-commit port map;
- final integration branch commit composition;
- exact stage migration reconciliation after audit;
- final stage seed scope;
- v1 probability + v2 analysis versus gated-v2 probability + v2 analysis;
- final public/free/premium signal matrix;
- structured deterministic narrative versus optional LLM polish;
- public proprietary boundary;
- automation governance for result verification/evaluation;
- legal/terms/privacy publication timing;
- second payment provider strategy.

## Delivery rule

Every epic should be split into bounded, deployable increments with an explicit environment, branch base, acceptance evidence, and rollback boundary. Avoid giant cross-cutting PRs that combine model, payments, UI, migrations, and documentation because apparently software is not complicated enough on its own.
