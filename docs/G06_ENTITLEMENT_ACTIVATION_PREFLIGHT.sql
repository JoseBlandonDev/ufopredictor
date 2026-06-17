-- G06B migration 0036 production preflight.
-- Read-only duplicate checks. Run before applying 0036_entitlement_activation_binding.sql.

-- Matches subscriptions_manual_admin_user_plan_uidx:
-- unique (user_id, plan_id) where payment_provider = 'manual_admin'
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

-- Matches user_entitlements_access_key_uidx:
-- unique (user_id, entitlement_type, resource_type, resource_id, coalesce(source_plan_id, nil_uuid))
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

-- Matches user_match_unlocks_access_key_uidx:
-- unique (user_id, match_id, coalesce(source_plan_id, nil_uuid))
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
