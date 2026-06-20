import type { DatabaseInsert } from "@/types/database";
import type { PredictionReviewBundle } from "./types";

function requireBundleProbability(value: number | null, label: string) {
  if (value === null) {
    throw new Error(`Prediction review bundle is missing required ${label} probability.`);
  }

  return value;
}

export function buildPredictionReviewSnapshotInsert(args: {
  reviewCaseId: string;
  snapshotKind: DatabaseInsert<"prediction_review_snapshots">["snapshot_kind"];
  sourcePredictionVersionId?: string | null;
  sourceSnapshotId: string;
  modelVersionId?: string | null;
  bundle: PredictionReviewBundle;
  createdBy?: string | null;
}) {
  const { bundle } = args;

  return {
    review_case_id: args.reviewCaseId,
    source_prediction_version_id: args.sourcePredictionVersionId ?? null,
    snapshot_kind: args.snapshotKind,
    source_snapshot_id: args.sourceSnapshotId,
    model_version_id: args.modelVersionId ?? null,
    prediction_type: bundle.predictionType,
    review_run_scope:
      args.snapshotKind === "current_reference"
        ? "current_reference"
        : args.snapshotKind === "published_output"
          ? "published_output"
          : bundle.runScope === "review_preview"
            ? "review_preview"
            : "shadow_review",
    home_win_prob: bundle.homeWinProb,
    draw_prob: bundle.drawProb,
    away_win_prob: bundle.awayWinProb,
    expected_home_goals: bundle.expectedHomeGoals,
    expected_away_goals: bundle.expectedAwayGoals,
    most_likely_score: bundle.mostLikelyScore,
    top_scores_json: bundle.topScorelines,
    btts_yes_prob: requireBundleProbability(bundle.bttsYesProb, "BTTS yes"),
    btts_no_prob: requireBundleProbability(bundle.bttsNoProb, "BTTS no"),
    over_2_5_over_prob: requireBundleProbability(bundle.over25Prob, "over 2.5"),
    over_2_5_under_prob: requireBundleProbability(bundle.under25Prob, "under 2.5"),
    confidence_score: bundle.confidenceScore,
    risk_level: bundle.riskLevel,
    bundle_json: {
      ...bundle,
    },
    created_by: args.createdBy ?? null,
  } satisfies DatabaseInsert<"prediction_review_snapshots">;
}

export function buildPublicPredictionVersionInsertFromReviewBundle(args: {
  matchId: string;
  modelVersionId: string;
  bundle: PredictionReviewBundle;
}) {
  return {
    match_id: args.matchId,
    model_version_id: args.modelVersionId,
    prediction_type: args.bundle.predictionType,
    home_win_prob: args.bundle.homeWinProb,
    draw_prob: args.bundle.drawProb,
    away_win_prob: args.bundle.awayWinProb,
    expected_home_goals: args.bundle.expectedHomeGoals,
    expected_away_goals: args.bundle.expectedAwayGoals,
    most_likely_score: args.bundle.mostLikelyScore,
    top_scores_json: args.bundle.topScorelines,
    confidence_score: args.bundle.confidenceScore,
    risk_level: args.bundle.riskLevel,
    run_scope: "public_product",
  } satisfies DatabaseInsert<"prediction_versions">;
}

export function buildPredictionMarketsFromReviewBundle(args: {
  predictionVersionId: string;
  bundle: PredictionReviewBundle;
}) {
  return [
    {
      prediction_version_id: args.predictionVersionId,
      market: "match_winner",
      selection: "home",
      probability: args.bundle.homeWinProb,
      confidence: args.bundle.confidenceScore,
      is_premium: false,
    },
    {
      prediction_version_id: args.predictionVersionId,
      market: "match_winner",
      selection: "draw",
      probability: args.bundle.drawProb,
      confidence: args.bundle.confidenceScore,
      is_premium: false,
    },
    {
      prediction_version_id: args.predictionVersionId,
      market: "match_winner",
      selection: "away",
      probability: args.bundle.awayWinProb,
      confidence: args.bundle.confidenceScore,
      is_premium: false,
    },
    {
      prediction_version_id: args.predictionVersionId,
      market: "btts",
      selection: "yes",
      probability: requireBundleProbability(args.bundle.bttsYesProb, "BTTS yes"),
      confidence: args.bundle.confidenceScore,
      is_premium: false,
    },
    {
      prediction_version_id: args.predictionVersionId,
      market: "btts",
      selection: "no",
      probability: requireBundleProbability(args.bundle.bttsNoProb, "BTTS no"),
      confidence: args.bundle.confidenceScore,
      is_premium: false,
    },
    {
      prediction_version_id: args.predictionVersionId,
      market: "over_2_5",
      selection: "over",
      probability: requireBundleProbability(args.bundle.over25Prob, "over 2.5"),
      confidence: args.bundle.confidenceScore,
      is_premium: false,
    },
    {
      prediction_version_id: args.predictionVersionId,
      market: "over_2_5",
      selection: "under",
      probability: requireBundleProbability(args.bundle.under25Prob, "under 2.5"),
      confidence: args.bundle.confidenceScore,
      is_premium: false,
    },
    ...args.bundle.topScorelines.map((scoreline) => ({
      prediction_version_id: args.predictionVersionId,
      market: "exact_score" as const,
      selection: scoreline.score,
      probability: scoreline.probability,
      confidence: args.bundle.confidenceScore,
      is_premium: false,
    })),
  ] satisfies DatabaseInsert<"prediction_markets">[];
}
