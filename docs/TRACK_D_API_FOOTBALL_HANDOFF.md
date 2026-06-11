# Track D — API-Football / Real Fixture Lab Handoff

Last refreshed: post-E05 / first public World Cup fixture publication.

## Purpose

This document preserves operational context for API-Football ingestion and Real Fixture Lab flows.

Status note: Track D/D05/D06 is now historical foundation for MVP 0. The active World Cup launch lane is Epic E, but this handoff remains useful for ingest/Lab behavior.

## Current proven flow

The system has now processed one real World Cup fixture through the full public MVP 1 path:

- `api-football:fixture:1489369`
- Mexico vs South Africa
- exact ingest as `admin_only`
- internal prediction saved
- public prediction copied
- match published through RPC
- visible on `/predictions`

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

## Internal result/evaluation path

Track D result/evaluation remains internal:

- result ingest creates/updates pending-review result data;
- admin verifies result;
- evaluation persists into `prediction_results`;
- `prediction_results` is not public.

## Hard boundaries

- no broad apply;
- no automatic publication;
- no batch publication;
- no public `prediction_results`;
- no provider predictions;
- no betting odds as hidden model input;
- no service-role in app routes.
