# ROADMAP AND BACKLOG — UFO Predictor

_Last updated: post PR #21 / C02 Plans & Entitlements Backend_

## Current Phase

UFO Predictor is transitioning from Lab foundation to public beta product foundation.

Completed foundations:

- internal Lab Admin Flow;
- public predictions listing from DB;
- plans and entitlements backend foundation.

Next product need:

- public/free match detail from DB.

## Product Strategy

The product should enter a controlled beta/freemium phase before the World Cup.

Strategy:

- show useful free value;
- keep premium data protected;
- do not run mass promotion until results, UX, costs, and infrastructure are validated;
- use finals, friendlies, and pre-World Cup fixtures for organic learning.

## Roadmap Sequence

### 1. C03 — Match Detail Public From DB

Branch:

```txt
feature/match-detail-public-from-db
```

Goal:

Replace mock `/matches/[slug]` with real public/free DB data.

### 2. Premium Access Enforcement

Goal:

Use C02 entitlement logic to ensure premium projections are filtered server-side.

### 3. Entitled Match Detail Premium Projection

Goal:

Expose premium match sections only to authorized users.

Possible premium sections later:

- markets;
- narratives;
- scorelines;
- model vs market;
- Golden Hour Delta;
- post-result evaluation.

### 4. Data Intake / Sports API

Goal:

Choose and integrate a real sports data provider.

Must consider:

- cost;
- quota;
- reliability;
- World Cup coverage;
- fixtures;
- lineups if needed;
- results.

### 5. Workers Runtime

Goal:

Replace mock worker runs with real scheduled jobs.

Likely jobs:

- sync fixtures;
- sync results;
- generate predictions;
- generate narratives;
- evaluate predictions.

### 6. Odds Integration

Goal:

Support model vs market comparisons.

Requires odds provider decision and cost planning.

### 7. LLM Explanation Layer

Goal:

Generate explanations after deterministic model outputs exist.

Rule:

The AI explains; it does not calculate.

### 8. Payments / Stripe

Goal:

Enable checkout/subscriptions when product is ready.

Not urgent during early beta.

### 9. Google Auth

Goal:

Add social login when auth experience needs it.

### 10. Staging / Production Hardening

Goal:

Prepare final staging and production release.

## Backlog: Product

- Real public match detail.
- Premium section design.
- Entitlement-to-match resolver.
- 10 match pack consumption model.
- Team pass access rules.
- Stage pass access rules.
- Competition pass access rules.
- Admin plan/access management later.
- Beta invite / soft launch messaging.
- Cost monitoring plan.

## Backlog: Technical

- Server-only match detail query.
- Public match detail RLS if needed.
- Premium-safe projection functions.
- Audit existing broad grants without breaking Lab.
- Real worker runtime.
- Sports API provider adapter.
- Odds provider adapter.
- LLM narrative adapter.
- Staging environment.
- Observability/logging.

## Backlog: Documentation

- Update active docs when switching major conversations.
- Keep Supabase manual migration rule visible.
- Keep current PR/migration baseline in `START_HERE` and `CURRENT_PROJECT_STATUS`.
- Treat secondary docs as historical when they conflict with active docs.
