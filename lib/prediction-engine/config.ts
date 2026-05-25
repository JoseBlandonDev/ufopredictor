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
};
