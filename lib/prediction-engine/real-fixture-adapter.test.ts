import { describe, expect, it } from "vitest";

import { generatePrediction } from "./generate-prediction";
import { buildRealFixturePredictionInput } from "./real-fixture-adapter";

const realFixtureView = {
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

describe("real fixture prediction adapter", () => {
  it("maps a real fixture view into a MatchPredictionInput", () => {
    const input = buildRealFixturePredictionInput(realFixtureView);

    expect(input).toEqual({
      matchId: "match-1",
      homeTeam: {
        id: "team-1",
        name: "Atletico Nacional",
      },
      awayTeam: {
        id: "team-2",
        name: "Junior",
      },
      context: {
        neutralVenue: false,
      },
      runScope: "internal_lab",
      predictionType: "pre_match_24h",
    });
  });

  it("can generate an in-memory preview without provider predictions or odds", () => {
    const output = generatePrediction(buildRealFixturePredictionInput(realFixtureView));

    expect(output.matchId).toBe("match-1");
    expect(output.predictionVersionProjection.runScope).toBe("internal_lab");
    expect(output.notes.some((note) => note.includes("Market score is neutral"))).toBe(true);
    expect(output.probabilities.oneXTwo.homeWin + output.probabilities.oneXTwo.draw + output.probabilities.oneXTwo.awayWin)
      .toBeCloseTo(100, 2);
  });
});
