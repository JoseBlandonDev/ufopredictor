import { describe, expect, it } from "vitest";
import { DEFAULT_PREDICTION_ENGINE_CONFIG } from "./config";
import { generatePrediction } from "./generate-prediction";
import { balancedLabFixture, incompleteLabFixture, strongHomeLabFixture } from "./lab-fixtures";
import { buildRealFixturePredictionInput } from "./real-fixture-adapter";

function collectNumbers(value: unknown): number[] {
  if (typeof value === "number") {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.flatMap(collectNumbers);
  }

  if (value && typeof value === "object") {
    return Object.values(value).flatMap(collectNumbers);
  }

  return [];
}

describe("generatePrediction", () => {
  it("never produces non-finite numeric output", () => {
    const result = generatePrediction(incompleteLabFixture);

    expect(collectNumbers(result).every((value) => Number.isFinite(value))).toBe(true);
  });

  it("produces bounded market probabilities whose 1X2 values total approximately 100", () => {
    const result = generatePrediction(balancedLabFixture);
    const { homeWin, draw, awayWin } = result.probabilities.oneXTwo;
    const boundedValues = [
      homeWin,
      draw,
      awayWin,
      result.probabilities.btts.yes,
      result.probabilities.btts.no,
      result.probabilities.overUnder25.over,
      result.probabilities.overUnder25.under,
      ...result.topScorelines.map((scoreline) => scoreline.probability),
    ];

    expect(homeWin + draw + awayWin).toBeCloseTo(100, 2);
    expect(boundedValues.every((value) => value >= 0 && value <= 100)).toBe(true);
  });

  it("orders its top scorelines from most to least probable", () => {
    const result = generatePrediction(strongHomeLabFixture);
    const probabilities = result.topScorelines.map((scoreline) => scoreline.probability);

    expect(result.topScorelines).toHaveLength(DEFAULT_PREDICTION_ENGINE_CONFIG.topScorelinesLimit);
    expect(probabilities).toEqual([...probabilities].sort((left, right) => right - left));
    expect(result.mostLikelyScore).toBe(result.topScorelines[0].score);
  });

  it("returns identical output for identical inputs", () => {
    expect(generatePrediction(strongHomeLabFixture)).toEqual(generatePrediction(strongHomeLabFixture));
  });

  it("describes equal team power as balanced rather than assigning a false advantage", () => {
    const result = generatePrediction(balancedLabFixture);

    expect(result.factors).toContain("Orbital United and Meridian FC are balanced on weighted power score.");
    expect(result.factors.some((factor) => factor.includes("higher weighted power score by 0"))).toBe(false);
  });

  it("keeps expected goals within the documented limits", () => {
    const result = generatePrediction(strongHomeLabFixture);

    expect(result.expectedGoals.home).toBeGreaterThanOrEqual(DEFAULT_PREDICTION_ENGINE_CONFIG.minExpectedGoals);
    expect(result.expectedGoals.home).toBeLessThanOrEqual(DEFAULT_PREDICTION_ENGINE_CONFIG.maxExpectedGoals);
    expect(result.expectedGoals.away).toBeGreaterThanOrEqual(DEFAULT_PREDICTION_ENGINE_CONFIG.minExpectedGoals);
    expect(result.expectedGoals.away).toBeLessThanOrEqual(DEFAULT_PREDICTION_ENGINE_CONFIG.maxExpectedGoals);
  });

  it("uses neutral safe defaults when team data is incomplete", () => {
    const result = generatePrediction(incompleteLabFixture);

    expect(result.normalizedInput.homeTeam.signals.ratingScore).toBe(DEFAULT_PREDICTION_ENGINE_CONFIG.defaultSignalScore);
    expect(result.normalizedInput.homeTeam.signals.attackScore).toBe(DEFAULT_PREDICTION_ENGINE_CONFIG.defaultSignalScore);
    expect(result.normalizedInput.awayTeam.signals.marketScore).toBe(DEFAULT_PREDICTION_ENGINE_CONFIG.defaultSignalScore);
    expect(result.normalizedInput.dataCompleteness).toBe(0);
    expect(result.notes.some((note) => note.includes("Default signals used"))).toBe(true);
  });

  it("increases home win probability for a clearly stronger home team", () => {
    const balanced = generatePrediction(balancedLabFixture);
    const strongerHome = generatePrediction(strongHomeLabFixture);

    expect(strongerHome.probabilities.oneXTwo.homeWin).toBeGreaterThan(balanced.probabilities.oneXTwo.homeWin);
    expect(strongerHome.expectedGoals.home).toBeGreaterThan(strongerHome.expectedGoals.away);
  });

  it("returns a Lab-compatible persistence projection without writing data", () => {
    const result = generatePrediction(strongHomeLabFixture);

    expect(result.modelVersion).toBe("v0.1-lab");
    expect(result.predictionVersionProjection.runScope).toBe("internal_lab");
    expect(result.predictionMarketsProjection.some((market) => market.market === "btts")).toBe(true);
    expect(result.predictionMarketsProjection.some((market) => market.market === "over_2_5")).toBe(true);
  });

  it("uses injected fallback signals to avoid baseline mode for known national teams", () => {
    const result = generatePrediction(
      buildRealFixturePredictionInput({
        id: "match-arg-isl",
        externalId: "api-football:fixture:1540357",
        slug: "argentina-iceland",
        competitionId: "competition-1",
        kickoffAt: "2026-06-09T02:00:00Z",
        stage: "Friendly",
        status: "scheduled",
        accessScope: "admin_only",
        intakeSource: "api_football",
        sourceNote: "tracked by ingest",
        competitionName: "Friendlies",
        homeTeamId: "team-arg",
        homeTeamName: "Argentina",
        awayTeamId: "team-isl",
        awayTeamName: "Iceland",
        result: null,
        savedPrediction: null,
        savedEvaluation: null,
      }),
    );

    expect(result.normalizedInput.dataCompleteness).toBeGreaterThan(0);
    expect(result.normalizedInput.homeTeam.signals.marketScore).toBe(50);
    expect(result.normalizedInput.awayTeam.signals.lineupContextScore).toBe(50);
    expect(result.notes.some((note) => note.includes("Market score is neutral"))).toBe(false);
    expect(result.teamPower.home.score).toBeGreaterThan(result.teamPower.away.score);
    expect(result.probabilities.oneXTwo.homeWin).toBeGreaterThan(result.probabilities.oneXTwo.awayWin);
  });

  it("uses static fallback signals for immediate world cup teams instead of baseline defaults", () => {
    const result = generatePrediction(
      buildRealFixturePredictionInput({
        id: "match-kor-cze",
        externalId: "api-football:fixture:1538999",
        slug: "world-cup-2026-south-korea-vs-czech-republic-2026-06-12",
        competitionId: "competition-world-cup",
        kickoffAt: "2026-06-12T02:00:00Z",
        stage: "Group Stage - Round 1",
        status: "scheduled",
        accessScope: "admin_only",
        intakeSource: "api_football",
        sourceNote: "tracked by ingest",
        competitionName: "World Cup",
        homeTeamId: "team-kor",
        homeTeamName: "South Korea",
        awayTeamId: "team-cze",
        awayTeamName: "Czech Republic",
        result: null,
        savedPrediction: null,
        savedEvaluation: null,
      }),
    );

    expect(result.normalizedInput.dataCompleteness).toBeGreaterThan(0);
    expect(result.normalizedInput.homeTeam.providedSignals.length).toBeGreaterThan(0);
    expect(result.normalizedInput.awayTeam.providedSignals.length).toBeGreaterThan(0);
    expect(result.normalizedInput.homeTeam.defaultedSignals).toEqual([]);
    expect(result.normalizedInput.awayTeam.defaultedSignals).toEqual([]);
  });
});
