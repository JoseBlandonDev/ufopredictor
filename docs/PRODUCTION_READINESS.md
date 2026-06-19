# Production Readiness - UFO Predictor

_Last refreshed: post PR #99 Data Ops 06 and frontend visual audit (2026-06-19)._

## Current status

Operational in production:

- public predictions;
- premium detail;
- Wompi approved-webhook activation;
- entitlements;
- admin pricing;
- exact fixture/result/evaluation queues;
- reproducible signals;
- Prediction Review Gate;
- Torneo export.

Matchday 2 is complete and the final JSON was delivered.

## Verified production milestones

- API-Football key configured for Review Gate revalidation.
- Review migration applied with RLS.
- Shadow and human decision flow tested.
- 24/24 Matchday 2 fixtures confirmed.
- 9 new immutable public versions created.
- export validated with 24 unique fixtures and complete markets.

## P0 launch issues

### Pricing truth

Visible production/admin pricing showed an inconsistent USDT/COP relationship. Resolve before paid acquisition.

### Home freshness

Home still highlights an opening-match fixture and initial coverage messaging.

### Truthful model status

Transparency says calibration is active. Model calibration is closed; operational beta and signal updates remain active.

### Catalog clarity

World Cup Pass appears duplicated/ambiguous among current and future offers.

## Required smoke matrix

Devices:

- Android Chrome;
- iPhone Safari;
- desktop Chrome;
- desktop Edge/Firefox.

Roles:

- anonymous;
- registered-free;
- premium;
- admin without entitlement;
- admin with entitlement.

Flows:

- home;
- predictions/upcoming/history;
- match detail;
- auth;
- pricing;
- Wompi checkout/webhook/return;
- dashboard;
- admin payments;
- publish/result/evaluation queues;
- Prediction Review Gate;
- Torneo export.

## Accessibility/performance

Check:

- keyboard/focus;
- contrast;
- touch targets;
- mobile navigation;
- horizontal overflow;
- long admin pages;
- console errors;
- LCP/CLS;
- large image sizing.

## Release blockers

- incorrect checkout price;
- payment activation failure;
- entitlement mismatch;
- public/internal data leak;
- broken core mobile navigation;
- unsafe caching;
- unverified result publication;
- broken export contract.

## Known non-blocking risks

- Real Fixture Lab exact-detail.
- venue gaps;
- Review Gate copy/length;
- no AI provider;
- reviewed-xG preview only;
- scoreline/blowout limitations.
