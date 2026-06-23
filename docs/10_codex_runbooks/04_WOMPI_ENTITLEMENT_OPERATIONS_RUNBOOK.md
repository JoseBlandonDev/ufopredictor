# Wompi and Entitlement Operations Runbook

_Last refreshed: 2026-06-23._

## Production flow

1. Authenticated user requests checkout.
2. Server creates constrained Pase Mundial intent.
3. Wompi handles payment.
4. Webhook event is validated.
5. Approved transaction is processed idempotently.
6. Entitlement is granted.
7. Premium projection resolves server-side.

## Rules

- redirect is informational only;
- no premium activation from client state;
- no activation for pending/failed/cancelled;
- repeated approved event must not double-grant;
- active user must not repurchase accidentally;
- admin role remains separate from commercial access.

## Configuration

Required runtime values include the public/server Wompi keys, environment/base URL, currency, integrity secret, canonical USD price configuration, and USD/COP rate. The webhook secret may be sourced from Supabase Vault according to the production implementation.

Never print values in a report.

## Production proof

The production checkout and webhook activation path has already been smoke-tested successfully. Do not incur another payment for routine regression unless a payment-path change actually requires it.

## Local behavior

Production Wompi/CloudFront may reject localhost origins. Treat this separately from production health.

## Incident checks

If approved payment does not activate:

- do not pay again;
- inspect admin payment/intents/events;
- verify webhook delivery/signature;
- inspect event idempotency state;
- inspect entitlement grant/activation record;
- inspect Railway logs;
- verify Vault/runtime secret availability.

## Manual admin activation and revocation

Detailed admin-only entitlement activation, idempotent retry, duplicate preflight, and revocation procedures live in:

- `07_ENTITLEMENT_ADMIN_ACTIVATION_RUNBOOK.md`
- `../G06_ENTITLEMENT_ACTIVATION_PREFLIGHT.sql`

The RPC path must run only after server-side admin authorization. Never expose these RPCs through public client code or a service-role browser path.

## Refund/revocation

Use explicit audited revocation. Do not delete payment history. A payment refund and an entitlement revocation are related operational events but must remain separately auditable.

## Secondary provider future

Implement only through a provider-neutral intent/event/grant contract with equivalent idempotency and revocation semantics.
