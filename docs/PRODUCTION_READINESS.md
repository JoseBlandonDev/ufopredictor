# Production Readiness - UFO Predictor

_Last refreshed: post PR #94 model closeout / Wompi production premium baseline / 28-fixture evaluation closeout (2026-06-19)._

## Current status

The product is operational in production with public predictions, premium access, Wompi payment activation, automatic entitlement, admin payment controls, verified results, evaluation, publication queues, and Torneo export.

The model refresh is merged and closed for the current cycle.

## Current operational checks

- Result Review Queue pending: 0.
- Evaluation Queue pending: 0.
- Four public fixtures upcoming.
- Public verified history includes Canada 6-0 Qatar and Mexico 1-0 South Korea.
- Focused queues avoid dependence on Real Fixture Lab exact-detail.

## Required launch-week smoke matrix

Devices/browsers:

- Android Chrome;
- iPhone Safari;
- desktop Chrome;
- desktop Edge or Firefox.

Roles:

- anonymous;
- registered-free;
- premium;
- admin.

Flows:

- home;
- predictions;
- match detail;
- signup/login/email confirmation;
- pricing;
- Wompi checkout;
- payment return/activation;
- premium-active UI;
- logout;
- admin result/evaluation/publish/payment controls;
- Torneo export.

## Mobile/responsive readiness

G09 should verify navbar, cards, long text, grids/tables, pricing/account/premium/payment presentation, touch targets, and horizontal overflow.

## PWA readiness

G10 may ship installability metadata and icons. Do not cache:

- Wompi checkout/redirect/callback/webhook;
- auth;
- admin;
- API routes;
- Supabase responses;
- premium projections;
- dynamic prediction/result data.

G11 service-worker/offline behavior may be deferred.

## Model/product communication

- Probabilities are not guarantees.
- Exact score is a scenario.
- Fair stored metrics currently show 57.1% 1X2 and 25.0% exact score on 28 fixtures.
- Continue fixture sanity gating and responsible-use copy.

## Known non-blocking risks

- Real Fixture Lab exact-detail stack overflow.
- Long `/predictions` history until UIHISTORY01.
- xG compression and blowout underestimation.
- Venue metadata gaps.

## Release blockers

- broken payment activation;
- premium entitlement mismatch;
- public/internal data leak;
- mobile navigation or checkout failure;
- critical accessibility failure in core flows;
- unsafe PWA caching;
- unverified fixture/result publication.
