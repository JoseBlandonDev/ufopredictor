# UFO Predictor — Project Status for Meeting

Last refreshed: post-E07 / MVP 1 public fixture expansion and refresh.

## Summary

UFO Predictor now has four real World Cup fixtures publicly visible in the product.

The project moved selected fixtures through the full controlled MVP 1 path:

```text
API-Football fixture
-> exact guarded ingest
-> internal Real Fixture Lab prediction
-> manual public-product copy
-> match publication
-> public predictions page
```

It also proved a refresh path for already-public predictions:

```text
public fixture
-> exact admin Lab refresh
-> new internal evidence
-> new public-product row
-> latest public prediction shown
```

Public fixtures:

- Mexico vs South Africa — `api-football:fixture:1489369`;
- South Korea vs Czech Republic — `api-football:fixture:1538999`;
- Canada vs Bosnia & Herzegovina — `api-football:fixture:1539000`;
- USA vs Paraguay — `api-football:fixture:1489370`.

## What is completed

### MVP 0 / Calibration

- Real Fixture Lab internal loop completed.
- 5-fixture friendly pilot completed.
- Result verification and evaluation persistence work.
- `v0.2-prelaunch` activated and frozen for MVP 1.

### MVP 1 / World Cup Launch

- Exact scheduled World Cup fixture apply guard completed.
- Competition/team slug reuse fixes completed for existing mock/legacy data.
- First World Cup fixture ingested successfully.
- Manual publication action created.
- Runtime publication stabilized with a narrow admin RPC.
- Public surface cleaned for real World Cup fixtures.
- MVP 1 fallback signals expanded for immediate launch-window teams.
- Exact public refresh path added for already-public fixtures.
- Four public World Cup predictions visible.

## What changed technically

The publication path uses a manual admin action.

It does not publish directly from ingest. It does not batch. It does not expose Lab internals.

Core behavior:

- selected `internal_lab` prediction is copied to `public_product`;
- internal row remains unchanged;
- match is flipped from `admin_only` to `public` through RPC;
- `prediction_results` remains internal-only;
- no provider predictions or betting odds are used.

The match access flip is handled by:

- `0029_manual_publication_match_access_scope_rpc.sql`
- `publish_real_fixture_match_access_scope(target_match_id, target_match_slug)`

Post-E07 refresh behavior:

- exact already-public fixtures can be loaded by admin in Real Fixture Lab;
- a fresh internal prediction is saved;
- a new replacement `public_product` row is appended;
- old public rows remain as history;
- public views render the latest public row.

The refresh RLS support is handled by:

- `0030_real_fixture_lab_public_refresh_rls.sql`

Both relevant migrations were applied manually through Supabase SQL Editor. Because apparently production systems enjoy making humans copy SQL by hand. Here we are.

## Current public product state

The public product currently shows:

- selected real World Cup fixtures;
- 1X2 probabilities;
- confidence/risk labels;
- basic public-safe match detail;
- no-betting/no-guarantee framing.

It does not show:

- `prediction_results`;
- internal evaluation payloads;
- provider predictions;
- betting odds;
- raw Lab internals.

## Current risks

### Access-tier clarity

The product needs a clear distinction between:

- anonymous visitors;
- registered free users;
- future premium users.

Recommendation:

- keep 1X2 public;
- use probable score and watchlist as free-authenticated value;
- keep top scorelines / BTTS / Over-Under / deeper explanations for premium future.

### Scoreline calibration

The model now differentiates fixtures better, but scoreline outputs still lean too often toward `1-1`.

This should become a planned calibration task, not an emergency tweak.

### Real data enrichment

Static fallback signals are good enough for MVP 1 launch, but future credibility needs:

- FIFA/Elo-style ratings;
- recent form;
- attack/defense;
- source/provenance dates;
- possibly DB-backed team strength snapshots.

### Lineage/audit debt

There is no formal DB-native link from the public prediction row back to the source internal prediction row.

For MVP 1, operational evidence is acceptable. Before broader publication/automation, consider adding lineage such as `source_prediction_version_id` or metadata.

## What is not implemented

- Payments.
- Tournament pass checkout.
- Automated World Cup fixture publishing.
- Broad World Cup ingest/apply.
- Premium market publication.
- Public accuracy dashboard from real World Cup sample.
- Provider predictions.
- Betting odds as model input.

## Recommended next work

### E09 — Access tiers for prediction detail + scoreline visibility

Immediate goals:

1. Decide anonymous/free/premium visibility.
2. Decide probable score visibility.
3. Decide top scorelines/BTTS/O-U premium strategy.
4. Keep `prediction_results` internal.
5. Avoid payment implementation until value tiers are clear.

### E10 — Scoreline calibration + real signal enrichment

After access-tier clarity:

1. inspect expected-goals and scoreline generation;
2. reduce over-conservative `1-1` behavior;
3. plan real data snapshots with provenance.

### H01 — Result verification after public fixtures finish

After matches finish:

1. ingest/verify real results;
2. persist internal evaluation;
3. decide public final-result display;
4. keep `prediction_results` protected.

## Meeting talking points

- “We have four real World Cup fixtures public end-to-end.”
- “The flow is intentionally manual and exact-fixture only.”
- “We can now refresh already-public predictions exactly after model/fallback updates.”
- “The model is still `v0.2-prelaunch`; fallback signals prevent generic outputs but are not final data maturity.”
- “The next priority is access tiers and scoreline visibility.”
- “Payments are still not implemented; tournament pass planning remains separate.”
