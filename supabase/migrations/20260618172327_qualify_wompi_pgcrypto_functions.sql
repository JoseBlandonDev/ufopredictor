-- G05B operational repair for databases that already applied 0037 before
-- pgcrypto calls were schema-qualified. This does not recreate ledgers or
-- loosen Wompi authorization.

do $$
declare
  v_sql text;
begin
  select pg_get_functiondef('public.create_wompi_world_cup_pass_intent(timestamptz)'::regprocedure)
  into v_sql;

  if v_sql is null then
    raise exception 'create_wompi_world_cup_pass_intent(timestamptz) is required before this repair migration'
      using errcode = '42883';
  end if;

  v_sql := replace(
    v_sql,
    'gen_random_bytes(6)',
    'extensions.gen_random_bytes(6)'
  );

  execute v_sql;

  select pg_get_functiondef('public.activate_verified_wompi_entitlement(jsonb, text)'::regprocedure)
  into v_sql;

  if v_sql is null then
    raise exception 'activate_verified_wompi_entitlement(jsonb, text) is required before this repair migration'
      using errcode = '42883';
  end if;

  v_sql := replace(
    v_sql,
    'digest(v_concat || v_timestamp || v_events_secret, ''sha256'')',
    'extensions.digest(v_concat || v_timestamp || v_events_secret, ''sha256'')'
  );

  execute v_sql;
end;
$$;

notify pgrst, 'reload schema';
