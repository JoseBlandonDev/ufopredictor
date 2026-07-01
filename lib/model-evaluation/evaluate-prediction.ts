import { DEFAULT_EVALUATION_CONFIG } from "./config";
import type {
  BttsSelection,
  EvaluablePrediction,
  EvaluablePredictionEvaluation,
  EvaluationConfig,
  MatchOutcome,
  MatchResultInput,
  OverUnder25Selection,
  PredictionEvaluation,
  ProbabilityOption,
  ResolvedMarketSelection,
} from "./types";

function round(value: number, digits = 4) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function parseScore(score: string) {
  const match = /^(\d+)-(\d+)$/.exec(score);

  if (!match) {
    return null;
  }

  return {
    homeGoals: Number(match[1]),
    awayGoals: Number(match[2]),
  };
}

function resolveMarketSelection<Selection extends string>(
  options: ProbabilityOption<Selection>[],
  tolerance: number,
): ResolvedMarketSelection<Selection> {
  const ordered = [...options].sort((left, right) => right.probability - left.probability);
  const leader = ordered[0];
  const runnerUp = ordered[1];

  if (!leader) {
    return {
      status: "ambiguous",
      selection: null,
      probability: null,
      margin: 0,
    };
  }

  if (!runnerUp) {
    return {
      status: "selected",
      selection: leader.selection,
      probability: leader.probability,
      margin: leader.probability,
    };
  }

  const margin = round(leader.probability - runnerUp.probability);

  if (margin <= tolerance) {
    return {
      status: "ambiguous",
      selection: null,
      probability: null,
      margin,
    };
  }

  return {
    status: "selected",
    selection: leader.selection,
    probability: leader.probability,
    margin,
  };
}

function determineOutcome(homeGoals: number, awayGoals: number): MatchOutcome {
  if (homeGoals > awayGoals) {
    return "home";
  }

  if (homeGoals < awayGoals) {
    return "away";
  }

  return "draw";
}

function determineBtts(homeGoals: number, awayGoals: number): BttsSelection {
  return homeGoals > 0 && awayGoals > 0 ? "yes" : "no";
}

function determineOverUnder25(homeGoals: number, awayGoals: number): OverUnder25Selection {
  return homeGoals + awayGoals > 2 ? "over" : "under";
}

function compareSelection<Selection extends string>(
  resolved: ResolvedMarketSelection<Selection>,
  actual: Selection,
) {
  return resolved.status === "selected" ? resolved.selection === actual : null;
}

function describeMetric(label: string, value: boolean | null) {
  if (value === null) {
    return `${label}=ambiguous`;
  }

  return `${label}=${value ? "correct" : "incorrect"}`;
}

export function evaluatePrediction(
  prediction: EvaluablePrediction,
  result: MatchResultInput,
  config: EvaluationConfig = DEFAULT_EVALUATION_CONFIG,
): PredictionEvaluation {
  if (prediction.matchId !== result.matchId) {
    return {
      status: "not_evaluable",
      predictionVersionId: prediction.predictionVersionId,
      matchId: prediction.matchId,
      warnings: [],
      reason: "match_id_mismatch",
      metrics: null,
      errorSummary: "Prediction and match result belong to different matches.",
      predictionResultsPayload: null,
    };
  }

  if (result.verificationStatus !== "verified") {
    return {
      status: "not_evaluable",
      predictionVersionId: prediction.predictionVersionId,
      matchId: prediction.matchId,
      warnings: [],
      reason: "result_not_verified",
      metrics: null,
      errorSummary: "Match result must be verified before evaluation.",
      predictionResultsPayload: null,
    };
  }

  if (result.decisionMethod === "aet" || result.decisionMethod === "pen") {
    return {
      status: "not_evaluable",
      predictionVersionId: prediction.predictionVersionId,
      matchId: prediction.matchId,
      warnings: [],
      reason: "knockout_evaluation_policy_unconfirmed",
      metrics: null,
      errorSummary: "Knockout AET/PEN evaluation is blocked until the settlement policy is confirmed.",
      predictionResultsPayload: null,
    };
  }

  const predictedScore = parseScore(prediction.mostLikelyScore);

  if (!predictedScore) {
    return {
      status: "not_evaluable",
      predictionVersionId: prediction.predictionVersionId,
      matchId: prediction.matchId,
      warnings: [],
      reason: "invalid_predicted_score",
      metrics: null,
      errorSummary: "Most likely score must use the home-away integer format.",
      predictionResultsPayload: null,
    };
  }

  const actualOutcome = determineOutcome(result.homeGoals, result.awayGoals);
  const actualBtts = determineBtts(result.homeGoals, result.awayGoals);
  const actualOverUnder25 = determineOverUnder25(result.homeGoals, result.awayGoals);
  const predictedOutcome = resolveMarketSelection(
    [
      { selection: "home", probability: prediction.probabilities.oneXTwo.homeWin },
      { selection: "draw", probability: prediction.probabilities.oneXTwo.draw },
      { selection: "away", probability: prediction.probabilities.oneXTwo.awayWin },
    ],
    config.tieTolerancePercentagePoints,
  );
  const predictedBtts = resolveMarketSelection(
    [
      { selection: "yes", probability: prediction.probabilities.btts.yes },
      { selection: "no", probability: prediction.probabilities.btts.no },
    ],
    config.tieTolerancePercentagePoints,
  );
  const predictedOverUnder25 = resolveMarketSelection(
    [
      { selection: "over", probability: prediction.probabilities.overUnder25.over },
      { selection: "under", probability: prediction.probabilities.overUnder25.under },
    ],
    config.tieTolerancePercentagePoints,
  );
  const actualScore = `${result.homeGoals}-${result.awayGoals}`;
  const leadingTopScoreline = prediction.topScorelines[0]?.score;
  const warnings =
    leadingTopScoreline && leadingTopScoreline !== prediction.mostLikelyScore
      ? [
          `Input inconsistency: mostLikelyScore ${prediction.mostLikelyScore} differs from topScorelines leader ${leadingTopScoreline}.`,
        ]
      : [];
  const winnerCorrect = compareSelection(predictedOutcome, actualOutcome);
  const bttsCorrect = compareSelection(predictedBtts, actualBtts);
  const over25Correct = compareSelection(predictedOverUnder25, actualOverUnder25);
  const exactScoreCorrect = prediction.mostLikelyScore === actualScore;
  const goalError =
    Math.abs(predictedScore.homeGoals - result.homeGoals) +
    Math.abs(predictedScore.awayGoals - result.awayGoals);
  const errorSummary = [
    `Predicted score ${prediction.mostLikelyScore}; actual score ${actualScore}.`,
    describeMetric("winner", winnerCorrect),
    describeMetric("btts", bttsCorrect),
    describeMetric("over_2_5", over25Correct),
    describeMetric("exact_score", exactScoreCorrect),
    `goal_error=${goalError}.`,
  ].join(" ");
  const evaluation: EvaluablePredictionEvaluation = {
    status: "evaluable",
    predictionVersionId: prediction.predictionVersionId,
    matchId: prediction.matchId,
    warnings,
    actual: {
      score: actualScore,
      outcome: actualOutcome,
      btts: actualBtts,
      overUnder25: actualOverUnder25,
    },
    predicted: {
      score: prediction.mostLikelyScore,
      outcome: predictedOutcome,
      btts: predictedBtts,
      overUnder25: predictedOverUnder25,
      exactScore: {
        status: "selected",
        selection: prediction.mostLikelyScore,
        probability: null,
        margin: 0,
      },
    },
    metrics: {
      winnerCorrect,
      bttsCorrect,
      over25Correct,
      exactScoreCorrect,
      goalError,
    },
    errorSummary,
    predictionResultsPayload: {
      prediction_version_id: prediction.predictionVersionId,
      actual_home_goals: result.homeGoals,
      actual_away_goals: result.awayGoals,
      winner_correct: winnerCorrect,
      btts_correct: bttsCorrect,
      over_2_5_correct: over25Correct,
      exact_score_correct: exactScoreCorrect,
      goal_error: goalError,
      error_summary: errorSummary,
    },
  };

  return evaluation;
}
