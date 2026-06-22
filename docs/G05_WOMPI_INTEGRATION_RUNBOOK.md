# G05 Wompi Integration Runbook - UFO Predictor

_Last refreshed: 2026-06-22. Historical production behavior retained; Prediction Intelligence v2 does not change this runbook._

## Status

G05 Wompi Payment Integration is **Done / Production Live** for the World Cup Pass MVP.

A verified `APPROVED` Wompi webhook activates premium through G06 entitlement logic.

## High-level flow

```text
Authenticated user starts checkout
-> server creates controlled payment intent
-> Wompi processes payment
-> redirect/status page remains informational
-> Wompi sends webhook
-> checksum/event is validated
-> approved event creates/reuses entitlement grant
-> user entitlement becomes active
-> premium UI resolves from authorization state
```

## Security rules

- Redirect never activates premium.
- Browser/client fields never prove payment.
- Caller cannot supply the event secret.
- Payment secrets remain server-side.
- No service-role key in app routes.
- `subscriptions` is not authorization.
- Duplicate approved events must not duplicate access.
- Non-approved states do not activate premium.

## Pricing source of truth

World Cup Pass pricing is DB/admin controlled through:

```text
/admin/payments
```

Do not rely on old documentation examples as the current commercial price.

Before marketing or checkout smoke, verify all of these agree:

- COP amount stored in DB;
- public USDT label;
- `/pricing`;
- `/admin/payments`;
- Wompi checkout amount;
- offer state and expiry.

A 2026-06-19 visual audit found an inconsistent visible combination of `20 USDT` and approximately `2.000 COP`. Treat this as a P0 commercial configuration/copy issue until the owner confirms and corrects the intended price.

## Production configuration

Expected variable families:

```text
WOMPI_ENV
WOMPI_API_BASE_URL
NEXT_PUBLIC_WOMPI_PUBLIC_KEY
WOMPI_PRIVATE_KEY
WOMPI_EVENTS_SECRET
WOMPI_INTEGRITY_SECRET
WOMPI_CURRENCY
NEXT_PUBLIC_APP_URL
```

Real values must never be committed or pasted into documentation.

## Vault and webhook

Production webhook:

```text
https://ufopredictor.com/api/wompi/webhook
```

Supabase Vault secret name:

```text
wompi_events_secret
```

Railway and Vault event secrets must match the active Wompi environment.

## Successful payment verification

1. Wompi transaction is approved.
2. Webhook logs show successful processing.
3. `wompi_payment_events` contains the event.
4. `entitlement_grants` contains the activation ledger row.
5. `user_entitlements` contains active World Cup access.
6. Premium content resolves on match detail.
7. Pricing/dashboard reflect the user state.

## Refunds and cancellations

Still open.

Early-production default:

- inspect the Wompi transaction;
- revoke or expire entitlement through an approved admin path;
- retain grant/audit history;
- document the support action;
- automate only after a dedicated approved slice.

## Secret rotation

Rotate if secrets were exposed, mixed between environments, or suspicious activity appears.

After rotation:

1. update Railway;
2. update Vault;
3. redeploy;
4. verify webhook configuration;
5. run a controlled payment smoke.
## Prediction Intelligence v2 boundary

Task 3B and the v2 frontend must not alter Wompi approval, webhook, pricing, or entitlement activation logic. Stage may use explicit test entitlements; do not clone production payment data.
