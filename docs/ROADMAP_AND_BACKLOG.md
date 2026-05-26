# ROADMAP AND BACKLOG — UFO Predictor

_Last updated: post PR #23 / C03 Match Detail Public From DB_

## Current Phase

UFO Predictor has moved from Lab foundation into public beta product foundation.

Completed foundations:

- internal Lab Admin Flow;
- public predictions listing from DB;
- plans and entitlements backend foundation;
- public/free match detail from DB;
- explicit public projection hardening for anonymous users.

Next product need:

- premium access enforcement skeleton.

## Product Strategy

The product should enter a controlled beta/freemium phase before the World Cup.

Strategy:

- show useful free value;
- keep premium data protected;
- do not run mass promotion until results, UX, costs, and infrastructure are validated;
- use finals, friendlies, and pre-World Cup fixtures for organic learning.

## Roadmap Sequence

### 1. C03 — Match Detail Public From DB

Status: Done.

Branch:

```txt
feature/match-detail-public-from-db
```

Delivered:

- real public `/matches/[slug]`;
- `public_match_details`;
- `public_prediction_summaries`;
- public projection hardening with `0013`.

### 2. C04 — Premium Access Enforcement Skeleton

Branch:

```txt
feature/premium-access-enforcement-skeleton
```

Goal:

Use C02 entitlement logic to create safe server-side enforcement patterns before premium fields are exposed.

### 3. Entitled Match Detail Premium Projection

Goal:

Expose premium match sections only to authorized users through backend-filtered projections.

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

- Premium section design.
- Free vs premium field boundary.
- Entitlement-to-match resolver.
- 10 match pack consumption model.
- Team pass access rules.
- Stage pass access rules.
- Competition pass access rules.
- Admin plan/access management later.
- Beta invite / soft launch messaging.
- Cost monitoring plan.

## Backlog: Technical

- Premium-safe projection functions.
- Entitlement-based match access resolver.
- Audit existing broad authenticated grants without breaking Lab.
- Real worker runtime.
- Sports API provider adapter.
- Odds provider adapter.
- LLM narrative adapter.
- Staging environment.
- Observability/logging.
- Data encoding cleanup for seeded team names such as `JapÃ³n` / `MÃ©xico`.

## Backlog: Documentation

- Update active docs when switching major conversations.
- Keep Supabase manual migration rule visible.
- Keep current PR/migration baseline in `START_HERE` and `CURRENT_PROJECT_STATUS`.
- Keep Codex Prompt Execution Card rule visible.
- Treat secondary docs as historical when they conflict with active docs.
