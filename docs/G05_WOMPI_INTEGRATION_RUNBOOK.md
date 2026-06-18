# G05 Wompi Sandbox Integration Runbook

_Last refreshed: G05B Wompi sandbox checkout + webhook MVP._

## Scope

This is a sandbox MVP for selling `world-cup-pass` through Wompi Colombia and activating the existing G06 entitlement layer after a verified webhook. It does not add betting, odds advice, dynamic FX, production payment secrets, prediction-engine changes, API-Football changes, ingest changes, or result-verification changes.

## Product And Amount

- Product: `world-cup-pass`.
- Visible price: `25 USDT · aprox. $87.000 COP`.
- Configured charge amount: `WOMPI_WORLD_CUP_PASS_AMOUNT_COP=87000`.
- Wompi checkout amount: `amount_in_cents=8700000`.
- Currency: `COP`.
- Resource mapping: `competition_access` on `world_cup_2026`.

Wompi Colombia expects the checkout amount as `amount-in-cents` / `amount_in_cents`. For COP, multiply configured pesos by 100.

## Environment

Only these Wompi variables may reach the browser:

```txt
NEXT_PUBLIC_WOMPI_PUBLIC_KEY
NEXT_PUBLIC_APP_URL
```

Server-only:

```txt
WOMPI_ENV=sandbox
WOMPI_API_BASE_URL=https://sandbox.wompi.co/v1
WOMPI_PRIVATE_KEY=prv_test_xxx
WOMPI_EVENTS_SECRET=test_events_xxx
WOMPI_INTEGRITY_SECRET=test_integrity_xxx
WOMPI_CURRENCY=COP
WOMPI_WORLD_CUP_PASS_AMOUNT_COP=87000
```

The webhook RPC does not accept the Wompi events secret from callers. Configure the same value as a Postgres setting outside source control:

```sql
alter database postgres set app.wompi_events_secret = '<WOMPI_EVENTS_SECRET>';
select pg_reload_conf();
```

Do not commit real Wompi keys. Railway is the current deployment target for this MVP.

## Flow

1. Signed-in user clicks the World Cup Pass CTA on `/pricing`.
2. `POST /api/wompi/checkout` calls `create_wompi_world_cup_pass_intent` for that user.
3. The server calculates the Wompi checkout integrity signature.
4. The browser is sent to Wompi Web Checkout.
5. The redirect returns to `/payments/wompi/return` and is informational only.
6. Wompi sends `POST /api/wompi/webhook`.
7. The route verifies the event checksum with `WOMPI_EVENTS_SECRET`.
8. The database RPC revalidates the checksum with the Postgres `app.wompi_events_secret` setting, records the event idempotently, and activates G06 only for `APPROVED`.

## Activation Contract

`public.activate_verified_wompi_entitlement(...)` writes through:

- `wompi_payment_events`;
- `entitlement_grants`;
- `user_entitlements`;
- `subscriptions` as commercial status only.

The stable idempotency key is:

```txt
wompi:<transaction_id>:APPROVED
```

Duplicate webhook deliveries return the already processed event and do not duplicate grants.

## Sandbox Test

1. Apply `supabase/migrations/0037_wompi_payment_mvp.sql`.
2. Configure Railway sandbox env vars and the Postgres `app.wompi_events_secret` setting.
3. Set the Wompi sandbox webhook URL to:

```txt
https://<railway-domain>/api/wompi/webhook
```

4. Sign in and open `/pricing`.
5. Start checkout from World Cup Pass.
6. Complete a Wompi sandbox payment.
7. Confirm the redirect page says access is being verified.
8. Confirm Wompi webhook creates one `entitlement_grants` row and a current `user_entitlements` row for `world_cup_2026`.
9. Confirm a duplicate event does not create another grant.

## Production Pending

- Production Wompi public/private/events/integrity keys.
- Production webhook URL configured in Wompi.
- Final COP price confirmation.
- Production smoke test on Railway domain.
- Monitoring/log review for webhook failures.
- Security advisor review for the intentionally exposed webhook RPC.

## Source Notes

- Wompi Web Checkout docs: https://docs.wompi.co/docs/colombia/widget-checkout-web/
- Wompi event docs: https://docs.wompi.co/docs/colombia/eventos/
- Supabase API/RLS docs: https://supabase.com/docs/guides/api/securing-your-api
