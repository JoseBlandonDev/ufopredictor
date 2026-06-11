# UFO Predictor — Project Context

Last refreshed: post-E07 / MVP 1 public fixture expansion and refresh.

UFO Predictor is a football prediction product focused on probabilistic match forecasts, transparent methodology, and safe free/premium presentation.

## Product stance

UFO Predictor provides probabilistic analysis.

It does not:

- receive bets;
- guarantee outcomes;
- provide betting advice;
- use provider predictions as its own hidden prediction source;
- use betting odds as hidden model input in the current MVP stages.

## Current launch focus

The current focus is MVP 1 for World Cup 2026.

Four real World Cup fixtures are public:

- Mexico vs South Africa — `api-football:fixture:1489369`;
- South Korea vs Czech Republic — `api-football:fixture:1538999`;
- Canada vs Bosnia & Herzegovina — `api-football:fixture:1539000`;
- USA vs Paraguay — `api-football:fixture:1489370`.

This validates the product path from real fixture ingest to public prediction visibility across multiple selected fixtures.

## Brand/product promise

The product should feel:

- data-driven;
- transparent;
- careful about uncertainty;
- premium but not casino-like;
- credible enough to survive contact with actual football, a sport designed to embarrass spreadsheets.

## Current product boundaries

Public product may show:

- selected real fixture predictions;
- 1X2 probabilities;
- confidence/risk framing;
- basic match context;
- public-safe explanation copy.

Public product must not expose:

- internal Lab rows;
- `prediction_results`;
- raw internal evaluation payloads;
- provider predictions;
- betting odds as model input;
- admin-only fixtures.

## Current access-tier direction

Not fully implemented yet.

Recommended direction:

| User type | Product value |
|---|---|
| Anonymous | 1X2 probabilities, confidence/risk, basic match context. |
| Registered free | probable score, short interpretation, watchlist/following. |
| Premium future | top scorelines, BTTS, Over/Under, deeper analysis and signal explanation. |

This is still a product decision for E09, not an implemented contract.

## Current operational style

The MVP 1 launch flow is intentionally manual and exact-fixture-based:

```text
exact fixture read
-> dry-run
-> exact apply
-> internal prediction
-> manual publication
-> public verification
```

Already-public fixtures can now be refreshed exactly:

```text
exact public fixture load
-> fresh internal evidence
-> replacement public prediction row
-> public verification
```

No broad apply. No batch publication. No automatic publication.
