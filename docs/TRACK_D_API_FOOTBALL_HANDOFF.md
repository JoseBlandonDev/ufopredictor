# Track D — API-Football / Real Fixture Lab Handoff

Last refreshed: post-E07 / MVP 1 public fixture expansion and refresh.

## Purpose

This document preserves operational context for API-Football ingestion and Real Fixture Lab flows.

Status note: Track D/D05/D06 is now historical foundation for MVP 0. The active World Cup launch lane is Epic E, but this handoff remains useful for ingest/Lab behavior.

## Current proven public MVP 1 flow

The system has now processed four real World Cup fixtures through the controlled public MVP 1 path:

- `api-football:fixture:1489369` — Mexico vs South Africa;
- `api-football:fixture:1538999` — South Korea vs Czech Republic;
- `api-football:fixture:1539000` — Canada vs Bosnia & Herzegovina;
- `api-football:fixture:1489370` — USA vs Paraguay.

The path:

```text
exact API-Football fixture
-> guarded exact ingest/apply
-> Real Fixture Lab internal prediction
-> manual publication
-> public_product prediction
-> public match visibility
```

## Current proven refresh flow

The system can now refresh an already-public exact API-Football fixture:

```text
public API-Football fixture
-> exact Real Fixture Lab admin load
-> fresh internal_lab evidence
-> replacement public_product row
-> public views read latest public_product row
```

Runtime-proven refreshed fixtures:

- Mexico vs South Africa;
- South Korea vs Czech Republic.

Required migration:

- `0030_real_fixture_lab_public_refresh_rls.sql`

## API-Football ingest guardrails

Current rules:

- exact fixture reads are allowed;
- dry-runs are safe;
- broad World Cup apply remains blocked;
- broad friendlies apply remains blocked;
- exact World Cup apply requires fixture id, explicit date range, and limit 1;
- scheduled World Cup fixture apply is allowed only through the narrow guard.

## Ingest defaults

Real API-Football fixtures should default to:

- `matches.access_scope = 'admin_only'`
- `matches.intake_source = 'api_football'`
- `match_results.verification_status = 'pending_review'` where result rows apply
- `match_results.intake_source = 'api_football'` where result rows apply
- `venue_id=null` unless provider venue support is added later

Publication is not part of ingest. Repeat that loudly if tempted to “simplify” it. The database will punish optimism.

## Slug reuse fixes

E03D/E03E changed ingest writer behavior to handle legacy/mock rows safely.

### Competitions

If a competition is planned with API-Football external id but an existing row has the same slug:

- reuse the row by slug;
- backfill external id only if existing value is null;
- preserve existing non-null legacy/mock external id.

### Teams

If a team is planned with API-Football external id but an existing row has the same slug:

- reuse the row by slug;
- backfill external id only if existing value is null;
- preserve existing non-null legacy/mock external id.

This was required because Mexico and World Cup rows existed from mock/product seed data before real ingest.

## Manual publication handoff

Publication is not part of ingest.

After ingest:

1. use Real Fixture Lab to inspect exact fixture;
2. save an internal `internal_lab` prediction;
3. use the manual admin publication action;
4. publication clones a `public_product` prediction;
5. match access is flipped through RPC `publish_real_fixture_match_access_scope`.

Do not publish by changing ingest defaults. Real fixtures should still arrive as `admin_only`.

## Exact public refresh handoff

After a fixture is public, the first-publication RPC no longer applies. Use the exact refresh path.

Refresh flow:

1. load the exact public fixture in Real Fixture Lab by `externalId`;
2. verify it is `public + api_football + scheduled`;
3. generate preview using current model/fallback logic;
4. run exact refresh action;
5. save fresh `internal_lab` evidence;
6. append new `public_product` prediction row;
7. verify `/predictions` and `/matches/[slug]` show the latest values.

Do not rollback a public match to `admin_only` just to regenerate predictions. That is using a chainsaw to sharpen a pencil.

## Internal result/evaluation path

Track D result/evaluation remains internal:

- result ingest creates/updates pending-review result data;
- admin verifies result;
- evaluation persists into `prediction_results`;
- `prediction_results` is not public.

When public World Cup fixtures finish, result verification should use this internal foundation while keeping public transparency separate and reviewed.

## Current model/fallback note

MVP 1 fallback signals now cover the immediate public launch teams:

- Mexico;
- South Africa;
- South Korea / Korea Republic;
- Czech Republic / Czechia;
- Canada;
- Bosnia & Herzegovina / Bosnia and Herzegovina;
- USA / United States;
- Paraguay.

This prevents default-signal collapse for the initial public fixtures, but does not replace future real data enrichment.

## Hard boundaries

- no broad apply;
- no automatic publication;
- no batch publication;
- no public `prediction_results`;
- no provider predictions;
- no betting odds as hidden model input;
- no service-role in app routes.
