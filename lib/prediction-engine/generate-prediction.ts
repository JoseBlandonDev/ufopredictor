import { DEFAULT_PREDICTION_ENGINE_CONFIG } from "./config";
import { buildFactors, calculateConfidenceAndRisk } from "./confidence-risk";
import { calculateExpectedGoals } from "./expected-goals";
import { calculateMarkets, selectTopScorelines } from "./markets";
import { normalizeInput } from "./normalize";
import { buildScoreMatrix } from "./poisson";
import { calculateTeamPower } from "./team-power";
import type { MatchPredictionInput, PredictionEngineConfig, PredictionEngineOutput } from "./types";

export function generatePrediction(
  input: MatchPredictionInput,
  config: PredictionEngineConfig = DEFAULT_PREDICTION_ENGINE_CONFIG,
): PredictionEngineOutput {
  const normalizedInput = normalizeInput(input, config);
  const teamPower = {
    home: calculateTeamPower(normalizedInput.homeTeam, config),
    away: calculateTeamPower(normalizedInput.awayTeam, config),
  };
  const expectedGoals = calculateExpectedGoals(normalizedInput, teamPower, config);
  const scoreMatrix = buildScoreMatrix(expectedGoals, config.maxGoalsInMatrix);
  const probabilities = calculateMarkets(scoreMatrix);
  const topScorelines = selectTopScorelines(scoreMatrix, config.topScorelinesLimit);
  const { confidence, risk, outcomeMargin } = calculateConfidenceAndRisk(normalizedInput, probabilities);
  const factors = buildFactors(normalizedInput, teamPower, expectedGoals, outcomeMargin);
  const mostLikelyScore = topScorelines[0]?.score ?? "0-0";
  const predictionVersionProjection = {
    predictionType: normalizedInput.predictionType,
    runScope: normalizedInput.runScope,
    homeWinProb: probabilities.oneXTwo.homeWin,
    drawProb: probabilities.oneXTwo.draw,
    awayWinProb: probabilities.oneXTwo.awayWin,
    expectedHomeGoals: expectedGoals.home,
    expectedAwayGoals: expectedGoals.away,
    mostLikelyScore,
    topScoresJson: topScorelines,
    confidenceScore: confidence,
    riskLevel: risk,
  };

  return {
    modelVersion: config.modelVersion,
    matchId: normalizedInput.matchId,
    normalizedInput,
    teamPower,
    expectedGoals,
    probabilities,
    topScorelines,
    mostLikelyScore,
    confidence,
    risk,
    factors,
    notes: normalizedInput.notes,
    predictionVersionProjection,
    predictionMarketsProjection: [
      { market: "match_winner", selection: "home", probability: probabilities.oneXTwo.homeWin, confidence },
      { market: "match_winner", selection: "draw", probability: probabilities.oneXTwo.draw, confidence },
      { market: "match_winner", selection: "away", probability: probabilities.oneXTwo.awayWin, confidence },
      { market: "over_2_5", selection: "over", probability: probabilities.overUnder25.over, confidence },
      { market: "over_2_5", selection: "under", probability: probabilities.overUnder25.under, confidence },
      { market: "btts", selection: "yes", probability: probabilities.btts.yes, confidence },
      { market: "btts", selection: "no", probability: probabilities.btts.no, confidence },
      ...topScorelines.map((scoreline) => ({
        market: "exact_score" as const,
        selection: scoreline.score,
        probability: scoreline.probability,
        confidence,
      })),
    ],
  };
}
