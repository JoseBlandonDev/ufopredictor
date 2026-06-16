import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const {
  requireAdminMock,
  getRealFixturePublishQueueDataMock,
} = vi.hoisted(() => ({
  requireAdminMock: vi.fn(),
  getRealFixturePublishQueueDataMock: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  requireAdmin: requireAdminMock,
}));

vi.mock("@/lib/supabase/real-fixture-publish-queue-queries", () => ({
  getRealFixturePublishQueueData: getRealFixturePublishQueueDataMock,
}));

vi.mock("../real-fixture-lab/actions", () => ({
  saveRealFixturePredictionAction: vi.fn(),
  publishRealFixturePredictionAction: vi.fn(),
}));

import RealFixturePublishQueuePage from "./page";

function buildRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "match-1",
    externalId: "api-football:fixture:1489384",
    apiFootballFixtureId: "1489384",
    slug: "world-cup-2026-england-vs-croatia-2026-06-17",
    kickoffAt: "2026-06-17T20:00:00Z",
    status: "scheduled",
    accessScope: "admin_only",
    homeTeamName: "England",
    awayTeamName: "Croatia",
    savedPredictionId: null,
    latestPublicPredictionId: null,
    ...overrides,
  };
}

describe("RealFixturePublishQueuePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminMock.mockResolvedValue({ user: { id: "admin-1" } });
  });

  it("renders save, publish, and future ready states from minimal queue data", async () => {
    getRealFixturePublishQueueDataMock.mockResolvedValue({
      activeModelVersionId: "model-1",
      rows: [
        buildRow(),
        buildRow({
          id: "match-2",
          externalId: "api-football:fixture:1489385",
          apiFootballFixtureId: "1489385",
          savedPredictionId: "prediction-2",
        }),
        buildRow({
          id: "match-3",
          externalId: "api-football:fixture:1489386",
          apiFootballFixtureId: "1489386",
          savedPredictionId: "prediction-3",
          latestPublicPredictionId: "public-3",
          accessScope: "public",
        }),
      ],
    });

    const element = await RealFixturePublishQueuePage({
      searchParams: Promise.resolve({}),
    });

    const html = renderToStaticMarkup(element);

    expect(html).toContain("Save prediction");
    expect(html).toContain("Publish basic");
    expect(html).toContain("future ready");
    expect(html).toContain("/admin/real-fixture-publish-queue");
  });

  it("renders queue status messages after save and publish redirects", async () => {
    getRealFixturePublishQueueDataMock.mockResolvedValue({
      activeModelVersionId: "model-1",
      rows: [buildRow()],
    });

    const saveElement = await RealFixturePublishQueuePage({
      searchParams: Promise.resolve({
        externalId: "api-football:fixture:1489384",
        save: "saved",
      }),
    });
    const publishElement = await RealFixturePublishQueuePage({
      searchParams: Promise.resolve({
        externalId: "api-football:fixture:1489384",
        publish: "published",
      }),
    });

    expect(renderToStaticMarkup(saveElement)).toContain("Prediccion interna guardada");
    expect(renderToStaticMarkup(publishElement)).toContain("Prediccion publica publicada");
  });
});
