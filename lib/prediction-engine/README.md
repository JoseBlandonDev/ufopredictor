# Prediction Engine v0.1 Lab

Pure TypeScript statistical engine for internal Lab fixtures. It does not read or
write Supabase, call external providers, or generate narrative.

Public entry point:

```ts
import { generatePrediction } from "./generate-prediction";

const output = generatePrediction(input);
```

Public exports from `index.ts` are `generatePrediction`, the versioned default
configuration, and the engine's input/output contract types. Calculation
helpers stay internal because their intermediate probabilities use decimal
scale.

Internal modules:

- `types.ts`: input/output and future persistence projections.
- `config.ts`: versioned v0.1 weights, goal rate and bounds.
- `normalize.ts`: safe score defaults and input normalization.
- `team-power.ts`: weighted team power calculation.
- `expected-goals.ts`: bounded expected goal calculation.
- `poisson.ts`: score matrix generation.
- `markets.ts`: 1X2, BTTS, Over/Under 2.5 and top scores.
- `confidence-risk.ts`: explainable confidence/risk indicators.
- `generate-prediction.ts`: deterministic orchestration.
- `lab-fixtures.ts`: synthetic fixtures used by tests.

All exported probability values use the `0..100` scale expected by the database
contracts. Statistical operations inside the engine use decimal probabilities.

The LLM must never decide match outcomes. It may only explain calculated output
in a later epic.
