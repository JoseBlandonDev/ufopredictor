import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const originalEnv = { ...process.env };

function setWompiEnv(overrides: Record<string, string | undefined> = {}) {
  process.env.WOMPI_ENV = "sandbox";
  process.env.WOMPI_API_BASE_URL = "https://sandbox.wompi.co/v1";
  process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY = "pub_test_xxx";
  process.env.WOMPI_PRIVATE_KEY = "prv_test_xxx";
  process.env.WOMPI_EVENTS_SECRET = "test_events_xxx";
  process.env.WOMPI_INTEGRITY_SECRET = "test_integrity_xxx";
  process.env.WOMPI_CURRENCY = "COP";
  process.env.WOMPI_WORLD_CUP_PASS_AMOUNT_COP = "87000";
  process.env.NEXT_PUBLIC_APP_URL = "https://ufopredictor.com";

  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("Wompi config", () => {
  it("requires server-only Wompi secrets for checkout/webhook work", async () => {
    setWompiEnv({ WOMPI_EVENTS_SECRET: undefined });

    const { requireWompiServerConfig } = await import("./config");

    expect(() => requireWompiServerConfig()).toThrow("Missing WOMPI_EVENTS_SECRET");
  });

  it("loads sandbox config and keeps the COP amount configurable", async () => {
    setWompiEnv({ WOMPI_WORLD_CUP_PASS_AMOUNT_COP: "91000" });

    const { requireWompiServerConfig } = await import("./config");

    expect(requireWompiServerConfig()).toMatchObject({
      env: "sandbox",
      currency: "COP",
      worldCupPassAmountCop: 91000,
    });
  });

  it("formats the visible World Cup Pass price from the configured COP amount", async () => {
    setWompiEnv();

    const { getWorldCupPassDisplayPrice } = await import("./config");

    expect(getWorldCupPassDisplayPrice()).toBe("25 USDT · aprox. $87.000 COP");
  });
});
