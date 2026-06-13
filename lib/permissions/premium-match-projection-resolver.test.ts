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
      data: {
        markets: [],
        narratives: [],
        model_detail: {
          expected_goals: { home: 1.6, away: 0.8 },
          top_scorelines: [{ score: "1-0", probability: 0.19 }],
          both_teams_to_score: { yes_probability: 45.5, no_probability: 54.5 },
          total_goals_2_5: { over_probability: 42.1, under_probability: 57.9 },
        },
      },
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
              premium_analysis: "Analisis premium",
              why_it_changed: "Cambios",
              risk_notes: "Riesgo",
            },
          ],
          model_detail: {
            expected_goals: { home: 1.6, away: 0.8 },
            top_scorelines: [
              { score: "1-0", probability: 0.19 },
              { score: "2-0", probability: 0.13 },
              { score: "1-1", probability: 0.11 },
            ],
            both_teams_to_score: { yes_probability: 45.5, no_probability: 54.5 },
            total_goals_2_5: { over_probability: 42.1, under_probability: 57.9 },
            confidence: { score: 73.4, risk_level: "medium" },
          },
        },
        error: null,
      }),
    });

    expect(projection.status).toBe("authorized");
    if (projection.status !== "authorized") return;
    expect(projection.payload.markets).toHaveLength(1);
    expect(projection.payload.markets[0]?.marketKey).toBe("btts");
    expect(projection.payload.modelDetail).toEqual({
      expectedGoals: {
        home: 1.6,
        away: 0.8,
      },
      topScorelines: [
        { score: "1-0", probability: 0.19 },
        { score: "2-0", probability: 0.13 },
        { score: "1-1", probability: 0.11 },
      ],
      bothTeamsToScore: {
        yesProbability: 45.5,
        noProbability: 54.5,
      },
      totalGoals25: {
        overProbability: 42.1,
        underProbability: 57.9,
      },
      confidence: {
        score: 73.4,
        riskLevel: "medium",
      },
    });
    expect(projection.payload.confidenceContext).toEqual({
      confidenceScore: 73.4,
      riskLevel: "medium",
      explanation: null,
    });
    expect(JSON.stringify(projection)).not.toContain("prediction_results");
  });
});
