export type MatchOutcome = "home" | "draw" | "away";
export type BttsSelection = "yes" | "no";
export type OverUnder25Selection = "over" | "under";
export type VerificationStatus = "pending_review" | "verified" | "rejected";

export type ProbabilityOption<Selection extends string> = {
  selection: Selection;
  probability: number;
};

export type ScorelineProjection = {
  score: string;
  probability: number;
};

export type EvaluablePrediction = {
  predictionVersionId: string;
  matchId: string;
  probabilities: {
    oneXTwo: {
      homeWin: number;
      draw: number;
      awayWin: number;
    };
    btts: {
      yes: number;
      no: number;
    };
    overUnder25: {
      over: number;
      under: number;
    };
  };
  mostLikelyScore: string;
  topScorelines: ScorelineProjection[];
};

export type MatchResultInput = {
  matchId: string;
  homeGoals: number;
  awayGoals: number;
  verificationStatus: VerificationStatus;
};

export type EvaluationConfig = {
  tieTolerancePercentagePoints: number;
};

export type ResolvedMarketSelection<Selection extends string> =
  | {
      status: "selected";
      selection: Selection;
      probability: number | null;
      margin: number;
    }
  | {
      status: "ambiguous";
      selection: null;
      probability: null;
      margin: number;
    };

export type PredictionResultsPayload = {
  prediction_version_id: string;
  actual_home_goals: number;
  actual_away_goals: number;
  winner_correct: boolean | null;
  btts_correct: boolean | null;
  over_2_5_correct: boolean | null;
  exact_score_correct: boolean | null;
  goal_error: number;
  error_summary: string;
};

export type EvaluablePredictionEvaluation = {
  status: "evaluable";
  predictionVersionId: string;
  matchId: string;
  warnings: string[];
  actual: {
    score: string;
    outcome: MatchOutcome;
    btts: BttsSelection;
    overUnder25: OverUnder25Selection;
  };
  predicted: {
    score: string;
    outcome: ResolvedMarketSelection<MatchOutcome>;
    btts: ResolvedMarketSelection<BttsSelection>;
    overUnder25: ResolvedMarketSelection<OverUnder25Selection>;
    exactScore: ResolvedMarketSelection<string>;
  };
  metrics: {
    winnerCorrect: boolean | null;
    bttsCorrect: boolean | null;
    over25Correct: boolean | null;
    exactScoreCorrect: boolean | null;
    goalError: number;
  };
  errorSummary: string;
  predictionResultsPayload: PredictionResultsPayload;
};

export type NonEvaluablePredictionEvaluation = {
  status: "not_evaluable";
  predictionVersionId: string;
  matchId: string;
  warnings: string[];
  reason: "result_not_verified" | "invalid_predicted_score" | "match_id_mismatch";
  metrics: null;
  errorSummary: string;
  predictionResultsPayload: null;
};

export type PredictionEvaluation = EvaluablePredictionEvaluation | NonEvaluablePredictionEvaluation;

export type AccuracyMetric = {
  correct: number;
  evaluated: number;
  accuracy: number | null;
};

export type AggregatedEvaluationMetrics = {
  totalEvaluable: number;
  totalNonEvaluable: number;
  winnerAccuracy: AccuracyMetric;
  bttsAccuracy: AccuracyMetric;
  over25Accuracy: AccuracyMetric;
  exactScoreAccuracy: AccuracyMetric;
  averageGoalError: number | null;
};
