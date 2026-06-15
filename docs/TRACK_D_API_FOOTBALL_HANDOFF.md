# Track D / API-Football Handoff

_Last refreshed: post PR #77 Premium Prediction Detail MVP / Real Fixture Lab Ops Summary, after latest World Cup result batch verification._

## Current operation model

Use exact fixture workflow:

1. Read provider fixture with `npm run spike:api-football -- --mode fixture --fixtureId <id>`.
2. Run exact ingest dry-run.
3. Apply only when dry-run confirms expected finished result.
4. Verify result in Real Fixture Lab.
5. Persist internal evaluation if available.
6. Verify public display.

Real Fixture Lab Ops Summary is now the main operations dashboard and shows fixture IDs, result status, evaluation status, and suggested actions.

## Latest verified/evaluated results

| API-Football fixture | Match | Result |
|---:|---|---:|
| 1489374 | Germany vs Curacao | 7-1 |
| 1489376 | Netherlands vs Japan | 2-2 |
| 1489375 | Ivory Coast vs Ecuador | 1-0 |
| 1539002 | Sweden vs Tunisia | 5-1 |
| 1539001 | Australia vs Turkiye | 2-0 |
| 1489372 | Haiti vs Scotland | 0-1 |
| 1489371 | Brazil vs Morocco | 1-1 |
| 1489373 | Qatar vs Switzerland | 1-1 |

Older verified fixtures remain visible in public history:

- USA 4-1 Paraguay.
- Canada 1-1 Bosnia & Herzegovina.
- South Korea 2-1 Czechia.
- Mexico 2-0 South Africa.

## Next API-Football/data task

Identify upcoming fixtures and publish the next prediction batch. Result verification flow is working; the product now needs new future predictions.

## Boundaries

Do not batch apply broad unknown fixtures, use provider predictions or odds, expose internal evaluation payloads, or use `prediction_results` in public pages.
