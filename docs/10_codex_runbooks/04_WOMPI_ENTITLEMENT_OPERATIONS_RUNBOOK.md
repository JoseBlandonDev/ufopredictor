# Wompi and Entitlement Operations Runbook

_Last refreshed: 2026-06-29._

## Production flow

1. Authenticated user requests checkout.
2. Server validates the Pase Mundial product and current access.
3. Server creates a constrained payment intent.
4. Wompi processes the payment.
5. Webhook authenticity is validated.
6. Approved transaction is processed idempotently.
7. Entitlement is granted.
8. Premium access resolves server-side.

## Owner-approved commercial target and implementation drift

Owner-approved and operator-confirmed production presentation:

```text
product: Pase Mundial 2026
base commercial price: US$10
current production/Wompi display observed by the owner: COP 35,000
payment type: one-time
```

Repository state is not yet fully reconciled:

- historical migration still reflects US$20;
- pricing fallback still reflects US$20;
- pricing tests still reflect US$20 / COP 68,700.

Reconcile this through a bounded forward implementation. Do not silently edit an already-applied historical migration merely to make the repository look tidy.

Do not change the backend charge based solely on display locale.

## Currency presentation

Allowed UI hierarchy after repository reconciliation:

```text
US$10 one-time
Owner-observed production/Wompi display: COP 35,000
Approximate local value: optional and labeled
```

Before release, verify the authoritative runtime pricing result and update implementation/tests through a bounded forward change.

Approximate values:

- are informational;
- may vary by exchange rate and bank;
- are not entitlement authority;
- must not replace the actual charge currency.

## Country/personalization

Preferred sources:

1. explicit user choice;
2. stored profile country;
3. trusted request country metadata;
4. browser locale as weak fallback;
5. no personalization.

Do not request GPS.

Do not infer billing country authoritatively from language.

## Access and validity

Technical entitlement authority remains the server resolver.

Public product copy should describe:

- one-time purchase;
- supported published World Cup 2026 Premium coverage;
- actual charge;
- no guaranteed outcome.

Do not market `Sin vencimiento` as lifetime access merely because a current grant has no end timestamp.

Changing technical expiration requires a separate backend review.

## Rules

- redirect is informational;
- no activation from client state;
- no activation for pending/failed/cancelled;
- repeated approved event does not double-grant;
- active users do not repurchase accidentally;
- admin role is separate from commercial access;
- no secrets in reports.

## Configuration

Required runtime values include:

- Wompi public/server configuration;
- environment/base URL;
- actual currency/amount configuration;
- integrity secret;
- canonical commercial price configuration;
- any configured exchange reference.

Never print secret values.

## Production proof

The production checkout/webhook path has already been smoke-tested.

Do not pay again for routine regression unless a payment-path change requires it.

## Incident checks

If an approved payment does not activate:

- do not pay again;
- inspect intent/event/transaction state;
- verify webhook delivery/signature;
- verify idempotency;
- inspect grant and entitlement;
- inspect logs;
- verify runtime/Vault secret availability;
- confirm active resolver behavior.

## Manual admin activation/revocation

Manual operations remain support/recovery only.

Requirements:

- signed-in admin;
- idempotent key;
- historical preservation;
- explicit revocation;
- no public client RPC;
- no service-role browser path.

## Terms/policy requirement

Before broader advertising, provide approved public wording for:

- product coverage;
- payment type;
- charge currency;
- approximate conversions;
- commercial validity;
- support/refund process;
- no sportsbook relationship;
- no guarantees.

Do not invent refund commitments without owner/legal approval.
