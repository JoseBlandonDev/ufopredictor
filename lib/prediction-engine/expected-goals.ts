import { clamp, round } from "./normalize";
import type { ExpectedGoalsResult, NormalizedMatchInput, PredictionEngineConfig, TeamPowerResult } from "./types";

function scoreMultiplier(score: number, influence: number) {
  return 1 + ((score - 50) / 50) * influence;
}

function opponentDefenseMultiplier(defenseScore: number) {
  return 1 + ((50 - defenseScore) / 50) * 0.3;
}

function strengthMultiplier(teamPower: number, opponentPower: number) {
  return clamp(1 + ((teamPower - opponentPower) / 100) * 0.55, 0.65, 1.35);
}

export function calculateExpectedGoals(
  input: NormalizedMatchInput,
  teamPower: { home: TeamPowerResult; away: TeamPowerResult },
  config: PredictionEngineConfig,
): ExpectedGoalsResult {
  const homeContextMultiplier = scoreMultiplier(input.context.homeAdvantageScore, 0.12);
  const awayContextMultiplier = scoreMultiplier(100 - input.context.homeAdvantageScore, 0.12);
  const homeRaw =
    config.baseGoalRate *
    scoreMultiplier(input.homeTeam.signals.attackScore, 0.35) *
    opponentDefenseMultiplier(input.awayTeam.signals.defenseScore) *
    strengthMultiplier(teamPower.home.score, teamPower.away.score) *
    homeContextMultiplier;
  const awayRaw =
    config.baseGoalRate *
    scoreMultiplier(input.awayTeam.signals.attackScore, 0.35) *
    opponentDefenseMultiplier(input.homeTeam.signals.defenseScore) *
    strengthMultiplier(teamPower.away.score, teamPower.home.score) *
    awayContextMultiplier;

  return {
    home: round(clamp(homeRaw, config.minExpectedGoals, config.maxExpectedGoals)),
    away: round(clamp(awayRaw, config.minExpectedGoals, config.maxExpectedGoals)),
  };
}
