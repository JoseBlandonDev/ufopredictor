import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { createSupabaseServerClientMock, requireWompiUsdCopRateMock } = vi.hoisted(() => ({
  createSupabaseServerClientMock: vi.fn(),
  requireWompiUsdCopRateMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: createSupabaseServerClientMock,
}));

vi.mock("./config", () => ({
  requireWompiUsdCopRate: requireWompiUsdCopRateMock,
}));

describe("getWompiWorldCupPassPrice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireWompiUsdCopRateMock.mockReturnValue(3435);
  });

  it("returns canonical USD display plus exact COP checkout display", async () => {
    createSupabaseServerClientMock.mockResolvedValue({
      rpc: vi.fn().mockResolvedValue({
        data: [{
          amount_in_cents: 6870000,
          amount_cop: 68700,
          currency: "COP",
          price_usd_cents: 2000,
          base_price_usd_cents: 2000,
          offer_price_usd_cents: null,
          offer_ends_at: null,
          is_offer_active: false,
          updated_at: "2026-06-19T12:00:00.000Z",
          usd_cop_rate: 3435,
          converted_at: "2026-06-19T12:00:00.000Z",
        }],
        error: null,
      }),
    });

    const { getWompiWorldCupPassPrice } = await import("./pricing");
    const price = await getWompiWorldCupPassPrice();

    expect(price).toMatchObject({
      status: "available",
      displayPrice: "US$20",
      checkoutDisplay: "COP 68.700",
      amountInCents: 6870000,
      amountCop: 68700,
      currency: "COP",
    });
  });

  it("keeps offer pricing in canonical USD while preserving exact COP checkout amount", async () => {
    createSupabaseServerClientMock.mockResolvedValue({
      rpc: vi.fn().mockResolvedValue({
        data: [{
          amount_in_cents: 5150000,
          amount_cop: 51500,
          currency: "COP",
          price_usd_cents: 1500,
          base_price_usd_cents: 2000,
          offer_price_usd_cents: 1500,
          offer_ends_at: "2026-06-20T01:00:00.000Z",
          is_offer_active: true,
          updated_at: "2026-06-19T12:00:00.000Z",
          usd_cop_rate: 3435,
          converted_at: "2026-06-19T12:00:00.000Z",
        }],
        error: null,
      }),
    });

    const { getWompiWorldCupPassPrice } = await import("./pricing");
    const price = await getWompiWorldCupPassPrice();

    expect(price).toMatchObject({
      status: "available",
      displayPrice: "US$15",
      checkoutDisplay: "COP 51.500",
      offerPriceUsdCents: 1500,
      isOfferActive: true,
    });
  });

  it("fails safely when the USD/COP configuration is missing", async () => {
    requireWompiUsdCopRateMock.mockImplementation(() => {
      throw new Error("Missing WOMPI_USD_COP_RATE");
    });

    const { getWompiWorldCupPassPrice } = await import("./pricing");
    const price = await getWompiWorldCupPassPrice();

    expect(price).toMatchObject({
      status: "configuration_error",
      message: "Missing WOMPI_USD_COP_RATE",
    });
  });
});
