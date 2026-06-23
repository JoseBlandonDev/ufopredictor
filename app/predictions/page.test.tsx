import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const {
  getPredictionsViewerContextMock,
  renderPredictionsAccountCalloutMock,
  renderPredictionCardsMock,
  renderAnonymousRegistrationModuleMock,
  renderPremiumUpgradeModuleMock,
  getPublicPredictionsDataMock,
} = vi.hoisted(() => ({
  getPredictionsViewerContextMock: vi.fn(),
  renderPredictionsAccountCalloutMock: vi.fn(),
  renderPredictionCardsMock: vi.fn(),
  renderAnonymousRegistrationModuleMock: vi.fn(),
  renderPremiumUpgradeModuleMock: vi.fn(),
  getPublicPredictionsDataMock: vi.fn(),
}));

vi.mock("./page-helpers", () => ({
  getPredictionsViewerContext: getPredictionsViewerContextMock,
  renderPredictionsAccountCallout: renderPredictionsAccountCalloutMock,
  renderPredictionCards: renderPredictionCardsMock,
  renderAnonymousRegistrationModule: renderAnonymousRegistrationModuleMock,
  renderPremiumUpgradeModule: renderPremiumUpgradeModuleMock,
}));

vi.mock("@/lib/supabase/public-prediction-queries", () => ({
  getPublicPredictionsData: getPublicPredictionsDataMock,
}));

import PredictionsPage from "./page";

describe("PredictionsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getPredictionsViewerContextMock.mockResolvedValue({
      viewer: "registered_free",
      isAuthenticated: true,
      premiumAccessActive: false,
    });
    renderPredictionsAccountCalloutMock.mockReturnValue(<div>cta</div>);
    renderPredictionCardsMock.mockImplementation(({ predictions }) => <div>{predictions.length} cards</div>);
    renderAnonymousRegistrationModuleMock.mockReturnValue(<div>anonymous-cta</div>);
    renderPremiumUpgradeModuleMock.mockReturnValue(<div>upgrade-cta</div>);
  });

  it("renders landing links for upcoming and full history", async () => {
    getPublicPredictionsDataMock.mockResolvedValue({
      status: "ready",
      livePredictions: [],
      awaitingUpdatePredictions: [],
      upcomingPredictions: [{ matchSlug: "fixture-a" }],
      historicalPredictions: [{ matchSlug: "fixture-b" }],
    });

    const element = await PredictionsPage();
    const html = renderToStaticMarkup(element);

    expect(html).toContain("Ver todos los próximos");
    expect(html).toContain("href=\"/predictions/upcoming\"");
    expect(html).toContain("Ir al historial");
    expect(html).toContain("href=\"/predictions/history\"");
  });

  it("renders the anonymous registration module and bounded preview flow", async () => {
    getPredictionsViewerContextMock.mockResolvedValue({
      viewer: "anonymous",
      isAuthenticated: false,
      premiumAccessActive: false,
    });
    getPublicPredictionsDataMock.mockResolvedValue({
      status: "ready",
      livePredictions: [],
      awaitingUpdatePredictions: [],
      upcomingPredictions: [{ matchSlug: "fixture-a" }, { matchSlug: "fixture-b" }],
      historicalPredictions: [],
    });

    const element = await PredictionsPage();
    const html = renderToStaticMarkup(element);

    expect(html).toContain("anonymous-cta");
    expect(renderPredictionCardsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        viewer: "anonymous",
        boundedAnonymousAfter: 2,
      }),
    );
  });

  it("renders the honest empty state when there are no future or historical public predictions", async () => {
    getPublicPredictionsDataMock.mockResolvedValue({
      status: "ready",
      livePredictions: [],
      awaitingUpdatePredictions: [],
      upcomingPredictions: [],
      historicalPredictions: [],
    });

    const element = await PredictionsPage();
    const html = renderToStaticMarkup(element);

    expect(html).toContain("Aún no hay predicciones públicas");
    expect(html).toContain("aparecerán aquí cuando haya partidos programados");
  });

  it("renders the live and interrupted section above upcoming with the pre-match disclaimer", async () => {
    getPublicPredictionsDataMock.mockResolvedValue({
      status: "ready",
      livePredictions: [{ matchSlug: "fixture-live" }],
      awaitingUpdatePredictions: [],
      upcomingPredictions: [{ matchSlug: "fixture-upcoming" }],
      historicalPredictions: [],
    });

    const element = await PredictionsPage();
    const html = renderToStaticMarkup(element);

    expect(html).toContain("Partidos en curso");
    expect(html).toContain(
      "Estos partidos ya comenzaron. Las probabilidades mostradas fueron publicadas antes del inicio y no se actualizan en tiempo real.",
    );
    expect(html.indexOf("Partidos en curso")).toBeLessThan(
      html.indexOf("Próximos partidos"),
    );
  });

  it("does not render the live section when there are no live or interrupted fixtures", async () => {
    getPublicPredictionsDataMock.mockResolvedValue({
      status: "ready",
      livePredictions: [],
      awaitingUpdatePredictions: [],
      upcomingPredictions: [{ matchSlug: "fixture-upcoming" }],
      historicalPredictions: [],
    });

    const element = await PredictionsPage();
    const html = renderToStaticMarkup(element);

    expect(html).not.toContain("Partidos en curso");
  });

  it("renders one restrained premium conversion module for free users and none for premium users", async () => {
    getPredictionsViewerContextMock.mockResolvedValue({
      viewer: "registered_free",
      isAuthenticated: true,
      premiumAccessActive: false,
    });
    getPublicPredictionsDataMock.mockResolvedValue({
      status: "ready",
      livePredictions: [],
      awaitingUpdatePredictions: [],
      upcomingPredictions: [{ matchSlug: "fixture-a" }],
      historicalPredictions: [{ matchSlug: "fixture-b" }],
    });

    const freeHtml = renderToStaticMarkup(await PredictionsPage());
    expect(freeHtml).toContain("upgrade-cta");
    expect(renderPremiumUpgradeModuleMock).toHaveBeenCalledTimes(1);

    getPredictionsViewerContextMock.mockResolvedValue({
      viewer: "registered_free",
      isAuthenticated: true,
      premiumAccessActive: true,
    });

    const premiumHtml = renderToStaticMarkup(await PredictionsPage());
    expect(premiumHtml).not.toContain("upgrade-cta");
  });

  it("renders awaiting-update only when needed and avoids empty headings", async () => {
    getPublicPredictionsDataMock.mockResolvedValue({
      status: "ready",
      livePredictions: [],
      awaitingUpdatePredictions: [{ matchSlug: "fixture-awaiting" }],
      upcomingPredictions: [],
      historicalPredictions: [],
    });

    const html = renderToStaticMarkup(await PredictionsPage());

    expect(html).toContain("Pendientes de actualización");
    expect(html).not.toContain("Partidos en curso");
  });
});
