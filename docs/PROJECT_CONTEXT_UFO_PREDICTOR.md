# Project Context - UFO Predictor

_Last refreshed: post PR #77 Premium Prediction Detail MVP / Real Fixture Lab Ops Summary, after latest World Cup result batch verification._

UFO Predictor is a probabilistic football prediction product focused on controlled public World Cup predictions, result verification, and transparent responsible framing.

## Current context

- Public predictions MVP is functional.
- Premium Prediction Detail MVP v1 is implemented on match detail.
- Real Fixture Lab is the operational admin dashboard.
- Latest World Cup result batch has been verified/evaluated.
- Next need is publishing the next batch of predictions.

## Product principles

- Public pages expose public-safe model outputs only.
- Internal Lab/evaluation payloads remain private.
- `prediction_results` is not a public product source.
- Provider odds/predictions are not hidden inputs.
- Probabilities are readings, not guarantees.

## Related product

Torneo Mundialista is a separate free friends prediction game. It is planned as a discovery surface for UFO Predictor through an export-first integration. UFO may export a complete public-safe JSON prediction package; Torneo controls reveal/display rules.
