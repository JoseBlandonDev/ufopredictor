import { describe, expect, it } from "vitest";

import { generatePrediction } from "./generate-prediction";
import {
  buildRealFixturePredictionMarketInserts,
  buildRealFixturePredictionVersionInsert,
  REAL_FIXTURE_LAB_PREDICTION_TYPE,
  REAL_FIXTURE_LAB_RUN_SCOPE,
} from "./real-fixture-persistence";
import { buildRealFixturePredictionInput } from "./real-fixture-adapter";

const realFixtureView = {
  id: "match-1",
  externalId: "api-football:fixture:1546413",
  slug: "colombia-final",
  competitionId: "competition-1",
  kickoffAt: "2026-06-08T22:00:00Z",
  stage: "Final",
  status: "scheduled",
  accessScope: "admin_only",
  intakeSource: "api_football",
  sourceNote: "tracked by ingest",
  competitionName: "Primera A",
  homeTeamId: "team-1",
  homeTeamName: "Atletico Nacional",
  awayTeamId: "team-2",
  awayTeamName: "Junior",
  result: null,
  savedPrediction: null,
} as const;

describe("real fixture prediction persistence helpers", () => {
  it("builds a prediction_versions payload using only internal pre-match fields", () => {
    const output = generatePrediction(buildRealFixturePredictionInput(realFixtureView));

    const payload = buildRealFixturePredictionVersionInsert({
      matchId: realFixtureView.id,
      modelVersionId: "model-1",
      predictionOutput: output,
    });

    expect(payload).toMatchObject({
      match_id: "match-1",
      model_version_id: "model-1",
      prediction_type: REAL_FIXTURE_LAB_PREDICTION_TYPE,
      run_scope: REAL_FIXTURE_LAB_RUN_SCOPE,
      most_likely_score: output.mostLikelyScore,
      confidence_score: output.confidence,
      risk_level: output.risk,
    });
    expect(payload.top_scores_json).toEqual(output.topScorelines);
    expect("provider_predictions" in (payload as object)).toBe(false);
    expect("odds" in (payload as object)).toBe(false);
  });

  it("builds non-premium prediction_markets payloads from the engine projection", () => {
    const output = generatePrediction(buildRealFixturePredictionInput(realFixtureView));

    const payloads = buildRealFixturePredictionMarketInserts({
      predictionVersionId: "prediction-1",
      predictionOutput: output,
    });

    expect(payloads.length).toBeGreaterThanOrEqual(7);
    expect(payloads[0]).toMatchObject({
      prediction_version_id: "prediction-1",
      is_premium: false,
    });
    expect(payloads.some((payload) => payload.market === "match_winner")).toBe(true);
    expect(payloads.some((payload) => payload.market === "btts")).toBe(true);
    expect(payloads.some((payload) => payload.market === "over_2_5")).toBe(true);
    expect(payloads.some((payload) => payload.market === "exact_score")).toBe(true);
  });
});
