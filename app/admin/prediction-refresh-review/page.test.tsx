import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const { requireAdminMock, getPredictionRefreshReviewPageDataMock } = vi.hoisted(() => ({
  requireAdminMock: vi.fn(),
  getPredictionRefreshReviewPageDataMock: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  requireAdmin: requireAdminMock,
}));

vi.mock("@/lib/supabase/prediction-refresh-review-queries", () => ({
  getPredictionRefreshReviewPageData: getPredictionRefreshReviewPageDataMock,
}));

vi.mock("./actions", () => ({
  generatePredictionRefreshShadowAction: vi.fn(),
  analyzePredictionRefreshWithAiAction: vi.fn(),
  keepCurrentPredictionRefreshAction: vi.fn(),
  holdPredictionRefreshAction: vi.fn(),
  publishRefreshedPredictionReviewAction: vi.fn(),
  previewReviewedXgAction: vi.fn(),
}));

import PredictionRefreshReviewPage from "./page";

describe("PredictionRefreshReviewPage", () => {
  it("requires admin access and renders the review gate shell in Spanish", async () => {
    requireAdminMock.mockResolvedValue({ user: { id: "admin-1" } });
    getPredictionRefreshReviewPageDataMock.mockResolvedValue({
      aiAvailability: {
        status: "unavailable",
        reason: "No supported AI provider key is configured.",
      },
      cases: [],
      warnings: [],
    });

    const element = await PredictionRefreshReviewPage({
      searchParams: Promise.resolve({}),
    });
    const html = renderToStaticMarkup(element);

    expect(requireAdminMock).toHaveBeenCalledWith("/admin/prediction-refresh-review");
    expect(html).toContain("Revision de refresco de predicciones");
    expect(html).toContain("Provider IA");
  });

  it("shows AI unavailable while keeping deterministic shadow review available", async () => {
    requireAdminMock.mockResolvedValue({ user: { id: "admin-1" } });
    getPredictionRefreshReviewPageDataMock.mockResolvedValue({
      aiAvailability: {
        status: "unavailable",
        reason: "No supported AI provider key is configured.",
      },
      warnings: [],
      cases: [
        {
          matchId: "match-1",
          externalId: "api-football:fixture:1540356",
          slug: "usa-turkiye",
          kickoffAt: "2026-06-19T22:00:00Z",
          providerStatus: "scheduled",
          providerStatusShort: "NS",
          providerStatusLabel: "scheduled",
          providerStatusAvailable: true,
          providerStatusReason: null,
          accessScope: "admin_only",
          competitionName: "World Cup",
          homeTeamNameEn: "USA",
          awayTeamNameEn: "Türkiye",
          homeTeamDisplayNameEs: "Estados Unidos",
          awayTeamDisplayNameEs: "Turquía",
          currentPrediction: null,
          shadowPrediction: null,
          reviewedXgPreview: null,
          coherenceFixture: null,
          refreshAlerts: [],
          coherenceAlerts: [],
          retainedFixtureOverride: false,
          aiAvailability: {
            status: "unavailable",
            reason: "No supported AI provider key is configured.",
          },
          latestAiRecommendation: null,
          auditHistory: [],
        },
      ],
    });

    const element = await PredictionRefreshReviewPage({
      searchParams: Promise.resolve({}),
    });
    const html = renderToStaticMarkup(element);

    expect(html).toContain("IA no disponible");
    expect(html).toContain("Generar predicción sombra");
    expect(html).toContain("disabled");
  });
});
