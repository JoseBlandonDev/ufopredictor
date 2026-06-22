import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const {
  getCurrentUserMock,
  getViewerEntitlementSummaryMock,
  hasCurrentPremiumAccessMock,
  getUpcomingPublicPredictionsPageMock,
} = vi.hoisted(() => ({
  getCurrentUserMock: vi.fn(),
  getViewerEntitlementSummaryMock: vi.fn(),
  hasCurrentPremiumAccessMock: vi.fn(),
  getUpcomingPublicPredictionsPageMock: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  getCurrentUser: getCurrentUserMock,
}));

vi.mock("@/lib/supabase/entitlement-queries", () => ({
  getViewerEntitlementSummary: getViewerEntitlementSummaryMock,
}));

vi.mock("@/lib/permissions/current-premium-access", () => ({
  hasCurrentPremiumAccess: hasCurrentPremiumAccessMock,
}));

vi.mock("@/lib/supabase/public-prediction-queries", () => ({
  getUpcomingPublicPredictionsPage: getUpcomingPublicPredictionsPageMock,
}));

vi.mock("../components/public-prediction-card", () => ({
  PublicPredictionCard: ({ prediction }: { prediction: { matchSlug: string } }) => (
    <div>{prediction.matchSlug}</div>
  ),
}));

import HomePage from "./page";

describe("HomePage", () => {
  it("uses the nearest upcoming fixture and avoids the old hardcoded opener", async () => {
    getCurrentUserMock.mockResolvedValue(null);
    getViewerEntitlementSummaryMock.mockResolvedValue(null);
    hasCurrentPremiumAccessMock.mockReturnValue(false);
    getUpcomingPublicPredictionsPageMock.mockResolvedValue({
      status: "ready",
      predictions: [
        {
          viewer: "anonymous",
          predictionCreatedAt: "2026-06-21T12:00:00Z",
          matchSlug: "world-cup-2026-germany-vs-saudi-arabia-2026-06-22",
          kickoffAt: "2026-06-22T21:00:00Z",
          stage: "Group A",
          status: "scheduled",
          competitionName: "World Cup 2026",
          competitionSlug: "world-cup-2026",
          homeTeamName: "Germany",
          homeTeamSlug: "germany",
          homeTeamLogoUrl: null,
          homeTeamFlagUrl: null,
          awayTeamName: "Saudi Arabia",
          awayTeamSlug: "saudi-arabia",
          awayTeamLogoUrl: null,
          awayTeamFlagUrl: null,
          venueName: "Estadio Azteca",
          venueCity: "Ciudad de México",
          verifiedResult: null,
          homeWinProb: 54,
          drawProb: 24,
          awayWinProb: 22,
        },
      ],
    });

    const element = await HomePage();
    const html = renderToStaticMarkup(element);

    expect(html).toContain("Alemania");
    expect(html).toContain("Arabia Saudita");
    expect(html).toContain("Próximo partido destacado");
    expect(html).not.toContain("Mexico vs South Africa");
    expect(html).not.toContain("/matches/world-cup-2026-mexico-vs-south-africa-2026-06-11");
  });

  it("shows an honest empty state when there is no upcoming published fixture", async () => {
    getCurrentUserMock.mockResolvedValue(null);
    getViewerEntitlementSummaryMock.mockResolvedValue(null);
    hasCurrentPremiumAccessMock.mockReturnValue(false);
    getUpcomingPublicPredictionsPageMock.mockResolvedValue({
      status: "ready",
      predictions: [],
    });

    const element = await HomePage();
    const html = renderToStaticMarkup(element);

    expect(html).toContain("Aún no hay un partido destacado para mostrar");
    expect(html).toContain("En cuanto haya un próximo partido publicado");
  });
});
