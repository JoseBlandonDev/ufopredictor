# Auth, Payments, and Entitlements - Current

_Last refreshed: 2026-06-29 after the Free/Premium surface review and the owner-approved US$10 pricing decision._

## Authentication baseline

The production authentication flow is operational.

Users may be:

- anonymous;
- registered free;
- Premium through entitlement;
- admin through protected authorization.

Authentication and commercial entitlement remain separate concerns.

## Access rules

Premium access is resolved server-side.

Do not authorize Premium content from:

- browser state;
- URL parameters;
- return-page state;
- profile display labels;
- an unverified payment status.

The source of access is a current server-side entitlement or approved match unlock, with explicit admin behavior only where supported.

## Pase Mundial 2026 flow

```text
authenticated user
-> constrained checkout intent
-> Wompi payment
-> validated webhook
-> idempotent approved transaction processing
-> entitlement grant
-> server-side Premium projection
```

The return page is informational only.

Repeated approved webhook delivery must not double-grant.

Pending, failed, cancelled, or unverified transactions do not activate Premium.

## Owner-approved pricing decision and repository reconciliation status

Owner-approved and operator-confirmed production presentation:

```text
Pase Mundial 2026
US$10 one-time
current production/Wompi display observed by the owner: COP 35,000
```

This is the owner-approved commercial target and operator-observed production presentation, but the tracked repository is not yet fully reconciled. Existing migration, fallback, and pricing-test references still encode US$20 / COP 68,700.

Therefore:

- documentation must distinguish owner-confirmed operational truth from repository implementation state;
- the repository pricing implementation/tests must be updated before the next pricing-related release;
- historical migrations should not be silently rewritten if already applied; use the approved forward-change strategy.

## Currency display

The actual Wompi charge must remain explicit.

Recommended hierarchy after repository reconciliation:

```text
Base commercial reference: US$10
Owner-observed production/Wompi display: COP 35,000
Optional viewer-local estimate: approximate only
```

The actual checkout amount must be read from the authoritative runtime pricing path before release; documentation must not infer it from stale fallback code or tests.

Viewer-local estimates may be shown when country/locale is available, but:

- they must be labeled as estimates;
- they do not change the charged currency;
- they must not promise an exchange rate;
- bank conversion may differ;
- browser language alone is not authoritative country detection.

Do not require GPS for pricing.

## Country/locale preference order

Preferred future order:

1. explicit user country choice;
2. stored profile country when implemented;
3. trusted request/edge country metadata already available;
4. browser locale as a weak presentation fallback;
5. US$10 default.

The user should be able to see the actual Wompi currency before payment.

## Product coverage and validity

Public copy should describe the commercial product honestly:

- one-time purchase;
- access to Premium analysis for supported published World Cup 2026 matches;
- coverage for the tournament product;
- no guaranteed result.

Do not use `Sin vencimiento` as a commercial promise merely because a current entitlement row has no `ends_at`.

Technical entitlement state and product marketing validity are related but not identical.

Before changing backend expiration behavior, confirm:

- current Wompi grant payload;
- current entitlement resolver;
- existing active customer impact;
- support/revocation policy.

A copy-only MVP 1.5 change may describe tournament coverage without changing the technical grant.

## Free and Premium presentation

### Registered free

Should see:

- account active state once;
- public predictions;
- public context;
- saved matches;
- clear pass value;
- US$10 one-time price;
- purchase CTA.

### Premium

Should see:

- persistent Premium/pass badge;
- unlocked Premium content;
- coverage summary;
- account/panel access;
- no repeated entitlement sentence inside every prediction card.

A visual Premium badge is not an authorization mechanism.

## Purchase prevention and idempotency

An already entitled user must not repurchase accidentally.

Required behavior:

- active entitlement preflight;
- idempotent payment event processing;
- deterministic grant reference;
- server-side resolver;
- auditable activation and revocation.

## Production proof

The production Wompi path has been smoke-tested successfully.

Do not trigger another real payment for routine regression unless a payment-path change requires it.

Use non-destructive inspection for:

- price/configuration;
- intent creation;
- webhook validation;
- entitlement resolver;
- active-user checkout blocking.

## Admin entitlement operations

Manual admin activation remains a controlled support/recovery path.

It:

- does not replace Wompi;
- requires admin authorization;
- uses idempotent grant keys;
- preserves history;
- supports explicit revocation;
- never exposes service role through browser code.

## Terms and commercial policy backlog

MVP 1.5 should provide a clear user-facing policy surface for:

- one-time payment;
- covered tournament/product;
- actual charge currency;
- approximate local conversion;
- support/refund path;
- access validity;
- no sportsbook relationship;
- no guaranteed outcome.

Do not invent a refund promise or legal right that has not been approved.

## Stage policy

Stage must not receive:

- production payment payloads;
- production users;
- production entitlement rows;
- Wompi secrets;
- personal payment data.

Stage may use controlled non-sensitive test access.

## Relationship to V2

V2 may enrich Premium content, but it must not change the entitlement authority.

Model release and payment authorization remain separate gates.

MVP 1.5 pricing/presentation changes must be synchronized into `main`, then preserved when `main` is merged into the V2 integration branch.

## Responsibility split

### ChatGPT

- canonical pricing and entitlement documentation;
- owner-decision recording;
- user-facing terminology policy.

### Codex

- bounded repository inspection;
- payment/entitlement implementation and tests when requested;
- no canonical-document authorship.

### Operator

- real payment actions;
- environment variables;
- Wompi dashboard;
- production release approval.
