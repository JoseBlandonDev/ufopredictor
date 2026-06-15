# ChatGPT Project Source - UFO Predictor Current

_Last refreshed: post PR #77 Premium Prediction Detail MVP / Real Fixture Lab Ops Summary, after latest World Cup result batch verification._

## Product summary

UFO Predictor is a probabilistic football prediction product. It publishes controlled public World Cup predictions, verifies real results, and keeps internal evaluation separate from public display. It does not receive bets and does not guarantee outcomes.

## Current state

- Public predictions are available through `/predictions`.
- Match detail pages are available through `/matches/[slug]`.
- Real Fixture Lab is the current admin operational dashboard.
- Premium Prediction Detail MVP v1 is implemented for match detail.
- The latest known fixture batch has been verified/evaluated through Real Fixture Lab.
- The next operational need is to load/publish the next World Cup prediction batch.

## Public prediction behavior

`/predictions` shows public-safe 1X2 probabilities, confidence/risk for registered-free users, and verified final result blocks when available. It does not render probable score, top scorelines, xG, BTTS, or Over/Under.

## Match detail behavior

`/matches/[slug]` shows public 1X2 probabilities and responsible framing. The probable score is gated:

- anonymous: no probable score;
- registered-free before/live/unverified: no probable score and no RPC fetch;
- registered-free after verified result: probable score may show as post-match reference;
- premium/admin: premium model detail remains available through premium projection.

Premium model detail includes expected goals, top scorelines, BTTS, Over/Under 2.5, and confidence/risk from a protected public-safe projection.

## Real Fixture Lab

Real Fixture Lab now provides operational fixture queue, upcoming fixtures, pending result review, verified/evaluated states, legacy/pilot collapse, exact fixture detail, result verification, and internal evaluation actions.

The Lab uses `model_detail: yes` as a readiness signal when direct `prediction_markets` count is hidden by RLS/read-path behavior.

## Recent results

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

Planned V0: admin-only JSON export from UFO Predictor / Real Fixture Lab with a date-range package of complete public-safe UFO predictions. Torneo Mundialista controls what is shown and when. UFO does not consume Torneo human picks as hidden model input.

## Safety boundaries

No public exposure of `prediction_results`, raw evaluation data, raw Lab payloads, service-role app routes, provider odds, or provider predictions.
