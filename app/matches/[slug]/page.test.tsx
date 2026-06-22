import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const {
  getPublicMatchDetailDataMock,
  getSavedMatchStateBySlugMock,
  createSupabaseServerClientMock,
} = vi.hoisted(() => ({
  getPublicMatchDetailDataMock: vi.fn(),
  getSavedMatchStateBySlugMock: vi.fn(),
  createSupabaseServerClientMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(),
}));

vi.mock("@/lib/supabase/public-match-detail-queries", () => ({
  getPublicMatchDetailData: getPublicMatchDetailDataMock,
}));

vi.mock("@/lib/supabase/saved-matches-queries", () => ({
  getSavedMatchStateBySlug: getSavedMatchStateBySlugMock,
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: createSupabaseServerClientMock,
}));

vi.mock("@/components/confidence-badge", () => ({
  ConfidenceBadge: () => <div>CONFIDENCE_BADGE</div>,
}));

vi.mock("@/components/probability-bar", () => ({
  ProbabilityBar: () => <div>PROBABILITY_BAR</div>,
}));

vi.mock("@/components/risk-badge", () => ({
  RiskBadge: () => <div>RISK_BADGE</div>,
}));

vi.mock("./actions", () => ({
  saveMatchAction: vi.fn(),
  removeSavedMatchAction: vi.fn(),
}));

import MatchDetailPage from "./page";

describe("MatchDetailPage", () => {
  beforeEach(() => {
    createSupabaseServerClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
        }),
      },
    });
    getSavedMatchStateBySlugMock.mockResolvedValue({
      status: "ready",
      isAuthenticated: true,
      isSaved: false,
    });
  });

  it("renders three representative scenarios and a plain-Spanish glossary for premium viewers", async () => {
    getPublicMatchDetailDataMock.mockResolvedValue({
      status: "ready",
      match: {
        viewer: "registered_free",
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
        prediction: {
          viewer: "registered_free",
          createdAt: "2026-06-21T12:00:00Z",
          homeWinProb: 54.2,
          drawProb: 23.1,
          awayWinProb: 22.7,
          confidenceScore: 65,
          riskLevel: "medium",
          probableScore: null,
        },
        premiumAccess: { status: "authorized" },
        premiumProjection: {
          status: "authorized",
          payload: {
            markets: [],
            narrative: {
              locale: "es",
              premiumAnalysis: "Alemania mantiene una ligera ventaja base.",
            },
            modelDetail: {
              expectedGoals: { home: 1.76, away: 0.98 },
              topScorelines: [
                { score: "1-0", probability: 16.2 },
                { score: "2-1", probability: 14.4 },
                { score: "2-0", probability: 11.8 },
              ],
              bothTeamsToScore: { yesProbability: 58.4, noProbability: 41.6 },
              totalGoals25: { overProbability: 55.1, underProbability: 44.9 },
              confidence: { score: 65, riskLevel: "medium" },
            },
            confidenceContext: null,
          },
        },
      },
    });

    const element = await MatchDetailPage({
      params: Promise.resolve({ slug: "world-cup-2026-germany-vs-saudi-arabia-2026-06-22" }),
    });
    const html = renderToStaticMarkup(element);

    expect(html).toContain("Escenarios representativos del partido");
    expect(html).toContain("Victoria local ajustada");
    expect(html).toContain("Estos marcadores representan caminos plausibles del partido.");
    expect(html).toContain("Ambos equipos marcan (BTTS)");
    expect(html).toContain("Goles esperados (xG)");
  });

  it("keeps premium detail locked for free viewers without leaking advanced content", async () => {
    createSupabaseServerClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
        }),
      },
    });
    getSavedMatchStateBySlugMock.mockResolvedValue({
      status: "ready",
      isAuthenticated: false,
      isSaved: false,
    });
    getPublicMatchDetailDataMock.mockResolvedValue({
      status: "ready",
      match: {
        viewer: "anonymous",
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
        venueName: null,
        venueCity: null,
        verifiedResult: null,
        prediction: {
          viewer: "anonymous",
          createdAt: "2026-06-21T12:00:00Z",
          homeWinProb: 54.2,
          drawProb: 23.1,
          awayWinProb: 22.7,
        },
        premiumAccess: { status: "locked", reason: "no_entitlement" },
        premiumProjection: {
          status: "locked",
          reason: "no_entitlement",
        },
      },
    });

    const element = await MatchDetailPage({
      params: Promise.resolve({ slug: "world-cup-2026-germany-vs-saudi-arabia-2026-06-22" }),
    });
    const html = renderToStaticMarkup(element);

    expect(html).toContain("Acceso premium bloqueado");
    expect(html).not.toContain("Escenarios representativos del partido");
    expect(html).not.toContain("Goles esperados (xG)");
  });
});
