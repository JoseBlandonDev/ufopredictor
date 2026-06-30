# Architecture, Data, and Security - UFO Predictor

_Last refreshed: 2026-06-29 after the production Round-of-32 operations and the venue/time-zone architecture inspection._

## System overview

UFO Predictor currently combines:

- Next.js public and protected product surfaces;
- Supabase Auth and PostgreSQL;
- server-side entitlement resolution;
- Wompi payment/webhook operations;
- API-Football fixture/result operations;
- immutable prediction versions and markets;
- verified result/evaluation storage;
- a separate V2 stage environment;
- a bounded future MVP 1.5 product-polish branch.

## Environment separation

```text
production:
- domain: ufopredictor.com
- Supabase: gcpdffkgsdomzyoenalg
- branch baseline: main

stage:
- domain: stage.ufopredictor.com
- Supabase: yfmklapgjrupctgxaako
- branch baseline: integration/prediction-intelligence-v2
```

Production and stage must not share:

- Auth users;
- sessions;
- Wompi payloads;
- entitlements;
- secrets;
- personal data;
- service-role browser access.

## Production prediction architecture

Public prediction history is based on stored public prediction versions.

A public result alone does not create a public prediction.

Conceptual path:

```text
matches
-> prediction_versions(run_scope=public_product)
-> prediction_markets
-> public prediction projections
-> cards/detail/history
```

Verified results and evaluations attach to the original immutable prediction version.

South Africa vs Canada confirms this boundary:

```text
public match: yes
verified result: yes
public prediction version: no
prediction history entry: no
evaluation: no
```

This is correct model governance, though a separate official-result surface may be added later.

## Prediction immutability

Rules:

- no post-kickoff prediction creation presented as original;
- no post-result probability mutation;
- replacement predictions require a new immutable version;
- historical replay must be explicitly labeled;
- verified results never authorize rewriting the original prediction;
- UI polish is not a model change.

## API-Football provider architecture

Operational source path:

```text
API-Football response
-> normalized ProviderFixture
-> ingest planner
-> controlled writer
-> competitions/seasons/teams/venues/matches
-> public projections
-> UI
```

Provider authority covers:

- fixture identity;
- home/away identity;
- kickoff;
- competition/season;
- round;
- provider state;
- venue when supplied;
- final score.

Official FIFA schedule information may be used as a tournament cross-check. Secondary pages are not write authority.

## Current venue gap

Current code behavior:

- the normalized fixture type does not expose provider venue ID, name, or city;
- the API client does not propagate `fixture.venue`;
- the planner deliberately produces `venueId: null`;
- the writer stores `matches.venue_id = null`;
- tests currently encode this as expected behavior.

The schema already supports:

```text
venues.external_id unique
matches.venue_id -> venues.id
API-Football venue external-id helper
```

Therefore the minimum venue implementation is:

1. add optional venue fields to the provider envelope and normalized type;
2. propagate venue through the planner;
3. upsert venue by provider external ID;
4. assign `matches.venue_id`;
5. preserve null only when provider venue is absent.

No new schema migration appears necessary for this bounded implementation.

## Kickoff storage and presentation

Canonical storage:

```text
matches.kickoff_at = UTC timestamp
```

Current public presentation is hardcoded around:

```text
America/Bogota
es-CO
COT
```

No profile time-zone preference currently exists.

MVP 1.5 should add a presentation helper that:

- accepts UTC kickoff;
- resolves viewer-local time in the browser when possible;
- uses IANA zones;
- keeps server and hydration output stable;
- offers compact references for:
  - Mexico City;
  - Bogotá / Lima;
  - Buenos Aires / Santiago;
  - Madrid;
- groups country labels only when local clock values match for that date.

Converted times must not be persisted as source data.

## Viewer-local time privacy

Use browser time-zone resolution, not GPS.

Acceptable:

```text
Intl.DateTimeFormat().resolvedOptions().timeZone
```

Do not request precise location merely to format kickoff time.

If automatic resolution is unavailable, use compact references rather than a long country list.

## Price presentation architecture

The commercial source of truth and the displayed local estimate are separate concerns.

Owner-approved commercial target and operator-observed production presentation:

```text
base price: US$10
current production/Wompi display observed by the owner: COP 35,000
```

Repository code/tests still contain stale US$20 / COP 68,700 references. The architecture target is US$10 / COP 35,000, but the repository implementation must be reconciled before the next pricing release.

Architecture rule:

- backend/configuration owns actual charge;
- UI may show a local estimate;
- estimates must be labeled;
- locale/country inference must not change billing authority;
- currency conversion must not be stored as entitlement truth;
- browser language alone is not authoritative country detection.

## Auth and entitlement boundary

Premium authorization is server-side.

Authoritative concepts include:

- subscriptions;
- user entitlements;
- match unlocks;
- entitlement grants;
- active server-side resolver.

A profile label or client badge is presentation, not authorization.

An active account must not be allowed to repurchase accidentally.

## V2 architecture

Stage contains:

- current-main-based integration work;
- Prediction Intelligence V2 tables/contracts;
- source snapshots and lineage;
- immutable V1 comparison rows;
- stored V2 baseline signals;
- no production V2 candidate release.

Current-data freshness is a gate before a live shadow candidate.

## Parallel branch architecture

Branches:

```text
main
integration/prediction-intelligence-v2
future bounded MVP 1.5 branch
```

Flow:

```text
main -> MVP 1.5 branch
main updates -> MVP 1.5 synchronization
accepted MVP 1.5 -> main
updated main -> V2 synchronization
```

Do not merge unfinished V2 analytical work into MVP 1.5.

Prefer small, independently releasable MVP 1.5 PRs to reduce shared frontend conflicts.

## Security boundaries

- service-role keys remain server-only;
- provider keys remain server/script-only;
- production/stage refs are explicitly checked before remote writes;
- no secret values in artifacts or documentation;
- Wompi redirect is not entitlement authority;
- public views expose only approved product data;
- admin queues require authenticated admin access;
- exact allowlists are required for production result writes;
- untracked operational JSON artifacts do not enter product commits.

## Observed operational debt

### Competition identity ambiguity

A one-off production script using `.single()` by API-Football competition external ID failed because the query did not resolve to one row.

Do not assume this lookup is unique until the competition data is audited.

Stable operator code should resolve competition through an exact known match/season context or enforce an approved uniqueness contract.

### Finished fixture ingestion gap

The generic fixture ingest guard rejects a newly planned finished World Cup fixture when it would be created as `admin_only`.

South Africa vs Canada required a bounded one-off operator intervention.

This one-off path is not a normal runbook command and should not be copied into routine operations.

Future architecture should provide one supported exact path for:

- a finished provider fixture;
- a verified result;
- no retrospective prediction;
- public match detail or official-results surface.

### Public results without prediction

The public detail projection can represent a verified result without a prediction, but the current `/predictions` listing cannot.

This is a product/query gap, not a data-integrity defect.

## Responsibility split

### ChatGPT

- canonical documentation;
- architecture and roadmap interpretation;
- bounded implementation requirements.

### Codex

- repository inspection;
- code implementation;
- migrations and tests;
- no routine score/fixture discovery.

### Operator

- remote writes;
- provider commands;
- admin verification;
- release approval.

## Next architecture transitions

1. venue normalization and persistence;
2. public time-zone presentation helper;
3. supported official-result-without-prediction path;
4. MVP 1.5 surface cleanup;
5. continued V2 current-data and candidate work.
