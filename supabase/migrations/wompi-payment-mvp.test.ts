import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/0037_wompi_payment_mvp.sql"),
  "utf8",
);
const repairMigrationName = readdirSync(join(process.cwd(), "supabase/migrations")).find((fileName) =>
  fileName.endsWith("_qualify_wompi_pgcrypto_functions.sql"),
);
const repairMigration = repairMigrationName
  ? readFileSync(join(process.cwd(), "supabase/migrations", repairMigrationName), "utf8")
  : "";
const priceMigrationName = readdirSync(join(process.cwd(), "supabase/migrations")).find((fileName) =>
  fileName.endsWith("_set_world_cup_pass_production_price.sql"),
);
const priceMigration = priceMigrationName
  ? readFileSync(join(process.cwd(), "supabase/migrations", priceMigrationName), "utf8")
  : "";
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
    expect(migration.indexOf("if v_status <> 'APPROVED' then")).toBeLessThan(
      migration.indexOf("insert into public.entitlement_grants"),
    );
  });

  it("does not let direct RPC callers activate with an invented secret", () => {
    expect(migration).toContain("drop function if exists public.activate_verified_wompi_entitlement(jsonb, text, text)");
    expect(migration).toContain("from vault.decrypted_secrets");
    expect(migration).toContain("where name = 'wompi_events_secret'");
    expect(migration).toContain("extensions.digest(v_concat || v_timestamp || v_events_secret, 'sha256')");
    expect(migration).not.toContain("p_events_secret");
    expect(webhookRoute).not.toContain("p_events_secret");
  });

  it("fails safely when the Vault Wompi events secret is missing", () => {
    expect(migration).toContain("if v_events_secret is null then");
    expect(migration).toContain("wompi_events_secret Vault secret is required");
    expect(migration.indexOf("wompi_events_secret Vault secret is required")).toBeLessThan(
      migration.indexOf("insert into public.wompi_payment_events"),
    );
  });

  it("uses the Vault secret to validate APPROVED events before activation", () => {
    expect(migration.indexOf("from vault.decrypted_secrets")).toBeLessThan(
      migration.indexOf("v_expected_checksum :="),
    );
    expect(migration.indexOf("if v_expected_checksum <> v_body_checksum then")).toBeLessThan(
      migration.indexOf("insert into public.entitlement_grants"),
    );
    expect(migration.indexOf("if v_status <> 'APPROVED' then")).toBeLessThan(
      migration.indexOf("insert into public.entitlement_grants"),
    );
  });

  it("does not depend on database settings for the Wompi events secret", () => {
    expect(migration).not.toContain("current_setting('app.wompi_events_secret'");
    expect(migration).not.toContain("alter database");
    expect(migration).not.toContain("pg_reload_conf");
  });

  it("delegates Wompi checksum verification to the Vault-backed RPC", () => {
    expect(webhookRoute).toContain("activate_verified_wompi_entitlement");
    expect(webhookRoute).toContain("p_header_checksum: headerChecksum");
    expect(webhookRoute).not.toContain("verifyEventChecksum");
    expect(webhookRoute).not.toContain("WOMPI_EVENTS_SECRET");
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
    expect(migration).toContain("extensions.gen_random_bytes(6)");
    expect(migration).toContain("6990000");
    expect(migration).toContain("'COP'");
    expect(migration).toContain("'competition_access'");
    expect(migration).toContain("'world_cup_2026'");
    expect(migration).toContain("grant execute on function public.create_wompi_world_cup_pass_intent(timestamptz) to authenticated");
    expect(migration).toContain("revoke execute on function public.create_wompi_world_cup_pass_intent(timestamptz) from anon");
  });

  it("keeps repair migration scoped to pgcrypto function qualification", () => {
    expect(repairMigrationName).toBeDefined();
    expect(repairMigration).toContain("extensions.gen_random_bytes(6)");
    expect(repairMigration).toContain("extensions.digest(v_concat || v_timestamp || v_events_secret, ''sha256'')");
    expect(repairMigration).toContain("notify pgrst, 'reload schema'");
    expect(repairMigration).not.toContain("create table public.wompi_payment_intents");
    expect(repairMigration).not.toContain("grant select, insert on public.wompi_payment_intents to authenticated");
  });

  it("keeps the production World Cup Pass price aligned with checkout config", () => {
    expect(priceMigrationName).toBeDefined();
    expect(priceMigration).toContain("price = 20");
    expect(priceMigration).toContain("'8700000', '6990000'");
    expect(priceMigration).toContain("notify pgrst, 'reload schema'");
    expect(migration).toContain("6990000");
    expect(migration).not.toContain("8700000");
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
