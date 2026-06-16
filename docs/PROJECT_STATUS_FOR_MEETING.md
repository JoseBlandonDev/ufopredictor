# Project Status for Meeting - UFO Predictor

_Last refreshed: post PR #81 real fixture publish queue bypass / Data Ops 02 completion (2026-06-16)._

## Executive summary

UFO Predictor now has public World Cup predictions, verified result display, Premium Prediction Detail MVP on match detail, and an operational admin publish queue. Data Ops 01 and Data Ops 02 are complete: `/predictions` has a 12-fixture active/upcoming runway, and recent completed fixtures have verified/evaluated results.

## Recently completed

- PR #77: Premium Prediction Detail MVP v1 and Lab Ops Summary.
- Data Ops 01: loaded/published next prediction batch and processed results.
- Data Ops 02: expanded upcoming prediction runway.
- PR #81: admin-only real fixture publish queue bypass.

## Current active/upcoming fixtures

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

## Recent verified results

| API-Football fixture | Match | Result | Status |
|---:|---|---:|---|
| 1489380 | Spain vs Cape Verde Islands | 0-0 | verified / evaluated |
| 1489377 | Belgium vs Egypt | 1-1 | verified / evaluated |
| 1489379 | Saudi Arabia vs Uruguay | 1-1 | verified / evaluated |
| 1489378 | Iran vs New Zealand | 2-2 | verified / evaluated |

## Current risks / gaps

- Real Fixture Lab exact/detail route still hits `RangeError: Maximum call stack size exceeded`; use `/admin/real-fixture-publish-queue` instead.
- Torneo Mundialista export is planned, not implemented.
- Payments/checkout/entitlements are not implemented.
- Wompi is the intended payment gateway direction for Epic G, but integration remains pending.
- Venue metadata and signal refresh cadence remain pending.

## Recommended next steps

1. Build TM01 admin JSON export for Torneo Mundialista.
2. Monitor and verify/evaluate results for the 12 active fixtures as they finish.
3. Open a separate Real Fixture Lab stack overflow cleanup task.
4. Continue Epic G work in parallel.
