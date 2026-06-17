import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getCurrentUserMock,
  getCurrentProfileMock,
  getTorneoUfoExportMock,
  parseTorneoExportRangeMock,
} = vi.hoisted(() => ({
  getCurrentUserMock: vi.fn(),
  getCurrentProfileMock: vi.fn(),
  getTorneoUfoExportMock: vi.fn(),
  parseTorneoExportRangeMock: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  getCurrentUser: getCurrentUserMock,
  getCurrentProfile: getCurrentProfileMock,
}));

vi.mock("@/lib/supabase/torneo-export-queries", () => ({
  getTorneoUfoExport: getTorneoUfoExportMock,
  parseTorneoExportRange: parseTorneoExportRangeMock,
}));

import { GET } from "./route";

describe("TM01 download route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    parseTorneoExportRangeMock.mockReturnValue({
      status: "valid",
      range: { from: "2026-06-16", to: "2026-06-22" },
      fromStartIso: "2026-06-16T00:00:00.000Z",
      toEndIso: "2026-06-22T23:59:59.999Z",
    });
    getTorneoUfoExportMock.mockResolvedValue({
      schemaVersion: "torneo-ufo-export-v1",
      generatedAt: "2026-06-16T12:00:00.000Z",
      source: "ufo_predictor",
      sourceAppUrl: "https://ufopredictor.com",
      competition: "world-cup-2026",
      range: { from: "2026-06-16", to: "2026-06-22" },
      displayGuidance: {
        defaultTeaser: "show_1x2_probabilities_and_link",
        exactScoreRecommendedReveal: "after_user_pick_or_pick_deadline",
        topScorelinesRecommendedReveal: "after_user_pick_or_pick_deadline",
        postMatchUse: "comparison_and_learning",
      },
      fixtures: [],
    });
  });

  it("redirects anonymous requests to login", async () => {
    getCurrentUserMock.mockResolvedValue(null);

    const response = await GET(
      new Request("http://localhost:3000/admin/torneo-export/download?from=2026-06-16&to=2026-06-22"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/login?next=");
    expect(getTorneoUfoExportMock).not.toHaveBeenCalled();
  });

  it("blocks non-admin users", async () => {
    getCurrentUserMock.mockResolvedValue({ id: "user-1" });
    getCurrentProfileMock.mockResolvedValue({ id: "user-1", role: "registered_free" });

    const response = await GET(new Request("http://localhost:3000/admin/torneo-export/download"));

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "admin access required" });
    expect(getTorneoUfoExportMock).not.toHaveBeenCalled();
  });

  it("returns attachment JSON for admins with validated ranges", async () => {
    getCurrentUserMock.mockResolvedValue({ id: "admin-1" });
    getCurrentProfileMock.mockResolvedValue({ id: "admin-1", role: "admin" });

    const response = await GET(
      new Request("https://ufopredictor.com/admin/torneo-export/download?from=2026-06-16&to=2026-06-22"),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/json");
    expect(response.headers.get("Content-Disposition")).toBe(
      'attachment; filename="torneo-ufo-export-2026-06-16.json"',
    );
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(parseTorneoExportRangeMock).toHaveBeenCalled();
    expect(getTorneoUfoExportMock).toHaveBeenCalledWith({
      range: { from: "2026-06-16", to: "2026-06-22" },
      fromStartIso: "2026-06-16T00:00:00.000Z",
      toEndIso: "2026-06-22T23:59:59.999Z",
      fallbackOrigin: "https://ufopredictor.com",
      excludeFinished: false,
    });

    const body = await response.json();
    expect(body.schemaVersion).toBe("torneo-ufo-export-v1");
  });

  it("rejects invalid dates safely", async () => {
    getCurrentUserMock.mockResolvedValue({ id: "admin-1" });
    getCurrentProfileMock.mockResolvedValue({ id: "admin-1", role: "admin" });
    parseTorneoExportRangeMock.mockReturnValue({
      status: "invalid",
      statusCode: 400,
      message: "Los parametros from y to deben usar el formato YYYY-MM-DD.",
    });

    const response = await GET(new Request("http://localhost:3000/admin/torneo-export/download?from=bad"));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Los parametros from y to deben usar el formato YYYY-MM-DD.",
    });
    expect(getTorneoUfoExportMock).not.toHaveBeenCalled();
  });

  it("uses upcoming-only filtering for the default no-query export", async () => {
    getCurrentUserMock.mockResolvedValue({ id: "admin-1" });
    getCurrentProfileMock.mockResolvedValue({ id: "admin-1", role: "admin" });

    const response = await GET(new Request("https://ufopredictor.com/admin/torneo-export/download"));

    expect(response.status).toBe(200);
    expect(getTorneoUfoExportMock).toHaveBeenCalledWith({
      range: { from: "2026-06-16", to: "2026-06-22" },
      fromStartIso: "2026-06-16T00:00:00.000Z",
      toEndIso: "2026-06-22T23:59:59.999Z",
      fallbackOrigin: "https://ufopredictor.com",
      excludeFinished: true,
    });
  });
});
