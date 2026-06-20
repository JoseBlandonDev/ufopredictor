import { isDirectionalOutcomeLeader } from "./anomaly-outcome";
import type {
  AtypicalFixtureDetectorInput,
  AtypicalFixtureFlag,
  AtypicalFixtureFlagCode,
  AtypicalFixtureLevelFavorite,
  AtypicalFixtureSeverity,
  OutcomeLeader,
} from "./types";

export const ATYPICAL_FIXTURE_ONE_X_TWO_TOLERANCE = 0.75;
export const ATYPICAL_FIXTURE_XG_LEVEL_EPSILON = 0.2;
export const ATYPICAL_FIXTURE_FAVORITE_MARGIN_PCT = 7;
export const ATYPICAL_FIXTURE_DOMINANT_INVERSION_MARGIN_PCT = 12;
export const ATYPICAL_FIXTURE_MODAL_FAVORITE_MARGIN_PCT = 7;

const FAMILY_CAPS = {
  SOURCE_INTEGRITY: 40,
  EXTERNAL_COHERENCE: 45,
  SIGNAL_DYNAMICS: 25,
  INTERNAL_COHERENCE: 35,
  PRESENTATION: 20,
} as const;

const SEVERITY_ORDER: Record<AtypicalFixtureSeverity, number> = {
  NONE: 0,
  WATCH: 1,
  REVIEW: 2,
  CRITICAL: 3,
};

function round(value: number, digits = 4) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function isFiniteNumber(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function compareSeverity(left: AtypicalFixtureSeverity, right: AtypicalFixtureSeverity) {
  return SEVERITY_ORDER[right] - SEVERITY_ORDER[left];
}

export function compareFlags(left: AtypicalFixtureFlag, right: AtypicalFixtureFlag) {
  const severityDelta = compareSeverity(left.severity, right.severity);
  if (severityDelta !== 0) {
    return severityDelta;
  }

  if (left.points !== right.points) {
    return right.points - left.points;
  }

  return left.code.localeCompare(right.code);
}

function pushFlag(
  flags: Map<AtypicalFixtureFlagCode, AtypicalFixtureFlag>,
  flag: AtypicalFixtureFlag,
) {
  const existing = flags.get(flag.code);
  if (!existing || compareFlags(flag, existing) < 0) {
    flags.set(flag.code, flag);
  }
}

function computeFamilyScore(flags: AtypicalFixtureFlag[]) {
  const totals = {
    SOURCE_INTEGRITY: 0,
    EXTERNAL_COHERENCE: 0,
    SIGNAL_DYNAMICS: 0,
    INTERNAL_COHERENCE: 0,
    PRESENTATION: 0,
  };

  for (const flag of flags) {
    totals[flag.family] += flag.points;
  }

  return Object.entries(totals).reduce((sum, [family, points]) => {
    return sum + Math.min(points, FAMILY_CAPS[family as keyof typeof FAMILY_CAPS]);
  }, 0);
}

export function toSeverity(score: number): AtypicalFixtureSeverity {
  if (score >= 45) {
    return "CRITICAL";
  }

  if (score >= 25) {
    return "REVIEW";
  }

  if (score >= 10) {
    return "WATCH";
  }

  return "NONE";
}

export function favoriteFromExpectedGoals(home: number, away: number): AtypicalFixtureLevelFavorite {
  const difference = home - away;

  if (Math.abs(difference) < ATYPICAL_FIXTURE_XG_LEVEL_EPSILON) {
    return "LEVEL";
  }

  return difference > 0 ? "HOME" : "AWAY";
}

export function outcomeFromModalScore(homeGoals: number, awayGoals: number): Exclude<OutcomeLeader, "TIE"> {
  if (homeGoals > awayGoals) {
    return "HOME";
  }

  if (awayGoals > homeGoals) {
    return "AWAY";
  }

  return "DRAW";
}

export function computeAnomalyScore(flags: AtypicalFixtureFlag[]) {
  return clamp(computeFamilyScore(flags), 0, 100);
}

export function evaluateAnomalyFlags(args: {
  input: AtypicalFixtureDetectorInput;
  favorite: OutcomeLeader;
  topOutcomePct: number;
  topTwoSpreadPp: number;
  decisiveHomeSharePct: number;
  xgFavorite: AtypicalFixtureLevelFavorite;
  modalOutcome: Exclude<OutcomeLeader, "TIE">;
  safeHomePct: number;
  safeAwayPct: number;
  safeHomeXg: number;
  safeAwayXg: number;
}) {
  const { input } = args;
  const flags = new Map<AtypicalFixtureFlagCode, AtypicalFixtureFlag>();

  const homePct = input.evidence.oneXtwo.homePct;
  const drawPct = input.evidence.oneXtwo.drawPct;
  const awayPct = input.evidence.oneXtwo.awayPct;
  if (
    !isFiniteNumber(homePct) ||
    !isFiniteNumber(drawPct) ||
    !isFiniteNumber(awayPct)
  ) {
    pushFlag(flags, {
      code: "REQUIRED_EVIDENCE_MISSING",
      family: "SOURCE_INTEGRITY",
      severity: "CRITICAL",
      points: 25,
      explanation: "Required 1X2 evidence is missing for this fixture.",
      evidenceRefs: ["prediction.homeWinProb", "prediction.drawProb", "prediction.awayWinProb"],
    });
  } else if (Math.abs(homePct + drawPct + awayPct - 100) > ATYPICAL_FIXTURE_ONE_X_TWO_TOLERANCE) {
    pushFlag(flags, {
      code: "INVALID_PROBABILITY_BUNDLE",
      family: "SOURCE_INTEGRITY",
      severity: "CRITICAL",
      points: 25,
      explanation: "The 1X2 bundle does not sum to approximately 100 on the expected 0..100 scale.",
      evidenceRefs: ["prediction.homeWinProb", "prediction.drawProb", "prediction.awayWinProb"],
    });
  }

  const expectedHomeGoals = input.evidence.expectedGoals.home;
  const expectedAwayGoals = input.evidence.expectedGoals.away;
  if (
    !isFiniteNumber(expectedHomeGoals) ||
    !isFiniteNumber(expectedAwayGoals) ||
    expectedHomeGoals < 0 ||
    expectedAwayGoals < 0
  ) {
    pushFlag(flags, {
      code: "INVALID_XG_BUNDLE",
      family: "SOURCE_INTEGRITY",
      severity: "CRITICAL",
      points: 25,
      explanation: "Expected-goals evidence is missing, non-finite, or negative.",
      evidenceRefs: ["prediction.expectedHomeGoals", "prediction.expectedAwayGoals"],
    });
  }

  const modalHomeGoals = input.evidence.modalScore.homeGoals;
  const modalAwayGoals = input.evidence.modalScore.awayGoals;
  if (
    !Number.isInteger(modalHomeGoals) ||
    !Number.isInteger(modalAwayGoals) ||
    (modalHomeGoals ?? -1) < 0 ||
    (modalAwayGoals ?? -1) < 0
  ) {
    pushFlag(flags, {
      code: "INVALID_MODAL_SCORE",
      family: "SOURCE_INTEGRITY",
      severity: "CRITICAL",
      points: 25,
      explanation: "The modal score is not a valid non-negative integer scoreline.",
      evidenceRefs: ["prediction.mostLikelyScore", "prediction.topScoresJson"],
    });
  }

  if (input.evidence.sourceIntegrity.qualityVerdict === "FAIL") {
    pushFlag(flags, {
      code: "SOURCE_QUALITY_FAILED",
      family: "SOURCE_INTEGRITY",
      severity: "REVIEW",
      points: 25,
      explanation: "The tracked source package failed its quality verdict.",
      evidenceRefs: ["signal.qualityReport.verdict"],
    });
  }

  if (!input.evidence.sourceIntegrity.centralProvenanceComplete) {
    pushFlag(flags, {
      code: "SOURCE_PROVENANCE_MISSING",
      family: "SOURCE_INTEGRITY",
      severity: "WATCH",
      points: 12,
      explanation: "Central prediction or signal provenance is missing or inconsistent.",
      evidenceRefs: ["prediction.predictionVersionId", "prediction.modelVersionId", "prediction.signalSnapshotId"],
    });
  }

  if (!input.coverage.preMatchCutoffSatisfied || input.evidence.sourceIntegrity.postCutoffEvidenceCount > 0) {
    pushFlag(flags, {
      code: "SOURCE_AFTER_PREMATCH_CUTOFF",
      family: "SOURCE_INTEGRITY",
      severity: "CRITICAL",
      points: 40,
      explanation: "Some source evidence appears to extend beyond the effective pre-match cutoff.",
      evidenceRefs: ["coverage.preMatchCutoffSatisfied", "sourceIntegrity.latestEvidenceAt"],
    });
  }

  if (!input.evidence.sourceIntegrity.homeAliasResolved || !input.evidence.sourceIntegrity.awayAliasResolved) {
    pushFlag(flags, {
      code: "ALIAS_UNRESOLVED",
      family: "SOURCE_INTEGRITY",
      severity: "CRITICAL",
      points: 40,
      explanation: "At least one team alias could not be resolved to a canonical key.",
      evidenceRefs: ["fixture.homeTeam.canonicalKey", "fixture.awayTeam.canonicalKey"],
    });
  }

  if (
    (input.evidence.sourceIntegrity.homeRecentSampleSize ?? 99) < 3 ||
    (input.evidence.sourceIntegrity.awayRecentSampleSize ?? 99) < 3
  ) {
    pushFlag(flags, {
      code: "RECENT_SAMPLE_TOO_SMALL",
      family: "SOURCE_INTEGRITY",
      severity: "WATCH",
      points: 6,
      explanation: "At least one team carries a very small recent-form sample.",
      evidenceRefs: ["sourceIntegrity.homeRecentSampleSize", "sourceIntegrity.awayRecentSampleSize"],
    });
  }

  if (input.evidence.elo.available) {
    const eloHomePct = input.evidence.elo.homeTwoWayPct;
    const eloAwayPct = input.evidence.elo.awayTwoWayPct;

    if (isFiniteNumber(eloHomePct) && isFiniteNumber(eloAwayPct)) {
      const eloGap = Math.abs(args.decisiveHomeSharePct - eloHomePct);
      if (eloGap > 30) {
        pushFlag(flags, {
          code: "ELO_DECISIVE_SHARE_GAP",
          family: "EXTERNAL_COHERENCE",
          severity: "CRITICAL",
          points: 24,
          explanation: `UFO decisive home share differs from Elo by ${round(eloGap, 1)} percentage points.`,
          evidenceRefs: ["elo.homeTwoWayPct", "oneXtwo.decisiveHomeSharePct"],
        });
      } else if (eloGap > 20) {
        pushFlag(flags, {
          code: "ELO_DECISIVE_SHARE_GAP",
          family: "EXTERNAL_COHERENCE",
          severity: "REVIEW",
          points: 16,
          explanation: `UFO decisive home share differs from Elo by ${round(eloGap, 1)} percentage points.`,
          evidenceRefs: ["elo.homeTwoWayPct", "oneXtwo.decisiveHomeSharePct"],
        });
      } else if (eloGap > 10) {
        pushFlag(flags, {
          code: "ELO_DECISIVE_SHARE_GAP",
          family: "EXTERNAL_COHERENCE",
          severity: "WATCH",
          points: 10,
          explanation: `UFO decisive home share differs from Elo by ${round(eloGap, 1)} percentage points.`,
          evidenceRefs: ["elo.homeTwoWayPct", "oneXtwo.decisiveHomeSharePct"],
        });
      }

      const eloFavorite = eloHomePct >= eloAwayPct ? "HOME" : "AWAY";
      const eloFavoriteMargin = Math.abs(eloHomePct - eloAwayPct);
      const neutralMargin = input.evidence.elo.favoriteNeutralMarginPct ?? ATYPICAL_FIXTURE_FAVORITE_MARGIN_PCT;
      const ufoRawMargin = Math.abs(args.safeHomePct - args.safeAwayPct);
      const basicInversion =
        isDirectionalOutcomeLeader(args.favorite) &&
        eloFavorite !== args.favorite &&
        eloFavoriteMargin >= neutralMargin &&
        ufoRawMargin >= ATYPICAL_FIXTURE_FAVORITE_MARGIN_PCT;

      if (basicInversion) {
        const dominantFavoriteThresholdPct =
          input.evidence.elo.dominantFavoriteThresholdPct ?? 70;
        const dominantInversionFavoriteWinThresholdPct =
          input.evidence.elo.dominantInversionFavoriteWinThresholdPct ?? 75;
        const dominant =
          ufoRawMargin >= (input.evidence.elo.dominantInversionRawFavoriteMarginPp ?? ATYPICAL_FIXTURE_DOMINANT_INVERSION_MARGIN_PCT) &&
          (
            Math.max(args.safeHomePct, args.safeAwayPct) >= dominantFavoriteThresholdPct ||
            Math.max(eloHomePct, eloAwayPct) >= dominantInversionFavoriteWinThresholdPct
          );

        pushFlag(flags, {
          code: "ELO_FAVORITE_INVERSION",
          family: "EXTERNAL_COHERENCE",
          severity: dominant ? "CRITICAL" : "REVIEW",
          points: dominant ? 28 : 20,
          explanation: dominant
            ? "Elo and UFO favor opposite teams, and the disagreement clears the dominant inversion threshold."
            : "Elo and UFO favor opposite sides beyond the documented neutral margin.",
          evidenceRefs: ["elo.homeTwoWayPct", "elo.awayTwoWayPct", "oneXtwo.homePct", "oneXtwo.awayPct"],
        });
      }
    }
  }

  const movement = input.evidence.signals.movement;
  if (movement.available) {
    const maxDelta = movement.maxAbsoluteDelta ?? 0;
    const totalDelta = movement.totalAbsoluteDelta ?? 0;

    if (maxDelta >= 15 || totalDelta >= 30) {
      pushFlag(flags, {
        code: "STRONG_SIGNAL_MOVEMENT",
        family: "SIGNAL_DYNAMICS",
        severity: "CRITICAL",
        points: 18,
        explanation: "Signal movement reached the critical operational delta bucket.",
        evidenceRefs: ["signals.movement.maxAbsoluteDelta", "signals.movement.totalAbsoluteDelta"],
      });
    } else if (maxDelta >= 7 || totalDelta >= 14) {
      pushFlag(flags, {
        code: "STRONG_SIGNAL_MOVEMENT",
        family: "SIGNAL_DYNAMICS",
        severity: "WATCH",
        points: 10,
        explanation: "Signal movement reached the material operational delta bucket.",
        evidenceRefs: ["signals.movement.maxAbsoluteDelta", "signals.movement.totalAbsoluteDelta"],
      });
    }
  }

  const weightedPowerGap = input.evidence.signals.componentGaps.weightedPower;
  const ratingGap = input.evidence.signals.componentGaps.rating;
  if (
    isFiniteNumber(weightedPowerGap) &&
    isFiniteNumber(ratingGap) &&
    Math.abs(weightedPowerGap) >= 0.5 &&
    Math.abs(ratingGap) >= 8 &&
    Math.sign(weightedPowerGap) !== Math.sign(ratingGap)
  ) {
    pushFlag(flags, {
      code: "SIGNAL_DIRECTION_CONFLICT",
      family: "SIGNAL_DYNAMICS",
      severity: "REVIEW",
      points: 14,
      explanation: "Weighted power and rating direction point toward opposite teams beyond the neutral epsilon.",
      evidenceRefs: ["signals.componentGaps.weightedPower", "signals.componentGaps.rating"],
    });
  }

  if (
    isDirectionalOutcomeLeader(args.favorite) &&
    args.xgFavorite !== "LEVEL" &&
    args.xgFavorite !== args.favorite &&
    Math.abs(args.safeHomeXg - args.safeAwayXg) >= ATYPICAL_FIXTURE_XG_LEVEL_EPSILON &&
    Math.abs(args.safeHomePct - args.safeAwayPct) >= ATYPICAL_FIXTURE_FAVORITE_MARGIN_PCT
  ) {
    pushFlag(flags, {
      code: "XG_1X2_DIRECTION_CONFLICT",
      family: "INTERNAL_COHERENCE",
      severity: "REVIEW",
      points: 14,
      explanation: "Expected-goals direction conflicts with the raw 1X2 favorite.",
      evidenceRefs: ["expectedGoals.home", "expectedGoals.away", "oneXtwo.homePct", "oneXtwo.awayPct"],
    });
  }

  if (
    isDirectionalOutcomeLeader(args.favorite) &&
    args.modalOutcome !== "DRAW" &&
    args.modalOutcome !== args.favorite &&
    args.topTwoSpreadPp >= ATYPICAL_FIXTURE_MODAL_FAVORITE_MARGIN_PCT
  ) {
    pushFlag(flags, {
      code: "MODAL_1X2_CONFLICT",
      family: "INTERNAL_COHERENCE",
      severity: "REVIEW",
      points: 16,
      explanation: "The modal score supports the opposite team from the 1X2 favorite.",
      evidenceRefs: ["modalScore.outcome", "oneXtwo.favorite"],
    });
  }

  const eloFavoritePct = Math.max(
    input.evidence.elo.homeTwoWayPct ?? 0,
    input.evidence.elo.awayTwoWayPct ?? 0,
  );
  if (
    args.modalOutcome === "DRAW" &&
    (args.topOutcomePct >= 55 || eloFavoritePct >= 70)
  ) {
    pushFlag(flags, {
      code: "MODAL_DRAW_VS_STRONG_FAVORITE",
      family: "INTERNAL_COHERENCE",
      severity: "WATCH",
      points: 10,
      explanation: "The modal outcome is a draw even though the favorite is already strong by 1X2 or Elo.",
      evidenceRefs: ["modalScore.outcome", "oneXtwo.topOutcomePct", "elo.favorite"],
    });
  }

  const favoriteXg = args.favorite === "HOME" ? args.safeHomeXg : args.favorite === "AWAY" ? args.safeAwayXg : null;
  const xgAdvantage = Math.abs(args.safeHomeXg - args.safeAwayXg);
  if (
    isDirectionalOutcomeLeader(args.favorite) &&
    args.topOutcomePct >= 55 &&
    (
      (favoriteXg !== null && favoriteXg < 1.15) ||
      xgAdvantage < 0.2
    )
  ) {
    pushFlag(flags, {
      code: "STRONG_FAVORITE_LOW_XG",
      family: "INTERNAL_COHERENCE",
      severity: "WATCH",
      points: 10,
      explanation: "A strong raw favorite still carries low favorite xG or only a tiny xG advantage.",
      evidenceRefs: ["oneXtwo.topOutcomePct", "expectedGoals.home", "expectedGoals.away"],
    });
  }

  if (eloFavoritePct >= 70 && args.topOutcomePct <= 52) {
    pushFlag(flags, {
      code: "LARGE_RATING_GAP_BALANCED_1X2",
      family: "INTERNAL_COHERENCE",
      severity: "REVIEW",
      points: 14,
      explanation: "External rating evidence strongly favors one side while the UFO raw 1X2 remains balanced.",
      evidenceRefs: ["elo.homeTwoWayPct", "elo.awayTwoWayPct", "oneXtwo.topOutcomePct"],
    });
  }

  const totalGoals = args.safeHomeXg + args.safeAwayXg;
  const bttsYesFromXgPct = round(
    (1 - Math.exp(-args.safeHomeXg) - Math.exp(-args.safeAwayXg) + Math.exp(-(args.safeHomeXg + args.safeAwayXg))) * 100,
    4,
  );
  const over25FromXgPct = round(
    (1 - Math.exp(-totalGoals) * (1 + totalGoals + (totalGoals * totalGoals) / 2)) * 100,
    4,
  );

  const bttsYesPct = input.evidence.markets.bttsYesPct;
  const over25Pct = input.evidence.markets.over25Pct;
  const bttsGap = isFiniteNumber(bttsYesPct) ? Math.abs(bttsYesPct - bttsYesFromXgPct) : null;
  const over25Gap = isFiniteNumber(over25Pct) ? Math.abs(over25Pct - over25FromXgPct) : null;

  if (isFiniteNumber(bttsGap)) {
    if (bttsGap >= 18) {
      pushFlag(flags, {
        code: "BTTS_XG_MISMATCH",
        family: "INTERNAL_COHERENCE",
        severity: "REVIEW",
        points: 14,
        explanation: "BTTS market deviates sharply from the xG-implied BTTS expectation.",
        evidenceRefs: ["markets.bttsYesPct", "marketCoherence.bttsYesFromXgPct"],
      });
    } else if (bttsGap >= 10) {
      pushFlag(flags, {
        code: "BTTS_XG_MISMATCH",
        family: "INTERNAL_COHERENCE",
        severity: "WATCH",
        points: 8,
        explanation: "BTTS market differs materially from the xG-implied BTTS expectation.",
        evidenceRefs: ["markets.bttsYesPct", "marketCoherence.bttsYesFromXgPct"],
      });
    }
  }

  if (isFiniteNumber(over25Gap)) {
    if (over25Gap >= 18) {
      pushFlag(flags, {
        code: "OVER_UNDER_XG_MISMATCH",
        family: "INTERNAL_COHERENCE",
        severity: "REVIEW",
        points: 14,
        explanation: "Over/Under 2.5 differs sharply from the xG-implied total-goal expectation.",
        evidenceRefs: ["markets.over25Pct", "marketCoherence.over25FromXgPct"],
      });
    } else if (over25Gap >= 10) {
      pushFlag(flags, {
        code: "OVER_UNDER_XG_MISMATCH",
        family: "INTERNAL_COHERENCE",
        severity: "WATCH",
        points: 8,
        explanation: "Over/Under 2.5 differs materially from the xG-implied total-goal expectation.",
        evidenceRefs: ["markets.over25Pct", "marketCoherence.over25FromXgPct"],
      });
    }
  }

  const confidenceScore = input.evidence.confidenceRisk.confidenceScore;
  if (isFiniteNumber(confidenceScore)) {
    if (confidenceScore >= 90 && args.topOutcomePct < 60) {
      pushFlag(flags, {
        code: "CONFIDENCE_SPREAD_CONFLICT",
        family: "PRESENTATION",
        severity: "REVIEW",
        points: 18,
        explanation: "Confidence reaches the top bucket even though no outcome clears a 60% raw probability.",
        evidenceRefs: ["confidenceRisk.confidenceScore", "oneXtwo.topOutcomePct"],
      });
    } else if (confidenceScore >= 80 && args.topOutcomePct < 55) {
      pushFlag(flags, {
        code: "CONFIDENCE_SPREAD_CONFLICT",
        family: "PRESENTATION",
        severity: "WATCH",
        points: 12,
        explanation: "Confidence is high relative to a modest top-outcome probability.",
        evidenceRefs: ["confidenceRisk.confidenceScore", "oneXtwo.topOutcomePct"],
      });
    }
  }

  if (
    input.evidence.confidenceRisk.riskLevel === "low" &&
    (
      args.topTwoSpreadPp < 20 ||
      args.topOutcomePct < 55 ||
      args.modalOutcome === "DRAW"
    )
  ) {
    pushFlag(flags, {
      code: "RISK_SPREAD_CONFLICT",
      family: "PRESENTATION",
      severity: "WATCH",
      points: 10,
      explanation: "Low risk is inconsistent with a narrow spread, modest favorite, or modal draw.",
      evidenceRefs: ["confidenceRisk.riskLevel", "oneXtwo.topTwoSpreadPp", "modalScore.outcome"],
    });
  }

  return {
    orderedFlags: [...flags.values()].sort(compareFlags),
    marketCoherence: {
      bttsYesPct,
      bttsYesFromXgPct,
      bttsGapPp: bttsGap === null ? null : round(bttsGap, 4),
      over25Pct,
      over25FromXgPct,
      over25GapPp: over25Gap === null ? null : round(over25Gap, 4),
    },
    confidenceMinusTopOutcome:
      isFiniteNumber(confidenceScore) ? round(confidenceScore - args.topOutcomePct, 4) : null,
  };
}
