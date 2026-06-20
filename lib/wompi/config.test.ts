import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const originalEnv = { ...process.env };

function setWompiEnv(overrides: Record<string, string | undefined> = {}) {
  process.env.WOMPI_ENV = "sandbox";
  process.env.WOMPI_API_BASE_URL = "https://sandbox.wompi.co/v1";
  process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY = "pub_test_xxx";
  process.env.WOMPI_PRIVATE_KEY = "prv_test_xxx";
  process.env.WOMPI_INTEGRITY_SECRET = "test_integrity_xxx";
  process.env.WOMPI_CURRENCY = "COP";
  process.env.WOMPI_USD_COP_RATE = "3435";
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
  it("requires only checkout secrets in app routes and leaves event verification to Vault", async () => {
    setWompiEnv({ WOMPI_PRIVATE_KEY: undefined });

    const { requireWompiServerConfig } = await import("./config");

    expect(() => requireWompiServerConfig()).toThrow("Missing WOMPI_PRIVATE_KEY");
  });

  it("does not require the Wompi events secret in Railway app env", async () => {
    setWompiEnv({ WOMPI_EVENTS_SECRET: undefined });

    const { requireWompiServerConfig } = await import("./config");

    expect(requireWompiServerConfig()).toMatchObject({
      env: "sandbox",
      currency: "COP",
    });
  });

  it("loads sandbox checkout config with the required USD/COP rate", async () => {
    setWompiEnv();

    const { requireWompiServerConfig } = await import("./config");

    expect(requireWompiServerConfig()).toMatchObject({
      env: "sandbox",
      currency: "COP",
      publicKey: "pub_test_xxx",
      usdCopRate: 3435,
    });
  });

  it("fails when the USD/COP rate is missing", async () => {
    setWompiEnv({ WOMPI_USD_COP_RATE: undefined });

    const { requireWompiServerConfig } = await import("./config");

    expect(() => requireWompiServerConfig()).toThrow("Missing WOMPI_USD_COP_RATE");
  });

  it("fails when the USD/COP rate is invalid", async () => {
    setWompiEnv({ WOMPI_USD_COP_RATE: "0" });

    const { requireWompiServerConfig } = await import("./config");

    expect(() => requireWompiServerConfig()).toThrow("WOMPI_USD_COP_RATE must be a positive safe integer.");
  });
});
