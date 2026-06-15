# Architecture Summary - UFO Predictor

_Last refreshed: post PR #77 Premium Prediction Detail MVP / Real Fixture Lab Ops Summary, after latest World Cup result batch verification._

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

## Real Fixture Lab

Real Fixture Lab is the admin operations surface. It can inspect exact API-Football/public fixtures, refresh exact public predictions, verify results, persist internal evaluation, and display the operational summary.

The summary uses direct `prediction_markets` count first and falls back to public-safe `model_detail` readiness from the premium RPC. This handles RLS/read-path cases where direct market count is `0` but premium detail is still available.

## API-Football ingest/apply

The exact fixture spike/dry-run/apply flow remains unchanged by PR #77. Apply creates pending review result rows; verification/evaluation happen in Real Fixture Lab.

## Torneo Mundialista planned export

Planned architecture is export-first: admin-only JSON export from Real Fixture Lab/UFO Predictor, no public endpoint by default, no service-role app route, only public-safe prediction fields, and Torneo controls reveal/display behavior.

## Hard boundaries

No public exposure of `prediction_results`, raw Lab/admin payloads, internal evaluation payloads, provider odds/predictions, or service-role app-route data.
