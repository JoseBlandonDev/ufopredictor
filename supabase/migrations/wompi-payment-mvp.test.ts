import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/0037_wompi_payment_mvp.sql"),
  "utf8",
);
const webhookRoute = readFileSync(
  join(process.cwd(), "app/api/wompi/webhook/route.ts"),
  "utf8",
);
const checkoutRoute = readFileSync(
  join(process.cwd(), "app/api/wompi/checkout/route.ts"),
  "utf8",
);
const returnPage = readFileSync(
  join(process.cwd(), "app/payments/wompi/return/page.tsx"),
  "utf8",
);

describe("0037 Wompi payment MVP migration", () => {
  it("creates the Wompi intent and event ledgers without storing card data", () => {
    expect(migration).toContain("create table public.wompi_payment_intents");
    expect(migration).toContain("create table public.wompi_payment_events");
    expect(migration).toContain("checkout_payload jsonb");
    expect(migration).toContain("raw_event_json jsonb");
    expect(migration).not.toMatch(/card_number|cvv|cvc|pan/i);
  });

  it("uses G06 entitlement tables and idempotent Wompi grant keys", () => {
    expect(migration).toContain("insert into public.entitlement_grants");
    expect(migration).toContain("'wompi_webhook'");
    expect(migration).toContain("'wompi:' || v_transaction_id || ':APPROVED'");
    expect(migration).toContain("on conflict (idempotency_key) do nothing");
    expect(migration).toContain("insert into public.user_entitlements");
    expect(migration).toContain("'competition_access'");
    expect(migration).toContain("'world_cup_2026'");
  });

  it("does not authorize premium through subscriptions directly", () => {
    expect(migration).toContain("insert into public.subscriptions");
    expect(migration).toContain("insert into public.user_entitlements");
    expect(migration).not.toMatch(/profiles\s+set\s+role\s*=\s*'premium_user'/i);
  });

  it("does not activate PENDING, DECLINED, or ERROR events", () => {
    expect(migration).toContain("if v_status <> 'APPROVED' then");
    expect(migration).toContain("set processed_at = now()");
    expect(migration).toContain("return v_event;");
  });

  it("does not let direct RPC callers activate with an invented secret", () => {
    expect(migration).toContain("drop function if exists public.activate_verified_wompi_entitlement(jsonb, text, text)");
    expect(migration).toContain("current_setting('app.wompi_events_secret', true)");
    expect(migration).toContain("digest(v_concat || v_timestamp || v_events_secret, 'sha256')");
    expect(migration).not.toContain("p_events_secret");
    expect(webhookRoute).not.toContain("p_events_secret");
  });

  it("validates Wompi checksums before processing and keeps the route server-only", () => {
    expect(webhookRoute).toContain("verifyEventChecksum");
    expect(webhookRoute).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
  });

  it("prevents arbitrary authenticated inserts into Wompi payment intents", () => {
    expect(migration).toContain("revoke all on public.wompi_payment_intents from anon, authenticated");
    expect(migration).toContain("grant select on public.wompi_payment_intents to authenticated");
    expect(migration).not.toContain("grant select, insert on public.wompi_payment_intents to authenticated");
    expect(migration).not.toContain("Users may create their own Wompi payment intents");
  });

  it("creates checkout intents only through a constrained authenticated RPC", () => {
    expect(migration).toContain("create or replace function public.create_wompi_world_cup_pass_intent");
    expect(migration).toContain("v_user_id := auth.uid()");
    expect(migration).toContain("where slug = 'world-cup-pass'");
    expect(migration).toContain("8700000");
    expect(migration).toContain("'COP'");
    expect(migration).toContain("'competition_access'");
    expect(migration).toContain("'world_cup_2026'");
    expect(migration).toContain("grant execute on function public.create_wompi_world_cup_pass_intent(timestamptz) to authenticated");
    expect(migration).toContain("revoke execute on function public.create_wompi_world_cup_pass_intent(timestamptz) from anon");
  });

  it("uses the constrained checkout RPC from the app route", () => {
    expect(checkoutRoute).toContain('supabase.rpc(\n    "create_wompi_world_cup_pass_intent"');
    expect(checkoutRoute).toContain("configuredAmountInCents !== intent.amount_in_cents");
    expect(checkoutRoute).toContain("amountInCents: intent.amount_in_cents");
    expect(checkoutRoute).toContain("checkoutPayload.currency !== intent.currency");
    expect(checkoutRoute).not.toContain('.from("wompi_payment_intents").insert');
    expect(checkoutRoute).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
  });

  it("keeps browser redirect pages informational", () => {
    expect(returnPage).toContain("Esta pantalla no activa premium");
    expect(returnPage).toContain("El redirect del navegador es solo informativo");
    expect(returnPage).not.toContain("activate_verified_wompi_entitlement");
  });
});
