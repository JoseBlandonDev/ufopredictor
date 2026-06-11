# UFO Predictor — Architecture Summary

Last refreshed: post-E07 / MVP 1 public fixture expansion and refresh.

## Current architecture posture

UFO Predictor now has a runtime-proven MVP 1 path for selected real World Cup fixtures and a runtime-proven refresh path for already-public predictions.

First-publication path:

```text
API-Football exact fixture
-> guarded exact ingest/apply
-> admin-only Real Fixture Lab match
-> internal_lab prediction save
-> manual publication action
-> public_product prediction copy
-> SECURITY DEFINER RPC flips match to public
-> public projections render in /predictions and /matches/[slug]
```

Already-public refresh path:

```text
public API-Football fixture
-> exact admin Real Fixture Lab load
-> fresh internal_lab evidence row
-> replacement public_product prediction row appended
-> older public_product rows remain as history
-> public projections render latest public_product row
```

The architecture remains deliberately conservative. Real fixtures enter as internal/admin-only, predictions are produced and saved internally, and only selected public-safe copies are exposed after explicit admin action. Revolutionary, really: the system does not spray database rows at strangers.

## Application layers

### Public product routes

Public-facing routes are designed to read from safe public projections and product-scoped rows, not directly from Lab/internal tables.

Relevant routes:

- `/`
- `/predictions`
- `/matches/[slug]`
- `/pricing`
- `/dashboard`
- `/transparency`

Public prediction reads rely on:

- `public_prediction_summaries`
- `public_match_details`

A real match becomes public only when all required visibility gates align:

- `matches.access_scope = 'public'`
- `competitions.usage_scope = 'public_product'`
- a compatible `prediction_versions` row exists with `run_scope='public_product'`

As of post-E07, four real World Cup fixtures are public:

- `api-football:fixture:1489369` — Mexico vs South Africa;
- `api-football:fixture:1538999` — South Korea vs Czech Republic;
- `api-football:fixture:1539000` — Canada vs Bosnia & Herzegovina;
- `api-football:fixture:1489370` — USA vs Paraguay.

### Admin / Real Fixture Lab

Admin route:

- `/admin/real-fixture-lab`

Purpose:

- inspect exact API-Football fixtures already ingested;
- run internal prediction preview;
- save internal Lab predictions;
- review results and evaluations;
- manually publish one selected public-safe prediction for one selected fixture;
- refresh an already-public exact fixture after model/fallback updates.

The admin app route uses the normal authenticated server client and admin session checks. It does not use service-role in app routes.

## Data ingest architecture

API-Football ingest remains guarded and exact for MVP 1.

Current behavior:

- broad World Cup apply remains blocked;
- broad friendlies apply remains blocked;
- exact fixture apply can be allowed only when explicit guard conditions pass;
- World Cup scheduled fixture ingest creates matches as `admin_only`, not public;
- provider venue support is not assumed, so `venue_id` remains `null` unless supported later.

Important ingest protections:

- competition reuse by slug prevents duplicate `world-cup-2026` rows when legacy/mock data exists;
- team reuse by slug prevents duplicate team rows when legacy/mock data exists;
- existing non-null legacy/mock `external_id` values are preserved rather than blindly overwritten.

## Prediction architecture

### Model version

Current active model:

- `v0.2-prelaunch`

The model remains launch-frozen unless a planned calibration epic explicitly opens. MVP 1 fallback signals were expanded for immediate World Cup fixtures, but this is still a constrained static enrichment, not a broad model rewrite.

### Internal prediction

Internal predictions are saved as:

- `prediction_versions.run_scope = 'internal_lab'`
- `prediction_versions.prediction_type = 'pre_match_24h'`

These rows are not public product rows.

### Public prediction

Manual publication creates a public-safe copy:

- `prediction_versions.run_scope = 'public_product'`
- same match;
- same model version;
- same prediction type;
- copied public-safe prediction payload;
- no `prediction_results` exposure.

For exact refresh, a new replacement `public_product` row is appended. Older public rows remain as history/audit. The public read layer surfaces the latest public-product row.

There is currently no DB-native lineage field linking the public row to the source internal row. Operational evidence exists through Lab actions and timestamps; formal lineage remains an open future decision.

## Manual first-publication architecture

E05 introduced the first manual publication bridge.

The bridge does two conceptual operations:

1. Copy a selected internal prediction into a public product prediction row.
2. Flip the selected match from `admin_only` to `public`.

The second operation was stabilized through a dedicated RPC after direct RLS update policies failed at runtime.

Runtime-proven RPC:

- migration: `0029_manual_publication_match_access_scope_rpc.sql`
- function: `publish_real_fixture_match_access_scope(target_match_id uuid, target_match_slug text)`
- type: `SECURITY DEFINER`
- grant: execute to `authenticated`
- exact behavior: updates only `matches.access_scope = 'public'`

RPC preconditions:

- caller must be admin through `is_real_fixture_lab_admin()`;
- exact match id + slug;
- current row must be `access_scope='admin_only'`;
- current row must be `status='scheduled'`;
- current row must be `intake_source='api_football'`;
- linked competition must be `usage_scope='public_product'`.

The app action remains exact-fixture only. It does not batch and does not publish from ingest.

## Exact public refresh architecture

PR #61 added the exact public refresh path.

Purpose:

- support regenerating a public prediction for an already-public scheduled API-Football fixture after model/fallback improvements;
- preserve public audit/history;
- avoid rolling back `matches.access_scope`;
- avoid deleting old predictions;
- keep refresh admin-only and exact.

Behavior:

1. admin loads one exact public API-Football fixture by `external_id`;
2. Real Fixture Lab generates a fresh preview with current model/fallback logic;
3. refresh action saves a new `internal_lab` evidence row;
4. refresh action appends a new `public_product` row;
5. old public rows remain untouched;
6. public projections read latest `public_product` row.

Required migration:

- `0030_real_fixture_lab_public_refresh_rls.sql`

This migration broadens admin-only RLS helper/policy behavior for the exact refresh workflow. It does not restore anonymous base-table reads and does not expose `prediction_results`.

## Supabase / RLS posture

The project intentionally uses RLS and normal authenticated app clients.

Rules:

- no service-role in app routes;
- migrations are reviewed and applied manually in Supabase SQL Editor;
- already-applied migrations are not edited;
- new DB behavior gets a new migration;
- public read projections remain the public boundary;
- `prediction_results` remains internal-only.

Relevant publication/refresh migrations:

- `0025_manual_publication_rls.sql` — initial narrow manual-publication grants/policies.
- `0026_fix_manual_publication_match_update_policy.sql` — old-row/new-row update policy split attempt.
- `0027_inline_manual_publication_match_update_check.sql` — inline new-row check attempt.
- `0028_manual_publication_match_new_row_helper.sql` — new-row helper attempt.
- `0029_manual_publication_match_access_scope_rpc.sql` — runtime-proven first-publication RPC.
- `0030_real_fixture_lab_public_refresh_rls.sql` — admin exact refresh support for already-public API-Football fixtures.

The earlier policy attempts are part of history. The stable first-publication mechanism is the `0029` RPC. The stable exact refresh RLS support is `0030`.

## Public/private boundary

Public product may show:

- basic 1X2 probabilities;
- confidence/risk framing;
- public-safe match detail;
- selected public prediction copy.

Public product must not expose:

- `prediction_results`;
- internal evaluations;
- Lab-only signals as raw internals;
- provider predictions;
- betting odds as model input;
- admin-only matches;
- unverified result/evaluation internals.

## Product access boundary still pending

The next architecture/product decision is access-tiering:

- anonymous: likely 1X2, confidence/risk, basic match info;
- free authenticated: likely probable score, watchlist, short interpretation;
- future premium: likely top scorelines, BTTS, over/under, expanded reasoning/signals.

This is not implemented yet. The project should not accidentally give away all premium-shaped value in the anonymous product and then wonder why no one pays. A bold theory, but worth testing.

## Operational caveats

- Publication is manual and one fixture at a time.
- Broad World Cup apply/publication remains out of scope.
- Public refresh is exact, admin-only, and not automatic.
- The current publication audit is operational rather than DB-native lineage; future schema can add lineage if needed.
- Scoreline generation currently leans too often toward `1-1`; future calibration should address this separately from launch publication plumbing.
