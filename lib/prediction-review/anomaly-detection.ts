import { classifySuspectedCause, selectAdvisoryAction } from "./anomaly-classification";
import {
  ATYPICAL_FIXTURE_DETECTOR_VERSION,
  ATYPICAL_FIXTURE_EVIDENCE_SCHEMA_VERSION,
  ATYPICAL_FIXTURE_REPORT_SCHEMA_VERSION,
} from "./anomaly-constants";
import { resolveOutcomeLeader } from "./anomaly-outcome";
import {
  ATYPICAL_FIXTURE_FAVORITE_MARGIN_PCT,
  compareSeverity,
  computeAnomalyScore,
  favoriteFromExpectedGoals,
  isFiniteNumber,
  outcomeFromModalScore,
  toSeverity,
  evaluateAnomalyFlags,
} from "./anomaly-rules";
import type {
  AtypicalFixtureAnalysisReportV1,
  AtypicalFixtureDetectorInput,
  AtypicalFixtureEvidenceBundleV1,
  AtypicalFixtureSeverity,
} from "./types";

function round(value: number, digits = 4) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function analyzeAtypicalFixture(args: {
  input: AtypicalFixtureDetectorInput;
  analysisAsOf: string;
  inputFingerprint: string;
}): AtypicalFixtureEvidenceBundleV1 {
  const { input, analysisAsOf, inputFingerprint } = args;
  const missingEvidence = [...input.coverage.missingEvidence];

  const homePct = input.evidence.oneXtwo.homePct;
  const drawPct = input.evidence.oneXtwo.drawPct;
  const awayPct = input.evidence.oneXtwo.awayPct;
  const safeHomePct = isFiniteNumber(homePct) ? homePct : 0;
  const safeDrawPct = isFiniteNumber(drawPct) ? drawPct : 0;
  const safeAwayPct = isFiniteNumber(awayPct) ? awayPct : 0;
  const favorite = resolveOutcomeLeader(safeHomePct, safeDrawPct, safeAwayPct);
  const topOutcomePct = Math.max(safeHomePct, safeDrawPct, safeAwayPct);
  const secondOutcomePct = [safeHomePct, safeDrawPct, safeAwayPct].sort((left, right) => right - left)[1] ?? 0;
  const topTwoSpreadPp = round(topOutcomePct - secondOutcomePct, 4);
  const decisiveDenominator = safeHomePct + safeAwayPct;
  const decisiveHomeSharePct = decisiveDenominator > 0
    ? round((safeHomePct / decisiveDenominator) * 100, 4)
    : 0;

  const expectedHomeGoals = input.evidence.expectedGoals.home;
  const expectedAwayGoals = input.evidence.expectedGoals.away;
  const safeHomeXg = isFiniteNumber(expectedHomeGoals) ? expectedHomeGoals : 0;
  const safeAwayXg = isFiniteNumber(expectedAwayGoals) ? expectedAwayGoals : 0;
  const xgFavorite = favoriteFromExpectedGoals(safeHomeXg, safeAwayXg);

  const modalHomeGoals = input.evidence.modalScore.homeGoals;
  const modalAwayGoals = input.evidence.modalScore.awayGoals;
  const safeModalHomeGoals = Number.isInteger(modalHomeGoals) ? Number(modalHomeGoals) : 0;
  const safeModalAwayGoals = Number.isInteger(modalAwayGoals) ? Number(modalAwayGoals) : 0;
  const modalOutcome = outcomeFromModalScore(
    safeModalHomeGoals,
    safeModalAwayGoals,
  );

  const { orderedFlags, marketCoherence, confidenceMinusTopOutcome } = evaluateAnomalyFlags({
    input,
    favorite,
    topOutcomePct,
    topTwoSpreadPp,
    decisiveHomeSharePct,
    xgFavorite,
    modalOutcome,
    safeHomePct,
    safeAwayPct,
    safeHomeXg,
    safeAwayXg,
  });

  const anomalyScore = computeAnomalyScore(orderedFlags);
  const severity = toSeverity(anomalyScore);
  const suspectedPrimaryCause = classifySuspectedCause(severity, orderedFlags);
  const advisoryAction = selectAdvisoryAction({
    severity,
    flags: orderedFlags,
    cause: suspectedPrimaryCause,
    input,
  });

  const coverageStatus = missingEvidence.length > 0 || orderedFlags.some((flag) => flag.code === "REQUIRED_EVIDENCE_MISSING")
    ? "PARTIAL"
    : "COMPLETE";

  return {
    schemaVersion: ATYPICAL_FIXTURE_EVIDENCE_SCHEMA_VERSION,
    detectorVersion: ATYPICAL_FIXTURE_DETECTOR_VERSION,
    analysisAsOf,
    inputFingerprint,
    fixture: input.fixture,
    prediction: input.prediction,
    coverage: {
      status: coverageStatus,
      missingEvidence,
      preMatchCutoffSatisfied: input.coverage.preMatchCutoffSatisfied,
    },
    severity,
    anomalyScore,
    orderedFlags,
    evidence: {
      oneXtwo: {
        homePct: safeHomePct,
        drawPct: safeDrawPct,
        awayPct: safeAwayPct,
        favorite,
        topOutcomePct,
        topTwoSpreadPp,
        decisiveHomeSharePct,
      },
      expectedGoals: {
        home: safeHomeXg,
        away: safeAwayXg,
        total: round(safeHomeXg + safeAwayXg, 4),
        difference: round(safeHomeXg - safeAwayXg, 4),
        favorite: xgFavorite,
      },
      modalScore: {
        homeGoals: safeModalHomeGoals,
        awayGoals: safeModalAwayGoals,
        outcome: modalOutcome,
        probabilityPct: input.evidence.modalScore.probabilityPct,
      },
      elo: {
        available: input.evidence.elo.available,
        homeTwoWayPct: input.evidence.elo.homeTwoWayPct,
        awayTwoWayPct: input.evidence.elo.awayTwoWayPct,
        favorite:
          input.evidence.elo.available &&
          isFiniteNumber(input.evidence.elo.homeTwoWayPct) &&
          isFiniteNumber(input.evidence.elo.awayTwoWayPct)
            ? input.evidence.elo.homeTwoWayPct >= input.evidence.elo.awayTwoWayPct
              ? "HOME"
              : "AWAY"
            : null,
        decisiveShareGapPp:
          input.evidence.elo.available && isFiniteNumber(input.evidence.elo.homeTwoWayPct)
            ? round(Math.abs(decisiveHomeSharePct - input.evidence.elo.homeTwoWayPct), 4)
            : null,
        favoriteInversion:
          orderedFlags.some((flag) => flag.code === "ELO_FAVORITE_INVERSION"),
        homeRating: input.evidence.elo.homeRating,
        awayRating: input.evidence.elo.awayRating,
        ratingGap:
          isFiniteNumber(input.evidence.elo.homeRating) && isFiniteNumber(input.evidence.elo.awayRating)
            ? round(input.evidence.elo.homeRating - input.evidence.elo.awayRating, 4)
            : null,
      },
      signals: {
        home: input.evidence.signals.home,
        away: input.evidence.signals.away,
        componentGaps: input.evidence.signals.componentGaps,
        movement: input.evidence.signals.movement,
      },
      marketCoherence,
      confidenceRisk: {
        confidenceScore: input.evidence.confidenceRisk.confidenceScore,
        riskLevel: input.evidence.confidenceRisk.riskLevel,
        confidenceMinusTopOutcome,
      },
      sourceIntegrity: input.evidence.sourceIntegrity,
    },
    suspectedPrimaryCause,
    advisoryAction,
    provenance: input.provenance,
  };
}

export function buildAtypicalFixtureAnalysisReport(args: {
  analysisAsOf: string;
  scope: {
    competitionKey: string;
    stage: string;
    futureOnly: true;
  };
  fixtures: Array<{
    input: AtypicalFixtureDetectorInput;
    inputFingerprint: string;
  }>;
}): AtypicalFixtureAnalysisReportV1 {
  const rankedFixtures = args.fixtures
    .map((fixture) =>
      analyzeAtypicalFixture({
        input: fixture.input,
        analysisAsOf: args.analysisAsOf,
        inputFingerprint: fixture.inputFingerprint,
      }),
    )
    .sort((left, right) => {
      if (right.anomalyScore !== left.anomalyScore) {
        return right.anomalyScore - left.anomalyScore;
      }

      const severityDelta = compareSeverity(left.severity, right.severity);
      if (severityDelta !== 0) {
        return severityDelta;
      }

      const kickoffDelta = left.fixture.kickoffAt.localeCompare(right.fixture.kickoffAt);
      if (kickoffDelta !== 0) {
        return kickoffDelta;
      }

      const providerFixtureIdLeft = left.fixture.providerFixtureId ?? Number.MAX_SAFE_INTEGER;
      const providerFixtureIdRight = right.fixture.providerFixtureId ?? Number.MAX_SAFE_INTEGER;
      if (providerFixtureIdLeft !== providerFixtureIdRight) {
        return providerFixtureIdLeft - providerFixtureIdRight;
      }

      return left.fixture.matchId.localeCompare(right.fixture.matchId);
    });

  const countsBySeverity: Record<AtypicalFixtureSeverity, number> = {
    NONE: 0,
    WATCH: 0,
    REVIEW: 0,
    CRITICAL: 0,
  };

  for (const fixture of rankedFixtures) {
    countsBySeverity[fixture.severity] += 1;
  }

  return {
    schemaVersion: ATYPICAL_FIXTURE_REPORT_SCHEMA_VERSION,
    detectorVersion: ATYPICAL_FIXTURE_DETECTOR_VERSION,
    analysisAsOf: args.analysisAsOf,
    scope: args.scope,
    fixtureCount: rankedFixtures.length,
    countsBySeverity,
    rankedFixtures,
  };
}

export { ATYPICAL_FIXTURE_FAVORITE_MARGIN_PCT };
