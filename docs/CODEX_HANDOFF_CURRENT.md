# Codex Handoff Current - UFO Predictor

_Last refreshed: post PR #77 Premium Prediction Detail MVP / Real Fixture Lab Ops Summary, after latest World Cup result batch verification._

## Repo baseline

Start every task from updated `main`:

```bash
git checkout main
git pull origin main
git status --short
```

Expected status: clean.

## Completed since prior handoff

### PR #77 - Premium Prediction Detail MVP + Lab Ops Summary

Completed and merged:

- Premium Prediction Detail MVP v1 in `/matches/[slug]`.
- Migration `0035_premium_match_model_detail_projection.sql`.
- Protected RPC extension for public-safe premium model detail.
- Real Fixture Lab Ops Summary.
- World Cup stage/resource normalization for labels like `Group Stage - 1`.
- Publication/refresh flow now clones `prediction_markets` for new public rows where applicable.
- Public timestamp in match detail removed.
- Probable score gated for registered-free users before verified result.

### Latest fixture operations

The latest known World Cup batch was applied, verified, and evaluated:

| Match | Result |
|---|---:|
| Germany vs Curacao | 7-1 |
| Netherlands vs Japan | 2-2 |
| Ivory Coast vs Ecuador | 1-0 |
| Sweden vs Tunisia | 5-1 |
| Australia vs Turkiye | 2-0 |
| Haiti vs Scotland | 0-1 |
| Brazil vs Morocco | 1-1 |
| Qatar vs Switzerland | 1-1 |
| USA vs Paraguay | 4-1 |
| Canada vs Bosnia & Herzegovina | 1-1 |
| South Korea vs Czechia | 2-1 |
| Mexico vs South Africa | 2-0 |

## Immediate next recommended task

### Data Ops 01 - Load next World Cup prediction batch

Scope: identify next upcoming fixtures, generate/refine predictions, publish `public_product` rows, confirm premium model detail readiness, and verify `/predictions` shows active/upcoming fixtures again. Do not touch result verification, historical results, model internals, or API-Football ingest/apply unless explicitly approved.

## Planned discovery task

### TM01 - Admin JSON export for Torneo Mundialista

Goal: export a complete public-safe UFO prediction package for Torneo Mundialista.

Preferred V0: admin-only JSON export from Real Fixture Lab with date/range selection, 1X2, confidence/risk, probable score, top scorelines, xG, BTTS, Over/Under, metadata, and UFO links. Torneo decides display/reveal rules. No endpoint by default.

## Epic G status

Parallel track: G01 done, G02 done, G03-G08 pending.

## Hard boundaries

Do not expose `prediction_results`, raw Lab/admin/evaluation payloads, service-role in app routes, provider odds/predictions, or hidden human picks from Torneo as model input. No payments/checkout unless explicitly Epic G.
