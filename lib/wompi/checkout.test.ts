import { describe, expect, it, vi } from "vitest";
import { normalizeWompiStatus, normalizeWorldCupResourceId } from "./events";

vi.mock("server-only", () => ({}));

describe("Wompi checkout helpers", () => {
  it("converts configured COP pesos to Wompi amount_in_cents", async () => {
    const { amountCopToWompiAmountInCents } = await import("./checkout");

    expect(amountCopToWompiAmountInCents(69900)).toBe(6990000);
  });

  it("can build checkout with the DB-constrained Wompi amount", async () => {
    const { buildWompiCheckoutPayload } = await import("./checkout");

    const payload = buildWompiCheckoutPayload({
      config: {
        env: "sandbox",
        apiBaseUrl: "https://sandbox.wompi.co/v1",
        publicKey: "pub_test_xxx",
        privateKey: "prv_test_xxx",
        integritySecret: "test_integrity_xxx",
        currency: "COP",
        appUrl: "https://ufopredictor.com",
      },
      reference: "ufo_wc_20260617154512_abcdef123456",
      amountInCents: 6990000,
      expirationTime: "2026-06-17T16:15:12.000Z",
    });

    expect(payload.amountInCents).toBe(6990000);
    expect(payload.currency).toBe("COP");
    expect(payload.checkoutUrl).toContain("amount-in-cents=6990000");
  });

  it("generates Wompi-safe unique references", async () => {
    const { generateWompiReference } = await import("./checkout");
    const reference = generateWompiReference(new Date("2026-06-17T15:45:12.000Z"));

    expect(reference).toMatch(/^ufo_wc_20260617154512_[a-f0-9]{12}$/);
  });

  it("maps the World Cup pass into the existing G06 entitlement resource", async () => {
    const { buildWorldCupPassEntitlementMapping } = await import("./checkout");

    expect(buildWorldCupPassEntitlementMapping()).toMatchObject({
      plan_slug: "world-cup-pass",
      grant_type: "competition_access",
      resource_type: "competition",
      resource_id: "world_cup_2026",
    });
    expect(normalizeWorldCupResourceId("world-cup-2026")).toBe("world_cup_2026");
  });

  it("normalizes Wompi statuses without activating unknown states", () => {
    expect(normalizeWompiStatus("APPROVED")).toBe("APPROVED");
    expect(normalizeWompiStatus("PENDING")).toBe("PENDING");
    expect(normalizeWompiStatus("DECLINED")).toBe("DECLINED");
    expect(normalizeWompiStatus("VOIDED")).toBe("ERROR");
  });
});
