export type TeamSignalKey =
  | "ratingScore"
  | "recentFormScore"
  | "attackScore"
  | "defenseScore"
  | "marketScore"
  | "lineupContextScore";

export type PredictionRunScope = "public_product" | "internal_lab";
export type PredictionType = "pre_match_24h" | "pre_match_6h" | "post_lineup" | "pre_kickoff";
export type RiskLevel = "low" | "medium" | "high";

export type TeamPredictionInput = {
  id: string;
  name: string;
  signals?: Partial<Record<TeamSignalKey, number | null>>;
};

export type MatchPredictionInput = {
  matchId: string;
  homeTeam: TeamPredictionInput;
  awayTeam: TeamPredictionInput;
  context?: {
    neutralVenue?: boolean;
    homeAdvantageScore?: number | null;
  };
  runScope?: PredictionRunScope;
  predictionType?: PredictionType;
};

export type PredictionEngineWeights = Record<TeamSignalKey, number>;

export type PredictionEngineConfig = {
  modelVersion: string;
  baseGoalRate: number;
  minExpectedGoals: number;
  maxExpectedGoals: number;
  maxGoalsInMatrix: number;
  topScorelinesLimit: number;
  defaultSignalScore: number;
  defaultHomeAdvantageScore: number;
  weights: PredictionEngineWeights;
};

export type NormalizedTeamInput = {
  id: string;
  name: string;
  signals: Record<TeamSignalKey, number>;
  providedSignals: TeamSignalKey[];
  defaultedSignals: TeamSignalKey[];
};

export type NormalizedMatchInput = {
  matchId: string;
  homeTeam: NormalizedTeamInput;
  awayTeam: NormalizedTeamInput;
  context: {
    neutralVenue: boolean;
    homeAdvantageScore: number;
  };
  runScope: PredictionRunScope;
  predictionType: PredictionType;
  dataCompleteness: number;
  notes: string[];
};

export type TeamPowerResult = {
  score: number;
  contributions: Record<TeamSignalKey, number>;
};

export type ExpectedGoalsResult = {
  home: number;
  away: number;
};

export type ScorelineProbability = {
  homeGoals: number;
  awayGoals: number;
  score: string;
  probability: number;
};

export type MarketProjection = {
  market: "match_winner" | "over_2_5" | "btts" | "exact_score";
  selection: string;
  probability: number;
  confidence: number | null;
};

export type PredictionEngineOutput = {
  modelVersion: string;
  matchId: string;
  normalizedInput: NormalizedMatchInput;
  teamPower: {
    home: TeamPowerResult;
    away: TeamPowerResult;
  };
  expectedGoals: ExpectedGoalsResult;
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
  topScorelines: ScorelineProbability[];
  mostLikelyScore: string;
  confidence: number;
  risk: RiskLevel;
  factors: string[];
  notes: string[];
  predictionVersionProjection: {
    predictionType: PredictionType;
    runScope: PredictionRunScope;
    homeWinProb: number;
    drawProb: number;
    awayWinProb: number;
    expectedHomeGoals: number;
    expectedAwayGoals: number;
    mostLikelyScore: string;
    topScoresJson: ScorelineProbability[];
    confidenceScore: number;
    riskLevel: RiskLevel;
  };
  predictionMarketsProjection: MarketProjection[];
};

export type ScoreMatrixCell = {
  homeGoals: number;
  awayGoals: number;
  probability: number;
};
