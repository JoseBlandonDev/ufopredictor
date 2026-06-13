import { describe, expect, it } from "vitest";

import { generatePrediction } from "./generate-prediction";
import { buildRealFixturePredictionInput } from "./real-fixture-adapter";
import type { MatchPredictionInput } from "./types";

function buildFixture(homeTeamName: string, awayTeamName: string) {
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
    sourceNote: "calibration test fixture",
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

describe("expected goals calibration", () => {
  it("removes the metadata reliability floor when recent-match coverage is zero", () => {
    const zeroCoverageFixture: MatchPredictionInput = {
      matchId: "metadata-zero-coverage",
      homeTeam: {
        id: "home-zero",
        name: "Home Zero",
        signals: {
          ratingScore: 65,
          recentFormScore: 60,
          attackScore: 61,
          defenseScore: 58,
          marketScore: 50,
          lineupContextScore: 50,
        },
        metadata: {
          fifaRank: 4,
          fifaPoints: 1800,
          eloRank: 5,
          eloRating: 1980,
          eloAverageRank: 6,
          eloAverageRating: 1900,
          historicalGoalsForPerMatch: 1.7,
          historicalGoalsAgainstPerMatch: 0.9,
          recentMatchCount: 0,
        },
      },
      awayTeam: {
        id: "away-zero",
        name: "Away Zero",
        signals: {
          ratingScore: 65,
          recentFormScore: 60,
          attackScore: 61,
          defenseScore: 58,
          marketScore: 50,
          lineupContextScore: 50,
        },
        metadata: {
          fifaRank: 60,
          fifaPoints: 1400,
          eloRank: 65,
          eloRating: 1550,
          eloAverageRank: 55,
          eloAverageRating: 1600,
          historicalGoalsForPerMatch: 1.2,
          historicalGoalsAgainstPerMatch: 1.4,
          recentMatchCount: 0,
        },
      },
      context: {
        neutralVenue: true,
      },
      runScope: "internal_lab",
    };
    const nonZeroCoverageFixture: MatchPredictionInput = {
      ...zeroCoverageFixture,
      matchId: "metadata-nonzero-coverage",
      homeTeam: {
        ...zeroCoverageFixture.homeTeam,
        metadata: {
          ...zeroCoverageFixture.homeTeam.metadata!,
          recentMatchCount: 10,
        },
      },
      awayTeam: {
        ...zeroCoverageFixture.awayTeam,
        metadata: {
          ...zeroCoverageFixture.awayTeam.metadata!,
          recentMatchCount: 10,
        },
      },
    };

    const zeroCoverage = generatePrediction(zeroCoverageFixture);
    const nonZeroCoverage = generatePrediction(nonZeroCoverageFixture);

    expect(nonZeroCoverage.expectedGoals.home - zeroCoverage.expectedGoals.home).toBeGreaterThan(0.08);
    expect(zeroCoverage.expectedGoals.away - nonZeroCoverage.expectedGoals.away).toBeGreaterThan(0.08);
  });

  it("still applies a bounded metadata effect when recent-match coverage is non-zero", () => {
    const partialCoverageFixture: MatchPredictionInput = {
      matchId: "metadata-partial-coverage",
      homeTeam: {
        id: "home-partial",
        name: "Home Partial",
        signals: {
          ratingScore: 65,
          recentFormScore: 60,
          attackScore: 61,
          defenseScore: 58,
          marketScore: 50,
          lineupContextScore: 50,
        },
        metadata: {
          fifaRank: 4,
          fifaPoints: 1800,
          eloRank: 5,
          eloRating: 1980,
          eloAverageRank: 6,
          eloAverageRating: 1900,
          historicalGoalsForPerMatch: 1.7,
          historicalGoalsAgainstPerMatch: 0.9,
          recentMatchCount: 1,
        },
      },
      awayTeam: {
        id: "away-partial",
        name: "Away Partial",
        signals: {
          ratingScore: 65,
          recentFormScore: 60,
          attackScore: 61,
          defenseScore: 58,
          marketScore: 50,
          lineupContextScore: 50,
        },
        metadata: {
          fifaRank: 60,
          fifaPoints: 1400,
          eloRank: 65,
          eloRating: 1550,
          eloAverageRank: 55,
          eloAverageRating: 1600,
          historicalGoalsForPerMatch: 1.2,
          historicalGoalsAgainstPerMatch: 1.4,
          recentMatchCount: 1,
        },
      },
      context: {
        neutralVenue: true,
      },
      runScope: "internal_lab",
    };
    const fullCoverageFixture: MatchPredictionInput = {
      ...partialCoverageFixture,
      matchId: "metadata-full-coverage",
      homeTeam: {
        ...partialCoverageFixture.homeTeam,
        metadata: {
          ...partialCoverageFixture.homeTeam.metadata!,
          recentMatchCount: 10,
        },
      },
      awayTeam: {
        ...partialCoverageFixture.awayTeam,
        metadata: {
          ...partialCoverageFixture.awayTeam.metadata!,
          recentMatchCount: 10,
        },
      },
    };

    const partialCoverage = generatePrediction(partialCoverageFixture);
    const fullCoverage = generatePrediction(fullCoverageFixture);

    expect(partialCoverage.expectedGoals.home).toBeGreaterThan(partialCoverage.expectedGoals.away);
    expect(fullCoverage.expectedGoals.home).toBeGreaterThanOrEqual(partialCoverage.expectedGoals.home);
    expect(fullCoverage.expectedGoals.home - partialCoverage.expectedGoals.home).toBeLessThan(0.25);
  });

  it("separates strong favorites from weaker opponents without leaving 1-1 as the modal score", () => {
    const result = generatePrediction(buildFixture("Spain", "New Zealand"));

    expect(result.expectedGoals.home).toBeGreaterThan(result.expectedGoals.away + 0.7);
    expect(result.mostLikelyScore).not.toBe("1-1");
    expect(result.probabilities.oneXTwo.homeWin).toBeGreaterThan(55);
  });

  it("keeps balanced mid-tier fixtures in a plausible draw range", () => {
    const result = generatePrediction(buildFixture("South Korea", "Czech Republic"));

    expect(Math.abs(result.expectedGoals.home - result.expectedGoals.away)).toBeLessThan(0.7);
    expect(result.probabilities.oneXTwo.draw).toBeGreaterThan(20);
    expect(result.topScorelines.some((scoreline) => scoreline.score === "1-1")).toBe(true);
  });

  it("keeps defensive low-total fixtures below an inflated scoring profile", () => {
    const result = generatePrediction(buildFixture("IR Iran", "Saudi Arabia"));

    expect(result.expectedGoals.home + result.expectedGoals.away).toBeLessThan(2.6);
    expect(result.probabilities.overUnder25.under).toBeGreaterThan(result.probabilities.overUnder25.over);
  });

  it("allows attack-leaning fixtures to reach a higher total than the defensive case", () => {
    const attackLeaning = generatePrediction(buildFixture("Germany", "Australia"));
    const defensive = generatePrediction(buildFixture("IR Iran", "Saudi Arabia"));

    expect(attackLeaning.expectedGoals.home + attackLeaning.expectedGoals.away).toBeGreaterThan(
      defensive.expectedGoals.home + defensive.expectedGoals.away,
    );
    expect(attackLeaning.probabilities.overUnder25.over).toBeGreaterThan(40);
  });
});
