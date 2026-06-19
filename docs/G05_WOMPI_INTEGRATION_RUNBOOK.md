# G05 Wompi Production Integration Runbook

_Last refreshed: G05B Wompi production checkout + webhook MVP._

## Scope

This is a production-enabled MVP for selling `world-cup-pass` through Wompi Colombia and activating the existing G06 entitlement layer after a verified webhook. It does not add betting, odds advice, dynamic FX, payment secrets, prediction-engine changes, API-Football changes, ingest changes, or result-verification changes.

## Product And Amount

- Product: `world-cup-pass`.
- Visible price and checkout amount are controlled from `/admin/payments`.
- Default seeded price: `20 USDT · aprox. $69.900 COP`.
- Default seeded Wompi checkout amount: `amount_in_cents=6990000`.
- Currency: `COP`.
- Resource mapping: `competition_access` on `world_cup_2026`.

Wompi Colombia expects the checkout amount as `amount-in-cents` / `amount_in_cents`. For COP, the database RPC multiplies admin-entered pesos by 100.

## Environment

Only these Wompi variables may reach the browser:

```txt
NEXT_PUBLIC_WOMPI_PUBLIC_KEY
NEXT_PUBLIC_APP_URL
```

Server-only:

```txt
WOMPI_ENV=production
WOMPI_API_BASE_URL=https://production.wompi.co/v1
WOMPI_PRIVATE_KEY=prv_prod_xxx
WOMPI_INTEGRITY_SECRET=prod_integrity_xxx
WOMPI_CURRENCY=COP
```

The webhook RPC does not accept the Wompi events secret from callers. Store the production events secret in Supabase Vault outside source control:

```sql
select vault.create_secret(
  '<WOMPI_EVENTS_SECRET>',
  'wompi_events_secret',
  'Wompi events secret for webhook validation'
);
```

Do not commit real Wompi keys. Railway is the current deployment target for this MVP.

## Flow

1. Signed-in user clicks the World Cup Pass CTA on `/pricing`.
2. `POST /api/wompi/checkout` calls `create_wompi_world_cup_pass_intent` for that user.
3. The database reads the active World Cup Pass price from `wompi_product_prices`; clients never send amount, currency, plan, or entitlement mapping.
4. The server calculates the Wompi checkout integrity signature for the DB amount.
5. The browser is sent to Wompi Web Checkout.
6. The redirect returns to `/payments/wompi/return` and is informational only.
7. Wompi sends `POST /api/wompi/webhook`.
8. The route parses the Wompi event and passes the event plus `X-Event-Checksum` to the database RPC.
9. The database RPC validates the checksum with the Supabase Vault `wompi_events_secret`, records the event idempotently, and activates G06 only for `APPROVED`.

## Admin Price Control

Use `/admin/payments` to update the permanent World Cup Pass price or start a temporary offer in minutes. The admin screen writes through `admin_update_wompi_world_cup_pass_price(...)`. The next checkout uses the new active price immediately; no Railway env edit is required.

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

## Security Advisor Note

Supabase may flag `public.activate_verified_wompi_entitlement(jsonb, text)` because it is a `SECURITY DEFINER` RPC executable by `anon`. That exposure is intentional for Wompi's unauthenticated webhook delivery. The function is treated as a public API endpoint and is constrained as follows:

- callers never send or control `wompi_events_secret`;
- the secret is read from Supabase Vault;
- the Wompi checksum is recomputed inside Postgres before any write;
- invalid checksum, missing Vault secret, missing intent, amount mismatch, or currency mismatch fail closed;
- only `APPROVED` events activate G06 access;
- `PENDING`, `DECLINED`, and `ERROR` events are recorded without grants;
- direct table access to `wompi_payment_events` remains denied for `anon` and `authenticated`.

## Production Smoke Test

1. Apply `supabase/migrations/0037_wompi_payment_mvp.sql`.
2. Apply any later Wompi repair/hardening migrations.
3. Configure Railway production checkout env vars and the Supabase Vault `wompi_events_secret`.
4. Set the Wompi production webhook URL to:

```txt
https://<railway-domain>/api/wompi/webhook
```

5. Sign in and open `/pricing`.
6. Start checkout from World Cup Pass.
7. Optionally update the price in `/admin/payments` and confirm `/pricing` reflects it.
8. Complete a Wompi production payment.
9. Confirm `/payments/wompi/return` redirects to `/dashboard` after the webhook has processed the approved payment.
10. Confirm the dashboard shows World Cup Pass active.
11. Confirm Wompi webhook creates one `entitlement_grants` row and a current `user_entitlements` row for `world_cup_2026`.
12. Confirm a duplicate event does not create another grant.

## Production Pending

- Production Wompi public/private/events/integrity keys configured.
- Production webhook URL configured in Wompi.
- Final COP price confirmation.
- Production smoke test on Railway domain.
- Monitoring/log review for webhook failures.
- Ongoing security advisor review for global non-Wompi objects.

## Source Notes

- Wompi Web Checkout docs: https://docs.wompi.co/docs/colombia/widget-checkout-web/
- Wompi event docs: https://docs.wompi.co/docs/colombia/eventos/
- Supabase API/RLS docs: https://supabase.com/docs/guides/api/securing-your-api
