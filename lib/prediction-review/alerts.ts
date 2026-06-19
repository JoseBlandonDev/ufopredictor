import { isRetainedPredictionReviewFixture } from "./fixtures";
import type {
  PredictionReviewAlert,
  PredictionReviewBundle,
  PredictionReviewCoherenceFixture,
  PredictionReviewThresholds,
  ReviewSignalChangeCategory,
} from "./types";

export const DEFAULT_PREDICTION_REVIEW_THRESHOLDS: PredictionReviewThresholds = {
  maxOneXTwoDeltaPct: 8,
  expectedGoalsDelta: 0.35,
  modalScoreGoalDelta: 1,
  coherenceWatchGapPct: 10,
  coherenceManualReviewGapPct: 20,
  coherenceCriticalGapPct: 30,
};

function getFavorite(bundle: PredictionReviewBundle) {
  if (bundle.homeWinProb === bundle.awayWinProb) {
    return "draw";
  }

  return bundle.homeWinProb > bundle.awayWinProb ? "home" : "away";
}

function parseScore(value: string) {
  const match = /^(\d+)-(\d+)$/.exec(value);
  if (!match) {
    return null;
  }

  return {
    home: Number(match[1]),
    away: Number(match[2]),
  };
}

function classifyProbabilityPair(yes: number, no: number) {
  return yes >= no ? "yes" : "no";
}

function buildAlert(
  alert: Omit<PredictionReviewAlert, "code"> & { code?: string },
): PredictionReviewAlert {
  return {
    code: alert.code ?? alert.type,
    ...alert,
  };
}

export function calculateRefreshDeltaAlerts(args: {
  currentPrediction: PredictionReviewBundle | null;
  shadowPrediction: PredictionReviewBundle | null;
  thresholds?: PredictionReviewThresholds;
  homeSignalChangeCategory?: ReviewSignalChangeCategory;
  awaySignalChangeCategory?: ReviewSignalChangeCategory;
  homeTeamName: string;
  awayTeamName: string;
}) {
  const alerts: PredictionReviewAlert[] = [];
  const thresholds = args.thresholds ?? DEFAULT_PREDICTION_REVIEW_THRESHOLDS;
  const current = args.currentPrediction;
  const shadow = args.shadowPrediction;

  if (isRetainedPredictionReviewFixture(args.homeTeamName, args.awayTeamName)) {
    alerts.push(
      buildAlert({
        type: "retained_fixture_override",
        category: "retained_fixture",
        severity: "manual_review",
        label: "Retained fixture override",
        description: "This fixture remains a review candidate even when refresh deltas look small.",
      }),
    );
  }

  if (!current || !shadow) {
    return alerts;
  }

  const currentFavorite = getFavorite(current);
  const shadowFavorite = getFavorite(shadow);
  if (currentFavorite !== shadowFavorite) {
    alerts.push(
      buildAlert({
        type: "favorite_changed",
        category: "refresh_delta",
        severity: "critical",
        label: "Favorite changed",
        description: `Current favorite ${currentFavorite} changed to ${shadowFavorite}.`,
      }),
    );
  }

  const maxOneXTwoDelta = Math.max(
    Math.abs(current.homeWinProb - shadow.homeWinProb),
    Math.abs(current.drawProb - shadow.drawProb),
    Math.abs(current.awayWinProb - shadow.awayWinProb),
  );
  if (maxOneXTwoDelta > thresholds.maxOneXTwoDeltaPct) {
    alerts.push(
      buildAlert({
        type: "max_one_x_two_delta",
        category: "refresh_delta",
        severity: maxOneXTwoDelta >= thresholds.maxOneXTwoDeltaPct * 2 ? "critical" : "manual_review",
        label: "1X2 delta exceeded threshold",
        description: `Maximum 1X2 delta reached ${maxOneXTwoDelta.toFixed(1)} pp.`,
        metadata: { maxOneXTwoDelta },
      }),
    );
  }

  const homeXgDelta = Math.abs(current.expectedHomeGoals - shadow.expectedHomeGoals);
  if (homeXgDelta >= thresholds.expectedGoalsDelta) {
    alerts.push(
      buildAlert({
        type: "home_xg_delta",
        category: "refresh_delta",
        severity: homeXgDelta >= thresholds.expectedGoalsDelta * 2 ? "critical" : "manual_review",
        label: "Home xG changed materially",
        description: `Home xG moved by ${homeXgDelta.toFixed(2)}.`,
        metadata: { homeXgDelta },
      }),
    );
  }

  const awayXgDelta = Math.abs(current.expectedAwayGoals - shadow.expectedAwayGoals);
  if (awayXgDelta >= thresholds.expectedGoalsDelta) {
    alerts.push(
      buildAlert({
        type: "away_xg_delta",
        category: "refresh_delta",
        severity: awayXgDelta >= thresholds.expectedGoalsDelta * 2 ? "critical" : "manual_review",
        label: "Away xG changed materially",
        description: `Away xG moved by ${awayXgDelta.toFixed(2)}.`,
        metadata: { awayXgDelta },
      }),
    );
  }

  const currentScore = parseScore(current.mostLikelyScore);
  const shadowScore = parseScore(shadow.mostLikelyScore);
  if (currentScore && shadowScore) {
    const scoreDelta = Math.max(
      Math.abs(currentScore.home - shadowScore.home),
      Math.abs(currentScore.away - shadowScore.away),
    );
    if (scoreDelta >= thresholds.modalScoreGoalDelta) {
      alerts.push(
        buildAlert({
          type: "modal_score_changed",
          category: "refresh_delta",
          severity: scoreDelta >= thresholds.modalScoreGoalDelta + 1 ? "critical" : "manual_review",
          label: "Modal score changed materially",
          description: `Most likely score moved from ${current.mostLikelyScore} to ${shadow.mostLikelyScore}.`,
        }),
      );
    }
  }

  if (
    classifyProbabilityPair(current.bttsYesProb, current.bttsNoProb) !==
    classifyProbabilityPair(shadow.bttsYesProb, shadow.bttsNoProb)
  ) {
    alerts.push(
      buildAlert({
        type: "btts_changed",
        category: "refresh_delta",
        severity: "manual_review",
        label: "BTTS classification changed",
        description: "BTTS yes/no classification flipped between the current and shadow versions.",
      }),
    );
  }

  if (
    classifyProbabilityPair(current.over25Prob, current.under25Prob) !==
    classifyProbabilityPair(shadow.over25Prob, shadow.under25Prob)
  ) {
    alerts.push(
      buildAlert({
        type: "over_under_changed",
        category: "refresh_delta",
        severity: "manual_review",
        label: "O/U 2.5 classification changed",
        description: "Over/Under 2.5 classification flipped between the current and shadow versions.",
      }),
    );
  }

  if (current.confidenceBucket !== shadow.confidenceBucket) {
    alerts.push(
      buildAlert({
        type: "confidence_changed",
        category: "refresh_delta",
        severity: "watch",
        label: "Confidence bucket changed",
        description: `Confidence bucket changed from ${current.confidenceBucket} to ${shadow.confidenceBucket}.`,
      }),
    );
  }

  if (current.riskLevel !== shadow.riskLevel) {
    alerts.push(
      buildAlert({
        type: "risk_changed",
        category: "refresh_delta",
        severity: "watch",
        label: "Risk bucket changed",
        description: `Risk changed from ${current.riskLevel} to ${shadow.riskLevel}.`,
      }),
    );
  }

  const strongestSignalChange =
    args.homeSignalChangeCategory === "critical" || args.awaySignalChangeCategory === "critical"
      ? "critical"
      : args.homeSignalChangeCategory === "material" || args.awaySignalChangeCategory === "material"
        ? "material"
        : "none";

  if (strongestSignalChange !== "none") {
    alerts.push(
      buildAlert({
        type: "team_signal_change",
        category: "refresh_delta",
        severity: strongestSignalChange === "critical" ? "critical" : "manual_review",
        label: "V1 to V2 team signal change",
        description: "At least one team carried a material or critical source-signal change.",
      }),
    );
  }

  return alerts;
}

export function calculateExternalCoherenceAlerts(args: {
  prediction: PredictionReviewBundle | null;
  coherenceFixture: PredictionReviewCoherenceFixture | null;
  thresholds?: PredictionReviewThresholds;
}) {
  const thresholds = args.thresholds ?? DEFAULT_PREDICTION_REVIEW_THRESHOLDS;
  const alerts: PredictionReviewAlert[] = [];
  const prediction = args.prediction;
  const coherence = args.coherenceFixture;

  if (!prediction || !coherence) {
    return alerts;
  }

  const homeDecisiveDenominator = prediction.homeWinProb + prediction.awayWinProb;
  if (homeDecisiveDenominator <= 0) {
    return alerts;
  }

  const ufoDecisiveHomePct = (prediction.homeWinProb / homeDecisiveDenominator) * 100;
  const eloHomePct = coherence.eloWinningExpectancyA;
  const gap = Math.abs(ufoDecisiveHomePct - eloHomePct);
  const ufoFavorite = prediction.homeWinProb >= prediction.awayWinProb ? "home" : "away";
  const eloFavorite = coherence.eloWinningExpectancyA >= coherence.eloWinningExpectancyB ? "home" : "away";

  if (ufoFavorite !== eloFavorite) {
    alerts.push(
      buildAlert({
        type: "elo_inversion",
        category: "external_coherence",
        severity: "critical",
        label: "Critical favorite inversion",
        description: "UFO and Elo disagree on the decisive favorite.",
        metadata: { ufoDecisiveHomePct, eloHomePct, gap },
      }),
    );
    return alerts;
  }

  if (gap > thresholds.coherenceCriticalGapPct) {
    alerts.push(
      buildAlert({
        type: "elo_gap",
        category: "external_coherence",
        severity: "critical",
        label: "Critical Elo coherence gap",
        description: `UFO decisive home share differs from Elo expectancy by ${gap.toFixed(1)} pp.`,
        metadata: { ufoDecisiveHomePct, eloHomePct, gap },
      }),
    );
  } else if (gap > thresholds.coherenceManualReviewGapPct) {
    alerts.push(
      buildAlert({
        type: "elo_gap",
        category: "external_coherence",
        severity: "manual_review",
        label: "Manual review Elo gap",
        description: `UFO decisive home share differs from Elo expectancy by ${gap.toFixed(1)} pp.`,
        metadata: { ufoDecisiveHomePct, eloHomePct, gap },
      }),
    );
  } else if (gap > thresholds.coherenceWatchGapPct) {
    alerts.push(
      buildAlert({
        type: "elo_gap",
        category: "external_coherence",
        severity: "watch",
        label: "Watch Elo coherence gap",
        description: `UFO decisive home share differs from Elo expectancy by ${gap.toFixed(1)} pp.`,
        metadata: { ufoDecisiveHomePct, eloHomePct, gap },
      }),
    );
  }

  return alerts;
}
