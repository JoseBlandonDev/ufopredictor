import { describe, expect, it } from "vitest";
import { DEFAULT_PREDICTION_ENGINE_CONFIG } from "./config";
import { generatePrediction } from "./generate-prediction";
import { balancedLabFixture, incompleteLabFixture, strongHomeLabFixture } from "./lab-fixtures";
import { reconcileDrawMarket } from "./markets";
import { buildRealFixturePredictionInput } from "./real-fixture-adapter";
import type { ScorelineProbability } from "./types";

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

function buildWorldCupFixture(homeTeamName: string, awayTeamName: string) {
  return buildRealFixturePredictionInput({
    id: `${homeTeamName}-${awayTeamName}`.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    externalId: `fixture:${homeTeamName}:${awayTeamName}`,
    slug: `${homeTeamName}-vs-${awayTeamName}`.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    competitionId: "competition-world-cup",
    kickoffAt: "2026-06-12T19:00:00Z",
    stage: "Group Stage - Round 1",
    status: "scheduled",
    accessScope: "admin_only",
    intakeSource: "api_football",
    sourceNote: "draw reconciliation fixture",
    competitionName: "World Cup",
    homeTeamId: `${homeTeamName}-id`.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    homeTeamName,
    awayTeamId: `${awayTeamName}-id`.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    awayTeamName,
    result: null,
    savedPrediction: null,
    savedEvaluation: null,
  });
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

  it("keeps reconciled 1X2 probabilities finite, bounded, and normalized", () => {
    const topScorelines: ScorelineProbability[] = [
      { homeGoals: 1, awayGoals: 1, score: "1-1", probability: 12.2 },
      { homeGoals: 1, awayGoals: 0, score: "1-0", probability: 11.1 },
      { homeGoals: 0, awayGoals: 1, score: "0-1", probability: 9.9 },
    ];
    const reconciled = reconcileDrawMarket(
      {
        oneXTwo: {
          homeWin: 40,
          draw: 37.5,
          awayWin: 22.5,
        },
        btts: { yes: 52, no: 48 },
        overUnder25: { over: 43, under: 57 },
      },
      { home: 1.25, away: 1.1 },
      topScorelines,
      DEFAULT_PREDICTION_ENGINE_CONFIG,
    );
    const total = reconciled.oneXTwo.homeWin + reconciled.oneXTwo.draw + reconciled.oneXTwo.awayWin;
    const bounded = Object.values(reconciled.oneXTwo).every((value) => value >= 0 && value <= 100 && Number.isFinite(value));

    expect(reconciled.oneXTwo.draw).toBeGreaterThan(reconciled.oneXTwo.homeWin);
    expect(total).toBeCloseTo(100, 4);
    expect(bounded).toBe(true);
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
    expect(result.normalizedInput.homeTeam.metadata?.eloRating).toBe(2128);
    expect(result.teamPower.home.score).toBeGreaterThan(result.teamPower.away.score);
    expect(result.probabilities.oneXTwo.homeWin).toBeGreaterThan(result.probabilities.oneXTwo.awayWin);
  });

  it("keeps a close fixture from forcing draw above both sides when the refreshed gap is still meaningful", () => {
    const result = generatePrediction(buildWorldCupFixture("Canada", "Bosnia & Herzegovina"));

    expect(result.mostLikelyScore).toBe("1-1");
    expect(result.probabilities.oneXTwo.homeWin).toBeGreaterThan(result.probabilities.oneXTwo.draw);
    expect(result.probabilities.oneXTwo.awayWin).toBeGreaterThan(result.probabilities.oneXTwo.draw);
  });

  it("still lets draw become the top 1X2 outcome for another balanced modal-draw fixture within the cap", () => {
    const result = generatePrediction(buildWorldCupFixture("Saudi Arabia", "Uruguay"));

    expect(result.mostLikelyScore).toBe("1-1");
    expect(result.probabilities.oneXTwo.draw).toBeGreaterThan(result.probabilities.oneXTwo.homeWin);
    expect(result.probabilities.oneXTwo.draw).toBeGreaterThan(result.probabilities.oneXTwo.awayWin);
  });

  it("does not partially reshape a close fixture when draw cannot become top within the allowed cap", () => {
    const result = generatePrediction(buildWorldCupFixture("Mexico", "South Korea"));

    expect(result.mostLikelyScore).toBe("1-1");
    expect(result.probabilities.oneXTwo.homeWin).toBeGreaterThan(result.probabilities.oneXTwo.draw);
    expect(result.probabilities.oneXTwo.awayWin).toBeGreaterThan(result.probabilities.oneXTwo.draw);
  });

  it("keeps medium favorites ahead when the xG gap is too wide for draw reconciliation", () => {
    const result = generatePrediction(buildWorldCupFixture("South Korea", "Czech Republic"));

    expect(result.mostLikelyScore).toBe("1-1");
    expect(result.probabilities.oneXTwo.homeWin).toBeGreaterThan(result.probabilities.oneXTwo.draw);
  });

  it("keeps strong favorites stable under draw reconciliation", () => {
    const result = generatePrediction(buildWorldCupFixture("Spain", "New Zealand"));

    expect(result.mostLikelyScore).not.toBe("1-1");
    expect(result.probabilities.oneXTwo.homeWin).toBeGreaterThan(80);
    expect(result.probabilities.oneXTwo.homeWin).toBeGreaterThan(result.probabilities.oneXTwo.draw);
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

  it("does not leave 1-1 as the modal score for a clear canonical mismatch", () => {
    const result = generatePrediction(
      buildRealFixturePredictionInput({
        id: "match-esp-nzl",
        externalId: "api-football:fixture:esp-nzl",
        slug: "world-cup-2026-spain-vs-new-zealand-2026-06-12",
        competitionId: "competition-world-cup",
        kickoffAt: "2026-06-12T21:00:00Z",
        stage: "Group Stage - Round 1",
        status: "scheduled",
        accessScope: "admin_only",
        intakeSource: "api_football",
        sourceNote: "tracked by ingest",
        competitionName: "World Cup",
        homeTeamId: "team-esp",
        homeTeamName: "Spain",
        awayTeamId: "team-nzl",
        awayTeamName: "New Zealand",
        result: null,
        savedPrediction: null,
        savedEvaluation: null,
      }),
    );

    expect(result.expectedGoals.home).toBeGreaterThan(result.expectedGoals.away + 0.7);
    expect(result.mostLikelyScore).not.toBe("1-1");
    expect(result.topScorelines[0]?.score).not.toBe("1-1");
  });
});
