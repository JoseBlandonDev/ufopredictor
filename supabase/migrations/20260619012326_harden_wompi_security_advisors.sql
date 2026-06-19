-- Harden the Wompi payment surface that is intentionally reachable by the
-- unauthenticated Wompi webhook. This does not change prices, checkout
-- behavior, or the activation contract.

create index if not exists wompi_payment_events_entitlement_grant_id_idx
on public.wompi_payment_events (entitlement_grant_id)
where entitlement_grant_id is not null;

create index if not exists wompi_payment_intents_plan_id_idx
on public.wompi_payment_intents (plan_id);

create index if not exists wompi_product_prices_updated_by_idx
on public.wompi_product_prices (updated_by)
where updated_by is not null;

drop policy if exists "No public access to Wompi payment events" on public.wompi_payment_events;
create policy "No public access to Wompi payment events"
on public.wompi_payment_events
for all
to anon, authenticated
using (false)
with check (false);

comment on table public.wompi_payment_events is
  'Verified Wompi webhook ledger. Direct anon/authenticated table access is intentionally denied; writes happen only inside the Vault-verified webhook RPC.';

comment on function public.activate_verified_wompi_entitlement(jsonb, text) is
  'Intentionally exposed for unauthenticated Wompi webhook delivery. It does not accept caller-provided secrets and validates event checksums against Supabase Vault secret wompi_events_secret before any activation.';

notify pgrst, 'reload schema';
