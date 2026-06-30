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
    requireWompiUsdCopRateMock.mockReturnValue(3500);
  });

  it("returns canonical USD display plus exact COP checkout display", async () => {
    createSupabaseServerClientMock.mockResolvedValue({
      rpc: vi.fn().mockResolvedValue({
        data: [{
          amount_in_cents: 3500000,
          amount_cop: 35000,
          currency: "COP",
          price_usd_cents: 1000,
          base_price_usd_cents: 1000,
          offer_price_usd_cents: null,
          offer_ends_at: null,
          is_offer_active: false,
          updated_at: "2026-06-19T12:00:00.000Z",
          usd_cop_rate: 3500,
          converted_at: "2026-06-19T12:00:00.000Z",
        }],
        error: null,
      }),
    });

    const { getWompiWorldCupPassPrice } = await import("./pricing");
    const price = await getWompiWorldCupPassPrice();

    expect(price).toMatchObject({
      status: "available",
      displayPrice: "US$10",
      checkoutDisplay: "COP 35.000",
      amountInCents: 3500000,
      amountCop: 35000,
      currency: "COP",
    });
  });

  it("keeps offer pricing in canonical USD while preserving exact COP checkout amount", async () => {
    createSupabaseServerClientMock.mockResolvedValue({
      rpc: vi.fn().mockResolvedValue({
        data: [{
          amount_in_cents: 2800000,
          amount_cop: 28000,
          currency: "COP",
          price_usd_cents: 800,
          base_price_usd_cents: 1000,
          offer_price_usd_cents: 800,
          offer_ends_at: "2026-06-20T01:00:00.000Z",
          is_offer_active: true,
          updated_at: "2026-06-19T12:00:00.000Z",
          usd_cop_rate: 3500,
          converted_at: "2026-06-19T12:00:00.000Z",
        }],
        error: null,
      }),
    });

    const { getWompiWorldCupPassPrice } = await import("./pricing");
    const price = await getWompiWorldCupPassPrice();

    expect(price).toMatchObject({
      status: "available",
      displayPrice: "US$8",
      checkoutDisplay: "COP 28.000",
      offerPriceUsdCents: 800,
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
