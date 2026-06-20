import { describe, expect, it } from "vitest";
import { buildPredictionReviewBundleFromVersion } from "./bundle";

const BASE_VERSION = {
  id: "prediction-1",
  model_version_id: "model-1",
  prediction_type: "pre_match_24h" as const,
  run_scope: "public_product" as const,
  home_win_prob: 54,
  draw_prob: 24,
  away_win_prob: 22,
  expected_home_goals: 1.4,
  expected_away_goals: 0.9,
  most_likely_score: "1-0",
  top_scores_json: [{ score: "1-0", probability: 12 }],
  confidence_score: 71,
  risk_level: "low" as const,
};

describe("buildPredictionReviewBundleFromVersion", () => {
  it("keeps missing BTTS and over/under markets unavailable instead of coercing them to zero", () => {
    const bundle = buildPredictionReviewBundleFromVersion({
      kind: "current_reference",
      predictionVersion: BASE_VERSION,
      markets: [],
      sourceSnapshotId: "2026-06-19",
      provenanceLabel: "Current public prediction",
    });

    expect(bundle.bttsYesProb).toBeNull();
    expect(bundle.bttsNoProb).toBeNull();
    expect(bundle.over25Prob).toBeNull();
    expect(bundle.under25Prob).toBeNull();
  });

  it("renders valid stored market probabilities without mixing in other versions", () => {
    const bundle = buildPredictionReviewBundleFromVersion({
      kind: "current_reference",
      predictionVersion: BASE_VERSION,
      markets: [
        { prediction_version_id: "prediction-1", market: "btts", selection: "yes", probability: 71.6 },
        { prediction_version_id: "prediction-1", market: "btts", selection: "no", probability: 28.4 },
        { prediction_version_id: "prediction-1", market: "over_2_5", selection: "over", probability: 73.5 },
        { prediction_version_id: "prediction-1", market: "over_2_5", selection: "under", probability: 26.5 },
        { prediction_version_id: "prediction-other", market: "btts", selection: "yes", probability: 0 },
      ],
      sourceSnapshotId: "2026-06-19",
      provenanceLabel: "Current public prediction",
    });

    expect(bundle.bttsYesProb).toBe(71.6);
    expect(bundle.bttsNoProb).toBe(28.4);
    expect(bundle.over25Prob).toBe(73.5);
    expect(bundle.under25Prob).toBe(26.5);
  });
});
