import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const {
  getPublicPlansCatalogDataMock,
  getViewerEntitlementSummaryMock,
  getWompiWorldCupPassPriceMock,
  hasCurrentPremiumAccessMock,
} = vi.hoisted(() => ({
  getPublicPlansCatalogDataMock: vi.fn(),
  getViewerEntitlementSummaryMock: vi.fn(),
  getWompiWorldCupPassPriceMock: vi.fn(),
  hasCurrentPremiumAccessMock: vi.fn(),
}));

vi.mock("@/lib/supabase/entitlement-queries", () => ({
  getPublicPlansCatalogData: getPublicPlansCatalogDataMock,
  getViewerEntitlementSummary: getViewerEntitlementSummaryMock,
}));

vi.mock("@/lib/wompi/pricing", () => ({
  getWompiWorldCupPassPrice: getWompiWorldCupPassPriceMock,
}));

vi.mock("@/lib/permissions/current-premium-access", () => ({
  hasCurrentPremiumAccess: hasCurrentPremiumAccessMock,
}));

vi.mock("@/components/wompi-checkout-button", () => ({
  WompiCheckoutButton: () => <div>WOMPI_CHECKOUT_BUTTON</div>,
}));

vi.mock("@/components/plan-card", () => ({
  PlanCard: () => <div>PLAN_CARD</div>,
}));

import PricingPage from "./page";

describe("PricingPage", () => {
  it("shows canonical USD pricing and COP checkout clarification", async () => {
    getPublicPlansCatalogDataMock.mockResolvedValue({
      status: "available",
      plans: [],
    });
    getViewerEntitlementSummaryMock.mockResolvedValue({ role: "free_user" });
    hasCurrentPremiumAccessMock.mockReturnValue(false);
    getWompiWorldCupPassPriceMock.mockResolvedValue({
      status: "available",
      amountInCents: 6870000,
      amountCop: 68700,
      currency: "COP",
      displayPrice: "US$20",
      checkoutDisplay: "COP 68.700",
      priceUsdCents: 2000,
      basePriceUsdCents: 2000,
      offerPriceUsdCents: null,
      usdCopRate: 3435,
      convertedAt: "2026-06-19T12:00:00.000Z",
      offerEndsAt: null,
      isOfferActive: false,
      updatedAt: "2026-06-19T12:00:00.000Z",
    });

    const element = await PricingPage();
    const html = renderToStaticMarkup(element);

    expect(html).toContain("US$20");
    expect(html).toContain("Wompi procesará el pago en pesos colombianos. Tu banco puede aplicar su propia conversión.");
    expect(html).toContain("Cobro Wompi: COP 68.700");
    expect(html).toContain("WOMPI_CHECKOUT_BUTTON");
  });

  it("fails safely in the public view when canonical pricing is unavailable", async () => {
    getPublicPlansCatalogDataMock.mockResolvedValue({
      status: "available",
      plans: [],
    });
    getViewerEntitlementSummaryMock.mockResolvedValue({ role: "free_user" });
    hasCurrentPremiumAccessMock.mockReturnValue(false);
    getWompiWorldCupPassPriceMock.mockResolvedValue({
      status: "configuration_error",
      message: "Missing WOMPI_USD_COP_RATE",
      currency: "COP",
      usdCopRate: null,
      basePriceUsdCents: null,
      offerPriceUsdCents: null,
      offerEndsAt: null,
      updatedAt: null,
    });

    const element = await PricingPage();
    const html = renderToStaticMarkup(element);

    expect(html).toContain("Precio temporalmente no disponible");
    expect(html).not.toContain("WOMPI_CHECKOUT_BUTTON");
  });
});
