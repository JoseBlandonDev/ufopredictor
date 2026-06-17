import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/0036_entitlement_activation_binding.sql"),
  "utf8",
);
const preflight = readFileSync(
  join(process.cwd(), "docs/G06_ENTITLEMENT_ACTIVATION_PREFLIGHT.sql"),
  "utf8",
);

describe("0036 entitlement activation binding migration", () => {
  it("creates entitlement_grants as the idempotent grant ledger", () => {
    expect(migration).toContain("create table public.entitlement_grants");
    expect(migration).toContain("idempotency_key text not null unique");
    expect(migration).toContain("source_type in ('manual_admin', 'wompi_webhook', 'wompi_transaction', 'system')");
    expect(migration).toContain("status in ('active', 'revoked', 'expired')");
  });

  it("keeps activation idempotent and avoids duplicate access rows", () => {
    expect(migration).toContain("on conflict (idempotency_key) do nothing");
    expect(migration).toContain("when p_resource_type = 'match' then p_match_id::text");
    expect(migration).toContain("user_entitlements_access_key_uidx");
    expect(migration).toContain("user_match_unlocks_access_key_uidx");
    expect(migration).toContain("subscriptions_provider_reference_uidx");
  });

  it("guards production unique indexes with read-only duplicate checks", () => {
    expect(migration).toContain("Cannot create subscriptions_manual_admin_user_plan_uidx");
    expect(migration).toContain("Cannot create user_entitlements_access_key_uidx");
    expect(migration).toContain("Cannot create user_match_unlocks_access_key_uidx");
    expect(migration).toContain("Run docs/G06_ENTITLEMENT_ACTIVATION_PREFLIGHT.sql");
    expect(migration).toContain("having count(*) > 1");
  });

  it("uses admin-only RPCs without granting direct anonymous access", () => {
    expect(migration).toContain("create or replace function public.is_app_admin()");
    expect(migration).toContain("create or replace function public.activate_entitlement_grant");
    expect(migration).toContain("create or replace function public.revoke_entitlement_grant");
    expect(migration).toContain("revoke execute on function public.activate_entitlement_grant");
    expect(migration).toContain("from anon");
    expect(migration).toContain("grant execute on function public.activate_entitlement_grant");
    expect(migration).toContain("to authenticated");
  });

  it("revokes by expiring access rather than deleting rows", () => {
    expect(migration).toContain("set ends_at = v_revoked_at");
    expect(migration).toContain("set expires_at = v_revoked_at");
    expect(migration).not.toMatch(/delete\s+from\s+public\.(user_entitlements|user_match_unlocks|subscriptions|entitlement_grants)/i);
  });

  it("documents read-only production preflight queries for historical duplicates", () => {
    expect(preflight).toContain("subscriptions_manual_admin_user_plan_uidx");
    expect(preflight).toContain("user_entitlements_access_key_uidx");
    expect(preflight).toContain("user_match_unlocks_access_key_uidx");
    expect(preflight).toContain("array_agg(id order by created_at, id) as affected_ids");
    expect(preflight).toContain("array_agg(id order by unlocked_at, id) as affected_ids");
    expect(preflight).toContain("having count(*) > 1");
    expect(preflight).not.toMatch(/\b(insert|update|delete|merge|truncate|drop|alter|create)\b/i);
  });
});
