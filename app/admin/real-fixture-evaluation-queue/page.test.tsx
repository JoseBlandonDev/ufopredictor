import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const {
  requireAdminMock,
  getRealFixtureEvaluationQueueDataMock,
} = vi.hoisted(() => ({
  requireAdminMock: vi.fn(),
  getRealFixtureEvaluationQueueDataMock: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  requireAdmin: requireAdminMock,
}));

vi.mock("@/lib/supabase/real-fixture-evaluation-queue-queries", () => ({
  getRealFixtureEvaluationQueueData: getRealFixtureEvaluationQueueDataMock,
}));

vi.mock("../real-fixture-lab/actions", () => ({
  persistRealFixtureEvaluationAction: vi.fn(),
}));

import RealFixtureEvaluationQueuePage from "./page";

function buildRow(overrides: Record<string, unknown> = {}) {
  return {
    matchId: "match-1",
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
    verificationStatus: "verified",
    reviewedAt: "2026-06-17T05:44:03.116Z",
    internalPredictionId: "internal-prediction-1",
    latestPublicPredictionId: "public-prediction-1",
    evaluationStatus: "pending",
    ...overrides,
  };
}

describe("RealFixtureEvaluationQueuePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminMock.mockResolvedValue({ user: { id: "admin-1" } });
  });

  it("renders verified rows and persistence controls from minimal queue data", async () => {
    getRealFixtureEvaluationQueueDataMock.mockResolvedValue({
      rows: [
        buildRow(),
        buildRow({
          matchId: "match-2",
          externalId: "api-football:fixture:1539016",
          apiFootballFixtureId: "1539016",
          slug: "world-cup-2026-iraq-vs-norway-2026-06-16",
          homeTeamName: "Iraq",
          awayTeamName: "Norway",
          homeGoals: 1,
          awayGoals: 4,
          internalPredictionId: "internal-prediction-2",
          latestPublicPredictionId: null,
        }),
      ],
    });

    const element = await RealFixtureEvaluationQueuePage({
      searchParams: Promise.resolve({}),
    });

    const html = renderToStaticMarkup(element);

    expect(requireAdminMock).toHaveBeenCalledWith("/admin/real-fixture-evaluation-queue");
    expect(html).toContain("Real fixture evaluation queue");
    expect(html).toContain("France vs Senegal");
    expect(html).toContain("Iraq vs Norway");
    expect(html).toContain("3-1");
    expect(html).toContain("1-4");
    expect(html).toContain("Persist evaluation");
    expect(html).toContain("name=\"returnTo\" value=\"/admin/real-fixture-evaluation-queue\"");
    expect(html).toContain("internal-prediction-1");
    expect(html).toContain("/matches/world-cup-2026-france-vs-senegal-2026-06-16");
  });

  it("renders status copy after evaluation redirects", async () => {
    getRealFixtureEvaluationQueueDataMock.mockResolvedValue({ rows: [] });

    const element = await RealFixtureEvaluationQueuePage({
      searchParams: Promise.resolve({
        externalId: "api-football:fixture:1489383",
        evaluation: "saved",
      }),
    });

    expect(renderToStaticMarkup(element)).toContain("Evaluacion persistida");
  });
});
