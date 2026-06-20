import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migrationName = readdirSync(join(process.cwd(), "supabase/migrations")).find((fileName) =>
  fileName.endsWith("_canonical_usd_wompi_pricing.sql"),
);
const migration = migrationName
  ? readFileSync(join(process.cwd(), "supabase/migrations", migrationName), "utf8")
  : "";
const pricingPage = readFileSync(join(process.cwd(), "app/pricing/page.tsx"), "utf8");
const adminPaymentsPage = readFileSync(join(process.cwd(), "app/admin/payments/page.tsx"), "utf8");
const pricingModule = readFileSync(join(process.cwd(), "lib/wompi/pricing.ts"), "utf8");
const configModule = readFileSync(join(process.cwd(), "lib/wompi/config.ts"), "utf8");

describe("canonical USD Wompi pricing migration", () => {
  it("adds canonical USD cents plus conversion metadata", () => {
    expect(migrationName).toBeDefined();
    expect(migration).toContain("add column if not exists base_price_usd_cents integer");
    expect(migration).toContain("add column if not exists offer_price_usd_cents integer");
    expect(migration).toContain("add column if not exists usd_cop_rate integer");
    expect(migration).toContain("add column if not exists converted_at timestamptz");
  });

  it("replaces label-driven RPC outputs with canonical USD and exact COP values", () => {
    expect(migration).toContain("price_usd_cents integer");
    expect(migration).toContain("base_price_usd_cents integer");
    expect(migration).toContain("offer_price_usd_cents integer");
    expect(migration).toContain("usd_cop_rate integer");
    expect(migration).toContain("drop column if exists base_price_label");
    expect(migration).toContain("drop column if exists offer_price_label");
  });

  it("requires the server-side USD/COP rate in active pricing code", () => {
    expect(configModule).toContain("WOMPI_USD_COP_RATE");
  });

  it("uses USD publicly and does not keep the old tether label in active pricing code", () => {
    expect(pricingModule).toContain("formatUsdCents");
    expect(pricingPage).toContain("Wompi procesará el pago en pesos colombianos");
    expect(pricingPage).toContain("Cobro Wompi:");
    expect([pricingPage, adminPaymentsPage, pricingModule, configModule].join("\n")).not.toContain(["US", "DT"].join(""));
  });
});
