import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const { requireAdminMock, getWompiWorldCupPassPriceMock } = vi.hoisted(() => ({
  requireAdminMock: vi.fn(),
  getWompiWorldCupPassPriceMock: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  requireAdmin: requireAdminMock,
}));

vi.mock("@/lib/wompi/pricing", () => ({
  getWompiWorldCupPassPrice: getWompiWorldCupPassPriceMock,
}));

vi.mock("@/lib/wompi/usd-pricing", () => ({
  formatUsdCents: (value: number) => `US$${value / 100}`,
  formatUsdInputValue: (value: number | null) => (value ? (value / 100).toFixed(2) : ""),
}));

vi.mock("./actions", () => ({
  updateWompiWorldCupPassPriceAction: vi.fn(),
}));

import AdminPaymentsPage from "./page";

describe("AdminPaymentsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminMock.mockResolvedValue({ user: { id: "admin-1" } });
    getWompiWorldCupPassPriceMock.mockResolvedValue({
      status: "available",
      amountInCents: 5150000,
      amountCop: 51500,
      currency: "COP",
      displayPrice: "US$15.00",
      checkoutDisplay: "COP 51.500",
      priceUsdCents: 1500,
      basePriceUsdCents: 2000,
      offerPriceUsdCents: 1500,
      usdCopRate: 3435,
      convertedAt: "2026-06-19T00:45:00.000Z",
      offerEndsAt: "2026-06-19T01:00:00.000Z",
      isOfferActive: true,
      updatedAt: "2026-06-19T00:45:00.000Z",
    });
  });

  it("requires admin access and renders USD-only Wompi price controls", async () => {
    const element = await AdminPaymentsPage({
      searchParams: Promise.resolve({}),
    });

    const html = renderToStaticMarkup(element);

    expect(requireAdminMock).toHaveBeenCalledWith("/admin/payments");
    expect(html).toContain("Precio World Cup Pass");
    expect(html).toContain("US$15.00");
    expect(html).toContain("name=\"basePriceUsd\"");
    expect(html).toContain("name=\"offerPriceUsd\"");
    expect(html).toContain("name=\"offerMinutes\"");
    expect(html).toContain("COP 51.500");
    expect(html).not.toContain("name=\"basePriceLabel\"");
    expect(html).not.toContain("name=\"offerPriceLabel\"");
    expect(html).not.toContain("name=\"baseAmountCop\"");
    expect(html).not.toContain("name=\"offerAmountCop\"");
    expect(html).toContain("Guardar precio");
  });

  it("shows update status feedback", async () => {
    const element = await AdminPaymentsPage({
      searchParams: Promise.resolve({ status: "updated" }),
    });

    const html = renderToStaticMarkup(element);

    expect(html).toContain("Precio actualizado");
  });
});
