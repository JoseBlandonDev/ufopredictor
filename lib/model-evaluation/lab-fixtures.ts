import type { EvaluablePrediction, MatchResultInput } from "./types";

export const homeWinPrediction: EvaluablePrediction = {
  predictionVersionId: "prediction-home-win",
  matchId: "match-home-win",
  probabilities: {
    oneXTwo: { homeWin: 62, draw: 22, awayWin: 16 },
    btts: { yes: 38, no: 62 },
    overUnder25: { over: 35, under: 65 },
  },
  mostLikelyScore: "2-0",
  topScorelines: [
    { score: "2-0", probability: 17 },
    { score: "1-0", probability: 14 },
    { score: "2-1", probability: 10 },
  ],
};

export const homeWinVerifiedResult: MatchResultInput = {
  matchId: "match-home-win",
  homeGoals: 2,
  awayGoals: 0,
  verificationStatus: "verified",
};

export const drawPrediction: EvaluablePrediction = {
  predictionVersionId: "prediction-draw",
  matchId: "match-draw",
  probabilities: {
    oneXTwo: { homeWin: 28, draw: 45, awayWin: 27 },
    btts: { yes: 60, no: 40 },
    overUnder25: { over: 32, under: 68 },
  },
  mostLikelyScore: "1-1",
  topScorelines: [
    { score: "1-1", probability: 18 },
    { score: "0-0", probability: 12 },
    { score: "1-0", probability: 10 },
  ],
};

export const drawVerifiedResult: MatchResultInput = {
  matchId: "match-draw",
  homeGoals: 1,
  awayGoals: 1,
  verificationStatus: "verified",
};

export const awayWinPrediction: EvaluablePrediction = {
  predictionVersionId: "prediction-away-win",
  matchId: "match-away-win",
  probabilities: {
    oneXTwo: { homeWin: 18, draw: 20, awayWin: 62 },
    btts: { yes: 55, no: 45 },
    overUnder25: { over: 61, under: 39 },
  },
  mostLikelyScore: "1-2",
  topScorelines: [
    { score: "1-2", probability: 16 },
    { score: "0-2", probability: 13 },
    { score: "1-1", probability: 9 },
  ],
};

export const awayWinVerifiedResult: MatchResultInput = {
  matchId: "match-away-win",
  homeGoals: 1,
  awayGoals: 3,
  verificationStatus: "verified",
};

export const ambiguousPrediction: EvaluablePrediction = {
  predictionVersionId: "prediction-ambiguous",
  matchId: "match-ambiguous",
  probabilities: {
    oneXTwo: { homeWin: 35, draw: 35.005, awayWin: 29.995 },
    btts: { yes: 50, no: 50 },
    overUnder25: { over: 50.004, under: 49.996 },
  },
  mostLikelyScore: "1-1",
  topScorelines: [
    { score: "1-1", probability: 16 },
    { score: "0-0", probability: 15.995 },
    { score: "0-1", probability: 10 },
  ],
};

export const ambiguousVerifiedResult: MatchResultInput = {
  matchId: "match-ambiguous",
  homeGoals: 1,
  awayGoals: 1,
  verificationStatus: "verified",
};

export const unverifiedResult: MatchResultInput = {
  ...homeWinVerifiedResult,
  verificationStatus: "pending_review",
};

export const inconsistentScorePrediction: EvaluablePrediction = {
  ...homeWinPrediction,
  predictionVersionId: "prediction-inconsistent-score",
  matchId: "match-inconsistent-score",
  mostLikelyScore: "2-0",
  topScorelines: [
    { score: "1-0", probability: 18 },
    { score: "2-0", probability: 17 },
    { score: "1-1", probability: 10 },
  ],
};

export const inconsistentScoreVerifiedResult: MatchResultInput = {
  matchId: "match-inconsistent-score",
  homeGoals: 1,
  awayGoals: 0,
  verificationStatus: "verified",
};
