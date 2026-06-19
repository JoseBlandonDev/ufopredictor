# Project Context - UFO Predictor

_Last refreshed: post PR #99 documentation rebaseline (2026-06-19)._

## Product

UFO Predictor publishes probabilistic World Cup football predictions with public, registered-free, premium, and admin layers.

It does not accept bets and does not guarantee results.

## Current baseline

- model calibration closed through PR #94;
- public history pagination through PR #96;
- reproducible signal refresh through PR #97;
- Prediction Review Gate through PR #98;
- complete Matchday 2 export workflow through PR #99;
- Wompi/G06/G07 production premium loop operational;
- final 24-fixture JSON delivered to Torneo.

## Working principles

- stored pre-match prediction is immutable historical evidence;
- signal refresh is not model recalibration;
- exact provider status gates writes;
- public and internal data stay separated;
- payments authorize through entitlements;
- repetitive API and batch operations belong in console/scripts;
- Codex handles architecture, implementation, tests, and complex review.

## Current parallel tracks

### Data operations

- Matchday 2 result monitoring;
- next runway preparation;
- export regeneration when required.

### Epic G frontend/commercial

- pricing truth;
- home freshness;
- transparency copy;
- catalog simplification;
- Review Gate polish;
- role/plan/entitlement clarity;
- responsive/accessibility/smoke.

## Guardrails

No:

- post-result prediction rewriting;
- provider predictions/odds as model inputs;
- Torneo picks as model inputs;
- public internal evaluation payloads;
- client secrets;
- combined model/payment/frontend mega-slices.
