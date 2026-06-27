# Auth, Payments, and Entitlements - Current

_Last refreshed: 2026-06-27 after PR #119 terminology changes, Task 2A stage completion, and confirmation that Auth, Wompi, payment, and entitlement authority remained unchanged._

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
- registered free: full public probability and context layer;
- premium: entitlement-protected advanced projection;
- admin: explicit operational authorization.

A payment or subscription row alone does not reveal premium content. The active entitlement is the access authority.

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
- current production example remains USD 20 with the configured conversion;
- pricing and admin update logic must preserve the canonical-source contract.

## Production proof

The production commercial flow has been smoke-tested:

- authenticated checkout opened;
- Wompi showed the expected merchant and amount;
- approved payment activated premium;
- premium persisted after refresh and login;
- premium UI showed premium content instead of free-only upgrade prompts.

Do not repeat a paid transaction merely because documentation or frontend copy changed.

A non-payment test account may receive a direct, auditable admin entitlement for UI smoke work. That grant must use the existing entitlement authority, must not fabricate a Wompi payment, and must remain clearly identified as test/admin-originated.

## Entitlement operations

Required properties:

- idempotent grant;
- no activation for pending, failed, or cancelled payment;
- explicit revocation path;
- auditability of event, payment intent, and grant;
- admin visibility without exposing secrets.

## PR #117 entitlement regression proof

The production smoke for `Lectura UFO` confirmed:

- premium access remained server-validated;
- premium xG, scenarios, BTTS, totals, and confidence/risk detail remained visible;
- the new public reading supplemented rather than replaced premium analysis;
- anonymous/free boundaries were not broadened;
- no role change was required;
- no payment or subscription row was used as a substitute for entitlement authority.

The test premium account was granted an entitlement with no expiry for ongoing UI validation. Personal identifiers are intentionally not part of canonical documentation.

## PR #119 terminology preservation proof

Task 4C changed premium-facing terminology and explanatory copy only.

It did not:

- alter Wompi checkout or webhook validation;
- change payment-intent or subscription state;
- grant, revoke, broaden, or bypass entitlements;
- replace server-side authorization with client-side display logic;
- change premium data values or V1/V2 calculations.

The existing entitlement remains the sole authority for premium projection.

## Stage policy

Stage uses its own:

- Supabase project;
- Auth users and roles;
- test entitlements when explicitly needed;
- safe payment configuration when intentionally introduced.

Current stage state:

- one Auth user exists;
- the corresponding profile is `admin`;
- the authenticated Codex browser session may be used for stage smoke checks;
- Wompi is intentionally not configured for this checkpoint;
- the optional AI provider is intentionally not configured for this checkpoint.

Do not copy production Wompi transactions, webhook payloads, users, personal data, sessions, subscriptions, or entitlements into stage.

## Stage data-task preservation proof

Task 3B preserved:

- Auth user count: 1;
- profile count: 1;
- admin role: unchanged.

Task 2A added 48 V2 signal-baseline rows and verified 72/72 fixture coverage without writing to:

- Auth;
- profiles;
- Wompi payment intents or events;
- subscriptions;
- entitlements;
- webhook payloads;
- sessions;
- personal-data tables.

Production remained untouched by the V2 stage task.

## Relationship to MVP2

Prediction Intelligence v2 must not regress:

- Auth;
- purchase routing;
- webhook validation;
- entitlement authority;
- premium projection;
- admin authorization.

MVP2 may enrich analytical content, but it does not replace the payment and entitlement authority model.

Parallel expert-experience improvements may change how premium information is presented, but they must not change who is authorized to see it.

## Future payment-provider decision

A second provider is later commercial work and is not an immediate V2 blocker.

Before implementation, define a provider-neutral payment and entitlement contract and decide whether the goal is:

- direct international checkout;
- regional payment coverage;
- or marketplace/course distribution, which would imply a different operating model.
