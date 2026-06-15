# Start Here for New Conversations - UFO Predictor

_Last refreshed: post PR #77 Premium Prediction Detail MVP / Real Fixture Lab Ops Summary, after latest World Cup result batch verification._

## Current baseline

The project is on `main` after PR #77 (`codex/premium-prediction-detail-mvp`) was merged and local `main` was pulled clean. The product/data/model track is now past the first Premium Prediction Detail MVP and the Real Fixture Lab operational summary.

Current repo expectation for a new task:

```bash
git checkout main
git pull origin main
git status --short
```

Expected status: clean.

## What is now done

### Premium Prediction Detail MVP v1

Implemented on match detail only (`/matches/[slug]`). It reuses the existing premium gate and the protected RPC `public.get_premium_match_projection(p_match_id uuid)` from migration `0035_premium_match_model_detail_projection.sql`.

Authorized premium/admin viewers can see public-safe model detail: expected goals, top 3 probable scorelines, BTTS, Over/Under 2.5, and confidence/risk context when safely projected.

This does not expose `prediction_results`, raw Lab/admin payloads, internal evaluation payloads, odds/provider predictions, or service-role app routes.

### Free-tier probable score gating

Registered-free users no longer see or fetch the probable score before a result is verified. The probable-score RPC only runs for registered-free viewers when a public prediction exists and the final result is verified. Anonymous users never see probable score in the public/basic section. Premium/admin access remains through the premium projection path.

### Real Fixture Lab Ops Summary

Real Fixture Lab now acts as the operational dashboard for World Cup fixture work. It shows external IDs, API-Football fixture IDs, latest public prediction row, result status, evaluation status, ops state and suggested action. It uses `model_detail: yes` as a readiness signal when direct `prediction_markets` count is hidden by RLS/read-path behavior.

### Latest verified/evaluated result batch

Recent completed and verified/evaluated fixtures now include:

| Match | Result |
|---|---:|
| Germany vs Curacao | 7-1 |
| Netherlands vs Japan | 2-2 |
| Ivory Coast vs Ecuador | 1-0 |
| Sweden vs Tunisia | 5-1 |
| Australia vs Turkiye | 2-0 |
| Haiti vs Scotland | 0-1 |
| Brazil vs Morocco | 1-1 |
| Qatar vs Switzerland | 1-1 |
| USA vs Paraguay | 4-1 |
| Canada vs Bosnia & Herzegovina | 1-1 |
| South Korea vs Czechia | 2-1 |
| Mexico vs South Africa | 2-0 |

If no new fixtures have been published since this batch, `/predictions` may show only historical results and no active/upcoming fixtures.

## Immediate next work

1. **Load/publish the next World Cup prediction batch.** Identify upcoming fixtures, publish latest `public_product` rows, confirm premium `model_detail`, and verify `/predictions` + `/matches/[slug]`.
2. **TM01 - Torneo Mundialista export discovery.** Plan an admin-only JSON export from UFO Predictor/Real Fixture Lab for a date range. Torneo Mundialista decides what fields to display and when.
3. Continue regular fixture result operations from Real Fixture Lab.

## Epic G parallel track

Done: G01 auth foundation and G02 production config/readiness audit.

Pending: G03 production smoke test, G04 plans/pricing MVP, G05 payment provider spike, G06 subscription/entitlement model proposal, G07 premium gate UI shell/CTA, G08 trust/legal/responsible-use copy.

Do not mix Epic G payments/checkout work into product/data/model tasks unless explicitly approved.

## Hard boundaries

Do not expose `prediction_results`, raw Lab/admin payloads, internal evaluation payloads, provider odds/predictions as model inputs, or service-role usage in app routes. Do not change API-Football ingest/apply, signal packs, or prediction engine unless explicitly scoped.
