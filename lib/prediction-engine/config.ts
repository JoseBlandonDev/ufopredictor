import type { PredictionEngineConfig } from "./types";

export const DEFAULT_PREDICTION_ENGINE_CONFIG: PredictionEngineConfig = {
  modelVersion: "v0.1-lab",
  baseGoalRate: 1.35,
  minExpectedGoals: 0.2,
  maxExpectedGoals: 3.5,
  maxGoalsInMatrix: 10,
  topScorelinesLimit: 3,
  defaultSignalScore: 50,
  defaultHomeAdvantageScore: 55,
  weights: {
    ratingScore: 0.25,
    recentFormScore: 0.2,
    attackScore: 0.15,
    defenseScore: 0.15,
    marketScore: 0.15,
    lineupContextScore: 0.1,
  },
  xgCalibration: {
    historicalGoalsForBaseline: 1.35,
    historicalGoalsAgainstBaseline: 1.2,
    historicalGoalsForInfluence: 0.2,
    historicalGoalsAgainstInfluence: 0.18,
    ratingDifferentialInfluence: 0.2,
    recentMatchCountCap: 10,
    minimumMetadataReliability: 0.45,
    scorelineGapBoostThreshold: 0.45,
    scorelineGapBoostInfluence: 0.2,
    scorelineUnderdogSuppressionThreshold: 1.35,
    scorelineUnderdogSuppressionInfluence: 0.14,
  },
};
