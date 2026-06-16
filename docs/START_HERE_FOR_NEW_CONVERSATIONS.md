# Start Here for New Conversations - UFO Predictor

_Last refreshed: post PR #81 real fixture publish queue bypass / Data Ops 02 completion (2026-06-16)._

## Current baseline

The project is on `main` after PR #81 (`feat: add real fixture publish queue operational bypass`) was merged. The current product/data state is past Data Ops 01 and Data Ops 02: recent finished fixtures have verified/evaluated results, and `/predictions` has an active runway of upcoming World Cup predictions.

Start each task from updated `main`:

```bash
git checkout main
git pull origin main
git status --short
```

Expected status: clean.

## What is now done

### Premium Prediction Detail MVP v1

Implemented on `/matches/[slug]`. Authorized premium/admin viewers can see public-safe model detail: expected goals, top 3 probable scorelines, BTTS, Over/Under 2.5, and confidence/risk context. This does not expose `prediction_results`, raw Lab/admin payloads, internal evaluation payloads, odds/provider predictions, or service-role app routes.

### Free-tier probable score gating

Registered-free users do not see or fetch probable score before a result is verified. Anonymous users never see probable score in the public/basic section. Premium/admin access remains through the protected premium projection path.

### Data Ops 01 and Data Ops 02

Data Ops 01 restored active/upcoming predictions after the previous result batch. Data Ops 02 expanded the public upcoming runway.

Current active/upcoming public fixtures:

| API-Football fixture | Match | Kickoff UTC | Status |
|---:|---|---:|---|
| 1489383 | France vs Senegal | 2026-06-16 19:00 | public / future ready |
| 1539016 | Iraq vs Norway | 2026-06-16 22:00 | public / future ready |
| 1489381 | Argentina vs Algeria | 2026-06-17 01:00 | public / future ready |
| 1489382 | Austria vs Jordan | 2026-06-17 04:00 | public / future ready |
| 1539003 | Portugal vs Congo DR | 2026-06-17 17:00 | public / future ready |
| 1489384 | England vs Croatia | 2026-06-17 20:00 | public / future ready |
| 1489385 | Ghana vs Panama | 2026-06-17 23:00 | public / future ready |
| 1489386 | Uzbekistan vs Colombia | 2026-06-18 02:00 | public / future ready |
| 1539004 | Czechia vs South Africa | 2026-06-18 16:00 | public / future ready |
| 1539005 | Switzerland vs Bosnia & Herzegovina | 2026-06-18 19:00 | public / future ready |
| 1489387 | Canada vs Qatar | 2026-06-18 22:00 | public / future ready |
| 1489388 | Mexico vs South Korea | 2026-06-19 01:00 | public / future ready |

Latest verified/evaluated fixtures from the recent operations cycle:

| API-Football fixture | Match | Result | Status |
|---:|---|---:|---|
| 1489380 | Spain vs Cape Verde Islands | 0-0 | verified / evaluated |
| 1489377 | Belgium vs Egypt | 1-1 | verified / evaluated |
| 1489379 | Saudi Arabia vs Uruguay | 1-1 | verified / evaluated |
| 1489378 | Iran vs New Zealand | 2-2 | verified / evaluated |

Prior verified/evaluated fixtures remain in public history:

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

### Admin publish queue bypass

PR #81 added `/admin/real-fixture-publish-queue`, an admin-only lightweight queue for saving and publishing exact real fixtures. It reuses existing save/publish server actions and avoids the heavy Real Fixture Lab exact-detail render path.

Use this route for publication operations until the Real Fixture Lab blocker is fixed.

## Known blocker

`/admin/real-fixture-lab` and especially `/admin/real-fixture-lab?externalId=...` remain unstable with `RangeError: Maximum call stack size exceeded`. Treat this as a separate follow-up bug. Do not use Real Fixture Lab exact-detail as the primary publication path.

## Immediate next work

1. **TM01 - Torneo Mundialista admin JSON export MVP.** Build an admin-only export from UFO Predictor using public-safe prediction fields and UFO match links. Torneo controls reveal/display rules.
2. **Monitor active fixtures and process results as they finish.** Use exact fixture result flow only after provider status is final.
3. **Fix Real Fixture Lab stack overflow** as a separate admin cleanup task.
4. Continue Epic G in parallel: dev/prod environment verification, production smoke, Wompi payment integration planning, plans/pricing, entitlements, premium gate, and trust/legal copy.

## Hard boundaries

Do not expose `prediction_results`, raw Lab/admin payloads, internal evaluation payloads, provider odds/predictions as model inputs, or service-role usage in app routes. Do not change API-Football ingest/apply, signal packs, prediction engine, payments, checkout, or Torneo integration unless explicitly scoped.
