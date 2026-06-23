import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const {
  getPredictionsViewerContextMock,
  renderPredictionsAccountCalloutMock,
  renderPredictionCardsMock,
  getPublicPredictionsDataMock,
} = vi.hoisted(() => ({
  getPredictionsViewerContextMock: vi.fn(),
  renderPredictionsAccountCalloutMock: vi.fn(),
  renderPredictionCardsMock: vi.fn(),
  getPublicPredictionsDataMock: vi.fn(),
}));

vi.mock("./page-helpers", () => ({
  getPredictionsViewerContext: getPredictionsViewerContextMock,
  renderPredictionsAccountCallout: renderPredictionsAccountCalloutMock,
  renderPredictionCards: renderPredictionCardsMock,
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
  });

  it("renders landing links for upcoming and full history", async () => {
    getPublicPredictionsDataMock.mockResolvedValue({
      status: "ready",
      livePredictions: [],
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

  it("renders the honest empty state when there are no future or historical public predictions", async () => {
    getPublicPredictionsDataMock.mockResolvedValue({
      status: "ready",
      livePredictions: [],
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
      upcomingPredictions: [{ matchSlug: "fixture-upcoming" }],
      historicalPredictions: [],
    });

    const element = await PredictionsPage();
    const html = renderToStaticMarkup(element);

    expect(html).toContain("En vivo y partidos interrumpidos");
    expect(html).toContain(
      "Esta predicción fue publicada antes del inicio del partido y no se actualiza en vivo.",
    );
    expect(html.indexOf("En vivo y partidos interrumpidos")).toBeLessThan(
      html.indexOf("Próximos partidos"),
    );
  });

  it("does not render the live section when there are no live or interrupted fixtures", async () => {
    getPublicPredictionsDataMock.mockResolvedValue({
      status: "ready",
      livePredictions: [],
      upcomingPredictions: [{ matchSlug: "fixture-upcoming" }],
      historicalPredictions: [],
    });

    const element = await PredictionsPage();
    const html = renderToStaticMarkup(element);

    expect(html).not.toContain("En vivo y partidos interrumpidos");
  });
});
