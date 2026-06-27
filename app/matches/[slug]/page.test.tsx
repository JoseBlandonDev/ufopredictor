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

function buildMatch(overrides?: Record<string, unknown>) {
  return {
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
    premiumAccess: { status: "authorized", mode: "premium_entitlement" },
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
    ...overrides,
  };
}

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

  it("renders exact scenario highlighting for verified historical premium detail", async () => {
    getPublicMatchDetailDataMock.mockResolvedValue({
      status: "ready",
      match: buildMatch({
        status: "finished",
        verifiedResult: {
          homeGoals: 1,
          awayGoals: 0,
          verificationStatus: "verified",
        },
      }),
    });

    const html = renderToStaticMarkup(
      await MatchDetailPage({
        params: Promise.resolve({ slug: "world-cup-2026-germany-vs-saudi-arabia-2026-06-22" }),
      }),
    );

    expect(html).toContain("Escenario cumplido");
    expect(html).toContain("Este escenario coincidió exactamente con el resultado final verificado.");
    expect(html).toContain("Lectura UFO");
    expect(html).toContain("Probabilidad del resultado");
  });

  it("shows the neutral no-match disclosure when the exact score does not match", async () => {
    getPublicMatchDetailDataMock.mockResolvedValue({
      status: "ready",
      match: buildMatch({
        status: "finished",
        verifiedResult: {
          homeGoals: 3,
          awayGoals: 1,
          verificationStatus: "verified",
        },
      }),
    });

    const html = renderToStaticMarkup(
      await MatchDetailPage({
        params: Promise.resolve({ slug: "world-cup-2026-germany-vs-saudi-arabia-2026-06-22" }),
      }),
    );

    expect(html).toContain(
      "Ninguno de los tres escenarios representativos coincidió exactamente con el marcador final.",
    );
    expect(html).not.toContain("Escenario cumplido");
  });

  it("keeps premium detail locked for anonymous future viewers without leaking advanced content", async () => {
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
      match: buildMatch({
        viewer: "anonymous",
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
      }),
    });

    const html = renderToStaticMarkup(
      await MatchDetailPage({
        params: Promise.resolve({ slug: "world-cup-2026-germany-vs-saudi-arabia-2026-06-22" }),
      }),
    );

    expect(html).toContain("Continúa con una cuenta gratis");
    expect(html).toContain("Crear cuenta gratis");
    expect(html).toContain("Lectura UFO");
    expect(html).toContain("El modelo le da a Alemania la probabilidad más alta en su lectura del partido.");
    expect(html).toContain("Probabilidad de que anoten ambos equipos");
    expect(html).toContain("Proyección del total de goles");
    expect(html).not.toContain("Goles esperados (xG)");
    expect(html).not.toContain("Escenarios representativos del partido");
    expect(html).not.toContain("Dentro del modelo, esta lectura");
    expect(html).not.toContain("Ambos equipos marcan");
    expect(html).not.toContain("Más/Menos de 2,5");
  });

  it("shows historical premium preview for eligible registered free users without hiding the upgrade path", async () => {
    getPublicMatchDetailDataMock.mockResolvedValue({
      status: "ready",
      match: buildMatch({
        status: "finished",
        verifiedResult: {
          homeGoals: 1,
          awayGoals: 0,
          verificationStatus: "verified",
        },
        premiumAccess: { status: "authorized", mode: "historical_preview" },
      }),
    });

    const html = renderToStaticMarkup(
      await MatchDetailPage({
        params: Promise.resolve({ slug: "world-cup-2026-germany-vs-saudi-arabia-2026-06-22" }),
      }),
    );

    expect(html).toContain("Análisis premium publicado antes del partido");
    expect(html).toContain("Este análisis fue publicado antes del partido.");
    expect(html).toContain("Consulta este nivel de análisis antes del próximo partido");
    expect(html).toContain("Goles esperados (xG)");
    expect(html).toContain("¿Anotan ambos equipos?");
    expect(html).toContain("Probabilidad de que cada equipo marque al menos un gol.");
    expect(html).toContain("Total de goles del partido");
    expect(html).toContain("3 o más goles");
    expect(html).toContain("2 o menos goles");
    expect(html).toContain("Dentro del modelo, esta lectura todavía deja espacio para varios desenlaces.");
    expect(html).not.toContain("Ambos equipos marcan (BTTS)");
    expect(html).not.toContain("Más / Menos de 2,5 goles");
  });

  it("does not unlock historical premium content for unverified results", async () => {
    getPublicMatchDetailDataMock.mockResolvedValue({
      status: "ready",
      match: buildMatch({
        status: "finished",
        verifiedResult: null,
        premiumAccess: { status: "locked", reason: "no_entitlement" },
        premiumProjection: { status: "locked", reason: "no_entitlement" },
      }),
    });

    const html = renderToStaticMarkup(
      await MatchDetailPage({
        params: Promise.resolve({ slug: "world-cup-2026-germany-vs-saudi-arabia-2026-06-22" }),
      }),
    );

    expect(html).toContain("Desbloquea el análisis completo del partido");
    expect(html).not.toContain("Análisis premium publicado antes del partido");
  });

  it("uses lista wording for saved-match public copy", async () => {
    getSavedMatchStateBySlugMock.mockResolvedValue({
      status: "ready",
      isAuthenticated: true,
      isSaved: false,
    });
    getPublicMatchDetailDataMock.mockResolvedValue({
      status: "ready",
      match: buildMatch(),
    });

    const html = renderToStaticMarkup(
      await MatchDetailPage({
        params: Promise.resolve({ slug: "world-cup-2026-germany-vs-saudi-arabia-2026-06-22" }),
      }),
    );

    expect(html).toContain("Guardar partido en tu lista");
    expect(html).toContain("Guarda este partido en tu lista para seguirlo más tarde desde tu cuenta.");
    expect(html).not.toContain("watchlist");
  });

  it("keeps the public expert read separate from premium narrative content for free users", async () => {
    getPublicMatchDetailDataMock.mockResolvedValue({
      status: "ready",
      match: buildMatch({
        premiumAccess: { status: "locked", reason: "no_entitlement" },
        premiumProjection: { status: "locked", reason: "no_entitlement" },
      }),
    });

    const html = renderToStaticMarkup(
      await MatchDetailPage({
        params: Promise.resolve({ slug: "world-cup-2026-germany-vs-saudi-arabia-2026-06-22" }),
      }),
    );

    expect(html).toContain("Lectura UFO");
    expect(html).toContain("El modelo le da a Alemania la probabilidad más alta en su lectura del partido.");
    expect(html).toContain("Dentro del modelo, esta lectura todavía deja espacio para varios desenlaces.");
    expect(html).toContain("Las probabilidades reflejan una lectura del modelo, no una promesa de resultado.");
    expect(html).not.toContain(
      "Alta incertidumbre: probabilidades cercanas. Una ventaja ligera no implica certeza.",
    );
    expect(html).not.toContain("Alemania mantiene una ligera ventaja base.");
    expect(html).not.toContain("Goles esperados (xG)");
  });
});
