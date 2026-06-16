# Project Context - UFO Predictor

_Last refreshed: post PR #81 real fixture publish queue bypass / Data Ops 02 completion (2026-06-16)._

UFO Predictor is a probabilistic football prediction product focused on controlled public World Cup predictions, result verification, and transparent responsible framing.

## Current context

- Public predictions MVP is functional.
- Premium Prediction Detail MVP v1 is implemented on match detail.
- Data Ops 01 and Data Ops 02 are complete.
- `/predictions` has a 12-fixture active/upcoming runway.
- Recent results are verified/evaluated and visible in public history.
- `/admin/real-fixture-publish-queue` is the current publication operations path.
- Real Fixture Lab exact-detail remains blocked by stack overflow and needs separate cleanup.
- Next product need is TM01 admin JSON export for Torneo Mundialista.

## Product principles

- Public pages expose public-safe model outputs only.
- Internal Lab/evaluation payloads remain private.
- `prediction_results` is not a public product source.
- Provider odds/predictions are not hidden inputs.
- Torneo human picks are not UFO model inputs.
- Probabilities are readings, not guarantees.

## Related product

Torneo Mundialista is a separate free friends prediction game. It is planned as a discovery surface for UFO Predictor through an export-first integration. UFO may export a complete public-safe JSON prediction package; Torneo controls reveal/display rules.
