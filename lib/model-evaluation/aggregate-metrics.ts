import type { AccuracyMetric, AggregatedEvaluationMetrics, PredictionEvaluation } from "./types";

function round(value: number, digits = 4) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function calculateAccuracy(values: Array<boolean | null>): AccuracyMetric {
  const evaluable = values.filter((value): value is boolean => value !== null);
  const correct = evaluable.filter(Boolean).length;

  return {
    correct,
    evaluated: evaluable.length,
    accuracy: evaluable.length === 0 ? null : round((correct / evaluable.length) * 100),
  };
}

export function aggregateEvaluationMetrics(evaluations: PredictionEvaluation[]): AggregatedEvaluationMetrics {
  const evaluable = evaluations.filter((evaluation) => evaluation.status === "evaluable");
  const goalErrorTotal = evaluable.reduce((total, evaluation) => total + evaluation.metrics.goalError, 0);

  return {
    totalEvaluable: evaluable.length,
    totalNonEvaluable: evaluations.length - evaluable.length,
    winnerAccuracy: calculateAccuracy(evaluable.map((evaluation) => evaluation.metrics.winnerCorrect)),
    bttsAccuracy: calculateAccuracy(evaluable.map((evaluation) => evaluation.metrics.bttsCorrect)),
    over25Accuracy: calculateAccuracy(evaluable.map((evaluation) => evaluation.metrics.over25Correct)),
    exactScoreAccuracy: calculateAccuracy(evaluable.map((evaluation) => evaluation.metrics.exactScoreCorrect)),
    averageGoalError: evaluable.length === 0 ? null : round(goalErrorTotal / evaluable.length),
  };
}
