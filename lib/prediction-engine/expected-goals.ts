import { clamp, round } from "./normalize";
import type {
  ExpectedGoalsResult,
  NormalizedMatchInput,
  PredictionEngineConfig,
  TeamPowerResult,
  TeamStrengthMetadata,
} from "./types";

function scoreMultiplier(score: number, influence: number) {
  return 1 + ((score - 50) / 50) * influence;
}

function opponentDefenseMultiplier(defenseScore: number) {
  return 1 + ((50 - defenseScore) / 50) * 0.3;
}

function strengthMultiplier(teamPower: number, opponentPower: number) {
  return clamp(1 + ((teamPower - opponentPower) / 100) * 0.55, 0.65, 1.35);
}

function normalizeDifferential(value: number, range: number) {
  return clamp(value / range, -1, 1);
}

function metadataReliability(
  teamMetadata: TeamStrengthMetadata | undefined,
  opponentMetadata: TeamStrengthMetadata | undefined,
  config: PredictionEngineConfig,
) {
  const counts = [teamMetadata?.recentMatchCount, opponentMetadata?.recentMatchCount].filter(
    (count): count is number => typeof count === "number" && Number.isFinite(count),
  );

  if (counts.length === 0) {
    return 0;
  }

  const averagedCount = counts.reduce((total, count) => total + count, 0) / counts.length;

  if (averagedCount <= 0) {
    return 0;
  }

  return clamp(
    averagedCount / config.xgCalibration.recentMatchCountCap,
    config.xgCalibration.minimumMetadataReliability,
    1,
  );
}

function historicalGoalsMultiplier(
  value: number | undefined,
  baseline: number,
  influence: number,
) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 1;
  }

  return clamp(1 + ((value - baseline) / baseline) * influence, 0.82, 1.22);
}

function ratingDifferentialMultiplier(
  teamMetadata: TeamStrengthMetadata | undefined,
  opponentMetadata: TeamStrengthMetadata | undefined,
  config: PredictionEngineConfig,
) {
  if (!teamMetadata || !opponentMetadata) {
    return 1;
  }

  const differentialParts: number[] = [];

  if (
    typeof teamMetadata.eloRating === "number" &&
    typeof opponentMetadata.eloRating === "number"
  ) {
    differentialParts.push(normalizeDifferential(teamMetadata.eloRating - opponentMetadata.eloRating, 400));
  }

  if (
    typeof teamMetadata.eloAverageRating === "number" &&
    typeof opponentMetadata.eloAverageRating === "number"
  ) {
    differentialParts.push(normalizeDifferential(teamMetadata.eloAverageRating - opponentMetadata.eloAverageRating, 300));
  }

  if (
    typeof teamMetadata.fifaPoints === "number" &&
    typeof opponentMetadata.fifaPoints === "number"
  ) {
    differentialParts.push(normalizeDifferential(teamMetadata.fifaPoints - opponentMetadata.fifaPoints, 600));
  }

  if (
    typeof teamMetadata.fifaRank === "number" &&
    typeof opponentMetadata.fifaRank === "number"
  ) {
    differentialParts.push(normalizeDifferential(opponentMetadata.fifaRank - teamMetadata.fifaRank, 80));
  }

  if (differentialParts.length === 0) {
    return 1;
  }

  const combinedDifferential =
    differentialParts.reduce((total, value) => total + value, 0) / differentialParts.length;
  const reliability = metadataReliability(teamMetadata, opponentMetadata, config);

  return clamp(
    1 + combinedDifferential * config.xgCalibration.ratingDifferentialInfluence * reliability,
    0.82,
    1.22,
  );
}

function scorelineGapMultiplier(teamGoals: number, opponentGoals: number, config: PredictionEngineConfig) {
  const gap = teamGoals - opponentGoals;

  if (gap >= config.xgCalibration.scorelineGapBoostThreshold) {
    return clamp(
      1 + Math.min(gap - config.xgCalibration.scorelineGapBoostThreshold, 1.2) *
        config.xgCalibration.scorelineGapBoostInfluence,
      1,
      1.24,
    );
  }

  if (teamGoals <= config.xgCalibration.scorelineUnderdogSuppressionThreshold && gap <= -0.35) {
    return clamp(
      1 - Math.min(Math.abs(gap), 1.2) * config.xgCalibration.scorelineUnderdogSuppressionInfluence,
      0.76,
      1,
    );
  }

  return 1;
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
    historicalGoalsMultiplier(
      input.homeTeam.metadata?.historicalGoalsForPerMatch,
      config.xgCalibration.historicalGoalsForBaseline,
      config.xgCalibration.historicalGoalsForInfluence,
    ) *
    historicalGoalsMultiplier(
      input.awayTeam.metadata?.historicalGoalsAgainstPerMatch,
      config.xgCalibration.historicalGoalsAgainstBaseline,
      config.xgCalibration.historicalGoalsAgainstInfluence,
    ) *
    ratingDifferentialMultiplier(input.homeTeam.metadata, input.awayTeam.metadata, config) *
    homeContextMultiplier;
  const awayRaw =
    config.baseGoalRate *
    scoreMultiplier(input.awayTeam.signals.attackScore, 0.35) *
    opponentDefenseMultiplier(input.homeTeam.signals.defenseScore) *
    strengthMultiplier(teamPower.away.score, teamPower.home.score) *
    historicalGoalsMultiplier(
      input.awayTeam.metadata?.historicalGoalsForPerMatch,
      config.xgCalibration.historicalGoalsForBaseline,
      config.xgCalibration.historicalGoalsForInfluence,
    ) *
    historicalGoalsMultiplier(
      input.homeTeam.metadata?.historicalGoalsAgainstPerMatch,
      config.xgCalibration.historicalGoalsAgainstBaseline,
      config.xgCalibration.historicalGoalsAgainstInfluence,
    ) *
    ratingDifferentialMultiplier(input.awayTeam.metadata, input.homeTeam.metadata, config) *
    awayContextMultiplier;
  const homeCalibrated = homeRaw * scorelineGapMultiplier(homeRaw, awayRaw, config);
  const awayCalibrated = awayRaw * scorelineGapMultiplier(awayRaw, homeRaw, config);

  return {
    home: round(clamp(homeCalibrated, config.minExpectedGoals, config.maxExpectedGoals)),
    away: round(clamp(awayCalibrated, config.minExpectedGoals, config.maxExpectedGoals)),
  };
}
