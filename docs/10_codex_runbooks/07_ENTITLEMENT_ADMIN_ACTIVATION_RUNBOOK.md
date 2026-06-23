# Entitlement Admin Activation Runbook

_Last refreshed: 2026-06-23._

## Purpose

Preserve the admin-only entitlement activation and revocation procedures that predate the Wompi production flow.

This runbook is for controlled support, testing, or recovery operations. It does not replace the normal Wompi approved-webhook path.

## Access authority

The existing premium model remains:

- `subscriptions` records plan relationship and status;
- `user_entitlements` authorizes global or resource-scoped premium access;
- `user_match_unlocks` authorizes a single match unlock;
- `entitlement_grants` records activation/revocation and enforces idempotency.

Effective premium access comes from a current, unexpired entitlement or match unlock, plus an explicit admin bypass only where a protected resolver allows it.

Neither `profiles.role = 'premium_user'` nor an active `subscriptions` row is sufficient by itself to reveal premium prediction detail.

## Duplicate preflight

Before any migration or operation that depends on the G06 unique access keys, run the read-only checks in:

```text
docs/G06_ENTITLEMENT_ACTIVATION_PREFLIGHT.sql
```

The checks cover duplicate keys for:

- manual-admin user/plan subscriptions;
- user entitlement access keys;
- user match-unlock access keys.

If any query returns rows:

1. stop;
2. do not deduplicate automatically;
3. do not delete access rows without product/admin review;
4. document the affected rows and the approved resolution;
5. rerun the preflight before proceeding.

The preflight is read-only. It must remain an active repository document and is also preserved in the archive snapshot.

## Manual activation

Invoke the admin-only RPC through a signed-in admin session:

```sql
select *
from public.activate_entitlement_grant(
  p_idempotency_key := 'manual:user-id:global-premium:2026-06-17',
  p_user_id := '00000000-0000-0000-0000-000000000000',
  p_grant_type := 'global_premium_access',
  p_resource_type := 'global',
  p_resource_id := null,
  p_match_id := null,
  p_plan_id := null,
  p_starts_at := now(),
  p_ends_at := now() + interval '30 days',
  p_source_type := 'manual_admin',
  p_source_reference := 'support-ticket-123',
  p_metadata_json := '{"reason":"manual_test"}'::jsonb
);
```

For competition access:

- set `p_resource_type := 'competition'`;
- set `p_resource_id` to the stable competition identifier used by the access resolver.

For one match:

- set `p_grant_type := 'match_unlock'`;
- set `p_resource_type := 'match'`;
- set `p_match_id` to the target match id.

The same `p_idempotency_key` may be retried safely. The RPC must return the original grant instead of creating duplicate access rows.

## Revocation

Revoke by the original idempotency key:

```sql
select *
from public.revoke_entitlement_grant(
  p_idempotency_key := 'manual:user-id:global-premium:2026-06-17',
  p_metadata_json := '{"reason":"manual_revocation"}'::jsonb
);
```

Revocation:

- marks the grant as `revoked`;
- expires the linked entitlement or match unlock;
- cancels/expires a linked subscription when applicable;
- preserves historical rows.

Do not delete payment, grant, subscription, entitlement, or unlock history merely to remove access.

## Server-side helper boundary

`lib/supabase/entitlement-grant-queries.ts` wraps the RPCs for protected admin surfaces or server actions.

Requirements:

- `requireAdmin()` succeeds first;
- use the signed-in server client;
- no public client invocation;
- no browser-exposed service-role path;
- no direct public write access to entitlement tables.

## Wompi integration boundary

The Wompi approved-webhook path should use the same entitlement binding with:

- deterministic event/transaction idempotency;
- payment source type;
- Wompi event/transaction reference;
- mapped product/resource and expiration window.

Do not create a parallel premium table and do not use profile role as the commercial access authority.

## Manual validation checklist

1. Sign in as an admin.
2. Run the duplicate preflight when the operation or migration depends on those unique keys.
3. Activate global, competition, or match access.
4. Retry the same idempotency key and confirm no duplicate grant/access rows are created.
5. Confirm dashboard/access projection sees the entitlement or unlock.
6. Confirm premium access works only while `starts_at` and `ends_at` are current.
7. Revoke using the original idempotency key.
8. Confirm premium access stops while historical rows remain.
9. Confirm internal tables such as `prediction_results` remain inaccessible to public/product reads.

## Reporting rule

Reports may include:

- operation type;
- non-sensitive user/resource identifiers when appropriate;
- idempotency outcome;
- access start/end;
- revocation result.

Never include:

- service-role keys;
- Wompi secrets;
- raw payment payloads;
- `.env` values;
- personal payment data.
