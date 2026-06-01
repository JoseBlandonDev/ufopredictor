import { describe, expect, it, vi } from "vitest";
import { resolvePremiumProjectionForMatch } from "./premium-match-projection-resolver";

describe("resolvePremiumProjectionForMatch", () => {
  it("does not call rpc when access is locked", async () => {
    const fetchProjection = vi.fn();
    const projection = await resolvePremiumProjectionForMatch({
      premiumAccess: { status: "locked", reason: "no_entitlement" },
      matchId: "match-1",
      fetchProjection,
    });

    expect(fetchProjection).not.toHaveBeenCalled();
    expect(projection).toEqual({ status: "locked", reason: "no_entitlement" });
  });

  it("does not call rpc when access is unavailable", async () => {
    const fetchProjection = vi.fn();
    const projection = await resolvePremiumProjectionForMatch({
      premiumAccess: { status: "unavailable", reason: "missing_match_context" },
      matchId: "match-1",
      fetchProjection,
    });

    expect(fetchProjection).not.toHaveBeenCalled();
    expect(projection).toEqual({ status: "unavailable", reason: "missing_match_context" });
  });

  it("calls rpc when access is authorized", async () => {
    const fetchProjection = vi.fn().mockResolvedValue({
      data: { markets: [], narratives: [] },
      error: null,
    });
    await resolvePremiumProjectionForMatch({
      premiumAccess: { status: "authorized" },
      matchId: "match-2",
      fetchProjection,
    });

    expect(fetchProjection).toHaveBeenCalledWith("match-2");
  });

  it("returns authorized_unavailable when rpc returns null", async () => {
    const projection = await resolvePremiumProjectionForMatch({
      premiumAccess: { status: "authorized" },
      matchId: "match-3",
      fetchProjection: async () => ({ data: null, error: null }),
    });

    expect(projection).toEqual({
      status: "authorized_unavailable",
      reason: "missing_authorized_payload",
    });
  });

  it("returns authorized with filtered payload", async () => {
    const projection = await resolvePremiumProjectionForMatch({
      premiumAccess: { status: "authorized" },
      matchId: "match-4",
      fetchProjection: async () => ({
        data: {
          markets: [
            {
              marketKey: "btts",
              label: "BTTS",
              selection: "yes",
              probability: 58.2,
              confidence: 71.5,
            },
            {
              marketKey: "unknown_market",
              label: "Unknown",
              selection: "x",
              probability: 10,
              confidence: null,
            },
          ],
          narratives: [
            {
              locale: "es",
              premium_analysis: "Análisis premium",
              why_it_changed: "Cambios",
              risk_notes: "Riesgo",
            },
          ],
        },
        error: null,
      }),
    });

    expect(projection.status).toBe("authorized");
    if (projection.status !== "authorized") return;
    expect(projection.payload.markets).toHaveLength(1);
    expect(projection.payload.markets[0]?.marketKey).toBe("btts");
    expect(JSON.stringify(projection)).not.toContain("prediction_results");
  });
});
