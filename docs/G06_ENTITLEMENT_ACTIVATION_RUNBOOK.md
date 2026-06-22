# G06 Entitlement Activation Binding Runbook

_Last refreshed: 2026-06-22. Historical production behavior retained; Prediction Intelligence v2 does not change this runbook._

## Scope

G06B adds a minimal backend layer for activating premium access without Wompi checkout, payment secrets, or UI changes. It uses the existing premium model:

- `subscriptions` documents plan relationship and status.
- `user_entitlements` authorizes global or resource-scoped premium access.
- `user_match_unlocks` authorizes a single match unlock.
- `entitlement_grants` records the activation/revocation event and enforces idempotency.

Effective premium access must continue to come from current, unexpired `user_entitlements` or `user_match_unlocks`, plus explicit admin bypass where a protected resolver allows it. A `profiles.role = 'premium_user'` value or active `subscriptions` row is not enough to reveal premium prediction detail.

## Production preflight before applying migration 0036

Before applying `supabase/migrations/0036_entitlement_activation_binding.sql` to production, run the read-only duplicate checks below in Supabase SQL Editor. The same queries are also available in `docs/G06_ENTITLEMENT_ACTIVATION_PREFLIGHT.sql`.

If all queries return 0 rows, the unique indexes required by G06B can be applied. If any query returns rows, stop and resolve the duplicates manually before applying the migration. Do not deduplicate automatically, do not delete access rows without product/admin review, and document any manual resolution.

```sql
select
  user_id,
  plan_id,
  count(*) as duplicate_count,
  array_agg(id order by created_at, id) as affected_ids
from public.subscriptions
where payment_provider = 'manual_admin'
group by
  user_id,
  plan_id
having count(*) > 1
order by duplicate_count desc, user_id, plan_id;
```

```sql
select
  user_id,
  entitlement_type,
  resource_type,
  resource_id,
  coalesce(source_plan_id, '00000000-0000-0000-0000-000000000000'::uuid) as normalized_source_plan_id,
  count(*) as duplicate_count,
  array_agg(id order by created_at, id) as affected_ids
from public.user_entitlements
group by
  user_id,
  entitlement_type,
  resource_type,
  resource_id,
  coalesce(source_plan_id, '00000000-0000-0000-0000-000000000000'::uuid)
having count(*) > 1
order by duplicate_count desc, user_id, entitlement_type, resource_type, resource_id, normalized_source_plan_id;
```

```sql
select
  user_id,
  match_id,
  coalesce(source_plan_id, '00000000-0000-0000-0000-000000000000'::uuid) as normalized_source_plan_id,
  count(*) as duplicate_count,
  array_agg(id order by unlocked_at, id) as affected_ids
from public.user_match_unlocks
group by
  user_id,
  match_id,
  coalesce(source_plan_id, '00000000-0000-0000-0000-000000000000'::uuid)
having count(*) > 1
order by duplicate_count desc, user_id, match_id, normalized_source_plan_id;
```

Migration `0036` also includes read-only guards before creating these unique indexes. The guards raise a clear exception if duplicate keys still exist; they do not update, delete, or merge data.

## Manual Activation Without Wompi

Use the admin-only RPC through a signed-in admin session:

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

For a World Cup or competition pass, set `p_resource_type := 'competition'` and `p_resource_id` to the stable competition identifier used by the access resolver. For a single match unlock, set `p_grant_type := 'match_unlock'`, `p_resource_type := 'match'`, and `p_match_id` to the target match id.

The same `p_idempotency_key` may be retried safely. The RPC returns the original grant instead of creating duplicate entitlement rows.

## Revocation

Revoke by the original idempotency key:

```sql
select *
from public.revoke_entitlement_grant(
  p_idempotency_key := 'manual:user-id:global-premium:2026-06-17',
  p_metadata_json := '{"reason":"manual_revocation"}'::jsonb
);
```

Revocation marks the grant as `revoked`, expires the linked entitlement or match unlock, and cancels/expires the linked subscription if one was created for the grant. It does not delete historical rows.

## Admin Helper

`lib/supabase/entitlement-grant-queries.ts` wraps the RPCs for future admin surfaces or server actions. It must be called only after `requireAdmin()` succeeds and uses `createSupabaseServerClient()` with the signed-in admin session. Do not call these RPCs from public client code.

## Wompi Production Integration

The live Wompi path verifies approved events before activation and calls the same binding with:

- a deterministic idempotency key, such as `wompi:<event_id>` or `wompi:<transaction_id>:<status>`;
- `source_type` set to the payment source used by the webhook path;
- `source_reference` set to the Wompi transaction/event reference;
- the mapped plan, resource, match, and expiration window.

The Wompi activation path must not create a parallel premium table, set `profiles.role` as the access control mechanism, expose service-role app routes, or grant direct client write access to entitlement tables.

## Manual Test Checklist

1. Sign in as an admin user.
2. Run `activate_entitlement_grant` for global, competition, or match access.
3. Confirm the same idempotency key returns the same grant on retry.
4. Confirm the user's dashboard/access query sees the current entitlement or unlock.
5. Confirm the premium resolver grants access only while `starts_at` and `ends_at` are current.
6. Run `revoke_entitlement_grant`.
7. Confirm access stops because the linked entitlement or unlock is expired.
8. Confirm `prediction_results` and other internal tables remain inaccessible from public/product reads.
## Stage/Task 3B boundary

Task 3B may create clearly labeled development-only test access only when required for premium projection validation. Do not copy production subscriptions, entitlements, grants, users, or Wompi events into stage.
