# G09 Frontend Commercial Readiness Plan - UFO Predictor

_Last refreshed: Prediction Intelligence v2 product handoff (2026-06-22)._

## Goal

Turn UFO's new data and analysis foundation into a truthful, differentiated, conversion-oriented experience without presenting the product as a fortune teller or exposing proprietary weights.

## Dependency

Do not begin broad v2 frontend implementation until Task 3B validates stage schema, data, signals, and immutable development predictions.

## P0 - Prediction Intelligence presentation

### General statistical reading

Before exact scores, show:

- statistical advantage;
- main uncertainty/risk;
- source cutoff;
- overall reliability.

### Scenario cards

Use three representative scenario families:

1. principal;
2. risk/coverage;
3. alternate.

A scenario includes:

- representative exact score;
- exact-score probability;
- family probability;
- evidence supporting it;
- evidence against it;
- required match script;
- reliability/sample warning.

Do not mechanically force one local, one draw, and one visitor scenario. Strong-favorite evidence may justify multiple favorite-win scenarios.

### Full-distribution honesty

Show additional plausible scores below the featured scenarios so users understand the model evaluates a matrix, not three guesses.

## P0 - access segmentation

### Anonymous

- basic teaser;
- limited fixture/reading;
- registration CTA;
- no premium evidence payload.

### Registered free

- basic 1X2;
- confidence/risk;
- limited current-form context;
- premium CTA.

### Premium

- full scenarios;
- evidence and contradictions;
- FIFA/Elo/current form;
- attack/defense/conversion;
- opponent quality;
- reliability and cutoff;
- more score distribution;
- post-match scenario evaluation.

### Admin

- provenance/source IDs;
- gate/cap diagnostics;
- review and publication controls;
- internal-only alerts.

## P0 - localization and venue truth

- Spanish team/country names in public UI;
- canonical identities remain locale-neutral;
- English supported from same localization table;
- future Portuguese requires rows/templates, not schema redesign;
- confirmed official venue/city must never render `Por definir`.

## P0 - truthful marketing

Allowed:

- probabilities, not certainties;
- scenarios and evidence;
- data aggregation and interpretation;
- source/reliability transparency.

Avoid:

- guaranteed result;
- “the highest percentage is the pick”;
- “we predicted it” after any covered scenario;
- material-accuracy claims not supported by metrics.

Preferred post-match wording:

```text
Se materializó uno de los escenarios contemplados.
```

## Existing commercial backlog retained

- pricing truth across DB/UI/Wompi;
- home freshness;
- catalog simplification;
- role/plan/entitlement clarity;
- Review Gate translation/empty states;
- responsive/accessibility/performance;
- cross-role/device smoke.

## Acceptance

- scenario/family distinction is understandable;
- premium value is obvious without exposing weights;
- anonymous/free/premium payloads are distinct server-side;
- Spanish names/venues are correct;
- no stale `Por definir` where official data exists;
- no production/payment/access regression;
- no claim that gated v2 materially beats v1.
