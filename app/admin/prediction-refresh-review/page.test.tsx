import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const { requireAdminMock, getPredictionRefreshReviewPageDataMock } = vi.hoisted(() => ({
  requireAdminMock: vi.fn(),
  getPredictionRefreshReviewPageDataMock: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  requireAdmin: requireAdminMock,
}));

vi.mock("@/lib/supabase/prediction-refresh-review-queries", () => ({
  getPredictionRefreshReviewPageData: getPredictionRefreshReviewPageDataMock,
}));

vi.mock("./actions", () => ({
  generatePredictionRefreshShadowAction: vi.fn(),
  analyzePredictionRefreshWithAiAction: vi.fn(),
  keepCurrentPredictionRefreshAction: vi.fn(),
  holdPredictionRefreshAction: vi.fn(),
  publishRefreshedPredictionReviewAction: vi.fn(),
  previewReviewedXgAction: vi.fn(),
}));

import PredictionRefreshReviewPage from "./page";

describe("PredictionRefreshReviewPage", () => {
  it("requires admin access and renders the review gate shell in Spanish", async () => {
    requireAdminMock.mockResolvedValue({ user: { id: "admin-1" } });
    getPredictionRefreshReviewPageDataMock.mockResolvedValue({
      aiAvailability: {
        status: "unavailable",
        reason: "No supported AI provider key is configured.",
      },
      atypicalAnalysisReport: null,
      cases: [],
      warnings: [],
    });

    const element = await PredictionRefreshReviewPage({
      searchParams: Promise.resolve({}),
    });
    const html = renderToStaticMarkup(element);

    expect(requireAdminMock).toHaveBeenCalledWith("/admin/prediction-refresh-review");
    expect(html).toContain("Revision de refresco de predicciones");
    expect(html).toContain("Provider IA");
  });

  it("shows AI unavailable while keeping deterministic shadow review available", async () => {
    requireAdminMock.mockResolvedValue({ user: { id: "admin-1" } });
    getPredictionRefreshReviewPageDataMock.mockResolvedValue({
      aiAvailability: {
        status: "unavailable",
        reason: "No supported AI provider key is configured.",
      },
      atypicalAnalysisReport: {
        schemaVersion: "atypical-fixture-analysis-report-v1",
        detectorVersion: "model-ops-01-slice-a-v1",
        analysisAsOf: "2026-06-19T21:11:52.000Z",
        scope: {
          competitionKey: "world-cup",
          stage: "Group Stage - 2",
          futureOnly: true,
        },
        fixtureCount: 1,
        countsBySeverity: {
          NONE: 0,
          WATCH: 1,
          REVIEW: 0,
          CRITICAL: 0,
        },
        rankedFixtures: [
          {
            schemaVersion: "atypical-fixture-evidence-v1",
            detectorVersion: "model-ops-01-slice-a-v1",
            analysisAsOf: "2026-06-19T21:11:52.000Z",
            inputFingerprint: "abc123",
            fixture: {
              matchId: "match-1",
              providerFixtureId: 1540356,
              competitionKey: "world-cup",
              stage: "Group Stage - 2",
              kickoffAt: "2026-06-19T22:00:00Z",
              status: "scheduled",
              homeTeam: { canonicalKey: "usa", displayName: "USA" },
              awayTeam: { canonicalKey: "turkey", displayName: "Türkiye" },
            },
            prediction: {
              predictionVersionId: "prediction-1",
              modelVersionId: "model-v0",
              modelVersionName: "v0.1-lab",
              generatedAt: "2026-06-19T12:00:00Z",
              scope: "public_product",
              signalSnapshotId: "2026-06-19",
            },
            coverage: {
              status: "PARTIAL",
              missingEvidence: ["signals.movement.history"],
              preMatchCutoffSatisfied: true,
            },
            severity: "WATCH",
            anomalyScore: 12,
            orderedFlags: [
              {
                code: "CONFIDENCE_SPREAD_CONFLICT",
                family: "PRESENTATION",
                severity: "WATCH",
                points: 12,
                explanation: "Confidence is high relative to a modest top-outcome probability.",
                evidenceRefs: ["confidenceRisk.confidenceScore"],
              },
            ],
            evidence: {
              oneXtwo: {
                homePct: 40,
                drawPct: 31,
                awayPct: 29,
                favorite: "HOME",
                topOutcomePct: 40,
                topTwoSpreadPp: 9,
                decisiveHomeSharePct: 58,
              },
              expectedGoals: {
                home: 1.2,
                away: 1.05,
                total: 2.25,
                difference: 0.15,
                favorite: "LEVEL",
              },
              modalScore: {
                homeGoals: 1,
                awayGoals: 1,
                outcome: "DRAW",
                probabilityPct: 13,
              },
              elo: {
                available: true,
                homeTwoWayPct: 56,
                awayTwoWayPct: 44,
                favorite: "HOME",
                decisiveShareGapPp: 2,
                favoriteInversion: false,
                homeRating: 1780,
                awayRating: 1839,
                ratingGap: -59,
              },
              signals: {
                home: {
                  ratingScore: 61,
                  recentFormScore: 58,
                  attackScore: 54,
                  defenseScore: 55,
                  weightedPower: 57,
                },
                away: {
                  ratingScore: 60,
                  recentFormScore: 57,
                  attackScore: 53,
                  defenseScore: 54,
                  weightedPower: 56,
                },
                componentGaps: {
                  rating: 1,
                  recentForm: 1,
                  attack: 1,
                  defense: 1,
                  weightedPower: 1,
                },
                movement: {
                  available: false,
                  maxAbsoluteDelta: null,
                  totalAbsoluteDelta: null,
                  changedComponents: [],
                },
              },
              marketCoherence: {
                bttsYesPct: 49,
                bttsYesFromXgPct: 47,
                bttsGapPp: 2,
                over25Pct: 44,
                over25FromXgPct: 42,
                over25GapPp: 2,
              },
              confidenceRisk: {
                confidenceScore: 82,
                riskLevel: "low",
                confidenceMinusTopOutcome: 42,
              },
              sourceIntegrity: {
                qualityVerdict: "PASS",
                homeAliasResolved: true,
                awayAliasResolved: true,
                homeRecentSampleSize: 4,
                awayRecentSampleSize: 5,
                latestEvidenceAt: "2026-06-18T00:00:00.000Z",
                postCutoffEvidenceCount: 0,
                centralProvenanceComplete: true,
              },
            },
            suspectedPrimaryCause: {
              code: "CONFIDENCE_OR_RISK_PRESENTATION_DEFECT",
              certainty: "MEDIUM",
              rationale: "Presentation is the dominant issue.",
              supportingFlagCodes: ["CONFIDENCE_SPREAD_CONFLICT"],
              alternativeCauseCodes: ["MODEL_FORMULA_LIMITATION"],
            },
            advisoryAction: {
              code: "KEEP_CURRENT",
              rationale: "Presentation only.",
              supportingFlagCodes: ["CONFIDENCE_SPREAD_CONFLICT"],
            },
            provenance: {
              predictionVersionId: "prediction-1",
              modelVersionId: "model-v0",
              signalSnapshotId: "2026-06-19",
              signalSnapshotDate: "2026-06-19",
              eloSnapshotId: "fixture-elo-coherence:2026-06-19",
              qualityReportId: "quality-report:2026-06-19",
              sourceManifestId: "source-manifest:2026-06-19",
              aliasResolverVersion: "national-team-strength-snapshots:2026-06-19",
              referenceProjectionGeneratedInMemory: true,
            },
          },
        ],
      },
      warnings: [],
      cases: [
        {
          matchId: "match-1",
          externalId: "api-football:fixture:1540356",
          slug: "usa-turkiye",
          kickoffAt: "2026-06-19T22:00:00Z",
          providerStatus: "scheduled",
          providerStatusShort: "NS",
          providerStatusLabel: "scheduled",
          providerStatusAvailable: true,
          providerStatusReason: null,
          accessScope: "admin_only",
          competitionName: "World Cup",
          homeTeamNameEn: "USA",
          awayTeamNameEn: "Türkiye",
          homeTeamDisplayNameEs: "Estados Unidos",
          awayTeamDisplayNameEs: "Turquía",
          currentPrediction: null,
          shadowPrediction: null,
          reviewedXgPreview: null,
          coherenceFixture: null,
          refreshAlerts: [],
          coherenceAlerts: [],
          retainedFixtureOverride: false,
          aiAvailability: {
            status: "unavailable",
            reason: "No supported AI provider key is configured.",
          },
          latestAiRecommendation: null,
          auditHistory: [],
        },
      ],
    });

    const element = await PredictionRefreshReviewPage({
      searchParams: Promise.resolve({}),
    });
    const html = renderToStaticMarkup(element);

    expect(html).toContain("IA no disponible");
    expect(html).toContain("Generar predicción sombra");
    expect(html).toContain("disabled");
    expect(html).toContain("Diagnóstico de fixtures atípicos");
    expect(html).toContain("CONFIDENCE_SPREAD_CONFLICT");
  });
});
