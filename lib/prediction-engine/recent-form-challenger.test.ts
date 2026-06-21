import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { generatePrediction } from "./generate-prediction";
import {
  assessTimeSafeHistoricalEvaluation,
  buildBaselinePredictionInput,
  buildRecentFormChallengerCatalog,
  buildRecentFormChallengerPredictionInput,
  isFutureShadowEligibleFixture,
  type TrackedSourceSnapshot,
} from "./recent-form-challenger";
import { CANONICAL_WORLD_CUP_TEAM_SNAPSHOTS } from "./national-team-strength-snapshots";
import { WORLD_CUP_2026_FIXTURES } from "../world-cup-2026/canonical-fixtures";

function readTrackedSourceSnapshot() {
  return JSON.parse(
    fs.readFileSync(
      path.join(process.cwd(), "data", "prediction-engine", "national-team-signals", "2026-06-19", "source.json"),
      "utf8",
    ),
  ) as TrackedSourceSnapshot;
}

describe("recent form challenger", () => {
  it("distinguishes five-match complete samples from four-match partial samples", () => {
    const diagnostics = buildRecentFormChallengerCatalog({
      sourceSnapshot: readTrackedSourceSnapshot(),
      baselineSnapshots: CANONICAL_WORLD_CUP_TEAM_SNAPSHOTS,
    });

    const germany = diagnostics.get("germany");
    const ivoryCoast = diagnostics.get("cote-divoire");

    expect(germany?.recentWindow.recentMatchCount).toBe(5);
    expect(germany?.recentWindow.sampleStatus).toBe("complete");
    expect(ivoryCoast?.recentWindow.recentMatchCount).toBe(4);
    expect(ivoryCoast?.recentWindow.sampleStatus).toBe("partial_source_window");
    expect((germany?.sampleReliability ?? 0)).toBeGreaterThan(ivoryCoast?.sampleReliability ?? 0);
  });

  it("clips extreme scorelines before they can dominate challenger recent-goal inputs", () => {
    const diagnostics = buildRecentFormChallengerCatalog({
      sourceSnapshot: readTrackedSourceSnapshot(),
      baselineSnapshots: CANONICAL_WORLD_CUP_TEAM_SNAPSHOTS,
    });

    const clippedMatches = [...diagnostics.values()]
      .flatMap((team) => team.recentWindow.matches)
      .filter((match) => match.clippedGoalsFor === 4 && match.adjustedGoalsFor <= 4.48);

    expect(clippedMatches.length).toBeGreaterThan(0);
    expect(clippedMatches.every((match) => match.clippedGoalsFor <= 4)).toBe(true);
    expect(clippedMatches.every((match) => match.clippedGoalsAgainst <= 4)).toBe(true);
  });

  it("applies opponent-strength adjustment when supported by canonical tracked opponents", () => {
    const diagnostics = buildRecentFormChallengerCatalog({
      sourceSnapshot: readTrackedSourceSnapshot(),
      baselineSnapshots: CANONICAL_WORLD_CUP_TEAM_SNAPSHOTS,
    });

    const germany = diagnostics.get("germany");

    expect(germany?.opponentStrengthAdjustment.supportedMatchCount).toBeGreaterThan(0);
    expect(germany?.opponentStrengthAdjustment.averageAttackMultiplier).not.toBe(1);
    expect(germany?.opponentStrengthAdjustment.averageDefenseMultiplier).not.toBe(1);
  });

  it("fails closed on historical evaluation rows whose snapshot or prediction timing is not provably pre-kickoff", () => {
    expect(
      assessTimeSafeHistoricalEvaluation({
        kickoffAt: "2026-06-19T17:00:00.000Z",
        sourceSnapshotDate: "2026-06-19",
        predictionCreatedAt: "2026-06-19T12:00:00.000Z",
      }),
    ).toEqual({
      eligible: false,
      reasons: ["source_snapshot_not_provably_pre_kickoff"],
    });

    expect(
      assessTimeSafeHistoricalEvaluation({
        kickoffAt: "2026-06-20T17:00:00.000Z",
        sourceSnapshotDate: "2026-06-19",
        predictionCreatedAt: "2026-06-20T18:00:00.000Z",
      }),
    ).toEqual({
      eligible: false,
      reasons: ["prediction_created_at_not_pre_kickoff"],
    });
  });

  it("keeps challenger prediction probabilities normalized", () => {
    const diagnostics = buildRecentFormChallengerCatalog({
      sourceSnapshot: readTrackedSourceSnapshot(),
      baselineSnapshots: CANONICAL_WORLD_CUP_TEAM_SNAPSHOTS,
    });
    const baselineByTeamKey = new Map(CANONICAL_WORLD_CUP_TEAM_SNAPSHOTS.map((snapshot) => [snapshot.teamKey, snapshot]));
    const fixture = WORLD_CUP_2026_FIXTURES.find((candidate) => candidate.matchNumber === 31);

    if (!fixture) {
      throw new Error("Expected World Cup Matchday 2 fixture #31.");
    }

    const homeBaselineSnapshot = baselineByTeamKey.get(fixture.homeTeamKey);
    const awayBaselineSnapshot = baselineByTeamKey.get(fixture.awayTeamKey);
    const homeDiagnostics = diagnostics.get(fixture.homeTeamKey);
    const awayDiagnostics = diagnostics.get(fixture.awayTeamKey);

    if (!homeBaselineSnapshot || !awayBaselineSnapshot || !homeDiagnostics || !awayDiagnostics) {
      throw new Error("Missing baseline or challenger inputs for the normalization test.");
    }

    const output = generatePrediction(
      buildRecentFormChallengerPredictionInput({
        fixture,
        homeBaselineSnapshot,
        awayBaselineSnapshot,
        homeDiagnostics,
        awayDiagnostics,
        variantKey: "recent_20",
      }),
    );

    expect(output.probabilities.oneXTwo.homeWin + output.probabilities.oneXTwo.draw + output.probabilities.oneXTwo.awayWin).toBeCloseTo(100, 1);
    expect(output.probabilities.btts.yes + output.probabilities.btts.no).toBeCloseTo(100, 1);
    expect(output.probabilities.overUnder25.over + output.probabilities.overUnder25.under).toBeCloseTo(100, 1);
  });

  it("does not mutate the committed production baseline snapshots", () => {
    const baselineByTeamKey = new Map(CANONICAL_WORLD_CUP_TEAM_SNAPSHOTS.map((snapshot) => [snapshot.teamKey, snapshot]));
    const before = {
      germanyAttack: baselineByTeamKey.get("germany")?.signals.attackScore,
      germanyDefense: baselineByTeamKey.get("germany")?.signals.defenseScore,
    };

    const diagnostics = buildRecentFormChallengerCatalog({
      sourceSnapshot: readTrackedSourceSnapshot(),
      baselineSnapshots: CANONICAL_WORLD_CUP_TEAM_SNAPSHOTS,
    });
    const fixture = WORLD_CUP_2026_FIXTURES.find((candidate) => candidate.matchNumber === 31);

    if (!fixture) {
      throw new Error("Expected World Cup Matchday 2 fixture #31.");
    }

    const homeBaselineSnapshot = baselineByTeamKey.get(fixture.homeTeamKey);
    const awayBaselineSnapshot = baselineByTeamKey.get(fixture.awayTeamKey);
    const homeDiagnostics = diagnostics.get(fixture.homeTeamKey);
    const awayDiagnostics = diagnostics.get(fixture.awayTeamKey);

    if (!homeBaselineSnapshot || !awayBaselineSnapshot || !homeDiagnostics || !awayDiagnostics) {
      throw new Error("Missing inputs for the baseline mutation test.");
    }

    generatePrediction(
      buildBaselinePredictionInput({
        fixture,
        homeBaselineSnapshot,
        awayBaselineSnapshot,
      }),
    );
    generatePrediction(
      buildRecentFormChallengerPredictionInput({
        fixture,
        homeBaselineSnapshot,
        awayBaselineSnapshot,
        homeDiagnostics,
        awayDiagnostics,
        variantKey: "recent_40",
      }),
    );

    expect(baselineByTeamKey.get("germany")?.signals.attackScore).toBe(before.germanyAttack);
    expect(baselineByTeamKey.get("germany")?.signals.defenseScore).toBe(before.germanyDefense);
  });

  it("filters shadow generation to fixtures whose kickoff has not started yet", () => {
    expect(isFutureShadowEligibleFixture({ kickoffAt: "2026-06-20T20:00:00.000Z" }, "2026-06-20T12:00:00.000Z")).toBe(true);
    expect(isFutureShadowEligibleFixture({ kickoffAt: "2026-06-20T10:00:00.000Z" }, "2026-06-20T12:00:00.000Z")).toBe(false);
  });
});
