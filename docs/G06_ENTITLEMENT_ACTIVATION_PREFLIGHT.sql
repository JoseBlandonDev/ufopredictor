-- G06 entitlement activation duplicate preflight
-- Read-only. Run before applying unique indexes to an existing environment.

select user_id, plan_id, count(*) as duplicate_count,
       array_agg(id order by created_at, id) as affected_ids
from public.subscriptions
where payment_provider = 'manual_admin'
group by user_id, plan_id
having count(*) > 1
order by duplicate_count desc, user_id, plan_id;

select user_id, entitlement_type, resource_type, resource_id,
       coalesce(source_plan_id, '00000000-0000-0000-0000-000000000000'::uuid) as normalized_source_plan_id,
       count(*) as duplicate_count,
       array_agg(id order by created_at, id) as affected_ids
from public.user_entitlements
group by user_id, entitlement_type, resource_type, resource_id,
         coalesce(source_plan_id, '00000000-0000-0000-0000-000000000000'::uuid)
having count(*) > 1
order by duplicate_count desc, user_id;

select user_id, match_id,
       coalesce(source_plan_id, '00000000-0000-0000-0000-000000000000'::uuid) as normalized_source_plan_id,
       count(*) as duplicate_count,
       array_agg(id order by created_at, id) as affected_ids
from public.user_match_unlocks
group by user_id, match_id,
         coalesce(source_plan_id, '00000000-0000-0000-0000-000000000000'::uuid)
having count(*) > 1
order by duplicate_count desc, user_id, match_id;

-- Expected result: zero rows from every query.
-- If duplicates exist, stop. Resolve manually with product/admin review.
-- Do not auto-delete access rows.
