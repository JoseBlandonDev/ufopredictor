# Auth Setup - UFO Predictor

_Last refreshed: post PR #81 real fixture publish queue bypass / Data Ops 02 completion (2026-06-16)._

## Current auth baseline

Epic G01 completed the auth foundation:

- Google login.
- Email/password registration.
- Email confirmation flow.
- Resend/Supabase confirmation support.
- Account/session shell.

## Viewer/product behavior relevant to current product

Public product surfaces currently distinguish anonymous, registered-free, and premium/admin through premium access/projection logic.

Registered-free users can see public 1X2 probabilities and confidence/risk. They do not see/fetch probable score before result verification. Premium/admin access to premium model detail is handled through the protected premium projection path.

## Admin behavior

Admin-only operations now include `/admin/real-fixture-publish-queue` as the current safe publication path. Real Fixture Lab exact-detail remains blocked and should not be the required admin path until fixed.

## Boundaries

- No service-role use in app routes.
- Payments/checkout are not implemented here.
- Entitlement/payment design remains future Epic G work.
- Wompi payment integration is planned under Epic G05, not implemented in auth.
