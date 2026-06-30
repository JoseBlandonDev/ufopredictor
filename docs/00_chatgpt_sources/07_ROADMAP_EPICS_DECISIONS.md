# Roadmap, Epics, and Decisions

_Last refreshed: 2026-06-29 after the Round-of-32 production operations and the MVP 1.5 Free/Premium surface review._

## Product objective

Maintain a usable, honest production product while:

- improving current commercial presentation through MVP 1.5;
- developing Prediction Intelligence V2 in stage;
- preserving original predictions and evaluation integrity;
- automating bounded provider operations.

## Current status

```text
MVP1 production: operational
Round-of-32 future predictions published: 15
latest exact result correction: Croatia 2-1 Ghana
official result without prediction: South Africa 0-1 Canada
V2 integration: active in Draft PR #114
V2 release: not approved
MVP 1.5: declared/planning
```

## Epic 1 - V2 Foundation and Stage

Status: complete.

Completed:

- integration normalization;
- separate stage environment;
- schema/data foundation;
- source snapshot preservation;
- exact runtime linkage;
- immutable V1 stage baseline;
- stage public smoke;
- stored V2 baseline.

Do not repeat without a concrete recovery need.

## Epic 2 - Current Football Data

### Task 2A - V2 Signal Baseline Database Load

Status: complete.

Outcome:

- reproducible baseline persisted;
- exact team rows;
- runtime coverage;
- idempotency proof;
- no production write.

### Task 2B - Current fixture and result refresh

Status: next/active V2 sequence.

Scope:

- exact fixture identity;
- not-started kickoff/status refresh;
- new verified results;
- conflict reporting;
- preservation of V1 and baseline;
- no candidate generation.

### Task 2C - Ranking, standings, and tournament context

Status: pending after 2B.

### Task 2D - Repeatable current signal snapshots

Status: pending after 2C.

## Epic 3 - V2 Candidate and Evaluation

### Task 3A - First unpublished V2 shadow candidate

Status: pending current-data gate.

### Task 3B - Historical replay

Status: pending candidate contract.

### Task 3C - V1/V2 evaluation

Status: pending.

### Task 3D - Release decision

Status: pending owner approval.

## Epic 4 - Current Product Experience

Completed production checkpoints include:

- V1 information inventory;
- public expert reading;
- football-first premium terminology;
- Task 4D / PR #120 production closeout and smoke.

Current production is usable, but additional polish is now grouped under MVP 1.5 rather than reopening completed tasks.

## Epic 5 - Operations and Automation

Delivered:

- exact fixture registry behavior;
- exact trusted result refresh;
- automatic valid terminal result verification/evaluation;
- idempotent operator artifacts;
- exact publication queue;
- manual reconciliation exception path.

Pending:

- scheduled recent-pending polling;
- retry/backoff;
- provider observability;
- official-result-without-prediction supported path;
- venue ingestion;
- reconciliation alerts.

## Epic 6 - MVP 1.5 Product and Commercial Polish

Status: declared; implementation not started in this checkpoint.

### Task 6A - Free/Premium surface inventory

Status: completed as owner/ChatGPT review evidence.

Surfaces reviewed:

- landing;
- predictions;
- match detail;
- pricing/Pase Mundial;
- panel;
- Transparency;
- Premium and registered-Free states.

### Task 6B - P0 conversion and copy cleanup

Scope:

- stronger Free pass visibility;
- US$10 one-time price;
- current Wompi charge clarity;
- Premium badge;
- remove redundant account-state copy;
- remove redundant CTAs;
- consistent Spanish terminology;
- coverage and validity wording.

### Task 6C - Premium response hierarchy

Scope:

- main reading first;
- compact key indicators;
- principal scenario;
- shorter alternatives;
- what-could-change block;
- model/cutoff/update metadata.

### Task 6D - Venue and time presentation

Scope:

- provider venue normalization;
- upsert existing venues;
- match venue linkage;
- viewer-local kickoff;
- compact references:
  - Mexico;
  - Colombia/Peru;
  - Argentina/Chile;
  - Spain.

### Task 6E - Pricing, panel, and terms

Scope:

- pass page conversion;
- panel identity;
- remove misleading `Sin vencimiento` copy;
- approximate local-price display;
- actual charge currency;
- product terms/support/refund wording.

### Task 6F - Transparency and public history

Scope:

- more scannable Transparency;
- annotated product example;
- model/version/update explanation;
- separate official results without prediction.

### Task 6G - Mobile, accessibility, and analytics

Scope:

- responsive polish;
- keyboard/focus checks;
- conversion event analytics;
- empty/loading/error states.

## Branch strategy decision

**Decision:** MVP 1.5 starts from current `main`.

**Decision:** MVP 1.5 receives current `main` regularly.

**Decision:** reviewed MVP 1.5 slices merge to `main`.

**Decision:** V2 then synchronizes the updated `main`.

**Rejected alternative:** allow MVP 1.5 and V2 to evolve independently until a final large merge.

**Reason:** shared frontend and presentation files would accumulate avoidable conflicts.

**Operational consequence:** use small PRs and synchronization checkpoints.

## Provider/source decision

**Decision:** API-Football is operational write authority for fixture identity, kickoff, status, venue when supplied, and score.

**Decision:** official FIFA data may be used as tournament cross-check.

**Decision:** Wikipedia and secondary sources are not write authority.

**Decision:** routine provider operations are PowerShell/admin tasks, not Codex tasks.

## Prediction-history decision

**Decision:** no retrospective prediction is created merely to make a verified match appear in history.

**Decision:** official verified results without prediction may receive a separate product surface.

**Reason:** prediction integrity is more important than filling every card.

## Pricing decision

**Owner decision / operator-observed production presentation, pending tracked-repository reconciliation:** US$10 one-time.

**Owner-observed production/Wompi display, not yet fully reflected by tracked code/tests:** COP 35,000.

**Repository status:** stale US$20 / COP 68,700 references remain in migration history, UI fallback, and tests and must be reconciled as a bounded MVP 1.5 implementation task.

**Decision:** other currencies are approximate references only unless checkout charges them.

## Time-zone decision

**Decision:** prefer viewer-local time.

**Fallback references:**

- Mexico;
- Colombia/Peru;
- Argentina/Chile;
- Spain.

Country pairs are grouped only when their rendered local times match for that kickoff date.

## Documentation decision

**Decision:** ChatGPT authors canonical sources and affected runbooks.

Codex may inspect, review, implement, and validate, but does not own canonical documentation authoring.

## Exact next sequence

Production:

```text
continue exact API-Football result operations as fixtures finish
```

MVP 1.5:

```text
package documentation
-> create branch from current main
-> Task 6B P0 cleanup
-> Task 6C Premium hierarchy
-> Task 6D venue/time
-> Task 6E pricing/panel/terms
-> bounded releases to main
```

V2:

```text
Task 2B
-> Task 2C
-> Task 2D
-> first shadow candidate
```

After each accepted MVP 1.5 shared-code release:

```text
main -> V2 integration synchronization
```

## Delivery rule

Each task must be independently useful, testable, and reversible.

Do not bundle:

- model release;
- payment-provider redesign;
- venue ingestion;
- complete frontend redesign;
- internationalization;
- automation infrastructure

into one PR.
