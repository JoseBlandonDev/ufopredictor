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

vi.mock("./actions", () => ({
  updateWompiWorldCupPassPriceAction: vi.fn(),
}));

import AdminPaymentsPage from "./page";

describe("AdminPaymentsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminMock.mockResolvedValue({ user: { id: "admin-1" } });
    getWompiWorldCupPassPriceMock.mockResolvedValue({
      amountInCents: 4990000,
      amountCop: 49900,
      currency: "COP",
      priceLabel: "Oferta 15 min",
      displayPrice: "Oferta 15 min · aprox. $49.900 COP",
      baseAmountCop: 69900,
      basePriceLabel: "20 USDT",
      offerAmountCop: 49900,
      offerPriceLabel: "Oferta 15 min",
      offerEndsAt: "2026-06-19T01:00:00.000Z",
      isOfferActive: true,
      updatedAt: "2026-06-19T00:45:00.000Z",
    });
  });

  it("requires admin access and renders editable Wompi price controls", async () => {
    const element = await AdminPaymentsPage({
      searchParams: Promise.resolve({}),
    });

    const html = renderToStaticMarkup(element);

    expect(requireAdminMock).toHaveBeenCalledWith("/admin/payments");
    expect(html).toContain("Precio World Cup Pass");
    expect(html).toContain("Oferta 15 min");
    expect(html).toContain("name=\"baseAmountCop\"");
    expect(html).toContain("name=\"offerAmountCop\"");
    expect(html).toContain("name=\"offerMinutes\"");
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
