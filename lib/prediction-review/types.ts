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
  bttsYesProb: number;
  bttsNoProb: number;
  over25Prob: number;
  under25Prob: number;
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
