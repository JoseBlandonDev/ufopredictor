export type RiskLevel = "low" | "medium" | "high";

export type ScoreProbability = {
  score: string;
  probability: number;
};

export type OneXTwoProbabilities = {
  homeWin: number;
  draw: number;
  awayWin: number;
};

export type MarketProbability = {
  selection: string;
  modelProbability: number;
  marketProbability: number;
  edge: number;
  label: "no edge" | "slight edge" | "notable edge" | "strong edge";
};

export type PredictionTimelinePoint = {
  label: string;
  timestamp: string;
  homeWin: number;
  draw: number;
  awayWin: number;
  note: string;
};

export type GoldenHourDelta = {
  homeDelta: number;
  drawDelta: number;
  awayDelta: number;
  reason: string;
};

export type Prediction = {
  id: string;
  matchId: string;
  modelVersion: "mock-v0.1";
  probabilities: OneXTwoProbabilities;
  expectedGoals: {
    home: number;
    away: number;
  };
  mostLikelyScore: string;
  topScores: ScoreProbability[];
  overUnder25: {
    over: number;
    under: number;
  };
  btts: {
    yes: number;
    no: number;
  };
  confidenceScore: number;
  riskLevel: RiskLevel;
  modelVsMarket: MarketProbability[];
  timeline: PredictionTimelinePoint[];
  goldenHourDelta: GoldenHourDelta;
  freeSummary: string;
  premiumAnalysis: string;
  whyItChanged: string;
  generatedAt: string;
};

export type PerformanceMetric = {
  label: string;
  value: string;
  detail: string;
};

export type PastPrediction = {
  match: string;
  market: string;
  prediction: string;
  result: string;
  status: "hit" | "miss" | "pending";
};
