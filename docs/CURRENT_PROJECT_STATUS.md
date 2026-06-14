# Current Project Status - UFO Predictor

_Last refreshed: post PR #71 plus parallel work planning._

## Executive status

UFO Predictor has moved from MVP 0/Lab validation into MVP 1 controlled public World Cup fixture operations.

The project now supports selected real World Cup fixtures from ingestion to public prediction, result verification, and public-safe final result display.

## What is completed

### Model and signals

- E10C complete: real national-team strength signal enrichment for the 48 canonical World Cup teams.
- E10D complete: expected-goals/scoreline calibration improved using E10C metadata.
- The model no longer relies on the early fallback-only state that overproduced `1-1` for many fixtures.

### Public product

- Public predictions page exists and is usable.
- Active/upcoming fixtures are prioritized.
- Finished fixtures are shown in a secondary recent results/history section.
- Verified final results can be shown on public cards and match detail pages.
- Public pages remain public-safe and do not expose internal evaluation tables.

### Admin / operations

- Real Fixture Lab can operate exact API-Football fixtures.
- Finished public fixtures can be refreshed during prelaunch through an exact admin-only path.
- Real Fixture Lab prioritizes operational World Cup fixtures and collapses legacy/pilot fixtures.
- Lab buttons provide pointer/pending/loading feedback.

### Supabase/manual migrations

Applied manually via SQL Editor:

- `0033_real_fixture_lab_finished_public_refresh_prediction_policies.sql`
- `0034_public_verified_match_results_projection.sql`

## Current fixture state

### Completed first four fixtures

| Fixture | Result | Public state |
|---|---:|---|
| Mexico vs South Africa | 2-0 | verified result, refreshed public prediction |
| South Korea vs Czechia | 2-1 | verified result, refreshed public prediction |
| Canada vs Bosnia & Herzegovina | 1-1 | verified result, refreshed public prediction |
| USA vs Paraguay | 4-1 | verified/evaluated result, refreshed public prediction |

### Published upcoming fixtures

- Qatar vs Switzerland
- Brazil vs Morocco
- Haiti vs Scotland
- Australia vs Turkiye
- Germany vs Curacao
- Netherlands vs Japan
- Ivory Coast vs Ecuador
- Sweden vs Tunisia

## What remains incomplete

### Premium

Premium projection content is not implemented yet. The intended MVP premium detail should expose public-safe richer model outputs, likely:

- top 3 probable scorelines with percentages;
- expected goals;
- BTTS;
- Over/Under 2.5;
- main model factors;
- confidence/risk explanation.

### Venues

Venue/stadium/city metadata is still incomplete. Public pages may still show "Sede por confirmar".

### Signal refresh

The project needs a defined signal refresh strategy for FIFA/Elo/recent form. Current likely path:

- daily or semi-manual refresh during World Cup;
- no update after every single match unless deliberately scoped;
- later worker/cron automation.

### Product platform / monetization

Epic G is planned as a parallel-safe track for another contributor:

- G01 Auth/account UX - done;
- G02 Dev/Prod Environment Separation and Production Config Audit - documented in `docs/PRODUCTION_READINESS.md`;
- G03 Production Smoke Test on `ufopredictor.com` - pending;
- G04 plans/pricing MVP;
- G05 payment provider spike;
- G06 subscription/entitlement model proposal;
- G07 premium gate shell;
- G08 trust/legal/product copy.

G02 does not mean production has been smoke-tested. It documents required
Supabase, Google OAuth, Resend SMTP, Vercel, domain, redirect, and environment
configuration before G03.

This work should avoid model, ingest, signal pack, and result verification files.

### Lineups and market context

- `lineupContextScore` remains neutral placeholder.
- `marketScore` remains neutral placeholder.
- Do not use odds/provider predictions as hidden input.

## Current risk areas

- Overfitting future calibration to a tiny sample of finished fixtures.
- Treating refreshed prelaunch predictions as original pre-match history without internal context.
- Broad API-Football writes instead of exact fixture operations.
- Publicly exposing internal evaluation state.
- Letting manual signal refresh become an operational bottleneck.
- Parallel contributors touching model/data files and creating conflicts.

## Recommended next work

1. Premium prediction detail MVP.
2. Product platform / monetization foundations as parallel work.
3. Venue/stadium metadata.
4. Signal refresh strategy.
5. Continue controlled fixture operations.
6. Later: docs/source rebaseline after the next major block.
