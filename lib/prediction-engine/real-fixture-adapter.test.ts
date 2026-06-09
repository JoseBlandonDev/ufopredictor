import { describe, expect, it } from "vitest";

import { generatePrediction } from "./generate-prediction";
import { buildRealFixturePredictionInput } from "./real-fixture-adapter";

const clubFixtureView = {
  id: "match-1",
  externalId: "api-football:fixture:1546413",
  slug: "colombia-final",
  competitionId: "competition-1",
  kickoffAt: "2026-06-08T22:00:00Z",
  stage: "Final",
  status: "scheduled",
  accessScope: "admin_only",
  intakeSource: "api_football",
  sourceNote: "tracked by ingest",
  competitionName: "Primera A",
  homeTeamId: "team-1",
  homeTeamName: "Atletico Nacional",
  awayTeamId: "team-2",
  awayTeamName: "Junior",
  result: null,
} as const;

const argentinaVsIcelandFixtureView = {
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
} as const;

const congoVsChileFixtureView = {
  id: "match-cod-chi",
  externalId: "api-football:fixture:1544367",
  slug: "congo-dr-chile",
  competitionId: "competition-1",
  kickoffAt: "2026-06-09T02:00:00Z",
  stage: "Friendly",
  status: "scheduled",
  accessScope: "admin_only",
  intakeSource: "api_football",
  sourceNote: "tracked by ingest",
  competitionName: "Friendlies",
  homeTeamId: "team-cod",
  homeTeamName: "Congo DR",
  awayTeamId: "team-chi",
  awayTeamName: "Chile",
  result: null,
} as const;

describe("real fixture prediction adapter", () => {
  it("keeps unknown teams safe/default when no fallback is available", () => {
    const input = buildRealFixturePredictionInput(clubFixtureView);

    expect(input).toEqual({
      matchId: "match-1",
      homeTeam: {
        id: "team-1",
        name: "Atletico Nacional",
        signals: undefined,
      },
      awayTeam: {
        id: "team-2",
        name: "Junior",
        signals: undefined,
      },
      context: {
        neutralVenue: false,
      },
      runScope: "internal_lab",
      predictionType: "pre_match_24h",
    });
  });

  it("injects national-team fallback signals without using market or lineup inputs", () => {
    const input = buildRealFixturePredictionInput(argentinaVsIcelandFixtureView);

    expect(input.homeTeam.signals).toEqual({
      ratingScore: 95,
      recentFormScore: 88,
      attackScore: 92,
      defenseScore: 89,
    });
    expect(input.awayTeam.signals).toEqual({
      ratingScore: 52,
      recentFormScore: 49,
      attackScore: 50,
      defenseScore: 53,
    });
    expect(input.homeTeam.signals).not.toHaveProperty("marketScore");
    expect(input.homeTeam.signals).not.toHaveProperty("lineupContextScore");
  });

  it("can generate an in-memory preview without provider predictions or odds", () => {
    const output = generatePrediction(buildRealFixturePredictionInput(clubFixtureView));

    expect(output.matchId).toBe("match-1");
    expect(output.predictionVersionProjection.runScope).toBe("internal_lab");
    expect(output.notes.some((note) => note.includes("Market score is neutral"))).toBe(true);
    expect(output.probabilities.oneXTwo.homeWin + output.probabilities.oneXTwo.draw + output.probabilities.oneXTwo.awayWin)
      .toBeCloseTo(100, 2);
  });

  it("raises data completeness above zero when fallback signals are injected", () => {
    const output = generatePrediction(buildRealFixturePredictionInput(argentinaVsIcelandFixtureView));

    expect(output.normalizedInput.dataCompleteness).toBeGreaterThan(0);
    expect(output.normalizedInput.homeTeam.providedSignals).toEqual([
      "ratingScore",
      "recentFormScore",
      "attackScore",
      "defenseScore",
    ]);
    expect(output.normalizedInput.awayTeam.providedSignals).toEqual([
      "ratingScore",
      "recentFormScore",
      "attackScore",
      "defenseScore",
    ]);
    expect(output.normalizedInput.homeTeam.signals.marketScore).toBe(50);
    expect(output.normalizedInput.homeTeam.signals.lineupContextScore).toBe(50);
  });

  it("differentiates Argentina vs Iceland from Congo DR vs Chile", () => {
    const argentinaVsIceland = generatePrediction(buildRealFixturePredictionInput(argentinaVsIcelandFixtureView));
    const congoVsChile = generatePrediction(buildRealFixturePredictionInput(congoVsChileFixtureView));

    expect(argentinaVsIceland.teamPower.home.score).not.toBe(congoVsChile.teamPower.home.score);
    expect(argentinaVsIceland.teamPower.away.score).not.toBe(congoVsChile.teamPower.away.score);
    expect(argentinaVsIceland.probabilities.oneXTwo.homeWin).not.toBe(congoVsChile.probabilities.oneXTwo.homeWin);
    expect(argentinaVsIceland.expectedGoals.home).toBeGreaterThan(argentinaVsIceland.expectedGoals.away);
    expect(congoVsChile.probabilities.oneXTwo.awayWin).toBeGreaterThan(congoVsChile.probabilities.oneXTwo.homeWin);
  });
});
