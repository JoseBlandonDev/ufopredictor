import type { PredictionEngineOutput } from "./types";

export const REAL_FIXTURE_LAB_PREDICTION_TYPE = "pre_match_24h" as const;
export const REAL_FIXTURE_LAB_RUN_SCOPE = "internal_lab" as const;

export type RealFixturePredictionVersionInsert = {
  match_id: string;
  model_version_id: string;
  prediction_type: "pre_match_24h";
  home_win_prob: number;
  draw_prob: number;
  away_win_prob: number;
  expected_home_goals: number;
  expected_away_goals: number;
  most_likely_score: string;
  top_scores_json: PredictionEngineOutput["predictionVersionProjection"]["topScoresJson"];
  confidence_score: number;
  risk_level: PredictionEngineOutput["predictionVersionProjection"]["riskLevel"];
  run_scope: "internal_lab";
};

export type RealFixturePredictionMarketInsert = {
  prediction_version_id: string;
  market: "match_winner" | "over_2_5" | "btts" | "exact_score";
  selection: string;
  probability: number;
  confidence: number | null;
  is_premium: false;
};

export function buildRealFixturePredictionVersionInsert(args: {
  matchId: string;
  modelVersionId: string;
  predictionOutput: PredictionEngineOutput;
}): RealFixturePredictionVersionInsert {
  const { matchId, modelVersionId, predictionOutput } = args;
  const projection = predictionOutput.predictionVersionProjection;

  return {
    match_id: matchId,
    model_version_id: modelVersionId,
    prediction_type: REAL_FIXTURE_LAB_PREDICTION_TYPE,
    home_win_prob: projection.homeWinProb,
    draw_prob: projection.drawProb,
    away_win_prob: projection.awayWinProb,
    expected_home_goals: projection.expectedHomeGoals,
    expected_away_goals: projection.expectedAwayGoals,
    most_likely_score: projection.mostLikelyScore,
    top_scores_json: projection.topScoresJson,
    confidence_score: projection.confidenceScore,
    risk_level: projection.riskLevel,
    run_scope: REAL_FIXTURE_LAB_RUN_SCOPE,
  };
}

export function buildRealFixturePredictionMarketInserts(args: {
  predictionVersionId: string;
  predictionOutput: PredictionEngineOutput;
}): RealFixturePredictionMarketInsert[] {
  const { predictionVersionId, predictionOutput } = args;

  return predictionOutput.predictionMarketsProjection.map((market) => ({
    prediction_version_id: predictionVersionId,
    market: market.market,
    selection: market.selection,
    probability: market.probability,
    confidence: market.confidence,
    is_premium: false,
  }));
}
