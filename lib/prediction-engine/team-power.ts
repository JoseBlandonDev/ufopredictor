import { round } from "./normalize";
import type { NormalizedTeamInput, PredictionEngineConfig, TeamPowerResult, TeamSignalKey } from "./types";

export function calculateTeamPower(team: NormalizedTeamInput, config: PredictionEngineConfig): TeamPowerResult {
  const contributions = {} as Record<TeamSignalKey, number>;
  let score = 0;

  for (const key of Object.keys(config.weights) as TeamSignalKey[]) {
    const contribution = team.signals[key] * config.weights[key];
    contributions[key] = round(contribution);
    score += contribution;
  }

  return {
    score: round(score),
    contributions,
  };
}
