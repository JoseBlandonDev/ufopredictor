-- Canonical USD pricing for World Cup Pass while preserving exact COP checkout amounts for Wompi.
-- Admin edits USD only. The server converts to COP before calling the constrained RPC.

alter table public.wompi_product_prices
  add column if not exists base_price_usd_cents integer,
  add column if not exists offer_price_usd_cents integer,
  add column if not exists usd_cop_rate integer,
  add column if not exists converted_at timestamptz;

update public.wompi_product_prices
set base_price_usd_cents = coalesce(
  case
    when substring(coalesce(base_price_label, '') from '([0-9]+(?:\.[0-9]{1,2})?)') is not null
      then round((substring(base_price_label from '([0-9]+(?:\.[0-9]{1,2})?)'))::numeric * 100)::integer
    else null
  end,
  2000
)
where base_price_usd_cents is null;

update public.wompi_product_prices
set usd_cop_rate = greatest(
  1,
  round(
    ((base_amount_in_cents / 100)::numeric * 100)
    / nullif(base_price_usd_cents, 0)
  )::integer
)
where usd_cop_rate is null;

update public.wompi_product_prices
set offer_price_usd_cents = case
  when offer_amount_in_cents is null then null
  else greatest(
    1,
    round(
      offer_amount_in_cents::numeric * base_price_usd_cents::numeric
      / nullif(base_amount_in_cents, 0)
    )::integer
  )
end
where offer_price_usd_cents is null;

update public.wompi_product_prices
set converted_at = coalesce(updated_at, now())
where converted_at is null;

alter table public.wompi_product_prices
  alter column base_price_usd_cents set not null,
  alter column usd_cop_rate set not null,
  alter column converted_at set not null;

alter table public.wompi_product_prices
  add constraint wompi_product_prices_base_price_usd_cents_check
    check (base_price_usd_cents > 0),
  add constraint wompi_product_prices_offer_price_usd_cents_check
    check (offer_price_usd_cents is null or offer_price_usd_cents > 0),
  add constraint wompi_product_prices_usd_cop_rate_check
    check (usd_cop_rate > 0);

alter table public.wompi_product_prices
  drop column if exists base_price_label,
  drop column if exists offer_price_label;

create or replace function public.get_wompi_world_cup_pass_price()
returns table (
  product_slug text,
  amount_in_cents integer,
  amount_cop integer,
  currency text,
  price_usd_cents integer,
  base_price_usd_cents integer,
  offer_price_usd_cents integer,
  offer_ends_at timestamptz,
  is_offer_active boolean,
  usd_cop_rate integer,
  converted_at timestamptz,
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
        and prices.offer_price_usd_cents is not null
        and prices.offer_ends_at is not null
        and prices.offer_ends_at > now()
        then prices.offer_amount_in_cents
      else prices.base_amount_in_cents
    end as amount_in_cents,
    (
      case
        when prices.offer_amount_in_cents is not null
          and prices.offer_price_usd_cents is not null
          and prices.offer_ends_at is not null
          and prices.offer_ends_at > now()
          then prices.offer_amount_in_cents
        else prices.base_amount_in_cents
      end
    ) / 100 as amount_cop,
    prices.currency,
    case
      when prices.offer_price_usd_cents is not null
        and prices.offer_ends_at is not null
        and prices.offer_ends_at > now()
        then prices.offer_price_usd_cents
      else prices.base_price_usd_cents
    end as price_usd_cents,
    prices.base_price_usd_cents,
    prices.offer_price_usd_cents,
    prices.offer_ends_at,
    (
      prices.offer_amount_in_cents is not null
      and prices.offer_price_usd_cents is not null
      and prices.offer_ends_at is not null
      and prices.offer_ends_at > now()
    ) as is_offer_active,
    prices.usd_cop_rate,
    prices.converted_at,
    prices.updated_at
  from public.wompi_product_prices prices
  where prices.product_slug = 'world-cup-pass'
  limit 1;
$$;

revoke all on function public.get_wompi_world_cup_pass_price() from public;
grant execute on function public.get_wompi_world_cup_pass_price() to anon, authenticated;

drop function if exists public.admin_update_wompi_world_cup_pass_price(integer, text, integer, text, timestamptz);

create or replace function public.admin_update_wompi_world_cup_pass_price(
  p_base_price_usd_cents integer,
  p_base_amount_cop integer,
  p_offer_price_usd_cents integer default null,
  p_offer_amount_cop integer default null,
  p_offer_ends_at timestamptz default null,
  p_usd_cop_rate integer default null
)
returns table (
  product_slug text,
  amount_in_cents integer,
  amount_cop integer,
  currency text,
  price_usd_cents integer,
  base_price_usd_cents integer,
  offer_price_usd_cents integer,
  offer_ends_at timestamptz,
  is_offer_active boolean,
  usd_cop_rate integer,
  converted_at timestamptz,
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

  if p_base_price_usd_cents is null or p_base_price_usd_cents < 100 or p_base_price_usd_cents > 5000000 then
    raise exception 'base canonical USD amount must be between 1.00 and 50,000.00' using errcode = '22023';
  end if;

  if p_base_amount_cop is null or p_base_amount_cop < 1000 or p_base_amount_cop > 5000000 then
    raise exception 'base amount must be between 1,000 and 5,000,000 COP' using errcode = '22023';
  end if;

  if p_usd_cop_rate is null or p_usd_cop_rate <= 0 then
    raise exception 'USD/COP rate must be positive' using errcode = '22023';
  end if;

  if p_offer_price_usd_cents is not null or p_offer_amount_cop is not null then
    if p_offer_price_usd_cents is null or p_offer_amount_cop is null then
      raise exception 'offer USD and COP amounts must be provided together' using errcode = '22023';
    end if;

    if p_offer_price_usd_cents < 100 or p_offer_price_usd_cents > 5000000 then
      raise exception 'offer canonical USD amount must be between 1.00 and 50,000.00' using errcode = '22023';
    end if;

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
    offer_amount_in_cents,
    offer_ends_at,
    currency,
    updated_by,
    base_price_usd_cents,
    offer_price_usd_cents,
    usd_cop_rate,
    converted_at
  )
  values (
    'world-cup-pass',
    p_base_amount_cop * 100,
    p_offer_amount_cop * 100,
    case when p_offer_amount_cop is null then null else p_offer_ends_at end,
    'COP',
    v_updated_by,
    p_base_price_usd_cents,
    p_offer_price_usd_cents,
    p_usd_cop_rate,
    now()
  )
  on conflict on constraint wompi_product_prices_pkey do update set
    base_amount_in_cents = excluded.base_amount_in_cents,
    offer_amount_in_cents = excluded.offer_amount_in_cents,
    offer_ends_at = case when p_offer_amount_cop is null then null else p_offer_ends_at end,
    currency = excluded.currency,
    updated_by = excluded.updated_by,
    base_price_usd_cents = excluded.base_price_usd_cents,
    offer_price_usd_cents = excluded.offer_price_usd_cents,
    usd_cop_rate = excluded.usd_cop_rate,
    converted_at = excluded.converted_at,
    updated_at = now();

  return query
  select *
  from public.get_wompi_world_cup_pass_price();
end;
$$;

revoke all on function public.admin_update_wompi_world_cup_pass_price(integer, integer, integer, integer, timestamptz, integer) from public;
revoke execute on function public.admin_update_wompi_world_cup_pass_price(integer, integer, integer, integer, timestamptz, integer) from anon;
grant execute on function public.admin_update_wompi_world_cup_pass_price(integer, integer, integer, integer, timestamptz, integer) to authenticated;

notify pgrst, 'reload schema';
