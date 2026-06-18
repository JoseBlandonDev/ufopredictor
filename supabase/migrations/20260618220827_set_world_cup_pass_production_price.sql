-- G05B production price update for World Cup Pass.
-- The checkout route rejects any mismatch between Railway
-- WOMPI_WORLD_CUP_PASS_AMOUNT_COP and this DB-constrained RPC amount.

update public.plans
set
  price = 20,
  currency = 'USD',
  updated_at = now()
where slug = 'world-cup-pass';

do $$
declare
  v_sql text;
begin
  select pg_get_functiondef('public.create_wompi_world_cup_pass_intent(timestamptz)'::regprocedure)
  into v_sql;

  if v_sql is null then
    raise exception 'create_wompi_world_cup_pass_intent(timestamptz) is required before this price migration'
      using errcode = '42883';
  end if;

  v_sql := replace(v_sql, '8700000', '6990000');

  execute v_sql;
end;
$$;

notify pgrst, 'reload schema';
