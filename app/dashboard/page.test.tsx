import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const {
  requireUserMock,
  getViewerEntitlementSummaryMock,
  getSavedMatchesForDashboardMock,
  hasCurrentPremiumAccessMock,
} = vi.hoisted(() => ({
  requireUserMock: vi.fn(),
  getViewerEntitlementSummaryMock: vi.fn(),
  getSavedMatchesForDashboardMock: vi.fn(),
  hasCurrentPremiumAccessMock: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  requireUser: requireUserMock,
}));

vi.mock("@/lib/supabase/entitlement-queries", () => ({
  getViewerEntitlementSummary: getViewerEntitlementSummaryMock,
}));

vi.mock("@/lib/supabase/saved-matches-queries", () => ({
  getSavedMatchesForDashboard: getSavedMatchesForDashboardMock,
}));

vi.mock("@/lib/permissions/current-premium-access", () => ({
  hasCurrentPremiumAccess: hasCurrentPremiumAccessMock,
}));

vi.mock("@/components/auth/logout-button", () => ({
  LogoutButton: () => <div>LOGOUT_BUTTON</div>,
}));

import DashboardPage from "./page";

describe("DashboardPage", () => {
  it("does not render a duplicate logout button and keeps premium copy source-neutral", async () => {
    requireUserMock.mockResolvedValue({ email: "premium@example.com" });
    getViewerEntitlementSummaryMock.mockResolvedValue({
      status: "ready",
      role: "premium_user",
      activeSubscriptions: [
        {
          id: "sub-1",
          planName: "Pase Mundial 2026",
          status: "active",
          endsAt: null,
        },
      ],
      entitlements: [],
      matchUnlocks: [],
    });
    getSavedMatchesForDashboardMock.mockResolvedValue({
      status: "ready",
      matches: [],
    });
    hasCurrentPremiumAccessMock.mockReturnValue(true);

    const element = await DashboardPage({
      searchParams: Promise.resolve({}),
    });
    const html = renderToStaticMarkup(element);

    expect(html).not.toContain("LOGOUT_BUTTON");
    expect(html).toContain("Tu acceso premium está activo y fue validado en el servidor.");
    expect(html).not.toContain("Tu pago fue confirmado por Wompi");
    expect(html).not.toContain("Resumen de acceso");
  });

  it("shows a useful upgrade path for free users and hides inactive unlock sections", async () => {
    requireUserMock.mockResolvedValue({ email: "free@example.com" });
    getViewerEntitlementSummaryMock.mockResolvedValue({
      status: "ready",
      role: "free_user",
      activeSubscriptions: [],
      entitlements: [],
      matchUnlocks: [],
    });
    getSavedMatchesForDashboardMock.mockResolvedValue({
      status: "ready",
      matches: [],
    });
    hasCurrentPremiumAccessMock.mockReturnValue(false);

    const html = renderToStaticMarkup(
      await DashboardPage({
        searchParams: Promise.resolve({}),
      }),
    );

    expect(html).toContain("Ver Pase Mundial 2026");
    expect(html).not.toContain("Partidos desbloqueados individualmente");
  });
});
