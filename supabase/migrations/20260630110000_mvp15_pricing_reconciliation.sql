update public.plans
set price = 10
where slug = 'world-cup-pass';

insert into public.wompi_product_prices (
  product_slug,
  base_amount_in_cents,
  currency,
  offer_amount_in_cents,
  offer_ends_at,
  base_price_usd_cents,
  offer_price_usd_cents,
  usd_cop_rate,
  converted_at,
  updated_at
)
values (
  'world-cup-pass',
  3500000,
  'COP',
  null,
  null,
  1000,
  null,
  3500,
  now(),
  now()
)
on conflict (product_slug) do update
set base_amount_in_cents = excluded.base_amount_in_cents,
    currency = excluded.currency,
    offer_amount_in_cents = null,
    offer_ends_at = null,
    base_price_usd_cents = excluded.base_price_usd_cents,
    offer_price_usd_cents = null,
    usd_cop_rate = excluded.usd_cop_rate,
    converted_at = now(),
    updated_at = now();

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
  v_amount_in_cents integer;
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

  if exists (
    select 1
    from public.user_entitlements ent
    where ent.user_id = v_user_id
      and ent.source_plan_id = v_plan_id
      and ent.entitlement_type = 'competition_access'
      and ent.resource_type = 'competition'
      and ent.resource_id = 'world_cup_2026'
      and ent.quantity is null
      and (ent.starts_at is null or ent.starts_at <= now())
      and (ent.ends_at is null or ent.ends_at > now())
  ) then
    raise exception 'world-cup-pass already active for this account' using errcode = 'P0001';
  end if;

  select price.amount_in_cents
  into v_amount_in_cents
  from public.get_wompi_world_cup_pass_price() price;

  if v_amount_in_cents is null then
    raise exception 'world-cup-pass Wompi price is not configured' using errcode = '22023';
  end if;

  loop
    v_reference := 'ufo_wc_' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISS') || '_' || encode(extensions.gen_random_bytes(6), 'hex');

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
      v_amount_in_cents,
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

notify pgrst, 'reload schema';
