# Data Dictionary - UFO Predictor

_Last refreshed: post PR #94 model closeout / Wompi production premium baseline / 28-fixture evaluation closeout (2026-06-19)._

## Prediction scopes

### `public_product`

Prediction scope used by public/free/premium product surfaces. Public pages must use latest public-safe `public_product` rows only.

### `internal_lab`

Internal/admin prediction scope used for evidence, review, and evaluation. It must not be used as public runtime fallback.

### `pre_match_24h`

Evaluation window used for the fair stored-prediction report. The closeout dedupes to the latest evaluated `internal_lab` + `pre_match_24h` row per fixture.

## Core prediction tables/concepts

### `prediction_versions`

Stores 1X2 probabilities, expected goals, most likely score, scoreline JSON, confidence, risk, run scope, and version metadata.

### `prediction_markets`

Stores market-style outputs such as BTTS, O/U 2.5, exact score, and match winner.

### `prediction_results`

Internal evaluation results. Never expose publicly.

### Verified result

Admin-verified final score projected through public-safe fields. May be displayed publicly without exposing evaluation internals.

### Internal evaluation

Admin-only correctness assessment persisted after verified result.

## Model concepts

### SIGNAL04

Accepted national-team signal refresh for the 48 World Cup teams. Runtime uses reviewed committed static fields, not raw source exports.

### DRAW01

Conservative 1X2 draw reconciliation. It only promotes draw when a draw-shaped score matrix and close aggregate probabilities satisfy strict bounds. It does not change xG, scoreline probabilities, BTTS, or O/U.

### Fair stored evaluation

Metrics calculated from the prediction actually stored before the match. This is the primary performance report.

### Fair overlay

A deterministic new rule applied to stored pre-match output without injecting post-match information. DRAW01 overlay is reported this way.

### Diagnostic recomputation

A recomputation using refreshed/current signals over historical fixtures. Useful for debugging, but not a fair backtest when the signals include later information.

## Signal refresh artifacts

### Normalized signal package

Audit/Codex input derived from FIFA CSV, Elo ranking HTML, and Elo results HTML. It is not a runtime dependency.

### Source manifest

Machine-readable record of input filenames, source roles, generation time, coverage, and boundaries.

### Quality report

Required future artifact:

```json
{
  "canonicalTeamCount": 48,
  "duplicateTeamCount": 0,
  "invalidDateCount": 0,
  "futureDateCount": 0,
  "unresolvedCanonicalOpponentCount": 0,
  "unresolvedExternalOpponentCount": 0,
  "incompleteRecentListCount": 0,
  "aliasRemaps": [],
  "sourceCoverage": {},
  "verdict": "pass"
}
```

A failing verdict blocks Codex implementation unless the owner approves a documented exception.

## Public/premium concepts

### `model_detail`

Protected public-safe premium model detail containing expected goals, top scorelines, BTTS, O/U 2.5, confidence, and risk.

### Probable score

Most likely scoreline. Premium-sensitive before verification; registered-free behavior follows current gating policy.

### Premium entitlement

Server-verified access state activated by the payment/entitlement flow. Dedicated Wompi and entitlement runbooks remain authoritative for payment implementation details.

## Admin queues

- Result Review Queue: verify final results.
- Evaluation Queue: persist internal evaluation.
- Publish Queue: save/publish scheduled exact fixtures.
- Torneo Export: generate public-safe admin export.

## Hard boundaries

No public `prediction_results`, raw Lab/evaluation payloads, raw source package runtime imports, provider predictions/odds as model inputs, Torneo human picks as model inputs, or client-side payment secrets.
