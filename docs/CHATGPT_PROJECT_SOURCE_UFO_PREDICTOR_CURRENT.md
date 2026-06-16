# ChatGPT Project Source - UFO Predictor Current

_Last refreshed: post PR #81 real fixture publish queue bypass / Data Ops 02 completion (2026-06-16)._

## Product summary

UFO Predictor is a probabilistic football prediction product. It publishes controlled public World Cup predictions, verifies real results, and keeps internal evaluation separate from public display. It does not receive bets and does not guarantee outcomes.

## Current state

- Public predictions are available through `/predictions`.
- Match detail pages are available through `/matches/[slug]`.
- Premium Prediction Detail MVP v1 is implemented for match detail.
- `/admin/real-fixture-publish-queue` is the current admin operational path for saving/publishing scheduled real fixtures.
- Real Fixture Lab exact-detail remains a known blocker due to `RangeError: Maximum call stack size exceeded`.
- Data Ops 01 and Data Ops 02 are complete.
- `/predictions` currently has 12 active/upcoming World Cup fixtures.
- TM01 export for Torneo Mundialista is planned, not implemented.

## Public prediction behavior

`/predictions` shows public-safe 1X2 probabilities, confidence/risk for registered-free users, and verified final result blocks when available. It does not render probable score, top scorelines, xG, BTTS, or Over/Under in the list cards.

## Match detail behavior

`/matches/[slug]` shows public 1X2 probabilities and responsible framing. The probable score is gated:

- anonymous: no probable score;
- registered-free before/live/unverified: no probable score and no RPC fetch;
- registered-free after verified result: probable score may show as post-match reference;
- premium/admin: premium model detail remains available through the protected premium projection.

Premium model detail includes expected goals, top scorelines, BTTS, Over/Under 2.5, and confidence/risk from a protected public-safe projection.

## Admin operations

### Current publication path

Use `/admin/real-fixture-publish-queue` for scheduled real fixture save/publish operations. The queue is admin-only, lightweight, and reuses existing server actions:

- `saveRealFixturePredictionAction`
- `publishRealFixturePredictionAction`

### Known Lab blocker

`/admin/real-fixture-lab` and exact-detail routes still hit a stack overflow. Keep Real Fixture Lab cleanup separate from TM01 and future data ops work.

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

## Recent verified results

| API-Football fixture | Match | Result | Status |
|---:|---|---:|---|
| 1489380 | Spain vs Cape Verde Islands | 0-0 | verified / evaluated |
| 1489377 | Belgium vs Egypt | 1-1 | verified / evaluated |
| 1489379 | Saudi Arabia vs Uruguay | 1-1 | verified / evaluated |
| 1489378 | Iran vs New Zealand | 2-2 | verified / evaluated |

Prior verified public history remains available:

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

## Torneo Mundialista planned track

Torneo Mundialista is a separate free friends prediction game used as a discovery surface for UFO Predictor. The planned integration is export-first, not endpoint-first.

Planned V0: admin-only JSON export from UFO Predictor with a date-range package of complete public-safe UFO predictions and UFO links. Torneo Mundialista controls what is shown and when. UFO does not consume Torneo human picks as hidden model input.

## Epic G parallel track

- G01 auth foundation: done.
- G02 dev/prod environment separation + config readiness: done as readiness/config baseline; operational smoke still belongs to G03.
- G03 production smoke test: pending.
- G04 plans/pricing MVP: pending.
- G05 Wompi payment integration spike/MVP: pending, provider direction selected as Wompi.
- G06 entitlement model: pending.
- G07 premium gate shell/CTA: pending.
- G08 trust/legal/responsible-use copy: pending.

## Safety boundaries

No public exposure of `prediction_results`, raw evaluation data, raw Lab payloads, service-role app routes, provider odds, provider predictions, payment secrets, or Torneo human-pick signals as UFO model inputs.
