# UFO Predictor — Architecture Summary

Last refreshed: after PR #40.

## Current architecture posture

UFO Predictor is a Next.js/Supabase football prediction app with:

- public prediction/match surfaces;
- registered/premium foundations;
- internal Real Fixture Lab;
- API-Football controlled ingest tooling;
- internal prediction/evaluation persistence;
- strict public/internal boundaries.

## Core layers

### Public app layer

Purpose:

- public match pages;
- prediction cards;
- transparency/product copy;
- free/premium presentation boundaries.

Public surfaces must not expose Real Fixture Lab internals, provider predictions, betting odds, or unpublished internal evaluation data.

### Admin/Internal lab layer

Key route:

- `/admin/real-fixture-lab`

Current Real Fixture Lab capabilities:

- load exact real fixtures scoped to `admin_only + api_football`;
- generate internal model preview;
- save internal predictions;
- read existing API-Football `match_results`;
- verify result rows from `pending_review` to `verified`;
- persist/refresh evaluation after verified result;
- read back saved evaluation.

### API-Football ingest layer

Key scripts/modules:

- `scripts/api-football-read-spike.ts`;
- `lib/football-api/ingest/planner.ts`;
- `lib/football-api/ingest/apply.ts`;
- `lib/football-api/ingest/writer.ts`.

Current allowed ingest lanes:

- exact friendly scheduled fixture pre-match;
- exact friendly finished fixture post-match when exactly one `pending_review` result write is planned.

Still blocked:

- broad friendlies apply;
- broad World Cup apply;
- provider predictions;
- odds.

### Persistence layer

Important tables:

- `matches`;
- `match_results`;
- `prediction_versions`;
- `prediction_markets`;
- `prediction_results`;
- `ingest_runs`;
- `ingest_run_items`.

### RLS/security posture

Important rules:

- no service-role in app routes;
- internal Lab writes are admin-only;
- Real Fixture Lab fixtures are `admin_only + api_football`;
- evaluation requires verified results;
- public views remain separate.

## Payment/auth status

Payments are not implemented yet.

Current planning:

- do not assume Stripe;
- MVP 1 should use PayPal or selected/available gateway;
- World Cup monetization should prefer one-time packages/tournament pass;
- recurring payments are post-World-Cup unless pulled forward by explicit decision.

## Workers status

Workers are not implemented yet.

Workers should wait until the manual D06 pilot proves which operations are painful enough to automate.

Potential future worker areas:

- fixture refresh;
- result polling;
- evaluation jobs;
- retry/error logging;
- admin alerts.

## Current immediate architecture risk

The biggest near-term risk is not architecture absence. It is scope drift under World Cup time pressure.

Protect the system by:

- exact fixture operations first;
- read-only discovery before apply;
- manual pilot before workers;
- no broad World Cup apply without explicit design.
