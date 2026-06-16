# Architecture Summary - UFO Predictor

_Last refreshed: post PR #81 real fixture publish queue bypass / Data Ops 02 completion (2026-06-16)._

## Core architecture

UFO Predictor separates public product data from internal Lab/evaluation data. Public surfaces read public-safe views/projections only. Internal evaluation stays in admin flows.

## Public prediction surfaces

- `/predictions` reads public prediction summaries.
- `/matches/[slug]` reads public match detail and public prediction summary.
- Verified final results are displayed from public-safe fields.
- `prediction_results` is not publicly exposed.

## Premium match detail

Premium Prediction Detail MVP v1 is implemented through a protected RPC:

```sql
public.get_premium_match_projection(p_match_id uuid)
```

Migration: `supabase/migrations/0035_premium_match_model_detail_projection.sql`.

Key properties:

- `SECURITY DEFINER`;
- `set search_path = public, pg_temp`;
- requires `auth.uid()`;
- `authenticated` execute grant;
- no anon execute grant;
- reads latest `public_product` prediction only;
- no `prediction_results`;
- defensive `top_scores_json` parsing;
- public-safe `model_detail` JSON.

Projected model detail: expected goals, top scorelines, BTTS, Over/Under 2.5, confidence/risk.

## Free-tier probable score gating

`get_authenticated_public_match_probable_score` is only called for registered-free viewers when the result is verified and verified goals are present. Pre-match/live/unverified registered-free users do not fetch probable score.

## Admin fixture operations

### Current publication path

`/admin/real-fixture-publish-queue` is the current lightweight admin-only path for publishing scheduled real fixtures. It lists minimal fixture state and reuses existing server actions:

- `saveRealFixturePredictionAction`
- `publishRealFixturePredictionAction`

It does not generate heavy previews during render, does not introduce new write logic, and does not expose raw internals.

### Real Fixture Lab

Real Fixture Lab previously served as the main operations dashboard for fixture/result follow-up. Its exact-detail route currently has a known stack overflow blocker and should be fixed separately. Until then, use the publish queue for publication operations and avoid exact-detail routes.

## API-Football ingest/apply

The exact fixture spike/dry-run/apply flow remains unchanged. Apply creates/updates exact operational rows; public publication is controlled through admin actions. Result verification/evaluation remains separate and should only run after provider status is final.

## Torneo Mundialista planned export

Planned architecture is export-first: admin-only JSON export from UFO Predictor, no public endpoint by default, no service-role app route, only public-safe prediction fields, and Torneo controls reveal/display behavior.

## Epic G / payments architecture direction

Epic G remains parallel. G02 covers dev/prod environment separation and config readiness. G05 is Wompi-focused but not implemented. Payment secrets must not enter public/client runtime; entitlement activation must be tied to verified payment events in a future scoped design.

## Hard boundaries

No public exposure of `prediction_results`, raw Lab/admin payloads, internal evaluation payloads, provider odds/predictions, service-role app-route data, payment secrets, or Torneo human picks as UFO model inputs.
