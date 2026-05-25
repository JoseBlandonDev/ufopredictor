# Model Evaluation / Backtesting Lab

Pure evaluation layer for comparing prediction output against verified final
scores. It produces payloads shaped for future `prediction_results`
persistence, but it does not read from or write to Supabase.

Public entry points:

```ts
import { aggregateEvaluationMetrics, evaluatePrediction } from "./index";
```

Rules:

- Only `verified` match results are evaluable.
- Market leaders within `0.01` percentage points are marked `ambiguous`.
- Ambiguous probability markets map to `null` correctness values.
- Exact score evaluation always uses `mostLikelyScore`; a conflicting first
  `topScorelines` entry is emitted as an input warning.
- `goalError` uses `mostLikelyScore`, not expected goals:
  `abs(predictedHome - actualHome) + abs(predictedAway - actualAway)`.
- Aggregated accuracy excludes ambiguous market values from that market's
  denominator.
