# Track D / API-Football Handoff

_Last refreshed: post PR #81 real fixture publish queue bypass / Data Ops 02 completion (2026-06-16)._

## Current operation model

Use exact fixture workflow. Avoid broad unknown apply.

### For upcoming scheduled fixtures

1. Read provider fixture with `npm run spike:api-football -- --mode fixture --fixtureId <id>`.
2. Run exact ingest dry-run.
3. Apply only when dry-run confirms the expected single scheduled fixture and `match_results=0`.
4. Publish via `/admin/real-fixture-publish-queue`.
5. Verify `/predictions` and `/matches/[slug]`.

### For finished fixtures

1. Read provider fixture.
2. Run exact ingest dry-run.
3. Apply only when provider status is final and dry-run shows `match_results=1`.
4. Verify result through admin result flow.
5. Persist internal evaluation when available.
6. Verify public display.

## Current active/upcoming runway

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

## Latest verified/evaluated results

| API-Football fixture | Match | Result | Status |
|---:|---|---:|---|
| 1489380 | Spain vs Cape Verde Islands | 0-0 | verified / evaluated |
| 1489377 | Belgium vs Egypt | 1-1 | verified / evaluated |
| 1489379 | Saudi Arabia vs Uruguay | 1-1 | verified / evaluated |
| 1489378 | Iran vs New Zealand | 2-2 | verified / evaluated |

Prior verified results remain visible in public history:

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

## Admin path note

Use `/admin/real-fixture-publish-queue` for publication. Real Fixture Lab exact-detail is unstable with `RangeError: Maximum call stack size exceeded` and should be treated as a separate follow-up bug.

## Boundaries

Do not batch apply broad unknown fixtures, use provider predictions or odds, expose internal evaluation payloads, expose `prediction_results`, or verify/evaluate live/unfinal fixtures.
