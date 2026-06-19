import { describe, expect, it } from "vitest";
import { calculateExternalCoherenceAlerts, calculateRefreshDeltaAlerts } from "./alerts";
import type { PredictionReviewBundle, PredictionReviewCoherenceFixture } from "./types";

function buildBundle(overrides: Partial<PredictionReviewBundle> = {}): PredictionReviewBundle {
  return {
    kind: "current_reference",
    predictionVersionId: "prediction-1",
    modelVersionId: "model-1",
    modelVersionLabel: "v0.2-prelaunch",
    sourceSnapshotId: "2026-06-19",
    predictionType: "pre_match_24h",
    runScope: "public_product",
    homeWinProb: 52,
    drawProb: 24,
    awayWinProb: 24,
    expectedHomeGoals: 1.6,
    expectedAwayGoals: 0.9,
    mostLikelyScore: "2-0",
    topScorelines: [{ homeGoals: 2, awayGoals: 0, score: "2-0", probability: 14 }],
    bttsYesProb: 43,
    bttsNoProb: 57,
    over25Prob: 49,
    under25Prob: 51,
    confidenceScore: 61,
    confidenceBucket: "medium",
    riskLevel: "medium",
    notes: [],
    factors: [],
    provenanceLabel: "test",
    ...overrides,
  };
}

function buildCoherenceFixture(overrides: Partial<PredictionReviewCoherenceFixture> = {}): PredictionReviewCoherenceFixture {
  return {
    matchDate: "2026-06-20",
    teamAKey: "germany",
    teamAEn: "Germany",
    teamADisplayNameEs: "Alemania",
    teamBKey: "ivory-coast",
    teamBEn: "Ivory Coast",
    teamBDisplayNameEs: "Costa de Marfil",
    eloRankA: 9,
    eloRankB: 37,
    eloRatingA: 1939,
    eloRatingB: 1743,
    eloWinningExpectancyA: 76,
    eloWinningExpectancyB: 24,
    ...overrides,
  };
}

describe("prediction review alerts", () => {
  it("flags refresh deltas and retained fixtures", () => {
    const alerts = calculateRefreshDeltaAlerts({
      currentPrediction: buildBundle(),
      shadowPrediction: buildBundle({
        homeWinProb: 28,
        drawProb: 27,
        awayWinProb: 45,
        expectedHomeGoals: 1.05,
        expectedAwayGoals: 1.24,
        mostLikelyScore: "1-1",
        bttsYesProb: 55,
        bttsNoProb: 45,
        over25Prob: 56,
        under25Prob: 44,
        confidenceBucket: "low",
        confidenceScore: 39,
        riskLevel: "high",
      }),
      homeTeamName: "Germany",
      awayTeamName: "Ivory Coast",
    });

    expect(alerts.some((alert) => alert.type === "retained_fixture_override")).toBe(true);
    expect(alerts.some((alert) => alert.type === "favorite_changed")).toBe(true);
    expect(alerts.some((alert) => alert.type === "max_one_x_two_delta")).toBe(true);
    expect(alerts.some((alert) => alert.type === "btts_changed")).toBe(true);
    expect(alerts.some((alert) => alert.type === "over_under_changed")).toBe(true);
  });

  it("flags critical Elo inversions", () => {
    const alerts = calculateExternalCoherenceAlerts({
      prediction: buildBundle({
        homeWinProb: 20,
        drawProb: 30,
        awayWinProb: 50,
      }),
      coherenceFixture: buildCoherenceFixture(),
    });

    expect(alerts).toHaveLength(1);
    expect(alerts[0]?.type).toBe("elo_inversion");
    expect(alerts[0]?.severity).toBe("critical");
  });
});
