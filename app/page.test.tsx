import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const {
  getCurrentUserMock,
  getViewerEntitlementSummaryMock,
  hasCurrentPremiumAccessMock,
  getPublicPredictionsDataMock,
} = vi.hoisted(() => ({
  getCurrentUserMock: vi.fn(),
  getViewerEntitlementSummaryMock: vi.fn(),
  hasCurrentPremiumAccessMock: vi.fn(),
  getPublicPredictionsDataMock: vi.fn(),
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
  getPublicPredictionsData: getPublicPredictionsDataMock,
}));

vi.mock("../components/public-prediction-card", () => ({
  PublicPredictionCard: ({
    prediction,
    showLiveState,
    showPreMatchDisclaimer,
  }: {
    prediction: { matchSlug: string; liveStateLabel?: string | null };
    showLiveState?: boolean;
    showPreMatchDisclaimer?: boolean;
  }) => (
    <div>
      {prediction.matchSlug}
      {showLiveState ? `:${prediction.liveStateLabel}` : ""}
      {showPreMatchDisclaimer
        ? ":Esta predicción fue publicada antes del inicio del partido y no se actualiza en vivo."
        : ""}
    </div>
  ),
}));

import HomePage from "./page";

describe("HomePage", () => {
  it("shows anonymous registration CTA and a meaningful upcoming preview", async () => {
    getCurrentUserMock.mockResolvedValue(null);
    getViewerEntitlementSummaryMock.mockResolvedValue(null);
    hasCurrentPremiumAccessMock.mockReturnValue(false);
    getPublicPredictionsDataMock.mockResolvedValue({
      status: "ready",
      livePredictions: [],
      awaitingUpdatePredictions: [],
      upcomingPredictions: [
        {
          viewer: "anonymous",
          predictionCreatedAt: "2026-06-21T12:00:00Z",
          matchSlug: "world-cup-2026-germany-vs-saudi-arabia-2026-06-22",
          kickoffAt: "2026-06-22T21:00:00Z",
          stage: "Group A",
          status: "scheduled",
          collectionMode: "upcoming",
          liveStateLabel: null,
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
      historicalPredictions: [],
    });

    const element = await HomePage();
    const html = renderToStaticMarkup(element);

    expect(html).toContain("Alemania");
    expect(html).toContain("Arabia Saudita");
    expect(html).toContain("Próximo partido destacado");
    expect(html).toContain("Crear cuenta gratis");
    expect(html).toContain("Ver Pase Mundial 2026");
  });

  it("shows an honest empty state when there is no upcoming published fixture", async () => {
    getCurrentUserMock.mockResolvedValue(null);
    getViewerEntitlementSummaryMock.mockResolvedValue(null);
    hasCurrentPremiumAccessMock.mockReturnValue(false);
    getPublicPredictionsDataMock.mockResolvedValue({
      status: "ready",
      livePredictions: [],
      awaitingUpdatePredictions: [],
      upcomingPredictions: [],
      historicalPredictions: [],
    });

    const element = await HomePage();
    const html = renderToStaticMarkup(element);

    expect(html).toContain("Aún no hay un partido destacado para mostrar");
    expect(html).toContain("En cuanto haya un próximo partido publicado");
  });

  it("prioritizes a live published fixture over the nearest future fixture", async () => {
    getCurrentUserMock.mockResolvedValue(null);
    getViewerEntitlementSummaryMock.mockResolvedValue(null);
    hasCurrentPremiumAccessMock.mockReturnValue(false);
    getPublicPredictionsDataMock.mockResolvedValue({
      status: "ready",
      livePredictions: [
        {
          viewer: "anonymous",
          predictionCreatedAt: "2026-06-22T10:00:00Z",
          matchSlug: "world-cup-2026-france-vs-iraq-2026-06-22",
          kickoffAt: "2026-06-22T16:00:00Z",
          stage: "Group A",
          status: "live",
          collectionMode: "in_progress",
          liveStateLabel: "En vivo",
          competitionName: "World Cup 2026",
          competitionSlug: "world-cup-2026",
          homeTeamName: "France",
          homeTeamSlug: "france",
          homeTeamLogoUrl: null,
          homeTeamFlagUrl: null,
          awayTeamName: "Iraq",
          awayTeamSlug: "iraq",
          awayTeamLogoUrl: null,
          awayTeamFlagUrl: null,
          venueName: "Stadium",
          venueCity: "City",
          verifiedResult: null,
          homeWinProb: 60,
          drawProb: 22,
          awayWinProb: 18,
        },
      ],
      awaitingUpdatePredictions: [],
      upcomingPredictions: [
        {
          viewer: "anonymous",
          predictionCreatedAt: "2026-06-22T12:00:00Z",
          matchSlug: "world-cup-2026-germany-vs-saudi-arabia-2026-06-23",
          kickoffAt: "2026-06-23T21:00:00Z",
          stage: "Group A",
          status: "scheduled",
          collectionMode: "upcoming",
          liveStateLabel: null,
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
      historicalPredictions: [],
    });

    const element = await HomePage();
    const html = renderToStaticMarkup(element);

    expect(html).toContain("Partido en curso destacado");
    expect(html).toContain("Francia");
    expect(html).toContain("Irak");
    expect(html).toContain("En vivo");
    expect(html).toContain("Esta predicción fue publicada antes del inicio del partido y no se actualiza en vivo.");
    expect(html).not.toContain("Próximo partido destacado");
  });

  it("avoids purchase prompts for active premium users", async () => {
    getCurrentUserMock.mockResolvedValue({ id: "user-1" });
    getViewerEntitlementSummaryMock.mockResolvedValue({ role: "premium_user" });
    hasCurrentPremiumAccessMock.mockReturnValue(true);
    getPublicPredictionsDataMock.mockResolvedValue({
      status: "ready",
      livePredictions: [],
      awaitingUpdatePredictions: [],
      upcomingPredictions: [],
      historicalPredictions: [],
    });

    const element = await HomePage();
    const html = renderToStaticMarkup(element);

    expect(html).toContain("Ver análisis premium");
    expect(html).toContain("Abrir panel");
    expect(html).not.toContain("Desbloquear análisis premium");
    expect(html).not.toContain("Crear cuenta gratis");
  });

  it("ignores awaiting-update fixtures as live featured matches and falls back to the nearest future fixture", async () => {
    getCurrentUserMock.mockResolvedValue(null);
    getViewerEntitlementSummaryMock.mockResolvedValue(null);
    hasCurrentPremiumAccessMock.mockReturnValue(false);
    getPublicPredictionsDataMock.mockResolvedValue({
      status: "ready",
      livePredictions: [],
      awaitingUpdatePredictions: [
        {
          viewer: "anonymous",
          predictionCreatedAt: "2026-06-22T06:00:00Z",
          matchSlug: "world-cup-2026-norway-vs-senegal-2026-06-22",
          kickoffAt: "2026-06-22T08:00:00Z",
          stage: "Group A",
          status: "live",
          collectionMode: "awaiting_result_update",
          liveStateLabel: "Esperando resultado oficial",
          competitionName: "World Cup 2026",
          competitionSlug: "world-cup-2026",
          homeTeamName: "Norway",
          homeTeamSlug: "norway",
          homeTeamLogoUrl: null,
          homeTeamFlagUrl: null,
          awayTeamName: "Senegal",
          awayTeamSlug: "senegal",
          awayTeamLogoUrl: null,
          awayTeamFlagUrl: null,
          venueName: "Stadium",
          venueCity: "City",
          verifiedResult: null,
          homeWinProb: 40,
          drawProb: 30,
          awayWinProb: 30,
        },
      ],
      upcomingPredictions: [
        {
          viewer: "anonymous",
          predictionCreatedAt: "2026-06-22T12:00:00Z",
          matchSlug: "world-cup-2026-germany-vs-saudi-arabia-2026-06-23",
          kickoffAt: "2026-06-23T21:00:00Z",
          stage: "Group A",
          status: "scheduled",
          collectionMode: "upcoming",
          liveStateLabel: null,
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
      historicalPredictions: [],
    });

    const html = renderToStaticMarkup(await HomePage());

    expect(html).toContain("Próximo partido destacado");
    expect(html).not.toContain("Partido en curso destacado");
    expect(html).toContain("Pendientes de actualización");
    expect(html).toContain("Esperando resultado oficial");
  });
});
