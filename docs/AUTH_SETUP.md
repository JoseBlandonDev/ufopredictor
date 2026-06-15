# Auth Setup - UFO Predictor

_Last reviewed in this refresh: post PR #77. Epic G auth foundation remains complete; no major auth setup changes in this docs refresh._

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

## Boundaries

- No service-role use in app routes.
- Payments/checkout are not implemented here.
- Entitlement/payment design remains future Epic G work.
