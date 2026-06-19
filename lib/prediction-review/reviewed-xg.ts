import { DEFAULT_PREDICTION_ENGINE_CONFIG } from "../prediction-engine/config";
import { buildFactors, calculateConfidenceAndRisk } from "../prediction-engine/confidence-risk";
import { calculateMarkets, reconcileDrawMarket, selectTopScorelines } from "../prediction-engine/markets";
import { normalizeInput } from "../prediction-engine/normalize";
import { buildScoreMatrix } from "../prediction-engine/poisson";
import { calculateTeamPower } from "../prediction-engine/team-power";
import type { MatchPredictionInput, PredictionEngineConfig } from "../prediction-engine/types";
import { REVIEW_XG_BOUNDS, SIGNAL_SOURCE_SNAPSHOT_ID } from "./constants";
import type { PredictionReviewAiResponse, PredictionReviewBundle } from "./types";

function formatBound(value: number) {
  return value.toFixed(2);
}

export function determinePredictionReviewFavorite(bundle: Pick<PredictionReviewBundle, "homeWinProb" | "awayWinProb" | "drawProb">) {
  if (bundle.homeWinProb > bundle.awayWinProb && bundle.homeWinProb > bundle.drawProb) {
    return "home";
  }

  if (bundle.awayWinProb > bundle.homeWinProb && bundle.awayWinProb > bundle.drawProb) {
    return "away";
  }

  return "draw";
}

export function validateReviewedXgBounds(args: {
  homeXg: number;
  awayXg: number;
  baseline?: Pick<PredictionReviewBundle, "expectedHomeGoals" | "expectedAwayGoals"> | null;
}) {
  const violations: string[] = [];

  if (!Number.isFinite(args.homeXg)) {
    violations.push("El xG local debe ser un numero finito.");
  }

  if (!Number.isFinite(args.awayXg)) {
    violations.push("El xG visitante debe ser un numero finito.");
  }

  if (Number.isFinite(args.homeXg) && args.homeXg < 0) {
    violations.push("El xG local no puede ser negativo.");
  }

  if (Number.isFinite(args.awayXg) && args.awayXg < 0) {
    violations.push("El xG visitante no puede ser negativo.");
  }

  if (
    Number.isFinite(args.homeXg) &&
    (args.homeXg < REVIEW_XG_BOUNDS.minPerTeam || args.homeXg > REVIEW_XG_BOUNDS.maxPerTeam)
  ) {
    violations.push(
      `El xG local debe mantenerse dentro de ${formatBound(REVIEW_XG_BOUNDS.minPerTeam)}..${formatBound(REVIEW_XG_BOUNDS.maxPerTeam)}.`,
    );
  }

  if (
    Number.isFinite(args.awayXg) &&
    (args.awayXg < REVIEW_XG_BOUNDS.minPerTeam || args.awayXg > REVIEW_XG_BOUNDS.maxPerTeam)
  ) {
    violations.push(
      `El xG visitante debe mantenerse dentro de ${formatBound(REVIEW_XG_BOUNDS.minPerTeam)}..${formatBound(REVIEW_XG_BOUNDS.maxPerTeam)}.`,
    );
  }

  const combinedXg = args.homeXg + args.awayXg;
  if (
    Number.isFinite(args.homeXg) &&
    Number.isFinite(args.awayXg) &&
    (combinedXg < REVIEW_XG_BOUNDS.minCombined || combinedXg > REVIEW_XG_BOUNDS.maxCombined)
  ) {
    violations.push(
      `El xG total debe mantenerse dentro de ${formatBound(REVIEW_XG_BOUNDS.minCombined)}..${formatBound(REVIEW_XG_BOUNDS.maxCombined)}.`,
    );
  }

  if (args.baseline) {
    const homeDelta = Math.abs(args.homeXg - args.baseline.expectedHomeGoals);
    const awayDelta = Math.abs(args.awayXg - args.baseline.expectedAwayGoals);
    if (Number.isFinite(homeDelta) && homeDelta > REVIEW_XG_BOUNDS.maxAbsDeltaPerTeam) {
      violations.push(
        `La variacion de xG local frente a la linea base no puede superar ${formatBound(REVIEW_XG_BOUNDS.maxAbsDeltaPerTeam)}.`,
      );
    }

    if (Number.isFinite(awayDelta) && awayDelta > REVIEW_XG_BOUNDS.maxAbsDeltaPerTeam) {
      violations.push(
        `La variacion de xG visitante frente a la linea base no puede superar ${formatBound(REVIEW_XG_BOUNDS.maxAbsDeltaPerTeam)}.`,
      );
    }

    if (Number.isFinite(homeDelta) && Number.isFinite(awayDelta) && homeDelta + awayDelta > REVIEW_XG_BOUNDS.maxTotalAbsDelta) {
      violations.push(
        `La suma de variaciones absolutas de xG no puede superar ${formatBound(REVIEW_XG_BOUNDS.maxTotalAbsDelta)}.`,
      );
    }
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}

function toConfidenceBucket(value: number): PredictionReviewBundle["confidenceBucket"] {
  if (value >= 67) {
    return "high";
  }

  if (value >= 45) {
    return "medium";
  }

  return "low";
}

export function buildReviewedXgPredictionBundle(args: {
  input: MatchPredictionInput;
  homeXg: number;
  awayXg: number;
  config?: PredictionEngineConfig;
  provenanceLabel?: string;
}): PredictionReviewBundle {
  const config = args.config ?? DEFAULT_PREDICTION_ENGINE_CONFIG;
  const normalizedInput = normalizeInput(args.input, config);
  const teamPower = {
    home: calculateTeamPower(normalizedInput.homeTeam, config),
    away: calculateTeamPower(normalizedInput.awayTeam, config),
  };
  const expectedGoals = {
    home: args.homeXg,
    away: args.awayXg,
  };
  const scoreMatrix = buildScoreMatrix(expectedGoals, config.maxGoalsInMatrix);
  const topScorelines = selectTopScorelines(scoreMatrix, config.topScorelinesLimit);
  const probabilities = reconcileDrawMarket(calculateMarkets(scoreMatrix), expectedGoals, topScorelines, config);
  const { confidence, risk, outcomeMargin } = calculateConfidenceAndRisk(normalizedInput, probabilities);
  const factors = buildFactors(normalizedInput, teamPower, expectedGoals, outcomeMargin);

  return {
    kind: "reviewed_xg_preview",
    predictionVersionId: null,
    modelVersionId: null,
    modelVersionLabel: config.modelVersion,
    sourceSnapshotId: SIGNAL_SOURCE_SNAPSHOT_ID,
    predictionType: normalizedInput.predictionType,
    runScope: "review_preview",
    homeWinProb: probabilities.oneXTwo.homeWin,
    drawProb: probabilities.oneXTwo.draw,
    awayWinProb: probabilities.oneXTwo.awayWin,
    expectedHomeGoals: expectedGoals.home,
    expectedAwayGoals: expectedGoals.away,
    mostLikelyScore: topScorelines[0]?.score ?? "0-0",
    topScorelines,
    bttsYesProb: probabilities.btts.yes,
    bttsNoProb: probabilities.btts.no,
    over25Prob: probabilities.overUnder25.over,
    under25Prob: probabilities.overUnder25.under,
    confidenceScore: confidence,
    confidenceBucket: toConfidenceBucket(confidence),
    riskLevel: risk,
    notes: normalizedInput.notes,
    factors,
    provenanceLabel: args.provenanceLabel ?? "Reviewed xG preview",
  };
}

export function normalizeAiReviewedXgDecision(args: {
  response: PredictionReviewAiResponse;
  baseline?: Pick<PredictionReviewBundle, "expectedHomeGoals" | "expectedAwayGoals"> | null;
}): PredictionReviewAiResponse {
  if (
    args.response.decision !== "PROPOSE_REVIEWED_XG" ||
    args.response.proposedHomeXg === null ||
    args.response.proposedAwayXg === null
  ) {
    return args.response;
  }

  const validation = validateReviewedXgBounds({
    homeXg: args.response.proposedHomeXg,
    awayXg: args.response.proposedAwayXg,
    baseline: args.baseline,
  });

  if (validation.valid) {
    return args.response;
  }

  return {
    ...args.response,
    decision: "HOLD",
    proposedHomeXg: null,
    proposedAwayXg: null,
    warnings: [
      ...args.response.warnings,
      `Reviewed xG fuera de limites: ${validation.violations.join(" | ")}`,
    ],
    rationale: `${args.response.rationale} Proposed reviewed xG was rejected by bounded validation.`,
    humanApprovalRequired: true,
  };
}
