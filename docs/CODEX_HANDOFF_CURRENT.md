# Codex Handoff Current - UFO Predictor

_Last refreshed: post PR #81 real fixture publish queue bypass / Data Ops 02 completion (2026-06-16)._

## Repo baseline

Start every task from updated `main`:

```bash
git checkout main
git pull origin main
git status --short
```

Expected status: clean after PR #81 is merged locally.

## Completed since prior handoff

### PR #77 - Premium Prediction Detail MVP + Lab Ops Summary

Completed and merged: premium model detail on `/matches/[slug]`, protected public-safe premium projection RPC, Lab Ops Summary, score gating, and safe public projection boundaries.

### Data Ops 01 and Data Ops 02

Completed operationally:

- restored active/upcoming predictions after the prior verified batch;
- verified/evaluated Spain, Belgium, Saudi Arabia, and Iran results;
- published a 12-fixture active/upcoming runway.

Active/upcoming public fixtures:

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

Latest verified/evaluated fixtures:

| API-Football fixture | Match | Result | Status |
|---:|---|---:|---|
| 1489380 | Spain vs Cape Verde Islands | 0-0 | verified / evaluated |
| 1489377 | Belgium vs Egypt | 1-1 | verified / evaluated |
| 1489379 | Saudi Arabia vs Uruguay | 1-1 | verified / evaluated |
| 1489378 | Iran vs New Zealand | 2-2 | verified / evaluated |

### PR #81 - Real Fixture Publish Queue Operational Bypass

Merged: `/admin/real-fixture-publish-queue` is now available as the admin-only publication path for scheduled real fixtures. It reuses existing save/publish actions and avoids the unstable Real Fixture Lab exact-detail route.

## Known blocker

`/admin/real-fixture-lab` and exact-detail routes still trigger `RangeError: Maximum call stack size exceeded`. Do not use those routes as the primary publication path. Treat Lab cleanup as a separate focused bug.

## Immediate next recommended task

### TM01 - Admin JSON export for Torneo Mundialista

Goal: export a complete public-safe UFO prediction package for Torneo Mundialista.

Preferred V0: admin-only JSON export with date/range selection, 1X2, confidence/risk, probable score, top scorelines, xG, BTTS, Over/Under, metadata, and UFO links. Torneo decides display/reveal rules. No endpoint by default.

## Operational follow-up

Monitor the 12 active/upcoming fixtures. When provider status is final, process results through the exact result ingest/review/evaluation flow. Do not verify live/unfinal fixtures.

## Epic G status

Parallel track:

- G01 done.
- G02 dev/prod environment separation + config readiness done as readiness baseline.
- G03-G08 pending.
- G05 is Wompi-focused; Wompi is the intended payment gateway direction, but integration is not implemented.

## Hard boundaries

Do not expose `prediction_results`, raw Lab/admin/evaluation payloads, service-role app routes, provider odds/predictions, payment secrets, or hidden human picks from Torneo as model input. No payments/checkout unless explicitly Epic G.
