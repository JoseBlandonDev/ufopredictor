-- Admin-controlled Wompi World Cup Pass pricing.
-- Checkout still creates intents only through the constrained RPC; clients never
-- provide amount, currency, plan_id, or entitlement mapping.

create table public.wompi_product_prices (
  product_slug text primary key,
  base_amount_in_cents integer not null
    check (base_amount_in_cents > 0 and base_amount_in_cents % 100 = 0),
  base_price_label text not null,
  offer_amount_in_cents integer
    check (offer_amount_in_cents is null or (offer_amount_in_cents > 0 and offer_amount_in_cents % 100 = 0)),
  offer_price_label text,
  offer_ends_at timestamptz,
  currency text not null default 'COP' check (currency = 'COP'),
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    product_slug = 'world-cup-pass'
    and (offer_amount_in_cents is not null or offer_ends_at is null)
  )
);

create trigger wompi_product_prices_set_updated_at before update on public.wompi_product_prices
for each row execute function public.set_updated_at();

alter table public.wompi_product_prices enable row level security;
revoke all on public.wompi_product_prices from anon, authenticated;
grant select on public.wompi_product_prices to anon, authenticated;
grant insert, update on public.wompi_product_prices to authenticated;

create policy "Anyone may read Wompi product prices"
on public.wompi_product_prices
for select
to anon, authenticated
using (product_slug = 'world-cup-pass');

create policy "Admins may insert Wompi product prices"
on public.wompi_product_prices
for insert
to authenticated
with check (public.is_real_fixture_lab_admin() and product_slug = 'world-cup-pass');

create policy "Admins may update Wompi product prices"
on public.wompi_product_prices
for update
to authenticated
using (public.is_real_fixture_lab_admin() and product_slug = 'world-cup-pass')
with check (public.is_real_fixture_lab_admin() and product_slug = 'world-cup-pass');

insert into public.wompi_product_prices (
  product_slug,
  base_amount_in_cents,
  base_price_label,
  currency
)
values (
  'world-cup-pass',
  6990000,
  '20 USDT',
  'COP'
)
on conflict (product_slug) do nothing;

create or replace function public.get_wompi_world_cup_pass_price()
returns table (
  product_slug text,
  amount_in_cents integer,
  amount_cop integer,
  currency text,
  price_label text,
  base_amount_in_cents integer,
  base_amount_cop integer,
  base_price_label text,
  offer_amount_in_cents integer,
  offer_amount_cop integer,
  offer_price_label text,
  offer_ends_at timestamptz,
  is_offer_active boolean,
  updated_at timestamptz
)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select
    prices.product_slug,
    case
      when prices.offer_amount_in_cents is not null
        and prices.offer_ends_at is not null
        and prices.offer_ends_at > now()
        then prices.offer_amount_in_cents
      else prices.base_amount_in_cents
    end as amount_in_cents,
    (
      case
        when prices.offer_amount_in_cents is not null
          and prices.offer_ends_at is not null
          and prices.offer_ends_at > now()
          then prices.offer_amount_in_cents
        else prices.base_amount_in_cents
      end
    ) / 100 as amount_cop,
    prices.currency,
    case
      when prices.offer_amount_in_cents is not null
        and prices.offer_ends_at is not null
        and prices.offer_ends_at > now()
        then coalesce(nullif(prices.offer_price_label, ''), prices.base_price_label)
      else prices.base_price_label
    end as price_label,
    prices.base_amount_in_cents,
    prices.base_amount_in_cents / 100 as base_amount_cop,
    prices.base_price_label,
    prices.offer_amount_in_cents,
    prices.offer_amount_in_cents / 100 as offer_amount_cop,
    prices.offer_price_label,
    prices.offer_ends_at,
    (
      prices.offer_amount_in_cents is not null
      and prices.offer_ends_at is not null
      and prices.offer_ends_at > now()
    ) as is_offer_active,
    prices.updated_at
  from public.wompi_product_prices prices
  where prices.product_slug = 'world-cup-pass'
  limit 1;
$$;

revoke all on function public.get_wompi_world_cup_pass_price() from public;
grant execute on function public.get_wompi_world_cup_pass_price() to anon, authenticated;

create or replace function public.admin_update_wompi_world_cup_pass_price(
  p_base_amount_cop integer,
  p_base_price_label text,
  p_offer_amount_cop integer default null,
  p_offer_price_label text default null,
  p_offer_ends_at timestamptz default null
)
returns table (
  product_slug text,
  amount_in_cents integer,
  amount_cop integer,
  currency text,
  price_label text,
  base_amount_in_cents integer,
  base_amount_cop integer,
  base_price_label text,
  offer_amount_in_cents integer,
  offer_amount_cop integer,
  offer_price_label text,
  offer_ends_at timestamptz,
  is_offer_active boolean,
  updated_at timestamptz
)
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_updated_by uuid;
begin
  if not public.is_real_fixture_lab_admin() then
    raise exception 'admin access required' using errcode = '42501';
  end if;

  v_updated_by := auth.uid();

  if p_base_amount_cop is null or p_base_amount_cop < 1000 or p_base_amount_cop > 5000000 then
    raise exception 'base amount must be between 1,000 and 5,000,000 COP' using errcode = '22023';
  end if;

  if nullif(trim(coalesce(p_base_price_label, '')), '') is null then
    raise exception 'base price label is required' using errcode = '22023';
  end if;

  if p_offer_amount_cop is not null then
    if p_offer_amount_cop < 1000 or p_offer_amount_cop > 5000000 then
      raise exception 'offer amount must be between 1,000 and 5,000,000 COP' using errcode = '22023';
    end if;

    if p_offer_ends_at is null or p_offer_ends_at <= now() then
      raise exception 'offer end time must be in the future' using errcode = '22023';
    end if;
  end if;

  insert into public.wompi_product_prices (
    product_slug,
    base_amount_in_cents,
    base_price_label,
    offer_amount_in_cents,
    offer_price_label,
    offer_ends_at,
    currency,
    updated_by
  )
  values (
    'world-cup-pass',
    p_base_amount_cop * 100,
    trim(p_base_price_label),
    p_offer_amount_cop * 100,
    nullif(trim(coalesce(p_offer_price_label, '')), ''),
    case when p_offer_amount_cop is null then null else p_offer_ends_at end,
    'COP',
    v_updated_by
  )
  on conflict (product_slug) do update set
    base_amount_in_cents = excluded.base_amount_in_cents,
    base_price_label = excluded.base_price_label,
    offer_amount_in_cents = excluded.offer_amount_in_cents,
    offer_price_label = excluded.offer_price_label,
    offer_ends_at = excluded.offer_ends_at,
    currency = excluded.currency,
    updated_by = excluded.updated_by,
    updated_at = now();

  return query
  select *
  from public.get_wompi_world_cup_pass_price();
end;
$$;

revoke all on function public.admin_update_wompi_world_cup_pass_price(integer, text, integer, text, timestamptz) from public;
revoke execute on function public.admin_update_wompi_world_cup_pass_price(integer, text, integer, text, timestamptz) from anon;
grant execute on function public.admin_update_wompi_world_cup_pass_price(integer, text, integer, text, timestamptz) to authenticated;

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
