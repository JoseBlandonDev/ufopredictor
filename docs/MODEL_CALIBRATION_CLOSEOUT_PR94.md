# Model Calibration Closeout - PR #94

_Status: historical closeout record._

## Closeout decision

The v0.1 calibration phase closed with SIGNAL04 and DRAW01 retained and the expected-goals implementation unchanged. Further formula changes required a new explicit research epic with clean data and acceptance criteria.

## Fair stored baseline

| Metric | Result |
|---|---:|
| 1X2 | 16/28 |
| Exact score | 7/28 |
| BTTS | 16/27 |
| O/U 2.5 | 16/28 |
| Average total-goal error | 1.821 |

## Guardrails preserved

- no post-result rewrite;
- stored pre-match row is the fair record;
- no provider prediction/odds as model input;
- current-signal historical recomputation is diagnostic;
- immutable publication lineage.

## Relationship to Prediction Intelligence v2

PR #94 remains the historical v1 closeout. The later Prediction Intelligence v2 branch is a separate research/implementation epic with durable data, replay, bounded signals, and scenario analysis. Current status must be read from `PREDICTION_INTELLIGENCE_V2_CURRENT.md`, not inferred from this historical document.
