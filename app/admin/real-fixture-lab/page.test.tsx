import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const {
  requireAdminMock,
  getAdminRealFixtureLabDataMock,
  buildRealFixturePredictionInputMock,
  generatePredictionMock,
} = vi.hoisted(() => ({
  requireAdminMock: vi.fn(),
  getAdminRealFixtureLabDataMock: vi.fn(),
  buildRealFixturePredictionInputMock: vi.fn(),
  generatePredictionMock: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  requireAdmin: requireAdminMock,
}));

vi.mock("@/lib/supabase/real-fixture-lab-queries", () => ({
  getAdminRealFixtureLabData: getAdminRealFixtureLabDataMock,
}));

vi.mock("@/lib/prediction-engine/real-fixture-adapter", () => ({
  buildRealFixturePredictionInput: buildRealFixturePredictionInputMock,
}));

vi.mock("@/lib/prediction-engine/generate-prediction", () => ({
  generatePrediction: generatePredictionMock,
}));

vi.mock("./actions", () => ({
  saveRealFixturePredictionAction: vi.fn(),
  persistRealFixtureEvaluationAction: vi.fn(),
  verifyRealFixtureResultAction: vi.fn(),
  publishRealFixturePredictionAction: vi.fn(),
  refreshPublishedRealFixturePredictionAction: vi.fn(),
}));

import RealFixtureLabPage, { organizeFixtureEntries } from "./page";

const preview = {
  probabilities: {
    oneXTwo: { homeWin: 41, draw: 29, awayWin: 30 },
    btts: { yes: 48, no: 52 },
    overUnder25: { over: 45, under: 55 },
  },
  mostLikelyScore: "1-0",
  confidence: 57,
  risk: "medium",
  topScorelines: [
    { score: "1-0", probability: 15 },
    { score: "1-1", probability: 12 },
  ],
  notes: ["note 1"],
  factors: ["factor 1"],
  normalizedInput: {
    runScope: "internal_lab",
    predictionType: "pre_match_24h",
    dataCompleteness: 1,
    context: {
      neutralVenue: true,
      homeAdvantageScore: 50,
    },
    homeTeam: {
      providedSignals: ["rating", "form"],
    },
    awayTeam: {
      providedSignals: ["rating", "form"],
    },
  },
};

function buildFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: "match-1",
    externalId: "api-football:fixture:1538999",
    slug: "world-cup-2026-south-korea-vs-czech-republic-2026-06-12",
    competitionId: "competition-1",
    kickoffAt: "2026-06-12T02:00:00Z",
    stage: "Group Stage - 1",
    status: "finished",
    accessScope: "public",
    intakeSource: "api_football",
    sourceNote: "tracked by ingest",
    competitionName: "World Cup",
    homeTeamId: "team-1",
    homeTeamName: "South Korea",
    awayTeamId: "team-2",
    awayTeamName: "Czech Republic",
    activeModelVersionId: "model-1",
    activeModelVersion: "v0.2-prelaunch",
    activeModelSavedPredictionId: "prediction-1",
    hasSavedPredictionForActiveModel: true,
    latestPublicPredictionId: "public-prediction-1",
    latestPublicPredictionCreatedAt: "2026-06-11T10:00:00Z",
    latestPublicPredictionMarketCount: 0,
    hasLatestPublicModelDetail: false,
    result: {
      id: "result-1",
      home_goals: 2,
      away_goals: 1,
      verification_status: "pending_review",
      intake_source: "api_football",
      source_note: "result source",
      reviewed_at: null,
      reviewed_by: null,
    },
    savedPrediction: {
      id: "prediction-1",
      modelVersionId: "model-1",
      modelVersionVersion: "v0.2-prelaunch",
      createdAt: "2026-06-12T10:00:00Z",
      predictionType: "pre_match_24h",
      runScope: "internal_lab",
    },
    savedEvaluation: null,
    ...overrides,
  };
}

function buildEntry(overrides: Record<string, unknown> = {}) {
  const fixture = buildFixture(overrides);

  return {
    fixture,
    predictionInput: { matchId: fixture.id },
    preview,
    derivedSignalWarning: null,
    evaluationStatus: "waiting_result" as const,
    operationalState: "future_ready" as const,
  };
}

async function renderSelectedFixture(fixture: ReturnType<typeof buildFixture>) {
  getAdminRealFixtureLabDataMock.mockImplementation(async (options?: { externalId?: string }) => {
    if (options?.externalId) {
      return {
        status: "ready",
        selectedExternalId: options.externalId,
        fixtures: [fixture],
        warnings: [],
      };
    }

    return {
      status: "ready",
      selectedExternalId: null,
      fixtures: [],
      warnings: [],
    };
  });

  const element = await RealFixtureLabPage({
    searchParams: Promise.resolve({
      externalId: fixture.externalId,
    }),
  });

  return renderToStaticMarkup(element);
}

async function renderSummary(fixtures: Array<ReturnType<typeof buildFixture>>) {
  getAdminRealFixtureLabDataMock.mockResolvedValue({
    status: "ready",
    selectedExternalId: null,
    fixtures,
    warnings: [],
  });

  const element = await RealFixtureLabPage({
    searchParams: Promise.resolve({}),
  });

  return renderToStaticMarkup(element);
}

describe("RealFixtureLabPage control visibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-14T12:00:00Z"));
    requireAdminMock.mockResolvedValue({ user: { id: "admin-1" } });
    buildRealFixturePredictionInputMock.mockReturnValue({ matchId: "match-1" });
    generatePredictionMock.mockReturnValue(preview);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the verification control for a selected public finished fixture with pending_review result", async () => {
    const html = await renderSelectedFixture(buildFixture());

    expect(html).toContain("Verify result");
    expect(html).toContain("Refrescar prediccion publica para este fixture");
  });

  it("does not render the verification control for a selected public scheduled fixture", async () => {
    const html = await renderSelectedFixture(
      buildFixture({
        status: "scheduled",
      }),
    );

    expect(html).not.toContain("Verify result");
    expect(html).toContain("Refrescar prediccion publica para este fixture");
  });

  it("renders the evaluation persistence control after a verified result exists", async () => {
    const html = await renderSelectedFixture(
      buildFixture({
        result: {
          id: "result-1",
          home_goals: 2,
          away_goals: 1,
          verification_status: "verified",
          intake_source: "api_football",
          source_note: "result source",
          reviewed_at: "2026-06-12T12:00:00Z",
          reviewed_by: "admin-1",
        },
      }),
    );

    expect(html).toContain("Persistir evaluacion interna");
    expect(html).not.toContain("Verify result");
  });

  it("organizes world cup operations ahead of legacy pilot fixtures", () => {
    const organized = organizeFixtureEntries(
      [
        buildEntry({
          id: "wc-upcoming",
          externalId: "api-football:fixture:wc-upcoming",
          status: "scheduled",
          competitionName: "World Cup 2026",
          kickoffAt: "2026-06-14T02:00:00Z",
          hasSavedPredictionForActiveModel: false,
          latestPublicPredictionId: null,
          latestPublicPredictionCreatedAt: null,
          latestPublicPredictionMarketCount: 0,
          hasLatestPublicModelDetail: false,
          result: null,
          savedPrediction: null,
          activeModelSavedPredictionId: null,
        }),
        buildEntry({
          id: "wc-pending",
          externalId: "api-football:fixture:wc-pending",
          status: "finished",
          competitionName: "World Cup 2026",
          kickoffAt: "2026-06-13T02:00:00Z",
          result: {
            id: "result-pending",
            home_goals: 1,
            away_goals: 1,
            verification_status: "pending_review",
            intake_source: "api_football",
            source_note: null,
            reviewed_at: null,
            reviewed_by: null,
          },
        }),
        buildEntry({
          id: "wc-verified",
          externalId: "api-football:fixture:wc-verified",
          status: "finished",
          competitionName: "World Cup 2026",
          kickoffAt: "2026-06-12T02:00:00Z",
          result: {
            id: "result-verified",
            home_goals: 2,
            away_goals: 0,
            verification_status: "verified",
            intake_source: "api_football",
            source_note: null,
            reviewed_at: "2026-06-12T04:00:00Z",
            reviewed_by: "admin-1",
          },
          savedEvaluation: {
            winnerCorrect: true,
            bttsCorrect: true,
            over25Correct: false,
            exactScoreCorrect: false,
            goalError: 1.2,
            errorSummary: null,
            validatedAt: "2026-06-12T05:00:00Z",
          },
        }),
        buildEntry({
          id: "legacy",
          externalId: "api-football:fixture:legacy",
          competitionName: "Friendly Cup",
          kickoffAt: "2026-05-01T02:00:00Z",
        }),
      ],
      "all",
      new Date("2026-06-13T12:00:00Z"),
    );

    expect(organized.primarySections.map((section) => section.title)).toEqual([
      "Operational now",
      "Upcoming fixtures",
    ]);
    expect(organized.primarySections[0]?.entries[0]?.fixture.externalId).toBe(
      "api-football:fixture:wc-pending",
    );
    expect(organized.primarySections[1]?.entries[0]?.fixture.externalId).toBe(
      "api-football:fixture:wc-upcoming",
    );
    expect(organized.legacyEntries.map((entry) => entry.fixture.externalId)).toEqual([
      "api-football:fixture:legacy",
    ]);
  });

  it("keeps verified_missing_evaluation in All and shows complete only in Verified / evaluated", () => {
    const verifiedMissingEvaluation = buildEntry({
      id: "wc-verified-missing-eval",
      externalId: "api-football:fixture:wc-verified-missing-eval",
      competitionName: "World Cup 2026",
      status: "finished",
      kickoffAt: "2026-06-13T02:00:00Z",
      result: {
        id: "result-verified",
        home_goals: 1,
        away_goals: 0,
        verification_status: "verified",
        intake_source: "api_football",
        source_note: null,
        reviewed_at: "2026-06-13T05:00:00Z",
        reviewed_by: "admin-1",
      },
      savedEvaluation: null,
    });
    const completeFixture = buildEntry({
      id: "wc-complete",
      externalId: "api-football:fixture:wc-complete",
      competitionName: "World Cup 2026",
      status: "finished",
      kickoffAt: "2026-06-12T02:00:00Z",
      result: {
        id: "result-complete",
        home_goals: 2,
        away_goals: 1,
        verification_status: "verified",
        intake_source: "api_football",
        source_note: null,
        reviewed_at: "2026-06-12T05:00:00Z",
        reviewed_by: "admin-1",
      },
      savedEvaluation: {
        winnerCorrect: true,
        bttsCorrect: true,
        over25Correct: true,
        exactScoreCorrect: false,
        goalError: 1,
        errorSummary: null,
        validatedAt: "2026-06-12T06:00:00Z",
      },
    });

    const allView = organizeFixtureEntries(
      [verifiedMissingEvaluation, completeFixture],
      "all",
      new Date("2026-06-14T12:00:00Z"),
    );
    const verifiedView = organizeFixtureEntries(
      [verifiedMissingEvaluation, completeFixture],
      "verified_evaluated",
      new Date("2026-06-14T12:00:00Z"),
    );

    expect(allView.primarySections).toHaveLength(1);
    expect(allView.primarySections[0]?.entries.map((entry) => entry.fixture.externalId)).toEqual([
      "api-football:fixture:wc-verified-missing-eval",
    ]);
    expect(verifiedView.primarySections[0]?.entries.map((entry) => entry.fixture.externalId)).toEqual([
      "api-football:fixture:wc-verified-missing-eval",
      "api-football:fixture:wc-complete",
    ]);
  });

  it("treats upcoming public fixtures with model detail but zero direct market count as future_ready", () => {
    const organized = organizeFixtureEntries(
      [
        buildEntry({
          id: "wc-model-detail-ready",
          externalId: "api-football:fixture:wc-model-detail-ready",
          competitionName: "World Cup 2026",
          status: "scheduled",
          kickoffAt: "2026-06-15T02:00:00Z",
          result: null,
          latestPublicPredictionId: "public-prediction-1",
          latestPublicPredictionCreatedAt: "2026-06-14T20:00:00Z",
          latestPublicPredictionMarketCount: 0,
          hasLatestPublicModelDetail: true,
        }),
      ],
      "all",
      new Date("2026-06-14T12:00:00Z"),
    );

    expect(organized.primarySections).toHaveLength(1);
    expect(organized.primarySections[0]?.title).toBe("Upcoming fixtures");
    expect(organized.primarySections[0]?.entries[0]?.operationalState).toBe("future_ready");
  });

  it("renders summary filters and the legacy section affordance", async () => {
    const html = await renderSummary([
      buildFixture({
        id: "wc-upcoming",
        externalId: "api-football:fixture:wc-upcoming",
        status: "scheduled",
        accessScope: "admin_only",
        competitionName: "World Cup 2026",
        savedPrediction: null,
        hasSavedPredictionForActiveModel: false,
        activeModelSavedPredictionId: null,
      }),
      buildFixture({
        id: "legacy",
        externalId: "api-football:fixture:legacy",
        competitionName: "Friendly Cup",
        accessScope: "admin_only",
      }),
    ]);

    expect(html).toContain("World Cup active");
    expect(html).toContain("Operational now");
    expect(html).toContain("Needs prediction");
    expect(html).toContain("Legacy / pilot fixtures");
  });
});
