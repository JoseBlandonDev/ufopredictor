# Start Here - UFO Predictor Current

_Last refreshed: 2026-06-29 after PR #120, the production Round-of-32 publication batch, the Croatia vs Ghana result refresh, and the MVP 1.5 product-polish planning checkpoint._

## Current truth

UFO Predictor currently has:

- a commercially usable MVP1 in production;
- a separate stage environment for Prediction Intelligence V2;
- an active V2 integration branch and Draft PR;
- an immutable V1-compatible public prediction baseline;
- a persisted V2 baseline in stage;
- 15 future Round-of-32 fixtures published with internal and public predictions;
- Croatia 2-1 Ghana stored, verified, evaluated, and visible in public history;
- South Africa 0-1 Canada stored and verified without a retrospective prediction;
- no released V2 probability candidate in production;
- a newly declared MVP 1.5 product-polish track for Free and Premium presentation.

Production remains on the V1-compatible probability layer. V2 continues behind the production product surface.

**Decision:** V1 remains the published comparison baseline while V2 is developed in shadow/stage mode.

**Decision:** MVP 1.5 may improve product presentation and commercial clarity in parallel, but it must not alter the V2 model or diverge from `main` for long periods.

## Repository and PR baseline

Last production checkpoint confirmed by the operator:

```text
production branch: main
production main HEAD: 6e43cb0e6575bff42372d021c8c35628e912a1e7
upstream: origin/main
tracked worktree: clean
local untracked state: operational JSON artifacts only
```

Last confirmed V2 checkpoint available to the shared project:

```text
active V2 branch: integration/prediction-intelligence-v2
active V2 Draft PR: #114
last confirmed V2 HEAD: dc0187e31770e7a03d57db25d3887967bdaef09a
```

Always recompute live SHAs and ahead/behind state before implementation. Do not treat this document as authorization to write to a remote environment.

Preserved historical source:

```text
old branch: feature/prediction-intelligence-v2-data-foundation
old Draft PR: #106
status: preservation/reference only
```

Do not resume work on PR #106. Do not blanket-merge or blanket-cherry-pick it.

## Environment map

```text
production domain: ufopredictor.com
production Supabase: gcpdffkgsdomzyoenalg

stage domain: stage.ufopredictor.com
stage Supabase: yfmklapgjrupctgxaako

canonical local stage env: .env.stage.local
```

Production and stage have separate Auth, users, sessions, roles, entitlements, data, and secrets.

No third environment is required for normal work.

## Production product checkpoint

Completed production behavior includes:

- public landing, predictions, match detail, pricing, panel, history, and transparency surfaces;
- anonymous, registered-free, Premium, and admin separation;
- Wompi checkout and approved-webhook entitlement activation;
- Premium match detail with scenarios, xG, BTTS, totals, confidence, and risk;
- verified public result history;
- saved-match support;
- bounded API-Football fixture and result operations;
- exact publication queue for future fixtures;
- football-first public terminology;
- 15 Round-of-32 public predictions.

## Pricing truth and repository drift

Owner-approved and operator-confirmed production presentation:

```text
base commercial price: US$10
current production/Wompi display observed by the owner: COP 35,000
payment type: one-time
```

This is owner-approved commercial/product truth plus operator-observed production evidence. It is not yet tracked-repository implementation truth.

The repository still contains stale references to the previous US$20 / COP 68,700 contract in migration history, UI fallback, and pricing tests. MVP 1.5 must reconcile those implementation references before the next pricing-related release.

Other currency displays are references only unless checkout actually supports charging in that currency.

## Round-of-32 production checkpoint

The following is operator-confirmed production evidence supported by local operational artifacts. It is not independently derivable from tracked Git state alone.

Future fixtures published:

```text
Brazil vs Japan
Germany vs Paraguay
Netherlands vs Morocco
Ivory Coast vs Norway
France vs Sweden
Mexico vs Ecuador
England vs Congo DR
Belgium vs Senegal
USA vs Bosnia & Herzegovina
Spain vs Austria
Portugal vs Croatia
Switzerland vs Algeria
Australia vs Egypt
Argentina vs Cape Verde Islands
Colombia vs Ghana
```

Operational outcome:

```text
future fixtures loaded: 15
internal predictions saved: 15
public predictions published: 15
publish queue after completion: empty
```

Result exceptions resolved:

```text
Croatia 2-1 Ghana:
- provider fixture ID 1489420
- exact dry-run passed
- result verified
- original prediction evaluated
- idempotency verification passed
- visible in public history

South Africa 0-1 Canada:
- provider fixture ID 1561329
- result stored and verified
- no prediction existed before kickoff
- no retrospective prediction created
- excluded from prediction history and accuracy
```

South Africa vs Canada is valid public match/result data, but the current `/predictions` history only lists matches with public prediction versions. A future product improvement may add a separate “official results without prediction” surface.

## API-Football operator rule

API-Football is the operational source of truth for:

- provider fixture ID;
- home/away identity;
- kickoff;
- round;
- provider status;
- venue and city when supplied;
- final score.

Official FIFA information may be used as a canonical tournament cross-check. Wikipedia, press graphics, social posts, and secondary pages are not write authority.

Routine lookup, dry-run, apply, publication, and verification are owner-operated from PowerShell and existing admin surfaces. Codex is not required for routine provider discovery or result operations.

Codex is reserved for:

- code defects;
- implementation;
- migrations;
- architecture changes;
- tests;
- complex debugging of a proven operator path.

## Venue and time-zone decision

Current venue absence is a pipeline limitation, not evidence that the World Cup venue is unknown.

The existing ingestion path currently discards API-Football venue data and writes `matches.venue_id = null`. The database already has a usable `venues` table and match foreign key, so the planned fix does not require a new schema migration.

Public kickoff presentation should prioritize:

1. viewer-local time when safely available from the browser;
2. a compact fallback/reference set:
   - Mexico;
   - Colombia / Peru;
   - Argentina / Chile;
   - Spain.

Country pairs are grouped only when their local times are equal for the actual kickoff date. UTC remains the stored source timestamp.

## MVP 1.5 track

MVP 1.5 is the bounded product-polish and commercial-clarity track.

It includes:

- stronger Free-to-Premium conversion;
- a visible but non-invasive Premium identity;
- removal of redundant/internal copy;
- improved Premium match response hierarchy;
- pricing and coverage clarity;
- venue persistence/display;
- viewer-local and compact reference times;
- better panel, pricing, landing, predictions, and transparency surfaces;
- consistent Spanish product terminology;
- terms/coverage wording;
- public results without prediction as a separate future surface.

It excludes:

- probability recalculation;
- V2 signal or model changes;
- calibration changes;
- post-kickoff prediction generation;
- broad schema work unrelated to product presentation.

## Parallel branch rule

The future MVP 1.5 branch must start from current `main`.

Recommended flow:

```text
current main
-> create bounded MVP 1.5 branch
-> merge current main into MVP 1.5 at defined checkpoints
-> merge reviewed MVP 1.5 releases into main
-> synchronize updated main into integration/prediction-intelligence-v2
```

Do not allow MVP 1.5 and V2 to evolve as unrelated long-lived products. Do not broadly merge unfinished V2 work into the MVP 1.5 branch.

## V2 stage baseline

The stage foundation remains complete:

- separate stage project and domain;
- current-main-based V2 integration branch;
- schema/data foundation;
- immutable V1 comparison baseline;
- exact fixture linkage;
- 48-row stored V2 signal baseline;
- runtime fixture coverage;
- no production write from V2 work.

The preserved baseline is reproducible, not “current.” Current-data refresh remains a required gate before a V2 shadow candidate.

## Exact next workstreams

Production operations:

```text
when a published fixture finishes
-> query API-Football from PowerShell
-> exact result dry-run
-> exact allowlisted apply
-> idempotency verification
-> public/admin smoke
```

V2:

```text
Task 2B - current fixture and result refresh
-> Task 2C - ranking, standings, and tournament context
-> Task 2D - repeatable current signal snapshots
-> first unpublished V2 shadow candidate
```

MVP 1.5:

```text
finalize surface inventory
-> create current-main-based bounded branch
-> implement P0 copy/conversion cleanup
-> implement venue and time presentation
-> smoke anonymous/free/Premium/admin
-> merge accepted slices to main
-> synchronize main into V2
```

## Responsibility split

### ChatGPT

- authors canonical shared sources and affected runbooks;
- preserves current decisions and no-repeat rules;
- defines bounded implementation and review packages;
- interprets operator and repository evidence.

### Codex

- inspects the repository;
- implements bounded code changes when requested;
- adds focused tests;
- reports exact changed files and blockers;
- does not own canonical documentation authoring.

### Operator

- runs Git and PowerShell;
- executes approved provider operations;
- uses admin queues and production dashboards;
- approves writes and releases;
- replaces canonical files in the repository.

## No-repeat rules

Do not:

- generate predictions after kickoff;
- use Wikipedia as fixture/result write authority;
- ask Codex to discover routine fixtures or scores;
- rerun successful applies ceremonially;
- include untracked operational artifacts in commits;
- recreate the South Africa vs Canada one-off bootstrap as a normal runbook path;
- claim venue data is unknown when the actual limitation is ingestion;
- let MVP 1.5 or V2 drift far from `main`.
