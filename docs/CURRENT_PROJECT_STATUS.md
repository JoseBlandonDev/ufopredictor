# Current Project Status - UFO Predictor

_Last refreshed: post PR #81 real fixture publish queue bypass / Data Ops 02 completion (2026-06-16)._

## Executive status

UFO Predictor has a working public prediction product, Premium Prediction Detail MVP on match detail pages, verified result history, and a new admin-only publish queue that keeps fixture publication operational while the original Real Fixture Lab exact-detail route is unstable.

Data Ops 01 and Data Ops 02 are complete. `/predictions` currently has a useful active/upcoming runway instead of only historical results.

## Current product capabilities

- Public predictions list with 1X2 probabilities and verified result blocks.
- Public match detail with 1X2 probabilities and responsible risk/confidence framing.
- Premium match detail with public-safe model detail for authorized viewers.
- Registered-free probable score gated until verified result.
- Admin-only publish queue for scheduled real fixture save/publish operations.
- Controlled result verification and internal evaluation persistence.

## Recent completed work

- PR #77 merged: Premium Prediction Detail MVP + Real Fixture Lab Ops Summary.
- Data Ops 01 completed: next fixture batch loaded/published and results processed.
- Data Ops 02 completed: active upcoming runway expanded.
- PR #81 merged: real fixture publish queue operational bypass.

## Active/upcoming predictions

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

## Recent verified/evaluated results

| API-Football fixture | Match | Result | Status |
|---:|---|---:|---|
| 1489380 | Spain vs Cape Verde Islands | 0-0 | verified / evaluated |
| 1489377 | Belgium vs Egypt | 1-1 | verified / evaluated |
| 1489379 | Saudi Arabia vs Uruguay | 1-1 | verified / evaluated |
| 1489378 | Iran vs New Zealand | 2-2 | verified / evaluated |

Prior verified results remain visible in history:

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

## Current risks / gaps

1. Real Fixture Lab exact/detail route has a known `RangeError: Maximum call stack size exceeded` blocker.
2. TM01 Torneo Mundialista export is planned, not implemented.
3. Venue/stadium metadata remains pending.
4. Signal refresh cadence remains open.
5. Premium v2/post-match demo policy remains open.
6. Epic G payments/plans/entitlements remain future work; Wompi is the intended gateway direction but not implemented.

## Recommended next actions

1. Build TM01 admin JSON export MVP for Torneo Mundialista.
2. Monitor active fixtures and process results only after provider status is final.
3. Create a separate focused fix for Real Fixture Lab stack overflow.
4. Continue Epic G in parallel: production smoke, dev/prod operational verification, Wompi, entitlements, premium gate, and trust/legal copy.
