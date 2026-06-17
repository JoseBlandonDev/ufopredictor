-- G06B - Entitlement activation binding.
-- Adds an auditable/idempotent grant ledger and admin-only activation RPCs.
-- The runtime source of premium authorization remains user_entitlements and
-- user_match_unlocks; subscriptions document commercial state only.

create table public.entitlement_grants (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text not null unique,
  source_type text not null
    check (source_type in ('manual_admin', 'wompi_webhook', 'wompi_transaction', 'system')),
  source_reference text,
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid references public.plans(id) on delete set null,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  user_entitlement_id uuid references public.user_entitlements(id) on delete set null,
  user_match_unlock_id uuid references public.user_match_unlocks(id) on delete set null,
  grant_type text not null
    check (
      grant_type in (
        'global_premium_access',
        'competition_access',
        'stage_access',
        'team_access',
        'match_access',
        'match_unlock'
      )
    ),
  resource_type text not null
    check (resource_type in ('global', 'competition', 'stage', 'team', 'match')),
  resource_id text,
  match_id uuid references public.matches(id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  status text not null default 'active'
    check (status in ('active', 'revoked', 'expired')),
  created_by uuid references auth.users(id) on delete set null,
  revoked_by uuid references auth.users(id) on delete set null,
  revoked_at timestamptz,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or ends_at > starts_at),
  check (
    (status = 'revoked' and revoked_at is not null)
    or (status <> 'revoked' and revoked_at is null and revoked_by is null)
  ),
  check (
    (grant_type = 'match_unlock' and resource_type = 'match' and match_id is not null)
    or grant_type <> 'match_unlock'
  ),
  check (
    (resource_type = 'match' and match_id is not null)
    or resource_type <> 'match'
  ),
  check (
    (resource_type = 'global' and coalesce(resource_id, 'global') = 'global')
    or (resource_type <> 'global' and coalesce(resource_id, '') <> '')
  )
);

create trigger entitlement_grants_set_updated_at before update on public.entitlement_grants
for each row execute function public.set_updated_at();

create index entitlement_grants_user_status_idx
on public.entitlement_grants (user_id, status, created_at desc);

create index entitlement_grants_resource_idx
on public.entitlement_grants (resource_type, resource_id)
where resource_id is not null;

create index entitlement_grants_match_id_idx
on public.entitlement_grants (match_id)
where match_id is not null;

create unique index subscriptions_provider_reference_uidx
on public.subscriptions (payment_provider, provider_subscription_id)
where payment_provider is not null and provider_subscription_id is not null;

do $$
begin
  if exists (
    select 1
    from public.subscriptions
    where payment_provider = 'manual_admin'
    group by user_id, plan_id
    having count(*) > 1
  ) then
    raise exception 'Cannot create subscriptions_manual_admin_user_plan_uidx: duplicate manual_admin subscriptions exist. Run docs/G06_ENTITLEMENT_ACTIVATION_PREFLIGHT.sql and resolve duplicates manually.';
  end if;
end;
$$;

create unique index subscriptions_manual_admin_user_plan_uidx
on public.subscriptions (user_id, plan_id)
where payment_provider = 'manual_admin';

do $$
begin
  if exists (
    select 1
    from public.user_entitlements
    group by
      user_id,
      entitlement_type,
      resource_type,
      resource_id,
      coalesce(source_plan_id, '00000000-0000-0000-0000-000000000000'::uuid)
    having count(*) > 1
  ) then
    raise exception 'Cannot create user_entitlements_access_key_uidx: duplicate entitlement access keys exist. Run docs/G06_ENTITLEMENT_ACTIVATION_PREFLIGHT.sql and resolve duplicates manually.';
  end if;
end;
$$;

create unique index user_entitlements_access_key_uidx
on public.user_entitlements (
  user_id,
  entitlement_type,
  resource_type,
  resource_id,
  coalesce(source_plan_id, '00000000-0000-0000-0000-000000000000'::uuid)
);

do $$
begin
  if exists (
    select 1
    from public.user_match_unlocks
    group by
      user_id,
      match_id,
      coalesce(source_plan_id, '00000000-0000-0000-0000-000000000000'::uuid)
    having count(*) > 1
  ) then
    raise exception 'Cannot create user_match_unlocks_access_key_uidx: duplicate match unlock access keys exist. Run docs/G06_ENTITLEMENT_ACTIVATION_PREFLIGHT.sql and resolve duplicates manually.';
  end if;
end;
$$;

create unique index user_match_unlocks_access_key_uidx
on public.user_match_unlocks (
  user_id,
  match_id,
  coalesce(source_plan_id, '00000000-0000-0000-0000-000000000000'::uuid)
);

create index user_entitlements_user_resource_idx
on public.user_entitlements (user_id, resource_type, resource_id);

create index user_match_unlocks_user_match_expires_idx
on public.user_match_unlocks (user_id, match_id, expires_at);

alter table public.entitlement_grants enable row level security;

grant select on public.entitlement_grants to authenticated;

create policy "Users may read their own entitlement grants"
on public.entitlement_grants
for select
to authenticated
using (user_id = (select auth.uid()));

create or replace function public.is_app_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  );
$$;

revoke all on function public.is_app_admin() from public;
revoke execute on function public.is_app_admin() from anon;
revoke execute on function public.is_app_admin() from service_role;
grant execute on function public.is_app_admin() to authenticated;

create policy "Admins may read entitlement grants"
on public.entitlement_grants
for select
to authenticated
using (public.is_app_admin());

create or replace function public.activate_entitlement_grant(
  p_idempotency_key text,
  p_user_id uuid,
  p_grant_type text,
  p_resource_type text,
  p_resource_id text default null,
  p_match_id uuid default null,
  p_plan_id uuid default null,
  p_starts_at timestamptz default now(),
  p_ends_at timestamptz default null,
  p_source_type text default 'manual_admin',
  p_source_reference text default null,
  p_metadata_json jsonb default '{}'::jsonb
)
returns public.entitlement_grants
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_admin_id uuid;
  v_existing public.entitlement_grants%rowtype;
  v_grant public.entitlement_grants%rowtype;
  v_subscription_id uuid;
  v_entitlement_id uuid;
  v_unlock_id uuid;
  v_normalized_resource_id text;
begin
  v_admin_id := auth.uid();

  if v_admin_id is null or not public.is_app_admin() then
    raise exception 'admin access required' using errcode = '42501';
  end if;

  if nullif(trim(p_idempotency_key), '') is null then
    raise exception 'idempotency_key is required' using errcode = '22023';
  end if;

  if p_source_type <> 'manual_admin' then
    raise exception 'only manual_admin source_type is supported before Wompi integration'
      using errcode = '22023';
  end if;

  if p_metadata_json is null or jsonb_typeof(p_metadata_json) <> 'object' then
    raise exception 'metadata_json must be a JSON object' using errcode = '22023';
  end if;

  if not exists (select 1 from auth.users where id = p_user_id) then
    raise exception 'target user not found' using errcode = '22023';
  end if;

  if p_plan_id is not null and not exists (select 1 from public.plans where id = p_plan_id) then
    raise exception 'plan not found' using errcode = '22023';
  end if;

  if p_starts_at is null then
    raise exception 'starts_at is required' using errcode = '22023';
  end if;

  if p_ends_at is not null and p_ends_at <= p_starts_at then
    raise exception 'ends_at must be after starts_at' using errcode = '22023';
  end if;

  if p_grant_type not in (
    'global_premium_access',
    'competition_access',
    'stage_access',
    'team_access',
    'match_access',
    'match_unlock'
  ) then
    raise exception 'unsupported grant_type' using errcode = '22023';
  end if;

  if p_resource_type not in ('global', 'competition', 'stage', 'team', 'match') then
    raise exception 'unsupported resource_type' using errcode = '22023';
  end if;

  if p_grant_type = 'match_unlock' and (p_resource_type <> 'match' or p_match_id is null) then
    raise exception 'match_unlock grants require resource_type match and match_id'
      using errcode = '22023';
  end if;

  if p_grant_type <> 'match_unlock' and p_grant_type = 'global_premium_access' and p_resource_type <> 'global' then
    raise exception 'global_premium_access requires resource_type global'
      using errcode = '22023';
  end if;

  if p_grant_type = 'competition_access' and p_resource_type <> 'competition' then
    raise exception 'competition_access requires resource_type competition'
      using errcode = '22023';
  end if;

  if p_grant_type = 'stage_access' and p_resource_type <> 'stage' then
    raise exception 'stage_access requires resource_type stage'
      using errcode = '22023';
  end if;

  if p_grant_type = 'team_access' and p_resource_type <> 'team' then
    raise exception 'team_access requires resource_type team'
      using errcode = '22023';
  end if;

  if p_grant_type = 'match_access' and p_resource_type <> 'match' then
    raise exception 'match_access requires resource_type match'
      using errcode = '22023';
  end if;

  if p_resource_type = 'match' and p_match_id is null then
    raise exception 'match grants require match_id' using errcode = '22023';
  end if;

  v_normalized_resource_id := case
    when p_resource_type = 'global' then 'global'
    when p_resource_type = 'match' then p_match_id::text
    else nullif(trim(coalesce(p_resource_id, '')), '')
  end;

  if p_resource_type <> 'global' and v_normalized_resource_id is null then
    raise exception 'resource_id is required for non-global grants' using errcode = '22023';
  end if;

  if p_match_id is not null and not exists (select 1 from public.matches where id = p_match_id) then
    raise exception 'match not found' using errcode = '22023';
  end if;

  insert into public.entitlement_grants (
    idempotency_key,
    source_type,
    source_reference,
    user_id,
    plan_id,
    grant_type,
    resource_type,
    resource_id,
    match_id,
    starts_at,
    ends_at,
    status,
    created_by,
    metadata_json
  )
  values (
    trim(p_idempotency_key),
    p_source_type,
    nullif(trim(coalesce(p_source_reference, '')), ''),
    p_user_id,
    p_plan_id,
    p_grant_type,
    p_resource_type,
    v_normalized_resource_id,
    p_match_id,
    p_starts_at,
    p_ends_at,
    'active',
    v_admin_id,
    p_metadata_json
  )
  on conflict (idempotency_key) do nothing
  returning * into v_grant;

  if not found then
    select *
    into v_existing
    from public.entitlement_grants
    where idempotency_key = trim(p_idempotency_key);

    return v_existing;
  end if;

  if p_plan_id is not null then
    insert into public.subscriptions (
      user_id,
      plan_id,
      status,
      starts_at,
      ends_at,
      payment_provider,
      provider_customer_id,
      provider_subscription_id
    )
    values (
      p_user_id,
      p_plan_id,
      'active',
      p_starts_at,
      p_ends_at,
      'manual_admin',
      null,
      null
    )
    on conflict (user_id, plan_id) where payment_provider = 'manual_admin'
    do update set
      status = 'active',
      starts_at = excluded.starts_at,
      ends_at = excluded.ends_at,
      provider_subscription_id = excluded.provider_subscription_id,
      updated_at = now()
    returning id into v_subscription_id;
  end if;

  if p_grant_type = 'match_unlock' then
    insert into public.user_match_unlocks (
      user_id,
      match_id,
      source_plan_id,
      unlocked_at,
      expires_at
    )
    values (
      p_user_id,
      p_match_id,
      p_plan_id,
      p_starts_at,
      p_ends_at
    )
    on conflict (
      user_id,
      match_id,
      (coalesce(source_plan_id, '00000000-0000-0000-0000-000000000000'::uuid))
    )
    do update set
      unlocked_at = excluded.unlocked_at,
      expires_at = excluded.expires_at
    returning id into v_unlock_id;
  else
    insert into public.user_entitlements (
      user_id,
      entitlement_type,
      resource_type,
      resource_id,
      quantity,
      starts_at,
      ends_at,
      source_plan_id
    )
    values (
      p_user_id,
      p_grant_type,
      p_resource_type,
      v_normalized_resource_id,
      null,
      p_starts_at,
      p_ends_at,
      p_plan_id
    )
    on conflict (
      user_id,
      entitlement_type,
      resource_type,
      resource_id,
      (coalesce(source_plan_id, '00000000-0000-0000-0000-000000000000'::uuid))
    )
    do update set
      starts_at = excluded.starts_at,
      ends_at = excluded.ends_at
    returning id into v_entitlement_id;
  end if;

  update public.entitlement_grants
  set
    subscription_id = v_subscription_id,
    user_entitlement_id = v_entitlement_id,
    user_match_unlock_id = v_unlock_id
  where id = v_grant.id
  returning * into v_grant;

  return v_grant;
end;
$$;

revoke all on function public.activate_entitlement_grant(
  text,
  uuid,
  text,
  text,
  text,
  uuid,
  uuid,
  timestamptz,
  timestamptz,
  text,
  text,
  jsonb
) from public;
revoke execute on function public.activate_entitlement_grant(
  text,
  uuid,
  text,
  text,
  text,
  uuid,
  uuid,
  timestamptz,
  timestamptz,
  text,
  text,
  jsonb
) from anon;
revoke execute on function public.activate_entitlement_grant(
  text,
  uuid,
  text,
  text,
  text,
  uuid,
  uuid,
  timestamptz,
  timestamptz,
  text,
  text,
  jsonb
) from service_role;
grant execute on function public.activate_entitlement_grant(
  text,
  uuid,
  text,
  text,
  text,
  uuid,
  uuid,
  timestamptz,
  timestamptz,
  text,
  text,
  jsonb
) to authenticated;

create or replace function public.revoke_entitlement_grant(
  p_idempotency_key text,
  p_metadata_json jsonb default '{}'::jsonb
)
returns public.entitlement_grants
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_admin_id uuid;
  v_grant public.entitlement_grants%rowtype;
  v_revoked_at timestamptz := now();
begin
  v_admin_id := auth.uid();

  if v_admin_id is null or not public.is_app_admin() then
    raise exception 'admin access required' using errcode = '42501';
  end if;

  if nullif(trim(p_idempotency_key), '') is null then
    raise exception 'idempotency_key is required' using errcode = '22023';
  end if;

  if p_metadata_json is null or jsonb_typeof(p_metadata_json) <> 'object' then
    raise exception 'metadata_json must be a JSON object' using errcode = '22023';
  end if;

  select *
  into v_grant
  from public.entitlement_grants
  where idempotency_key = trim(p_idempotency_key)
  for update;

  if not found then
    raise exception 'entitlement grant not found' using errcode = '22023';
  end if;

  if v_grant.status = 'revoked' then
    return v_grant;
  end if;

  if v_grant.user_entitlement_id is not null then
    update public.user_entitlements
    set ends_at = v_revoked_at
    where id = v_grant.user_entitlement_id
      and (ends_at is null or ends_at > v_revoked_at);
  end if;

  if v_grant.user_match_unlock_id is not null then
    update public.user_match_unlocks
    set expires_at = v_revoked_at
    where id = v_grant.user_match_unlock_id
      and (expires_at is null or expires_at > v_revoked_at);
  end if;

  if v_grant.subscription_id is not null then
    update public.subscriptions
    set
      status = case
        when ends_at is not null and ends_at <= v_revoked_at then 'expired'
        else 'cancelled'
      end,
      ends_at = case
        when ends_at is null or ends_at > v_revoked_at then v_revoked_at
        else ends_at
      end,
      updated_at = now()
    where id = v_grant.subscription_id;
  end if;

  update public.entitlement_grants
  set
    status = 'revoked',
    revoked_at = v_revoked_at,
    revoked_by = v_admin_id,
    metadata_json = entitlement_grants.metadata_json || p_metadata_json
  where id = v_grant.id
  returning * into v_grant;

  return v_grant;
end;
$$;

revoke all on function public.revoke_entitlement_grant(text, jsonb) from public;
revoke execute on function public.revoke_entitlement_grant(text, jsonb) from anon;
revoke execute on function public.revoke_entitlement_grant(text, jsonb) from service_role;
grant execute on function public.revoke_entitlement_grant(text, jsonb) to authenticated;
