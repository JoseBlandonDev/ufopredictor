# Model V0.1 / V0.2 Notes - UFO Predictor

_Last refreshed: post PR #81 real fixture publish queue bypass / Data Ops 02 completion (2026-06-16)._

## Current model/product relationship

Premium Prediction Detail MVP exposes more of the existing model output, but does not change the model itself. Public-safe fields available to premium/admin on match detail include expected goals, top scorelines, BTTS, Over/Under 2.5, confidence, and risk.

## Recent evaluation observations

| Match | Result | Observation |
|---|---:|---|
| Germany vs Curacao | 7-1 | Strong favorite/goleada case for tail calibration review. |
| Sweden vs Tunisia | 5-1 | Direction/favorite signal was useful; exact probable score was conservative. |
| Netherlands vs Japan | 2-2 | Draw result useful for draw calibration review. |
| Spain vs Cape Verde Islands | 0-0 | Favorite/draw balance and low-scoring calibration case. |
| Belgium vs Egypt | 1-1 | Draw and risk/confidence calibration case. |
| Saudi Arabia vs Uruguay | 1-1 | Draw result useful for away-favorite / balanced-market calibration. |
| Iran vs New Zealand | 2-2 | Multi-goal draw and total-goals calibration case. |

## Interpretation policy

- 1X2 probabilities are model readings, not promises.
- Most likely score is a scenario, not a guaranteed prediction.
- High confidence does not mean exact score certainty.
- Scoreline calibration should be reviewed over a larger result sample.

## Torneo Mundialista / Human Signal

Torneo Mundialista human picks may be useful as product/marketing/Human Signal in the future, but they are not model inputs today. Do not introduce hidden human-pick signals into the UFO model without an approved design.
