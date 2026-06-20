import type { PredictionEngineOutput, RiskLevel } from "@/lib/prediction-engine/types";
import type { ProviderFixture, ProviderFixtureStatus } from "@/lib/football-api/api-football-types";
import type { REVIEW_ALERT_SEVERITIES, REVIEW_CONFIDENCE_BUCKETS, REVIEW_DECISION_OPTIONS, REVIEW_SNAPSHOT_KINDS } from "./constants";

export type ReviewDecision = (typeof REVIEW_DECISION_OPTIONS)[number];
export type ReviewSnapshotKind = (typeof REVIEW_SNAPSHOT_KINDS)[number];
export type ReviewAlertSeverity = (typeof REVIEW_ALERT_SEVERITIES)[number];
export type ReviewConfidenceBucket = (typeof REVIEW_CONFIDENCE_BUCKETS)[number];

export type PredictionReviewAlertType =
  | "favorite_changed"
  | "max_one_x_two_delta"
  | "home_xg_delta"
  | "away_xg_delta"
  | "modal_score_changed"
  | "btts_changed"
  | "over_under_changed"
  | "confidence_changed"
  | "risk_changed"
  | "team_signal_change"
  | "elo_gap"
  | "elo_inversion"
  | "retained_fixture_override";

export type PredictionReviewAlert = {
  type: PredictionReviewAlertType;
  category: "refresh_delta" | "external_coherence" | "retained_fixture";
  severity: ReviewAlertSeverity;
  code: string;
  label: string;
  description: string;
  metadata?: Record<string, string | number | boolean | null>;
};

export type ReviewSignalChangeCategory = "none" | "material" | "critical";

export type PredictionReviewThresholds = {
  maxOneXTwoDeltaPct: number;
  expectedGoalsDelta: number;
  modalScoreGoalDelta: number;
  coherenceWatchGapPct: number;
  coherenceManualReviewGapPct: number;
  coherenceCriticalGapPct: number;
};

export type PredictionReviewBundle = {
  kind: ReviewSnapshotKind;
  predictionVersionId?: string | null;
  modelVersionId?: string | null;
  modelVersionLabel?: string | null;
  sourceSnapshotId: string;
  predictionType: PredictionEngineOutput["predictionVersionProjection"]["predictionType"];
  runScope: PredictionEngineOutput["predictionVersionProjection"]["runScope"] | "review_preview";
  homeWinProb: number;
  drawProb: number;
  awayWinProb: number;
  expectedHomeGoals: number;
  expectedAwayGoals: number;
  mostLikelyScore: string;
  topScorelines: PredictionEngineOutput["topScorelines"];
  bttsYesProb: number | null;
  bttsNoProb: number | null;
  over25Prob: number | null;
  under25Prob: number | null;
  confidenceScore: number;
  confidenceBucket: ReviewConfidenceBucket;
  riskLevel: RiskLevel;
  notes: string[];
  factors: string[];
  provenanceLabel: string;
};

export type PredictionReviewCoherenceFixture = {
  teamAKey: string;
  teamAEn: string;
  teamADisplayNameEs: string;
  teamBKey: string;
  teamBEn: string;
  teamBDisplayNameEs: string;
  eloRankA: number;
  eloRankB: number;
  eloRatingA: number;
  eloRatingB: number;
  eloWinningExpectancyA: number;
  eloWinningExpectancyB: number;
  matchDate: string;
};

export type PredictionReviewProviderState =
  | {
      status: "available";
      fixture: ProviderFixture;
    }
  | {
      status: "unavailable";
      reason: string;
    }
  | {
      status: "not_found";
      reason: string;
    };

export type PredictionReviewProviderGuard = {
  allowed: boolean;
  reason: string | null;
};

export type PredictionReviewAiAvailability =
  | {
      status: "available";
      provider: string;
      model: string;
    }
  | {
      status: "unavailable";
      reason: string;
    };

export type PredictionReviewAiExecutionStatus = "succeeded" | "failed" | "unavailable";

export type PredictionReviewAiResponse = {
  decision: ReviewDecision;
  rationale: string;
  evidenceUsed: string[];
  contradictions: string[];
  confidence: "low" | "medium" | "high";
  proposedHomeXg: number | null;
  proposedAwayXg: number | null;
  warnings: string[];
  humanApprovalRequired: boolean;
};

export type PredictionReviewCaseSummary = {
  matchId: string;
  externalId: string;
  slug: string;
  kickoffAt: string;
  providerStatus: ProviderFixtureStatus | null;
  providerStatusShort: string | null;
  providerStatusLabel: string;
  providerStatusAvailable: boolean;
  providerStatusReason: string | null;
  accessScope: "public" | "admin_only";
  competitionName: string;
  homeTeamNameEn: string;
  awayTeamNameEn: string;
  homeTeamDisplayNameEs: string;
  awayTeamDisplayNameEs: string;
  currentPrediction: PredictionReviewBundle | null;
  shadowPrediction: PredictionReviewBundle | null;
  reviewedXgPreview: PredictionReviewBundle | null;
  coherenceFixture: PredictionReviewCoherenceFixture | null;
  refreshAlerts: PredictionReviewAlert[];
  coherenceAlerts: PredictionReviewAlert[];
  retainedFixtureOverride: boolean;
  aiAvailability: PredictionReviewAiAvailability;
  latestAiRecommendation: PredictionReviewAiResponse | null;
  auditHistory: Array<{
    id: string;
    kind: "shadow" | "ai" | "decision" | "publication";
    createdAt: string;
    summary: string;
  }>;
};

export type AtypicalFixtureSeverity =
  | "NONE"
  | "WATCH"
  | "REVIEW"
  | "CRITICAL";

export type AtypicalFixtureAdvisoryAction =
  | "KEEP_CURRENT"
  | "REGENERATE_CURRENT_MODEL"
  | "PROPOSE_REVIEWED_XG"
  | "HOLD_PUBLICATION"
  | "MODEL_EXPERIMENT_REQUIRED";

export type AtypicalFixtureFlagFamily =
  | "SOURCE_INTEGRITY"
  | "EXTERNAL_COHERENCE"
  | "SIGNAL_DYNAMICS"
  | "INTERNAL_COHERENCE"
  | "PRESENTATION";

export type AtypicalFixtureFlagCode =
  | "REQUIRED_EVIDENCE_MISSING"
  | "INVALID_PROBABILITY_BUNDLE"
  | "INVALID_XG_BUNDLE"
  | "INVALID_MODAL_SCORE"
  | "SOURCE_QUALITY_FAILED"
  | "SOURCE_PROVENANCE_MISSING"
  | "SOURCE_AFTER_PREMATCH_CUTOFF"
  | "ALIAS_UNRESOLVED"
  | "RECENT_SAMPLE_TOO_SMALL"
  | "ELO_DECISIVE_SHARE_GAP"
  | "ELO_FAVORITE_INVERSION"
  | "STRONG_SIGNAL_MOVEMENT"
  | "SIGNAL_DIRECTION_CONFLICT"
  | "XG_1X2_DIRECTION_CONFLICT"
  | "MODAL_1X2_CONFLICT"
  | "MODAL_DRAW_VS_STRONG_FAVORITE"
  | "CONFIDENCE_SPREAD_CONFLICT"
  | "RISK_SPREAD_CONFLICT"
  | "STRONG_FAVORITE_LOW_XG"
  | "LARGE_RATING_GAP_BALANCED_1X2"
  | "BTTS_XG_MISMATCH"
  | "OVER_UNDER_XG_MISMATCH";

export type SuspectedPrimaryCauseCode =
  | "SOURCE_DATA_DEFECT"
  | "TEAM_IDENTITY_OR_ALIAS_DEFECT"
  | "SIGNAL_AGGREGATION_DEFECT"
  | "MODEL_FORMULA_LIMITATION"
  | "ELO_MODEL_DISAGREEMENT"
  | "LEGITIMATE_UFO_DISAGREEMENT"
  | "CONFIDENCE_OR_RISK_PRESENTATION_DEFECT"
  | "INSUFFICIENT_EVIDENCE";

export type ClassificationCertainty = "LOW" | "MEDIUM" | "HIGH";

export interface AtypicalFixtureFlag {
  code: AtypicalFixtureFlagCode;
  family: AtypicalFixtureFlagFamily;
  severity: Exclude<AtypicalFixtureSeverity, "NONE">;
  points: number;
  explanation: string;
  evidenceRefs: string[];
}

export interface SignalEvidence {
  ratingScore: number | null;
  recentFormScore: number | null;
  attackScore: number | null;
  defenseScore: number | null;
  weightedPower: number | null;
}

export interface SignalGapEvidence {
  rating: number | null;
  recentForm: number | null;
  attack: number | null;
  defense: number | null;
  weightedPower: number | null;
}

export interface SuspectedPrimaryCause {
  code: SuspectedPrimaryCauseCode;
  certainty: ClassificationCertainty;
  rationale: string;
  supportingFlagCodes: AtypicalFixtureFlagCode[];
  alternativeCauseCodes: SuspectedPrimaryCauseCode[];
}

export type OutcomeLeader = "HOME" | "DRAW" | "AWAY" | "TIE";
export type AtypicalFixtureFavoriteSide = Exclude<OutcomeLeader, "TIE">;
export type AtypicalFixtureLevelFavorite = "HOME" | "LEVEL" | "AWAY";

export interface AtypicalFixtureDetectorInput {
  fixture: {
    matchId: string;
    providerFixtureId: number | null;
    competitionKey: string;
    stage: string | null;
    kickoffAt: string;
    status: string;
    homeTeam: {
      canonicalKey: string;
      displayName: string;
    };
    awayTeam: {
      canonicalKey: string;
      displayName: string;
    };
  };
  prediction: {
    predictionVersionId: string;
    modelVersionId: string | null;
    modelVersionName: string | null;
    generatedAt: string;
    scope: string;
    signalSnapshotId: string | null;
  };
  coverage: {
    missingEvidence: string[];
    preMatchCutoffSatisfied: boolean;
  };
  evidence: {
    oneXtwo: {
      homePct: number | null;
      drawPct: number | null;
      awayPct: number | null;
    };
    expectedGoals: {
      home: number | null;
      away: number | null;
    };
    modalScore: {
      homeGoals: number | null;
      awayGoals: number | null;
      probabilityPct: number | null;
    };
    elo: {
      available: boolean;
      homeTwoWayPct: number | null;
      awayTwoWayPct: number | null;
      homeRating: number | null;
      awayRating: number | null;
      favoriteNeutralMarginPct: number | null;
      dominantFavoriteThresholdPct: number | null;
      dominantInversionFavoriteWinThresholdPct: number | null;
      dominantInversionRawFavoriteMarginPp: number | null;
    };
    signals: {
      home: SignalEvidence;
      away: SignalEvidence;
      componentGaps: SignalGapEvidence;
      movement: {
        available: boolean;
        maxAbsoluteDelta: number | null;
        totalAbsoluteDelta: number | null;
        changedComponents: string[];
      };
    };
    markets: {
      bttsYesPct: number | null;
      over25Pct: number | null;
    };
    confidenceRisk: {
      confidenceScore: number | null;
      riskLevel: string | null;
    };
    sourceIntegrity: {
      qualityVerdict: "PASS" | "FAIL" | "UNKNOWN";
      homeAliasResolved: boolean;
      awayAliasResolved: boolean;
      homeRecentSampleSize: number | null;
      awayRecentSampleSize: number | null;
      latestEvidenceAt: string | null;
      postCutoffEvidenceCount: number;
      centralProvenanceComplete: boolean;
    };
    referenceProjection: {
      available: boolean;
      oneXtwoDeltaMaxPp: number | null;
      expectedGoalsDeltaMax: number | null;
      favoriteChanged: boolean | null;
    };
  };
  provenance: {
    predictionVersionId: string;
    modelVersionId: string | null;
    signalSnapshotId: string | null;
    signalSnapshotDate: string | null;
    eloSnapshotId: string | null;
    qualityReportId: string | null;
    sourceManifestId: string | null;
    aliasResolverVersion: string | null;
    referenceProjectionGeneratedInMemory: boolean;
  };
}

export interface AtypicalFixtureEvidenceBundleV1 {
  schemaVersion: "atypical-fixture-evidence-v1";
  detectorVersion: "model-ops-01-slice-a-v1";
  analysisAsOf: string;
  inputFingerprint: string;
  fixture: AtypicalFixtureDetectorInput["fixture"];
  prediction: AtypicalFixtureDetectorInput["prediction"];
  coverage: {
    status: "COMPLETE" | "PARTIAL";
    missingEvidence: string[];
    preMatchCutoffSatisfied: boolean;
  };
  severity: AtypicalFixtureSeverity;
  anomalyScore: number;
  orderedFlags: AtypicalFixtureFlag[];
  evidence: {
    oneXtwo: {
      homePct: number;
      drawPct: number;
      awayPct: number;
      favorite: OutcomeLeader;
      topOutcomePct: number;
      topTwoSpreadPp: number;
      decisiveHomeSharePct: number;
    };
    expectedGoals: {
      home: number;
      away: number;
      total: number;
      difference: number;
      favorite: AtypicalFixtureLevelFavorite;
    };
    modalScore: {
      homeGoals: number;
      awayGoals: number;
      outcome: AtypicalFixtureFavoriteSide;
      probabilityPct: number | null;
    };
    elo: {
      available: boolean;
      homeTwoWayPct: number | null;
      awayTwoWayPct: number | null;
      favorite: Exclude<AtypicalFixtureFavoriteSide, "DRAW"> | null;
      decisiveShareGapPp: number | null;
      favoriteInversion: boolean | null;
      homeRating: number | null;
      awayRating: number | null;
      ratingGap: number | null;
    };
    signals: {
      home: SignalEvidence;
      away: SignalEvidence;
      componentGaps: SignalGapEvidence;
      movement: AtypicalFixtureDetectorInput["evidence"]["signals"]["movement"];
    };
    marketCoherence: {
      bttsYesPct: number | null;
      bttsYesFromXgPct: number | null;
      bttsGapPp: number | null;
      over25Pct: number | null;
      over25FromXgPct: number | null;
      over25GapPp: number | null;
    };
    confidenceRisk: {
      confidenceScore: number | null;
      riskLevel: string | null;
      confidenceMinusTopOutcome: number | null;
    };
    sourceIntegrity: AtypicalFixtureDetectorInput["evidence"]["sourceIntegrity"];
  };
  suspectedPrimaryCause: SuspectedPrimaryCause | null;
  advisoryAction: {
    code: AtypicalFixtureAdvisoryAction;
    rationale: string;
    supportingFlagCodes: AtypicalFixtureFlagCode[];
  };
  provenance: AtypicalFixtureDetectorInput["provenance"];
}

export interface AtypicalFixtureAnalysisReportV1 {
  schemaVersion: "atypical-fixture-analysis-report-v1";
  detectorVersion: "model-ops-01-slice-a-v1";
  analysisAsOf: string;
  scope: {
    competitionKey: string;
    stage: string;
    futureOnly: true;
  };
  fixtureCount: number;
  countsBySeverity: Record<AtypicalFixtureSeverity, number>;
  rankedFixtures: AtypicalFixtureEvidenceBundleV1[];
}
