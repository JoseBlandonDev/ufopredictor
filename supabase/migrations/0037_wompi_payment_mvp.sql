-- G05B - Wompi sandbox checkout + verified webhook MVP.
-- Premium authorization continues to come from user_entitlements and
-- user_match_unlocks. subscriptions remains commercial status only.

insert into public.plans (
  id,
  name,
  slug,
  description,
  price,
  currency,
  billing_type,
  is_active
)
values (
  '00000000-0000-4000-8000-000000001002',
  'World Cup Pass',
  'world-cup-pass',
  'Acceso premium para el Mundial 2026.',
  25,
  'USD',
  'one_time',
  true
)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  currency = excluded.currency,
  billing_type = excluded.billing_type,
  is_active = true,
  updated_at = now();

insert into public.plan_features (plan_id, feature_key, feature_value)
values
  (
    (select id from public.plans where slug = 'world-cup-pass'),
    'competition_scope',
    '{"competition_slug": "world-cup-2026", "competition_key": "world_cup_2026"}'::jsonb
  ),
  (
    (select id from public.plans where slug = 'world-cup-pass'),
    'premium_model_detail',
    '{"included": true, "fields": ["xg", "top_scorelines", "btts", "over_under", "model_reading"]}'::jsonb
  )
on conflict (plan_id, feature_key) do update set
  feature_value = excluded.feature_value;

create table public.wompi_payment_intents (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.plans(id) on delete restrict,
  amount_in_cents integer not null check (amount_in_cents > 0),
  currency text not null check (currency = 'COP'),
  status text not null default 'PENDING'
    check (status in ('PENDING', 'APPROVED', 'DECLINED', 'ERROR')),
  checkout_payload jsonb not null default '{}'::jsonb,
  entitlement_mapping_json jsonb not null default '{}'::jsonb,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger wompi_payment_intents_set_updated_at before update on public.wompi_payment_intents
for each row execute function public.set_updated_at();

create index wompi_payment_intents_user_created_idx
on public.wompi_payment_intents (user_id, created_at desc);

create index wompi_payment_intents_status_idx
on public.wompi_payment_intents (status, created_at desc);

create table public.wompi_payment_events (
  id uuid primary key default gen_random_uuid(),
  transaction_id text,
  reference text,
  event_type text,
  status text check (status is null or status in ('PENDING', 'APPROVED', 'DECLINED', 'ERROR')),
  checksum text not null unique,
  raw_event_json jsonb not null,
  verified_at timestamptz,
  processed_at timestamptz,
  entitlement_grant_id uuid references public.entitlement_grants(id) on delete set null,
  processing_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger wompi_payment_events_set_updated_at before update on public.wompi_payment_events
for each row execute function public.set_updated_at();

create index wompi_payment_events_reference_idx
on public.wompi_payment_events (reference, created_at desc);

create index wompi_payment_events_transaction_idx
on public.wompi_payment_events (transaction_id)
where transaction_id is not null;

alter table public.wompi_payment_intents enable row level security;
alter table public.wompi_payment_events enable row level security;

revoke all on public.wompi_payment_intents from anon, authenticated;
grant select on public.wompi_payment_intents to authenticated;

create policy "Users may read their own Wompi payment intents"
on public.wompi_payment_intents
for select
to authenticated
using (user_id = (select auth.uid()));

revoke all on public.wompi_payment_events from anon, authenticated;

create or replace function public.create_wompi_world_cup_pass_intent(
  p_expires_at timestamptz default (now() + interval '30 minutes')
)
returns public.wompi_payment_intents
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid;
  v_plan_id uuid;
  v_reference text;
  v_intent public.wompi_payment_intents%rowtype;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if p_expires_at is null or p_expires_at <= now() then
    raise exception 'expires_at must be in the future' using errcode = '22023';
  end if;

  select id
  into v_plan_id
  from public.plans
  where slug = 'world-cup-pass'
    and is_active = true
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at > now())
  limit 1;

  if v_plan_id is null then
    raise exception 'world-cup-pass is not available' using errcode = '22023';
  end if;

  loop
    v_reference := 'ufo_wc_' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISS') || '_' || encode(gen_random_bytes(6), 'hex');

    insert into public.wompi_payment_intents (
      reference,
      user_id,
      plan_id,
      amount_in_cents,
      currency,
      status,
      checkout_payload,
      entitlement_mapping_json,
      expires_at
    )
    values (
      v_reference,
      v_user_id,
      v_plan_id,
      8700000,
      'COP',
      'PENDING',
      '{}'::jsonb,
      jsonb_build_object(
        'plan_slug', 'world-cup-pass',
        'grant_type', 'competition_access',
        'resource_type', 'competition',
        'resource_id', 'world_cup_2026'
      ),
      p_expires_at
    )
    on conflict (reference) do nothing
    returning * into v_intent;

    exit when found;
  end loop;

  return v_intent;
end;
$$;

revoke all on function public.create_wompi_world_cup_pass_intent(timestamptz) from public;
revoke execute on function public.create_wompi_world_cup_pass_intent(timestamptz) from anon;
grant execute on function public.create_wompi_world_cup_pass_intent(timestamptz) to authenticated;

drop function if exists public.activate_verified_wompi_entitlement(jsonb, text, text);

create or replace function public.activate_verified_wompi_entitlement(
  p_event_json jsonb,
  p_header_checksum text default null
)
returns public.wompi_payment_events
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_properties jsonb;
  v_property text;
  v_part text;
  v_cursor jsonb;
  v_concat text := '';
  v_timestamp text;
  v_body_checksum text;
  v_header_checksum text;
  v_expected_checksum text;
  v_transaction jsonb;
  v_transaction_id text;
  v_reference text;
  v_event_type text;
  v_status text;
  v_amount_in_cents integer;
  v_currency text;
  v_events_secret text;
  v_intent public.wompi_payment_intents%rowtype;
  v_event public.wompi_payment_events%rowtype;
  v_grant public.entitlement_grants%rowtype;
  v_idempotency_key text;
  v_subscription_id uuid;
  v_entitlement_id uuid;
  v_resource_id text;
begin
  if p_event_json is null or jsonb_typeof(p_event_json) <> 'object' then
    raise exception 'event_json must be a JSON object' using errcode = '22023';
  end if;

  v_events_secret := nullif(current_setting('app.wompi_events_secret', true), '');

  if v_events_secret is null then
    raise exception 'app.wompi_events_secret database setting is required'
      using errcode = '22023';
  end if;

  v_body_checksum := upper(nullif(p_event_json #>> '{signature,checksum}', ''));
  v_header_checksum := upper(nullif(coalesce(p_header_checksum, ''), ''));
  v_properties := p_event_json #> '{signature,properties}';
  v_timestamp := p_event_json ->> 'timestamp';

  if v_body_checksum is null then
    raise exception 'Wompi event checksum is required' using errcode = '22023';
  end if;

  if v_header_checksum is not null and v_header_checksum <> v_body_checksum then
    raise exception 'Wompi header checksum does not match body checksum' using errcode = '22023';
  end if;

  if v_properties is null or jsonb_typeof(v_properties) <> 'array' then
    raise exception 'Wompi signature properties must be an array' using errcode = '22023';
  end if;

  if nullif(v_timestamp, '') is null then
    raise exception 'Wompi timestamp is required' using errcode = '22023';
  end if;

  for v_property in select jsonb_array_elements_text(v_properties)
  loop
    v_cursor := p_event_json -> 'data';

    foreach v_part in array regexp_split_to_array(v_property, '\.')
    loop
      v_cursor := v_cursor -> v_part;

      if v_cursor is null then
        raise exception 'Wompi signature property % is missing', v_property
          using errcode = '22023';
      end if;
    end loop;

    v_concat := v_concat || coalesce(v_cursor #>> '{}', '');
  end loop;

  v_expected_checksum := upper(encode(digest(v_concat || v_timestamp || v_events_secret, 'sha256'), 'hex'));

  if v_expected_checksum <> v_body_checksum then
    raise exception 'Invalid Wompi event checksum' using errcode = '22023';
  end if;

  v_event_type := nullif(p_event_json ->> 'event', '');
  v_transaction := p_event_json #> '{data,transaction}';

  if v_transaction is null or jsonb_typeof(v_transaction) <> 'object' then
    raise exception 'Wompi transaction payload is required' using errcode = '22023';
  end if;

  v_transaction_id := nullif(v_transaction ->> 'id', '');
  v_reference := nullif(v_transaction ->> 'reference', '');
  v_amount_in_cents := nullif(v_transaction ->> 'amount_in_cents', '')::integer;
  v_currency := upper(nullif(v_transaction ->> 'currency', ''));
  v_status := case upper(coalesce(v_transaction ->> 'status', ''))
    when 'APPROVED' then 'APPROVED'
    when 'DECLINED' then 'DECLINED'
    when 'PENDING' then 'PENDING'
    else 'ERROR'
  end;

  if v_transaction_id is null or v_reference is null then
    raise exception 'Wompi transaction id and reference are required' using errcode = '22023';
  end if;

  insert into public.wompi_payment_events (
    transaction_id,
    reference,
    event_type,
    status,
    checksum,
    raw_event_json,
    verified_at
  )
  values (
    v_transaction_id,
    v_reference,
    v_event_type,
    v_status,
    v_body_checksum,
    p_event_json,
    now()
  )
  on conflict (checksum) do nothing;

  select *
  into v_event
  from public.wompi_payment_events
  where checksum = v_body_checksum
  for update;

  if v_event.processed_at is not null then
    return v_event;
  end if;

  select *
  into v_intent
  from public.wompi_payment_intents
  where reference = v_reference
  for update;

  if not found then
    update public.wompi_payment_events
    set processing_error = 'payment intent not found'
    where id = v_event.id
    returning * into v_event;

    raise exception 'payment intent not found for Wompi reference %', v_reference
      using errcode = '22023';
  end if;

  if v_intent.amount_in_cents <> v_amount_in_cents or v_intent.currency <> v_currency then
    update public.wompi_payment_events
    set processing_error = 'amount or currency mismatch'
    where id = v_event.id
    returning * into v_event;

    raise exception 'Wompi amount or currency mismatch for reference %', v_reference
      using errcode = '22023';
  end if;

  update public.wompi_payment_intents
  set status = v_status
  where id = v_intent.id;

  if v_status <> 'APPROVED' then
    update public.wompi_payment_events
    set processed_at = now(),
        processing_error = null
    where id = v_event.id
    returning * into v_event;

    return v_event;
  end if;

  v_resource_id := coalesce(v_intent.entitlement_mapping_json ->> 'resource_id', 'world_cup_2026');

  if v_resource_id = 'world-cup-2026' then
    v_resource_id := 'world_cup_2026';
  end if;

  if v_resource_id <> 'world_cup_2026' then
    update public.wompi_payment_events
    set processing_error = 'unsupported entitlement resource'
    where id = v_event.id
    returning * into v_event;

    raise exception 'unsupported Wompi entitlement resource %', v_resource_id
      using errcode = '22023';
  end if;

  v_idempotency_key := 'wompi:' || v_transaction_id || ':APPROVED';

  insert into public.entitlement_grants (
    idempotency_key,
    source_type,
    source_reference,
    user_id,
    plan_id,
    grant_type,
    resource_type,
    resource_id,
    starts_at,
    ends_at,
    status,
    created_by,
    metadata_json
  )
  values (
    v_idempotency_key,
    'wompi_webhook',
    v_transaction_id,
    v_intent.user_id,
    v_intent.plan_id,
    'competition_access',
    'competition',
    v_resource_id,
    now(),
    null,
    'active',
    null,
    jsonb_build_object(
      'wompi_reference', v_reference,
      'wompi_transaction_id', v_transaction_id,
      'wompi_event_checksum', v_body_checksum,
      'plan_slug', 'world-cup-pass',
      'amount_in_cents', v_amount_in_cents,
      'currency', v_currency
    )
  )
  on conflict (idempotency_key) do nothing
  returning * into v_grant;

  if not found then
    select *
    into v_grant
    from public.entitlement_grants
    where idempotency_key = v_idempotency_key;

    update public.wompi_payment_events
    set processed_at = now(),
        entitlement_grant_id = v_grant.id,
        processing_error = null
    where id = v_event.id
    returning * into v_event;

    return v_event;
  end if;

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
    v_intent.user_id,
    v_intent.plan_id,
    'active',
    v_grant.starts_at,
    null,
    'wompi',
    null,
    v_transaction_id
  )
  on conflict (payment_provider, provider_subscription_id)
  where payment_provider is not null and provider_subscription_id is not null
  do update set
    status = 'active',
    starts_at = excluded.starts_at,
    ends_at = excluded.ends_at,
    updated_at = now()
  returning id into v_subscription_id;

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
    v_intent.user_id,
    'competition_access',
    'competition',
    v_resource_id,
    null,
    v_grant.starts_at,
    null,
    v_intent.plan_id
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

  update public.entitlement_grants
  set
    subscription_id = v_subscription_id,
    user_entitlement_id = v_entitlement_id
  where id = v_grant.id
  returning * into v_grant;

  update public.wompi_payment_events
  set processed_at = now(),
      entitlement_grant_id = v_grant.id,
      processing_error = null
  where id = v_event.id
  returning * into v_event;

  return v_event;
end;
$$;

revoke all on function public.activate_verified_wompi_entitlement(jsonb, text) from public;
revoke execute on function public.activate_verified_wompi_entitlement(jsonb, text) from authenticated;
revoke execute on function public.activate_verified_wompi_entitlement(jsonb, text) from service_role;
grant execute on function public.activate_verified_wompi_entitlement(jsonb, text) to anon;
