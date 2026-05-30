# MODEL V01 — UFO Predictor

_Last updated: post C05 / pre C06_

Current baseline: `main` is post PR #29 (`Feature/registered free saved matches`). C05 is functionally closed. Next major block: C06 — World Cup Premium Package Foundation.


## Product Principle

```txt
The statistical model calculates.
The AI explains.
```

The model, not an LLM narrative layer, must be the source of prediction probabilities.

## Current Prediction Surface

The current public product exposes:

- match metadata;
- public 1X2 probabilities;
- confidence/risk for Registered Free;
- confidence/risk teaser for Anonymous.

After C05 Gate 2B, Anonymous users do not receive confidence/risk fields in the shaped UI DTO.

## Current Public Prediction Data Path

Public predictions are read from:

```txt
public_prediction_summaries
```

This view contains public prediction summary columns. UI shaping determines what each viewer receives.

## Current Match Detail Data Path

Public match details are read from:

```txt
public_match_details
```

This view now includes `match_id` only to support saved matches server-side resolution for public matches.

## Model Outputs Currently Public

Public/free product may show:

- home win probability;
- draw probability;
- away win probability.

Registered Free may also see:

- confidence score;
- risk level.

## Premium Candidate Outputs

Potential future premium outputs include:

- scorelines;
- expected goals;
- BTTS;
- over/under;
- Model vs Market;
- Golden Hour Delta;
- deeper narratives;
- post-result evaluation details;
- historical/trust explanations beyond public summary.

These must not be exposed until a protected premium projection is implemented.

## LLM Narrative Rule

LLMs may eventually help explain model output, but must not invent prediction probabilities.

Narratives should be constrained by persisted model output and product-safe fields.

## Trust / Transparency

Current `/transparency` remains simulated/mock.

Future trust work must distinguish:

- internal Lab evaluation;
- beta calibration;
- public trust-eligible performance.

Do not use early or internal calibration data as finished public trust evidence.
