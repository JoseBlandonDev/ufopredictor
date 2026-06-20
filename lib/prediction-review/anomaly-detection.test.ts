import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { resolveOutcomeLeader } from "./anomaly-outcome";
import {
  ATYPICAL_FIXTURE_FAVORITE_MARGIN_PCT,
  analyzeAtypicalFixture,
  buildAtypicalFixtureAnalysisReport,
} from "./anomaly-detection";
import { computeAnomalyScore } from "./anomaly-rules";
import {
  MATCHDAY2_ANOMALY_ANALYSIS_AS_OF,
  MATCHDAY2_ANOMALY_BATCH_FIXTURES,
  MATCHDAY2_ANOMALY_FIXTURES,
} from "./__fixtures__/matchday2-anomaly-evidence";
import type { AtypicalFixtureFlag } from "./types";

function buildFixtureOverride(overrides: Parameters<typeof analyzeAtypicalFixture>[0]["input"]) {
  return analyzeAtypicalFixture({
    analysisAsOf: MATCHDAY2_ANOMALY_FIXTURES.brazilVsHaiti.analysisAsOf,
    inputFingerprint: "test-fixture",
    input: overrides,
  });
}

function createBaseInput() {
  return structuredClone(MATCHDAY2_ANOMALY_FIXTURES.brazilVsHaiti.input);
}

function buildSyntheticFlag(args: Pick<AtypicalFixtureFlag, "code" | "family" | "points" | "severity">): AtypicalFixtureFlag {
  return {
    ...args,
    explanation: "synthetic",
    evidenceRefs: ["synthetic"],
  };
}

describe("analyzeAtypicalFixture", () => {
  it("keeps low-anomaly controls at NONE or low WATCH", () => {
    const controls = [
      MATCHDAY2_ANOMALY_FIXTURES.brazilVsHaiti,
      MATCHDAY2_ANOMALY_FIXTURES.spainVsSaudiArabia,
      MATCHDAY2_ANOMALY_FIXTURES.argentinaVsAustria,
      MATCHDAY2_ANOMALY_FIXTURES.englandVsGhana,
    ].map((fixture) =>
      analyzeAtypicalFixture({
        input: fixture.input,
        analysisAsOf: fixture.analysisAsOf,
        inputFingerprint: fixture.inputFingerprint,
      }),
    );

    for (const control of controls) {
      expect(["NONE", "WATCH"]).toContain(control.severity);
      if (control.severity === "NONE") {
        expect(control.suspectedPrimaryCause).toBeNull();
      }
    }
  });

  it("classifies Germany vs Ivory Coast as presentation-related and keeps current", () => {
    const report = analyzeAtypicalFixture(MATCHDAY2_ANOMALY_FIXTURES.germanyVsIvoryCoast);

    expect(["WATCH", "REVIEW"]).toContain(report.severity);
    expect(report.orderedFlags.map((flag) => flag.code)).toEqual(
      expect.arrayContaining(["CONFIDENCE_SPREAD_CONFLICT", "RISK_SPREAD_CONFLICT"]),
    );
    expect(report.suspectedPrimaryCause?.code).toBe("CONFIDENCE_OR_RISK_PRESENTATION_DEFECT");
    expect(report.advisoryAction.code).toBe("KEEP_CURRENT");
  });

  it("keeps Jordan vs Algeria as a watch-level presentation anomaly", () => {
    const report = analyzeAtypicalFixture(MATCHDAY2_ANOMALY_FIXTURES.jordanVsAlgeria);

    expect(["WATCH", "REVIEW"]).toContain(report.severity);
    expect(report.suspectedPrimaryCause?.code).toBe("CONFIDENCE_OR_RISK_PRESENTATION_DEFECT");
    expect(report.advisoryAction.code).toBe("KEEP_CURRENT");
  });

  it("marks required strong anomalies as REVIEW or CRITICAL", () => {
    const strongFixtures = [
      MATCHDAY2_ANOMALY_FIXTURES.ecuadorVsCuracao,
      MATCHDAY2_ANOMALY_FIXTURES.franceVsIraq,
      MATCHDAY2_ANOMALY_FIXTURES.belgiumVsIran,
      MATCHDAY2_ANOMALY_FIXTURES.portugalVsUzbekistan,
      MATCHDAY2_ANOMALY_FIXTURES.colombiaVsCongoDr,
    ].map((fixture) => analyzeAtypicalFixture(fixture));

    for (const report of strongFixtures) {
      expect(["REVIEW", "CRITICAL"]).toContain(report.severity);
      expect(report.orderedFlags.length).toBeGreaterThan(0);
      expect(report.suspectedPrimaryCause).not.toBeNull();
    }

    expect(strongFixtures[0].orderedFlags.map((flag) => flag.code)).toEqual(
      expect.arrayContaining(["ELO_DECISIVE_SHARE_GAP", "ELO_FAVORITE_INVERSION"]),
    );
    expect(strongFixtures[2].orderedFlags.map((flag) => flag.code)).toEqual(
      expect.arrayContaining(["ELO_FAVORITE_INVERSION"]),
    );
  });

  it("does not over-penalize controls with plausible watch-level disagreement", () => {
    const controls = [
      MATCHDAY2_ANOMALY_FIXTURES.netherlandsVsSweden,
      MATCHDAY2_ANOMALY_FIXTURES.uruguayVsCapeVerde,
      MATCHDAY2_ANOMALY_FIXTURES.newZealandVsEgypt,
    ].map((fixture) => analyzeAtypicalFixture(fixture));

    for (const report of controls) {
      expect(report.severity).not.toBe("CRITICAL");
    }
  });

  it("is deterministic across repeated execution", () => {
    const fixture = MATCHDAY2_ANOMALY_FIXTURES.franceVsIraq;

    const left = analyzeAtypicalFixture(fixture);
    const right = analyzeAtypicalFixture(fixture);

    expect(left).toEqual(right);
  });

  it("keeps score bounded, percentage scale intact, and flag order stable", () => {
    const report = analyzeAtypicalFixture(MATCHDAY2_ANOMALY_FIXTURES.belgiumVsIran);

    expect(report.anomalyScore).toBeGreaterThanOrEqual(0);
    expect(report.anomalyScore).toBeLessThanOrEqual(100);
    expect(report.evidence.oneXtwo.homePct).toBeGreaterThanOrEqual(0);
    expect(report.evidence.oneXtwo.awayPct).toBeLessThanOrEqual(100);
    expect(report.orderedFlags).toEqual(
      [...report.orderedFlags].sort((left, right) => {
        const severityOrder = { CRITICAL: 3, REVIEW: 2, WATCH: 1 };
        if (severityOrder[right.severity] !== severityOrder[left.severity]) {
          return severityOrder[right.severity] - severityOrder[left.severity];
        }
        if (right.points !== left.points) {
          return right.points - left.points;
        }
        return left.code.localeCompare(right.code);
      }),
    );
  });

  it("handles invalid 1X2, invalid xG, and invalid modal bundles as partial coverage", () => {
    const invalidProbability = analyzeAtypicalFixture({
      ...MATCHDAY2_ANOMALY_FIXTURES.brazilVsHaiti,
      input: {
        ...MATCHDAY2_ANOMALY_FIXTURES.brazilVsHaiti.input,
        evidence: {
          ...MATCHDAY2_ANOMALY_FIXTURES.brazilVsHaiti.input.evidence,
          oneXtwo: { homePct: 55, drawPct: 30, awayPct: 30 },
        },
      },
    });
    const invalidXg = analyzeAtypicalFixture({
      ...MATCHDAY2_ANOMALY_FIXTURES.brazilVsHaiti,
      input: {
        ...MATCHDAY2_ANOMALY_FIXTURES.brazilVsHaiti.input,
        evidence: {
          ...MATCHDAY2_ANOMALY_FIXTURES.brazilVsHaiti.input.evidence,
          expectedGoals: { home: -1, away: 0.5 },
        },
      },
    });
    const invalidModal = analyzeAtypicalFixture({
      ...MATCHDAY2_ANOMALY_FIXTURES.brazilVsHaiti,
      input: {
        ...MATCHDAY2_ANOMALY_FIXTURES.brazilVsHaiti.input,
        evidence: {
          ...MATCHDAY2_ANOMALY_FIXTURES.brazilVsHaiti.input.evidence,
          modalScore: { homeGoals: 1.5, awayGoals: -1, probabilityPct: 10 },
        },
      },
    });

    expect(invalidProbability.coverage.status).toBe("PARTIAL");
    expect(invalidProbability.orderedFlags.map((flag) => flag.code)).toContain("INVALID_PROBABILITY_BUNDLE");
    expect(invalidXg.orderedFlags.map((flag) => flag.code)).toContain("INVALID_XG_BUNDLE");
    expect(invalidModal.orderedFlags.map((flag) => flag.code)).toContain("INVALID_MODAL_SCORE");
  });

  it("treats unavailable movement evidence as partial without universal provenance penalty", () => {
    const report = analyzeAtypicalFixture(MATCHDAY2_ANOMALY_FIXTURES.brazilVsHaiti);

    expect(report.coverage.status).toBe("PARTIAL");
    expect(report.coverage.missingEvidence).toContain("signals.movement.history");
    expect(report.orderedFlags.map((flag) => flag.code)).not.toContain("SOURCE_PROVENANCE_MISSING");
  });

  it("requires exactly one suspected cause for every marked fixture and null for NONE", () => {
    const report = analyzeAtypicalFixture(MATCHDAY2_ANOMALY_FIXTURES.franceVsIraq);
    const none = analyzeAtypicalFixture(MATCHDAY2_ANOMALY_FIXTURES.spainVsSaudiArabia);

    expect(report.suspectedPrimaryCause).not.toBeNull();
    expect(none.severity).toBe("NONE");
    expect(none.suspectedPrimaryCause).toBeNull();
  });

  it("keeps opposite-side 6.99 pp favorites below the inversion threshold", () => {
    const input = createBaseInput();
    input.evidence.oneXtwo = { homePct: 43.495, drawPct: 20, awayPct: 36.505 };
    input.evidence.elo.homeTwoWayPct = 40;
    input.evidence.elo.awayTwoWayPct = 60;

    const report = buildFixtureOverride(input);

    expect(report.orderedFlags.map((flag) => flag.code)).not.toContain("ELO_FAVORITE_INVERSION");
  });

  it("emits basic inversion at 7-11.99 pp without the dominant bonus", () => {
    const input = createBaseInput();
    input.evidence.oneXtwo = { homePct: 47, drawPct: 20, awayPct: 33 };
    input.evidence.elo.homeTwoWayPct = 40;
    input.evidence.elo.awayTwoWayPct = 60;

    const report = buildFixtureOverride(input);
    const inversion = report.orderedFlags.find((flag) => flag.code === "ELO_FAVORITE_INVERSION");

    expect(inversion?.points).toBe(20);
    expect(inversion?.severity).toBe("REVIEW");
  });

  it("upgrades inversion when the dominant branch thresholds are met", () => {
    const input = createBaseInput();
    input.evidence.oneXtwo = { homePct: 58, drawPct: 10, awayPct: 32 };
    input.evidence.elo.homeTwoWayPct = 22;
    input.evidence.elo.awayTwoWayPct = 78;

    const report = buildFixtureOverride(input);
    const inversion = report.orderedFlags.find((flag) => flag.code === "ELO_FAVORITE_INVERSION");

    expect(inversion?.points).toBe(28);
    expect(inversion?.severity).toBe("CRITICAL");
  });

  it("does not emit inversion when Elo and UFO favor the same side", () => {
    const input = createBaseInput();
    input.evidence.oneXtwo = { homePct: 52, drawPct: 20, awayPct: 28 };
    input.evidence.elo.homeTwoWayPct = 61;
    input.evidence.elo.awayTwoWayPct = 39;

    const report = buildFixtureOverride(input);

    expect(report.orderedFlags.map((flag) => flag.code)).not.toContain("ELO_FAVORITE_INVERSION");
  });

  it("represents tied favorites as TIE and blocks directional rules from firing", () => {
    const input = createBaseInput();
    input.evidence.oneXtwo = { homePct: 40, drawPct: 20, awayPct: 40 };
    input.evidence.expectedGoals = { home: 0.8, away: 1.4 };
    input.evidence.modalScore = { homeGoals: 0, awayGoals: 1, probabilityPct: 14 };
    input.evidence.elo.homeTwoWayPct = 62;
    input.evidence.elo.awayTwoWayPct = 38;

    const report = buildFixtureOverride(input);
    const codes = report.orderedFlags.map((flag) => flag.code);

    expect(report.evidence.oneXtwo.favorite).toBe("TIE");
    expect(codes).not.toContain("ELO_FAVORITE_INVERSION");
    expect(codes).not.toContain("XG_1X2_DIRECTION_CONFLICT");
    expect(codes).not.toContain("MODAL_1X2_CONFLICT");
  });

  it("caps each scoring family, caps the final score at 100, and does not double count duplicate flag codes", () => {
    const input = createBaseInput();
    input.coverage.preMatchCutoffSatisfied = false;
    input.evidence.sourceIntegrity.postCutoffEvidenceCount = 1;
    input.evidence.sourceIntegrity.homeAliasResolved = false;
    input.evidence.sourceIntegrity.awayAliasResolved = false;
    input.evidence.sourceIntegrity.homeRecentSampleSize = 1;
    input.evidence.sourceIntegrity.awayRecentSampleSize = 1;
    input.evidence.sourceIntegrity.qualityVerdict = "FAIL";
    input.evidence.sourceIntegrity.centralProvenanceComplete = false;
    input.evidence.oneXtwo = { homePct: 58, drawPct: 5, awayPct: 37 };
    input.evidence.expectedGoals = { home: 0.9, away: 1.35 };
    input.evidence.modalScore = { homeGoals: 0, awayGoals: 1, probabilityPct: 16 };
    input.evidence.elo.homeTwoWayPct = 20;
    input.evidence.elo.awayTwoWayPct = 80;
    input.evidence.signals.movement = {
      available: true,
      maxAbsoluteDelta: 16,
      totalAbsoluteDelta: 31,
      changedComponents: ["rating", "rating", "attack"],
    };
    input.evidence.signals.componentGaps = {
      ...input.evidence.signals.componentGaps,
      weightedPower: 1,
      rating: -12,
    };
    input.evidence.markets = {
      bttsYesPct: 5,
      over25Pct: 95,
    };
    input.evidence.confidenceRisk = {
      confidenceScore: 95,
      riskLevel: "low",
    };

    const report = buildFixtureOverride(input);
    const codeSet = new Set(report.orderedFlags.map((flag) => flag.code));

    expect(report.anomalyScore).toBe(100);
    expect(report.severity).toBe("CRITICAL");
    expect(codeSet.size).toBe(report.orderedFlags.length);
  });

  it("keeps mutually exclusive threshold buckets mutually exclusive", () => {
    const input = createBaseInput();
    input.evidence.oneXtwo = {
      homePct: 50 + ATYPICAL_FIXTURE_FAVORITE_MARGIN_PCT,
      drawPct: 20,
      awayPct: 30 - ATYPICAL_FIXTURE_FAVORITE_MARGIN_PCT,
    };
    input.evidence.elo.homeTwoWayPct = 40;
    input.evidence.elo.awayTwoWayPct = 60;

    const report = buildFixtureOverride(input);
    const inversions = report.orderedFlags.filter((flag) => flag.code === "ELO_FAVORITE_INVERSION");

    expect(inversions).toHaveLength(1);
    expect(inversions[0]?.points).toBe(20);
  });
});

describe("resolveOutcomeLeader", () => {
  it("resolves the documented tie matrix", () => {
    expect(resolveOutcomeLeader(40, 20, 40)).toBe("TIE");
    expect(resolveOutcomeLeader(35, 35, 30)).toBe("TIE");
    expect(resolveOutcomeLeader(30, 40, 30)).toBe("DRAW");
    expect(resolveOutcomeLeader(34, 33, 33)).toBe("HOME");
    expect(resolveOutcomeLeader(33.3, 33.3, 33.3)).toBe("TIE");
  });

  it("treats floating-point noise at the boundary as a tie", () => {
    expect(resolveOutcomeLeader(33.3333333, 33.3333332, 33.3333333)).toBe("TIE");
  });
});

describe("computeAnomalyScore", () => {
  it("applies the source-integrity family cap at 40", () => {
    expect(computeAnomalyScore([
      buildSyntheticFlag({ code: "REQUIRED_EVIDENCE_MISSING", family: "SOURCE_INTEGRITY", points: 25, severity: "CRITICAL" }),
      buildSyntheticFlag({ code: "INVALID_PROBABILITY_BUNDLE", family: "SOURCE_INTEGRITY", points: 25, severity: "CRITICAL" }),
      buildSyntheticFlag({ code: "INVALID_XG_BUNDLE", family: "SOURCE_INTEGRITY", points: 25, severity: "CRITICAL" }),
    ])).toBe(40);
  });

  it("applies the external-coherence family cap at 45", () => {
    expect(computeAnomalyScore([
      buildSyntheticFlag({ code: "ELO_DECISIVE_SHARE_GAP", family: "EXTERNAL_COHERENCE", points: 24, severity: "CRITICAL" }),
      buildSyntheticFlag({ code: "ELO_FAVORITE_INVERSION", family: "EXTERNAL_COHERENCE", points: 28, severity: "CRITICAL" }),
    ])).toBe(45);
  });

  it("applies the signal-dynamics family cap at 25", () => {
    expect(computeAnomalyScore([
      buildSyntheticFlag({ code: "STRONG_SIGNAL_MOVEMENT", family: "SIGNAL_DYNAMICS", points: 18, severity: "CRITICAL" }),
      buildSyntheticFlag({ code: "SIGNAL_DIRECTION_CONFLICT", family: "SIGNAL_DYNAMICS", points: 14, severity: "REVIEW" }),
    ])).toBe(25);
  });

  it("applies the internal-coherence family cap at 35", () => {
    expect(computeAnomalyScore([
      buildSyntheticFlag({ code: "XG_1X2_DIRECTION_CONFLICT", family: "INTERNAL_COHERENCE", points: 14, severity: "REVIEW" }),
      buildSyntheticFlag({ code: "MODAL_1X2_CONFLICT", family: "INTERNAL_COHERENCE", points: 16, severity: "REVIEW" }),
      buildSyntheticFlag({ code: "BTTS_XG_MISMATCH", family: "INTERNAL_COHERENCE", points: 14, severity: "REVIEW" }),
    ])).toBe(35);
  });

  it("applies the presentation family cap at 20", () => {
    expect(computeAnomalyScore([
      buildSyntheticFlag({ code: "CONFIDENCE_SPREAD_CONFLICT", family: "PRESENTATION", points: 18, severity: "REVIEW" }),
      buildSyntheticFlag({ code: "RISK_SPREAD_CONFLICT", family: "PRESENTATION", points: 10, severity: "WATCH" }),
    ])).toBe(20);
  });

  it("applies the final score cap at 100", () => {
    expect(computeAnomalyScore([
      buildSyntheticFlag({ code: "REQUIRED_EVIDENCE_MISSING", family: "SOURCE_INTEGRITY", points: 40, severity: "CRITICAL" }),
      buildSyntheticFlag({ code: "ELO_FAVORITE_INVERSION", family: "EXTERNAL_COHERENCE", points: 45, severity: "CRITICAL" }),
      buildSyntheticFlag({ code: "STRONG_SIGNAL_MOVEMENT", family: "SIGNAL_DYNAMICS", points: 25, severity: "CRITICAL" }),
      buildSyntheticFlag({ code: "MODAL_1X2_CONFLICT", family: "INTERNAL_COHERENCE", points: 35, severity: "REVIEW" }),
      buildSyntheticFlag({ code: "CONFIDENCE_SPREAD_CONFLICT", family: "PRESENTATION", points: 20, severity: "REVIEW" }),
    ])).toBe(100);
  });
});

describe("buildAtypicalFixtureAnalysisReport", () => {
  it("produces stable ranking for the fixed 19-fixture offline batch", () => {
    const report = buildAtypicalFixtureAnalysisReport({
      analysisAsOf: MATCHDAY2_ANOMALY_ANALYSIS_AS_OF,
      scope: {
        competitionKey: "world-cup",
        stage: "Group Stage - 2",
        futureOnly: true,
      },
      fixtures: MATCHDAY2_ANOMALY_BATCH_FIXTURES.map((fixture) => ({
        input: fixture.input,
        inputFingerprint: fixture.inputFingerprint,
      })),
    });

    expect(report.fixtureCount).toBe(19);
    expect(report.rankedFixtures).toHaveLength(19);
    expect(report.rankedFixtures[0]!.fixture.matchId).toBe(
      analyzeAtypicalFixture(MATCHDAY2_ANOMALY_FIXTURES.ecuadorVsCuracao).fixture.matchId,
    );
    expect(report.countsBySeverity.CRITICAL + report.countsBySeverity.REVIEW + report.countsBySeverity.WATCH + report.countsBySeverity.NONE).toBe(19);
  });
});

describe("anomaly-detection source guarantees", () => {
  it("does not depend on Date.now, fetch, or random values", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "lib/prediction-review/anomaly-detection.ts"), "utf8");

    expect(source).not.toContain("Date.now(");
    expect(source).not.toContain("fetch(");
    expect(source).not.toContain("Math.random(");
  });
});
