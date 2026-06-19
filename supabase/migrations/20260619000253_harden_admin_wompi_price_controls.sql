-- Make Wompi price reads use ordinary RLS instead of SECURITY DEFINER.
-- Admin updates remain constrained by profile role checks and RLS policies.

grant select on public.wompi_product_prices to anon, authenticated;
grant insert, update on public.wompi_product_prices to authenticated;

drop policy if exists "Anyone may read Wompi product prices" on public.wompi_product_prices;
create policy "Anyone may read Wompi product prices"
on public.wompi_product_prices
for select
to anon, authenticated
using (product_slug = 'world-cup-pass');

drop policy if exists "Admins may insert Wompi product prices" on public.wompi_product_prices;
create policy "Admins may insert Wompi product prices"
on public.wompi_product_prices
for insert
to authenticated
with check (public.is_real_fixture_lab_admin() and product_slug = 'world-cup-pass');

drop policy if exists "Admins may update Wompi product prices" on public.wompi_product_prices;
create policy "Admins may update Wompi product prices"
on public.wompi_product_prices
for update
to authenticated
using (public.is_real_fixture_lab_admin() and product_slug = 'world-cup-pass')
with check (public.is_real_fixture_lab_admin() and product_slug = 'world-cup-pass');

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

notify pgrst, 'reload schema';
