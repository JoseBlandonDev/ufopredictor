# Auth, Payments, and Entitlements - Current

_Last refreshed: 2026-06-23._

## Authentication baseline

- Supabase Auth;
- email/password registration;
- confirmation and recovery flows;
- supported OAuth login;
- safe `next` redirects;
- server-side access projection.

Production and stage Auth universes are separate. A production user may need to register independently in stage.

## Access rules

- anonymous: limited public preview;
- registered free: full public probability/context layer;
- premium: entitlement-protected advanced projection;
- admin: explicit operational authorization.

A subscription/payment row alone does not reveal premium content. The active entitlement is the access authority.

## Pase Mundial 2026 flow

```text
Authenticated user
-> server creates constrained Wompi intent
-> user pays in Wompi
-> Wompi sends event
-> server validates signature/event
-> approved payment is processed idempotently
-> Pase Mundial entitlement is granted
-> premium projection becomes available
```

The return page does not grant premium access.

## Pricing

- canonical price is stored in USD;
- server uses configured `WOMPI_USD_COP_RATE` for COP checkout;
- current production example: USD 20 -> COP 68,700 at configured rate;
- pricing/admin update logic must preserve the canonical-source contract.

## Production proof

The full real production flow has already been smoke-tested:

- authenticated checkout opened;
- Wompi showed the expected amount and merchant;
- approved payment activated premium;
- premium persisted after session refresh/login.

Do not repeat a paid transaction simply because documentation or frontend copy changed.

## Local development note

A local production-key Wompi redirect may be blocked by origin/CloudFront policy even when production works. This is not a production regression by itself.

Local `.env.local` is Git-ignored and must never be copied into docs or commits.

## Entitlement operations

Required operational properties:

- idempotent grant;
- no activation for pending/failed/cancelled payment;
- explicit revocation path;
- auditability of event, payment intent, and grant;
- admin visibility without exposing secrets.

## Stage policy

Stage must use its own:

- Supabase project;
- users and test roles;
- test entitlements;
- safe payment/test configuration where applicable.

Do not copy production Wompi transactions, webhook payloads, users, or secrets into stage.

## Future payment-provider decision

A second provider is a future commercial epic, not part of Prediction Intelligence v2 itself.

Before implementation, define a provider-neutral payment/entitlement contract and choose whether the goal is:

- direct international checkout, where PayPal Business may fit;
- regional payment coverage;
- marketplace/course distribution, where Hotmart would imply a different operating model.
