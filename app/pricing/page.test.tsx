import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const {
  getCurrentUserMock,
  getViewerEntitlementSummaryMock,
  getWompiWorldCupPassPriceMock,
  hasCurrentPremiumAccessMock,
} = vi.hoisted(() => ({
  getCurrentUserMock: vi.fn(),
  getViewerEntitlementSummaryMock: vi.fn(),
  getWompiWorldCupPassPriceMock: vi.fn(),
  hasCurrentPremiumAccessMock: vi.fn(),
}));

vi.mock("@/lib/supabase/entitlement-queries", () => ({
  getViewerEntitlementSummary: getViewerEntitlementSummaryMock,
}));

vi.mock("@/lib/wompi/pricing", () => ({
  getWompiWorldCupPassPrice: getWompiWorldCupPassPriceMock,
}));

vi.mock("@/lib/auth/session", () => ({
  getCurrentUser: getCurrentUserMock,
}));

vi.mock("@/lib/permissions/current-premium-access", () => ({
  hasCurrentPremiumAccess: hasCurrentPremiumAccessMock,
}));

vi.mock("@/components/wompi-checkout-button", () => ({
  WompiCheckoutButton: () => <div>WOMPI_CHECKOUT_BUTTON</div>,
}));

import PricingPage from "./page";

describe("PricingPage", () => {
  it("shows anonymous create-account CTA instead of actionable checkout while preserving price visibility", async () => {
    getCurrentUserMock.mockResolvedValue(null);
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
    expect(html).toContain("Pase Mundial 2026");
    expect(html).toContain("Crear cuenta para comprar");
    expect(html).toContain("Probabilidad de que anoten ambos equipos");
    expect(html).toContain("Proyección del total de goles");
    expect(html).toContain('href="/register?next=/pricing"');
    expect(html).toContain('href="/login?next=/pricing"');
    expect(html).not.toContain("WOMPI_CHECKOUT_BUTTON");
    expect(html).not.toContain("Ambos equipos marcan");
    expect(html).not.toContain("Más/Menos de 2,5");
    expect(html).not.toContain("10 Match Pack");
    expect(html).not.toContain("Single Match Unlock");
  });

  it("keeps the existing actionable Wompi checkout for authenticated non-premium users", async () => {
    getCurrentUserMock.mockResolvedValue({ id: "user-1", email: "free@example.com" });
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

    expect(html).toContain("WOMPI_CHECKOUT_BUTTON");
    expect(html).not.toContain("Inicia sesión para comprar");
  });

  it("retains active-pass state without repurchase controls for premium users", async () => {
    getCurrentUserMock.mockResolvedValue({ id: "user-1", email: "premium@example.com" });
    getViewerEntitlementSummaryMock.mockResolvedValue({ role: "premium_user" });
    hasCurrentPremiumAccessMock.mockReturnValue(true);
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

    expect(html).toContain("Pase Mundial 2026 activo");
    expect(html).not.toContain("WOMPI_CHECKOUT_BUTTON");
    expect(html).not.toContain("Crear cuenta para comprar");
  });

  it("fails safely in the public view when canonical pricing is unavailable", async () => {
    getCurrentUserMock.mockResolvedValue(null);
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

    expect(html).toContain("La compra está temporalmente no disponible. Inténtalo nuevamente más tarde.");
    expect(html).not.toContain("WOMPI_CHECKOUT_BUTTON");
    expect(html).not.toContain("Missing WOMPI_USD_COP_RATE");
  });
});
