drop policy if exists "Public may read active visible plans"
on public.plans;

grant select on public.plans to anon, authenticated;

create policy "Public may read active visible plans"
on public.plans
for select
to anon, authenticated
using (
  is_active = true
  and (starts_at is null or starts_at <= now())
  and (ends_at is null or ends_at > now())
);

drop policy if exists "Public may read features of active visible plans"
on public.plan_features;

grant select on public.plan_features to anon, authenticated;

create policy "Public may read features of active visible plans"
on public.plan_features
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.plans
    where plans.id = plan_features.plan_id
      and plans.is_active = true
      and (plans.starts_at is null or plans.starts_at <= now())
      and (plans.ends_at is null or plans.ends_at > now())
  )
);

drop policy if exists "Users may read their own subscriptions"
on public.subscriptions;

grant select on public.subscriptions to authenticated;

create policy "Users may read their own subscriptions"
on public.subscriptions
for select
to authenticated
using (
  user_id = (select auth.uid())
);

drop policy if exists "Users may read their own current entitlements"
on public.user_entitlements;

grant select on public.user_entitlements to authenticated;

create policy "Users may read their own current entitlements"
on public.user_entitlements
for select
to authenticated
using (
  user_id = (select auth.uid())
  and (starts_at is null or starts_at <= now())
  and (ends_at is null or ends_at > now())
);

drop policy if exists "Users may read their own current match unlocks"
on public.user_match_unlocks;

grant select on public.user_match_unlocks to authenticated;

create policy "Users may read their own current match unlocks"
on public.user_match_unlocks
for select
to authenticated
using (
  user_id = (select auth.uid())
  and (expires_at is null or expires_at > now())
);
