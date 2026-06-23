import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const {
  getPredictionsViewerContextMock,
  renderPredictionsAccountCalloutMock,
  renderPredictionCardsMock,
  renderPredictionPaginationMock,
  getUpcomingPublicPredictionsPageMock,
  parsePredictionPageMock,
} = vi.hoisted(() => ({
  getPredictionsViewerContextMock: vi.fn(),
  renderPredictionsAccountCalloutMock: vi.fn(),
  renderPredictionCardsMock: vi.fn(),
  renderPredictionPaginationMock: vi.fn(),
  getUpcomingPublicPredictionsPageMock: vi.fn(),
  parsePredictionPageMock: vi.fn(),
}));

vi.mock("../page-helpers", () => ({
  getPredictionsViewerContext: getPredictionsViewerContextMock,
  renderPredictionsAccountCallout: renderPredictionsAccountCalloutMock,
  renderPredictionCards: renderPredictionCardsMock,
  renderPredictionPagination: renderPredictionPaginationMock,
}));

vi.mock("@/lib/supabase/public-prediction-queries", () => ({
  getUpcomingPublicPredictionsPage: getUpcomingPublicPredictionsPageMock,
  parsePredictionPage: parsePredictionPageMock,
}));

import UpcomingPredictionsPage from "./page";

describe("UpcomingPredictionsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    parsePredictionPageMock.mockReturnValue(1);
    getPredictionsViewerContextMock.mockResolvedValue({
      viewer: "anonymous",
      isAuthenticated: false,
      premiumAccessActive: false,
    });
    renderPredictionsAccountCalloutMock.mockReturnValue(<div>cta</div>);
    renderPredictionCardsMock.mockReturnValue(<div>cards</div>);
    renderPredictionPaginationMock.mockReturnValue(<div>pagination</div>);
  });

  it("sanitizes page values and renders pagination controls", async () => {
    getUpcomingPublicPredictionsPageMock.mockResolvedValue({
      status: "ready",
      predictions: [{ matchSlug: "fixture-a" }],
      page: 1,
      pageSize: 12,
      hasPreviousPage: false,
      hasNextPage: true,
    });

    const element = await UpcomingPredictionsPage({
      searchParams: Promise.resolve({ page: "invalid" }),
    });
    const html = renderToStaticMarkup(element);

    expect(parsePredictionPageMock).toHaveBeenCalledWith("invalid");
    expect(getUpcomingPublicPredictionsPageMock).toHaveBeenCalledWith("anonymous", 1);
    expect(html).toContain("Todos los próximos partidos publicados");
    expect(html).toContain("Volver a predicciones");
    expect(html).toContain("pagination");
  });
});
