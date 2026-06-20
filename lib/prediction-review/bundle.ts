import type { PredictionVersionRow } from "@/types/database";
import type { PredictionReviewSnapshotRow } from "@/types/database";
import type { PredictionEngineOutput } from "../prediction-engine/types";
import type { PredictionReviewBundle } from "./types";

type MarketLike = {
  market: string;
  selection: string;
  probability: number;
};

function toConfidenceBucket(value: number): PredictionReviewBundle["confidenceBucket"] {
  if (value >= 67) {
    return "high";
  }

  if (value >= 45) {
    return "medium";
  }

  return "low";
}

function pickProbability(markets: MarketLike[], market: string, selection: string) {
  return markets.find((entry) => entry.market === market && entry.selection === selection)?.probability ?? null;
}

export function buildPredictionReviewBundleFromVersion(args: {
  kind: PredictionReviewBundle["kind"];
  predictionVersion: Pick<
    PredictionVersionRow,
    | "id"
    | "model_version_id"
    | "prediction_type"
    | "run_scope"
    | "home_win_prob"
    | "draw_prob"
    | "away_win_prob"
    | "expected_home_goals"
    | "expected_away_goals"
    | "most_likely_score"
    | "top_scores_json"
    | "confidence_score"
    | "risk_level"
  >;
  markets: MarketLike[];
  sourceSnapshotId: string;
  provenanceLabel: string;
  modelVersionLabel?: string | null;
}): PredictionReviewBundle {
  const { predictionVersion, markets } = args;

  return {
    kind: args.kind,
    predictionVersionId: predictionVersion.id,
    modelVersionId: predictionVersion.model_version_id,
    modelVersionLabel: args.modelVersionLabel ?? null,
    sourceSnapshotId: args.sourceSnapshotId,
    predictionType: predictionVersion.prediction_type,
    runScope: predictionVersion.run_scope,
    homeWinProb: predictionVersion.home_win_prob,
    drawProb: predictionVersion.draw_prob,
    awayWinProb: predictionVersion.away_win_prob,
    expectedHomeGoals: predictionVersion.expected_home_goals,
    expectedAwayGoals: predictionVersion.expected_away_goals,
    mostLikelyScore: predictionVersion.most_likely_score,
    topScorelines: Array.isArray(predictionVersion.top_scores_json) ? predictionVersion.top_scores_json as PredictionReviewBundle["topScorelines"] : [],
    bttsYesProb: pickProbability(markets, "btts", "yes"),
    bttsNoProb: pickProbability(markets, "btts", "no"),
    over25Prob: pickProbability(markets, "over_2_5", "over"),
    under25Prob: pickProbability(markets, "over_2_5", "under"),
    confidenceScore: predictionVersion.confidence_score,
    confidenceBucket: toConfidenceBucket(predictionVersion.confidence_score),
    riskLevel: predictionVersion.risk_level,
    notes: [],
    factors: [],
    provenanceLabel: args.provenanceLabel,
  };
}

export function buildPredictionReviewBundleFromSnapshot(args: {
  snapshot: Pick<
    PredictionReviewSnapshotRow,
    | "id"
    | "snapshot_kind"
    | "source_snapshot_id"
    | "model_version_id"
    | "prediction_type"
    | "review_run_scope"
    | "home_win_prob"
    | "draw_prob"
    | "away_win_prob"
    | "expected_home_goals"
    | "expected_away_goals"
    | "most_likely_score"
    | "top_scores_json"
    | "btts_yes_prob"
    | "btts_no_prob"
    | "over_2_5_over_prob"
    | "over_2_5_under_prob"
    | "confidence_score"
    | "risk_level"
    | "bundle_json"
  >;
  provenanceLabel: string;
  modelVersionLabel?: string | null;
}): PredictionReviewBundle {
  const snapshot = args.snapshot;
  const bundleJson = snapshot.bundle_json;
  const notes =
    bundleJson && typeof bundleJson === "object" && !Array.isArray(bundleJson) && Array.isArray(bundleJson.notes)
      ? (bundleJson.notes as string[])
      : [];
  const factors =
    bundleJson && typeof bundleJson === "object" && !Array.isArray(bundleJson) && Array.isArray(bundleJson.factors)
      ? (bundleJson.factors as string[])
      : [];

  return {
    kind: snapshot.snapshot_kind,
    predictionVersionId: null,
    modelVersionId: snapshot.model_version_id,
    modelVersionLabel: args.modelVersionLabel ?? null,
    sourceSnapshotId: snapshot.source_snapshot_id,
    predictionType: snapshot.prediction_type,
    runScope: snapshot.review_run_scope === "review_preview" ? "review_preview" : "internal_lab",
    homeWinProb: snapshot.home_win_prob,
    drawProb: snapshot.draw_prob,
    awayWinProb: snapshot.away_win_prob,
    expectedHomeGoals: snapshot.expected_home_goals,
    expectedAwayGoals: snapshot.expected_away_goals,
    mostLikelyScore: snapshot.most_likely_score,
    topScorelines: Array.isArray(snapshot.top_scores_json) ? snapshot.top_scores_json as PredictionReviewBundle["topScorelines"] : [],
    bttsYesProb: snapshot.btts_yes_prob,
    bttsNoProb: snapshot.btts_no_prob,
    over25Prob: snapshot.over_2_5_over_prob,
    under25Prob: snapshot.over_2_5_under_prob,
    confidenceScore: snapshot.confidence_score,
    confidenceBucket: toConfidenceBucket(snapshot.confidence_score),
    riskLevel: snapshot.risk_level,
    notes,
    factors,
    provenanceLabel: args.provenanceLabel,
  };
}

export function buildPredictionReviewBundleFromOutput(args: {
  output: PredictionEngineOutput;
  kind: PredictionReviewBundle["kind"];
  sourceSnapshotId: string;
  provenanceLabel: string;
  modelVersionId?: string | null;
  modelVersionLabel?: string | null;
}): PredictionReviewBundle {
  const { output } = args;

  return {
    kind: args.kind,
    predictionVersionId: null,
    modelVersionId: args.modelVersionId ?? null,
    modelVersionLabel: args.modelVersionLabel ?? output.modelVersion,
    sourceSnapshotId: args.sourceSnapshotId,
    predictionType: output.predictionVersionProjection.predictionType,
    runScope: output.predictionVersionProjection.runScope,
    homeWinProb: output.predictionVersionProjection.homeWinProb,
    drawProb: output.predictionVersionProjection.drawProb,
    awayWinProb: output.predictionVersionProjection.awayWinProb,
    expectedHomeGoals: output.predictionVersionProjection.expectedHomeGoals,
    expectedAwayGoals: output.predictionVersionProjection.expectedAwayGoals,
    mostLikelyScore: output.predictionVersionProjection.mostLikelyScore,
    topScorelines: output.topScorelines,
    bttsYesProb: output.probabilities.btts.yes,
    bttsNoProb: output.probabilities.btts.no,
    over25Prob: output.probabilities.overUnder25.over,
    under25Prob: output.probabilities.overUnder25.under,
    confidenceScore: output.confidence,
    confidenceBucket: toConfidenceBucket(output.confidence),
    riskLevel: output.risk,
    notes: output.notes,
    factors: output.factors,
    provenanceLabel: args.provenanceLabel,
  };
}
