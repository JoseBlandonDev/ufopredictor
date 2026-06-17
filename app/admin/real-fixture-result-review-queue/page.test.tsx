import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const {
  requireAdminMock,
  getRealFixtureResultReviewQueueDataMock,
} = vi.hoisted(() => ({
  requireAdminMock: vi.fn(),
  getRealFixtureResultReviewQueueDataMock: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  requireAdmin: requireAdminMock,
}));

vi.mock("@/lib/supabase/real-fixture-result-review-queue-queries", () => ({
  getRealFixtureResultReviewQueueData: getRealFixtureResultReviewQueueDataMock,
}));

vi.mock("../real-fixture-lab/actions", () => ({
  verifyRealFixtureResultAction: vi.fn(),
}));

import RealFixtureResultReviewQueuePage from "./page";

function buildRow(overrides: Record<string, unknown> = {}) {
  return {
    matchId: "match-1",
    matchResultId: "result-1",
    externalId: "api-football:fixture:1489383",
    apiFootballFixtureId: "1489383",
    slug: "world-cup-2026-france-vs-senegal-2026-06-16",
    kickoffAt: "2026-06-16T19:00:00Z",
    matchStatus: "finished",
    accessScope: "public",
    competitionName: "World Cup",
    homeTeamName: "France",
    awayTeamName: "Senegal",
    homeGoals: 3,
    awayGoals: 1,
    verificationStatus: "pending_review",
    recordedAt: "2026-06-17T02:00:00Z",
    ...overrides,
  };
}

describe("RealFixtureResultReviewQueuePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminMock.mockResolvedValue({ user: { id: "admin-1" } });
  });

  it("renders pending result rows and verify controls from minimal queue data", async () => {
    getRealFixtureResultReviewQueueDataMock.mockResolvedValue({
      rows: [
        buildRow(),
        buildRow({
          matchId: "match-2",
          matchResultId: "result-2",
          externalId: "api-football:fixture:1539016",
          apiFootballFixtureId: "1539016",
          slug: "world-cup-2026-iraq-vs-norway-2026-06-16",
          homeTeamName: "Iraq",
          awayTeamName: "Norway",
          homeGoals: 1,
          awayGoals: 4,
        }),
      ],
    });

    const element = await RealFixtureResultReviewQueuePage({
      searchParams: Promise.resolve({}),
    });

    const html = renderToStaticMarkup(element);

    expect(requireAdminMock).toHaveBeenCalledWith("/admin/real-fixture-result-review-queue");
    expect(html).toContain("Result review queue");
    expect(html).toContain("France vs Senegal");
    expect(html).toContain("Iraq vs Norway");
    expect(html).toContain("3-1");
    expect(html).toContain("1-4");
    expect(html).toContain("Verify result");
    expect(html).toContain("name=\"returnTo\" value=\"/admin/real-fixture-result-review-queue\"");
    expect(html).toContain("/matches/world-cup-2026-france-vs-senegal-2026-06-16");
  });

  it("renders status copy after result verification redirects", async () => {
    getRealFixtureResultReviewQueueDataMock.mockResolvedValue({ rows: [] });

    const element = await RealFixtureResultReviewQueuePage({
      searchParams: Promise.resolve({
        externalId: "api-football:fixture:1489383",
        result: "verified",
      }),
    });

    expect(renderToStaticMarkup(element)).toContain("Resultado verificado");
  });
});
