# UFO Predictor — Architecture Summary

Last refreshed: post-E05 / first public World Cup fixture publication.

## Current architecture posture

UFO Predictor now has a runtime-proven MVP 1 path for a real World Cup fixture:

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

The architecture remains deliberately conservative. Real fixtures enter as internal/admin-only, predictions are produced and saved internally, and only a selected public-safe copy is exposed after an explicit admin action.

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

### Admin / Real Fixture Lab

Admin route:

- `/admin/real-fixture-lab`

Purpose:

- inspect exact API-Football fixtures already ingested;
- run internal prediction preview;
- save internal Lab predictions;
- review results and evaluations;
- manually publish one selected public-safe prediction for one selected fixture.

The admin app route uses the normal authenticated server client and admin session checks. It does not use service-role in app routes.

## Data ingest architecture

API-Football ingest remains guarded and exact for MVP 1.

Current behavior:

- broad World Cup apply remains blocked;
- broad friendlies apply remains blocked;
- exact fixture apply can be allowed only when explicit guard conditions pass;
- World Cup scheduled fixture ingest creates matches as `admin_only`, not public;
- provider venue support is not assumed, so `venue_id` remains `null` unless supported later.

Important E03 fixes:

- competition reuse by slug prevents duplicate `world-cup-2026` rows when legacy/mock data exists;
- team reuse by slug prevents duplicate team rows when legacy/mock data exists;
- existing non-null legacy/mock `external_id` values are preserved rather than blindly overwritten.

## Prediction architecture

### Model version

Current active model:

- `v0.2-prelaunch`

The model is frozen for MVP 1 unless a planned calibration epic explicitly opens.

### Internal prediction

Internal predictions are saved as:

- `prediction_versions.run_scope = 'internal_lab'`
- `prediction_versions.prediction_type = 'pre_match_24h'`

These rows are not public product rows.

### Public prediction

Manual publication creates or reuses a public-safe copy:

- `prediction_versions.run_scope = 'public_product'`
- same match;
- same model version;
- same prediction type;
- copied public-safe prediction payload;
- no `prediction_results` exposure;
- no market copy in E05.

There is currently no DB-native lineage field linking the public row to the internal row. That is an open future decision.

## Manual publication architecture

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

The app action remains idempotent for prediction rows. If a matching `public_product` prediction already exists, publication confirms the match access scope rather than duplicating the public prediction.

## Supabase / RLS posture

The project intentionally uses RLS and normal authenticated app clients.

Rules:

- no service-role in app routes;
- migrations are reviewed and applied manually in Supabase SQL Editor;
- already-applied migrations are not edited;
- new DB behavior gets a new migration;
- public read projections remain the public boundary;
- `prediction_results` remains internal-only.

Relevant manual-publication migrations:

- `0025_manual_publication_rls.sql` — initial narrow manual-publication grants/policies.
- `0026_fix_manual_publication_match_update_policy.sql` — old-row/new-row update policy split attempt.
- `0027_inline_manual_publication_match_update_check.sql` — inline new-row check attempt.
- `0028_manual_publication_match_new_row_helper.sql` — new-row helper attempt.
- `0029_manual_publication_match_access_scope_rpc.sql` — runtime-proven RPC publication path.

The earlier policy attempts are part of history. The stable publication mechanism is the `0029` RPC.

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

## Operational caveats

- The first public fixture still coexists with legacy/mock/previews on public surfaces; E06/F02 should clean or separate this.
- Publication is manual and one fixture at a time.
- Broad World Cup apply/publication remains out of scope.
- The current publication audit is operational rather than DB-native lineage; future schema can add lineage if needed.
