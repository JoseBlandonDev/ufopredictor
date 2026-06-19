import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const {
  getPredictionsViewerContextMock,
  renderPredictionsAccountCalloutMock,
  renderPredictionCardsMock,
  renderPredictionPaginationMock,
  getHistoricalPublicPredictionsPageMock,
  parsePredictionPageMock,
} = vi.hoisted(() => ({
  getPredictionsViewerContextMock: vi.fn(),
  renderPredictionsAccountCalloutMock: vi.fn(),
  renderPredictionCardsMock: vi.fn(),
  renderPredictionPaginationMock: vi.fn(),
  getHistoricalPublicPredictionsPageMock: vi.fn(),
  parsePredictionPageMock: vi.fn(),
}));

vi.mock("../page-helpers", () => ({
  getPredictionsViewerContext: getPredictionsViewerContextMock,
  renderPredictionsAccountCallout: renderPredictionsAccountCalloutMock,
  renderPredictionCards: renderPredictionCardsMock,
  renderPredictionPagination: renderPredictionPaginationMock,
}));

vi.mock("@/lib/supabase/public-prediction-queries", () => ({
  getHistoricalPublicPredictionsPage: getHistoricalPublicPredictionsPageMock,
  parsePredictionPage: parsePredictionPageMock,
}));

import PredictionHistoryPage from "./page";

describe("PredictionHistoryPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    parsePredictionPageMock.mockReturnValue(1);
    getPredictionsViewerContextMock.mockResolvedValue({
      viewer: "registered_free",
      isAuthenticated: true,
      premiumAccessActive: true,
    });
    renderPredictionsAccountCalloutMock.mockReturnValue(<div>cta</div>);
    renderPredictionCardsMock.mockReturnValue(<div>cards</div>);
    renderPredictionPaginationMock.mockReturnValue(<div>pagination</div>);
  });

  it("renders verified history pagination safely", async () => {
    getHistoricalPublicPredictionsPageMock.mockResolvedValue({
      status: "ready",
      predictions: [{ matchSlug: "fixture-a" }],
      page: 2,
      pageSize: 12,
      hasPreviousPage: true,
      hasNextPage: false,
    });

    const element = await PredictionHistoryPage({
      searchParams: Promise.resolve({ page: "-1" }),
    });
    const html = renderToStaticMarkup(element);

    expect(parsePredictionPageMock).toHaveBeenCalledWith("-1");
    expect(getHistoricalPublicPredictionsPageMock).toHaveBeenCalledWith("registered_free", 1);
    expect(html).toContain("Historial publico verificado");
    expect(html).toContain("Volver a predicciones");
    expect(html).toContain("pagination");
  });
});
