import { describe, expect, it } from "vitest";
import { aggregateEvaluationMetrics } from "./aggregate-metrics";
import { evaluatePrediction } from "./evaluate-prediction";
import {
  ambiguousPrediction,
  ambiguousVerifiedResult,
  awayWinPrediction,
  awayWinVerifiedResult,
  drawPrediction,
  drawVerifiedResult,
  homeWinPrediction,
  homeWinVerifiedResult,
  inconsistentScorePrediction,
  inconsistentScoreVerifiedResult,
  unverifiedResult,
} from "./lab-fixtures";

describe("evaluatePrediction", () => {
  it("evaluates a correct home win, BTTS no, under 2.5 and exact score", () => {
    const evaluation = evaluatePrediction(homeWinPrediction, homeWinVerifiedResult);

    expect(evaluation.status).toBe("evaluable");

    if (evaluation.status !== "evaluable") {
      throw new Error("Expected an evaluable result.");
    }

    expect(evaluation.actual.outcome).toBe("home");
    expect(evaluation.metrics).toEqual({
      winnerCorrect: true,
      bttsCorrect: true,
      over25Correct: true,
      exactScoreCorrect: true,
      goalError: 0,
    });
  });

  it("evaluates a draw with BTTS yes and under 2.5", () => {
    const evaluation = evaluatePrediction(drawPrediction, drawVerifiedResult);

    expect(evaluation.status).toBe("evaluable");

    if (evaluation.status !== "evaluable") {
      throw new Error("Expected an evaluable result.");
    }

    expect(evaluation.actual).toMatchObject({
      outcome: "draw",
      btts: "yes",
      overUnder25: "under",
    });
    expect(evaluation.metrics.winnerCorrect).toBe(true);
    expect(evaluation.metrics.bttsCorrect).toBe(true);
    expect(evaluation.metrics.over25Correct).toBe(true);
  });

  it("evaluates an away win and records an incorrect exact score", () => {
    const evaluation = evaluatePrediction(awayWinPrediction, awayWinVerifiedResult);

    expect(evaluation.status).toBe("evaluable");

    if (evaluation.status !== "evaluable") {
      throw new Error("Expected an evaluable result.");
    }

    expect(evaluation.actual.outcome).toBe("away");
    expect(evaluation.metrics.winnerCorrect).toBe(true);
    expect(evaluation.metrics.bttsCorrect).toBe(true);
    expect(evaluation.metrics.over25Correct).toBe(true);
    expect(evaluation.metrics.exactScoreCorrect).toBe(false);
  });

  it("calculates goal error from most likely score rather than expected goals", () => {
    const evaluation = evaluatePrediction(awayWinPrediction, awayWinVerifiedResult);

    if (evaluation.status !== "evaluable") {
      throw new Error("Expected an evaluable result.");
    }

    expect(evaluation.metrics.goalError).toBe(1);
    expect(evaluation.predictionResultsPayload.goal_error).toBe(1);
  });

  it("marks an unverified result as not evaluable", () => {
    const evaluation = evaluatePrediction(homeWinPrediction, unverifiedResult);

    expect(evaluation).toMatchObject({
      status: "not_evaluable",
      reason: "result_not_verified",
      predictionResultsPayload: null,
    });
  });

  it("marks tied probability markets as ambiguous while using most likely score for exact score", () => {
    const evaluation = evaluatePrediction(ambiguousPrediction, ambiguousVerifiedResult);

    if (evaluation.status !== "evaluable") {
      throw new Error("Expected an evaluable result.");
    }

    expect(evaluation.predicted.outcome.status).toBe("ambiguous");
    expect(evaluation.predicted.btts.status).toBe("ambiguous");
    expect(evaluation.predicted.overUnder25.status).toBe("ambiguous");
    expect(evaluation.predicted.exactScore).toMatchObject({ status: "selected", selection: "1-1" });
    expect(evaluation.metrics.winnerCorrect).toBeNull();
    expect(evaluation.metrics.bttsCorrect).toBeNull();
    expect(evaluation.metrics.over25Correct).toBeNull();
    expect(evaluation.metrics.exactScoreCorrect).toBe(true);
  });

  it("uses most likely score for exact score and warns if top scorelines disagree", () => {
    const evaluation = evaluatePrediction(inconsistentScorePrediction, inconsistentScoreVerifiedResult);

    if (evaluation.status !== "evaluable") {
      throw new Error("Expected an evaluable result.");
    }

    expect(evaluation.metrics.exactScoreCorrect).toBe(false);
    expect(evaluation.metrics.goalError).toBe(1);
    expect(evaluation.errorSummary).toContain("Predicted score 2-0; actual score 1-0.");
    expect(evaluation.warnings).toEqual([
      "Input inconsistency: mostLikelyScore 2-0 differs from topScorelines leader 1-0.",
    ]);
  });

  it("produces a payload compatible with prediction_results fields", () => {
    const evaluation = evaluatePrediction(homeWinPrediction, homeWinVerifiedResult);

    if (evaluation.status !== "evaluable") {
      throw new Error("Expected an evaluable result.");
    }

    expect(evaluation.predictionResultsPayload).toEqual({
      prediction_version_id: "prediction-home-win",
      actual_home_goals: 2,
      actual_away_goals: 0,
      winner_correct: true,
      btts_correct: true,
      over_2_5_correct: true,
      exact_score_correct: true,
      goal_error: 0,
      error_summary: evaluation.errorSummary,
    });
  });

  it("is deterministic for equal inputs", () => {
    expect(evaluatePrediction(awayWinPrediction, awayWinVerifiedResult)).toEqual(
      evaluatePrediction(awayWinPrediction, awayWinVerifiedResult),
    );
  });
});

describe("aggregateEvaluationMetrics", () => {
  it("aggregates evaluated, non-evaluated, ambiguous and accuracy values", () => {
    const evaluations = [
      evaluatePrediction(homeWinPrediction, homeWinVerifiedResult),
      evaluatePrediction(drawPrediction, drawVerifiedResult),
      evaluatePrediction(awayWinPrediction, awayWinVerifiedResult),
      evaluatePrediction(ambiguousPrediction, ambiguousVerifiedResult),
      evaluatePrediction(homeWinPrediction, unverifiedResult),
    ];

    expect(aggregateEvaluationMetrics(evaluations)).toEqual({
      totalEvaluable: 4,
      totalNonEvaluable: 1,
      winnerAccuracy: { correct: 3, evaluated: 3, accuracy: 100 },
      bttsAccuracy: { correct: 3, evaluated: 3, accuracy: 100 },
      over25Accuracy: { correct: 3, evaluated: 3, accuracy: 100 },
      exactScoreAccuracy: { correct: 3, evaluated: 4, accuracy: 75 },
      averageGoalError: 0.25,
    });
  });
});
