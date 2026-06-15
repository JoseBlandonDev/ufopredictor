# Model V0.1 / V0.2 Notes - UFO Predictor

_Last refreshed: post PR #77 Premium Prediction Detail MVP / Real Fixture Lab Ops Summary, after latest World Cup result batch verification._

## Current model/product relationship

Premium Prediction Detail MVP exposes more of the existing model output, but does not change the model itself. Public-safe fields now available to premium/admin on match detail include expected goals, top scorelines, BTTS, Over/Under 2.5, confidence, and risk.

## Recent evaluation observations

| Match | Result | Observation |
|---|---:|---|
| Sweden vs Tunisia | 5-1 | Direction/favorite signal was useful; exact probable score was conservative. |
| Germany vs Curacao | 7-1 | Strong favorite/goleada case for tail calibration review. |
| Netherlands vs Japan | 2-2 | Draw result useful for draw calibration review. |
| Ivory Coast vs Ecuador | 1-0 | Low-scoring home win. |

## Interpretation policy

- 1X2 probabilities are model readings, not promises.
- Most likely score is a scenario, not a guaranteed prediction.
- High confidence does not mean exact score certainty.
- Scoreline calibration should be reviewed over a larger result sample.

## Torneo Mundialista / Human Signal

Torneo Mundialista human picks may be useful as product/marketing/Human Signal in the future, but they are not model inputs today. Do not introduce hidden human-pick signals into the UFO model without an approved design.
