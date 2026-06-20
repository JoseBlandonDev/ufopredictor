import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createSupabaseServerClientMock,
  buildPredictionReviewBundleFromVersionMock,
  findPredictionReviewCoherenceFixtureMock,
  orientPredictionReviewCoherenceFixtureMock,
  validatePredictionReviewProviderFixtureMock,
} = vi.hoisted(() => ({
  createSupabaseServerClientMock: vi.fn(),
  buildPredictionReviewBundleFromVersionMock: vi.fn(() => ({
    kind: "current_reference",
    sourceSnapshotId: "2026-06-19",
    predictionType: "pre_match_24h",
    runScope: "public_product",
    homeWinProb: 54,
    drawProb: 24,
    awayWinProb: 22,
    expectedHomeGoals: 1.4,
    expectedAwayGoals: 0.9,
    mostLikelyScore: "1-0",
    topScorelines: [{ score: "1-0", probability: 12 }],
    bttsYesProb: 46,
    bttsNoProb: 54,
    over25Prob: 48,
    under25Prob: 52,
    confidenceScore: 71,
    confidenceBucket: "medium",
    riskLevel: "low",
    notes: [],
    factors: [],
    provenanceLabel: "Current public prediction",
  })),
  findPredictionReviewCoherenceFixtureMock: vi.fn(() => null),
  orientPredictionReviewCoherenceFixtureMock: vi.fn(() => null),
  validatePredictionReviewProviderFixtureMock: vi.fn(() => ({
    allowed: true,
    reason: null,
  })),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: createSupabaseServerClientMock,
}));

vi.mock("../prediction-review/ai", () => ({
  discoverPredictionReviewAiAvailability: vi.fn(() => ({
    status: "unavailable",
    reason: "test",
  })),
}));

vi.mock("../prediction-review/bundle", () => ({
  buildPredictionReviewBundleFromSnapshot: vi.fn(() => null),
  buildPredictionReviewBundleFromVersion: buildPredictionReviewBundleFromVersionMock,
}));

vi.mock("../prediction-review/coherence-source", () => ({
  findPredictionReviewCoherenceFixture: findPredictionReviewCoherenceFixtureMock,
  orientPredictionReviewCoherenceFixture: orientPredictionReviewCoherenceFixtureMock,
}));

vi.mock("../prediction-review/provider", () => ({
  readPredictionReviewProviderState: vi.fn(async () => ({
    status: "available",
    fixture: { status: "scheduled", statusShort: "NS" },
  })),
  validatePredictionReviewProviderFixture: validatePredictionReviewProviderFixtureMock,
}));

vi.mock("../prediction-review/team-display-names", () => ({
  resolvePredictionReviewTeamDisplayNameEs: vi.fn((name: string) => name),
}));

vi.mock("../prediction-review/fixtures", () => ({
  isRetainedPredictionReviewFixture: vi.fn(() => false),
}));

vi.mock("../prediction-review/alerts", () => ({
  calculateExternalCoherenceAlerts: vi.fn(() => []),
  calculateRefreshDeltaAlerts: vi.fn(() => []),
}));

import { getPredictionRefreshReviewPageData } from "./prediction-refresh-review-queries";

type QueryState = {
  eq: Array<{ column: string; value: unknown }>;
  in: Array<{ column: string; value: unknown[] }>;
  gte: Array<{ column: string; value: unknown }>;
  lte: Array<{ column: string; value: unknown }>;
};

class FakeQueryBuilder {
  private state: QueryState = { eq: [], in: [], gte: [], lte: [] };

  constructor(
    private readonly table: string,
    private readonly resolve: (table: string, state: QueryState) => { data: unknown[]; error: null },
  ) {}

  select() {
    return this;
  }

  eq(column: string, value: unknown) {
    this.state.eq.push({ column, value });
    return this;
  }

  in(column: string, value: unknown[]) {
    this.state.in.push({ column, value });
    return this;
  }

  gte(column: string, value: unknown) {
    this.state.gte.push({ column, value });
    return this;
  }

  lte(column: string, value: unknown) {
    this.state.lte.push({ column, value });
    return this;
  }

  order() {
    return this;
  }

  then<TResult1 = { data: unknown[]; error: null }, TResult2 = never>(
    onfulfilled?: ((value: { data: unknown[]; error: null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    return Promise.resolve(this.resolve(this.table, this.state)).then(onfulfilled, onrejected);
  }
}

function buildPrediction(matchId: string, id: string) {
  return {
    id,
    match_id: matchId,
    model_version_id: "model-v1",
    prediction_type: "pre_match_24h",
    home_win_prob: 54,
    draw_prob: 24,
    away_win_prob: 22,
    expected_home_goals: 1.4,
    expected_away_goals: 0.9,
    most_likely_score: "1-0",
    top_scores_json: [{ score: "1-0", probability: 12 }],
    confidence_score: 71,
    risk_level: "low",
    run_scope: "public_product",
    created_at: "2026-06-19T12:00:00.000Z",
  };
}

function buildMarketRows(predictionVersionId: string) {
  return [
    { prediction_version_id: predictionVersionId, market: "btts", selection: "yes", probability: 46 },
    { prediction_version_id: predictionVersionId, market: "btts", selection: "no", probability: 54 },
    { prediction_version_id: predictionVersionId, market: "over_2_5", selection: "over", probability: 48 },
    { prediction_version_id: predictionVersionId, market: "over_2_5", selection: "under", probability: 52 },
    { prediction_version_id: predictionVersionId, market: "exact_score", selection: "1-0", probability: 12 },
  ];
}

function setupClient(args: {
  matches: unknown[];
  competitions: unknown[];
  teams: unknown[];
  predictions: unknown[];
  markets: unknown[];
  reviewCases?: unknown[];
  reviewSnapshots?: unknown[];
  aiExecutions?: unknown[];
  reviewDecisions?: unknown[];
}) {
  const resolver = (table: string, state: QueryState) => {
    const rows =
      table === "matches" ? args.matches
      : table === "competitions" ? args.competitions
      : table === "teams" ? args.teams
      : table === "prediction_versions" ? args.predictions
      : table === "prediction_markets" ? args.markets
      : table === "prediction_review_cases" ? (args.reviewCases ?? [])
      : table === "prediction_review_snapshots" ? (args.reviewSnapshots ?? [])
      : table === "prediction_review_ai_executions" ? (args.aiExecutions ?? [])
      : table === "prediction_review_decisions" ? (args.reviewDecisions ?? [])
      : table === "model_versions" ? [{ id: "model-v1", version: "v1" }]
      : [];

    const filtered = rows.filter((row) => {
      const record = row as Record<string, unknown>;
      return state.eq.every(({ column, value }) => record[column] === value) &&
        state.in.every(({ column, value }) => value.includes(record[column] as never)) &&
        state.gte.every(({ column, value }) => String(record[column]) >= String(value)) &&
        state.lte.every(({ column, value }) => String(record[column]) <= String(value));
    });

    return { data: filtered, error: null };
  };

  createSupabaseServerClientMock.mockResolvedValue({
    from: (table: string) => new FakeQueryBuilder(table, resolver),
  });
}

describe("getPredictionRefreshReviewPageData atypical query scope", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-19T12:00:00.000Z"));
  });

  it("includes only future scheduled Group Stage - 2 world-cup-2026 fixtures", async () => {
    const matches = [
      { id: "eligible", external_id: "api-football:fixture:1", slug: "eligible", competition_id: "wc", home_team_id: "h1", away_team_id: "a1", kickoff_at: "2026-06-20T19:00:00.000Z", stage: "Group Stage - 2", status: "scheduled", access_scope: "public", intake_source: "api_football" },
      { id: "cancelled", external_id: "api-football:fixture:2", slug: "cancelled", competition_id: "wc", home_team_id: "h2", away_team_id: "a2", kickoff_at: "2026-06-20T20:00:00.000Z", stage: "Group Stage - 2", status: "cancelled", access_scope: "public", intake_source: "api_football" },
      { id: "postponed", external_id: "api-football:fixture:3", slug: "postponed", competition_id: "wc", home_team_id: "h3", away_team_id: "a3", kickoff_at: "2026-06-20T21:00:00.000Z", stage: "Group Stage - 2", status: "postponed", access_scope: "public", intake_source: "api_football" },
      { id: "wrong-competition", external_id: "api-football:fixture:4", slug: "wrong-competition", competition_id: "other", home_team_id: "h4", away_team_id: "a4", kickoff_at: "2026-06-20T22:00:00.000Z", stage: "Group Stage - 2", status: "scheduled", access_scope: "public", intake_source: "api_football" },
      { id: "wrong-stage", external_id: "api-football:fixture:5", slug: "wrong-stage", competition_id: "wc", home_team_id: "h5", away_team_id: "a5", kickoff_at: "2026-06-20T23:00:00.000Z", stage: "Group Stage - 1", status: "scheduled", access_scope: "public", intake_source: "api_football" },
      { id: "kickoff-passed", external_id: "api-football:fixture:6", slug: "kickoff-passed", competition_id: "wc", home_team_id: "h6", away_team_id: "a6", kickoff_at: "2026-06-19T11:00:00.000Z", stage: "Group Stage - 2", status: "scheduled", access_scope: "public", intake_source: "api_football" },
    ];

    setupClient({
      matches,
      competitions: [
        { id: "wc", name: "World Cup", slug: "world-cup-2026", usage_scope: "public_product" },
        { id: "other", name: "Other Cup", slug: "other-cup", usage_scope: "public_product" },
      ],
      teams: matches.flatMap((match) => [
        { id: (match as { home_team_id: string }).home_team_id, name: `${(match as { id: string }).id}-home` },
        { id: (match as { away_team_id: string }).away_team_id, name: `${(match as { id: string }).id}-away` },
      ]),
      predictions: matches.map((match) => buildPrediction((match as { id: string }).id, `prediction-${(match as { id: string }).id}`)),
      markets: matches.flatMap((match) => buildMarketRows(`prediction-${(match as { id: string }).id}`)),
    });

    const result = await getPredictionRefreshReviewPageData();

    expect(result.atypicalAnalysisReport).not.toBeNull();
    expect(result.atypicalAnalysisReport?.fixtureCount).toBe(1);
    expect(result.atypicalAnalysisReport?.rankedFixtures.map((fixture) => fixture.fixture.matchId)).toEqual(["eligible"]);
    expect(result.atypicalAnalysisReport?.scope.competitionKey).toBe("world-cup-2026");
  });

  it("returns an empty anomaly report when no eligible future fixtures remain", async () => {
    const matches = [
      { id: "cancelled", external_id: "api-football:fixture:2", slug: "cancelled", competition_id: "wc", home_team_id: "h2", away_team_id: "a2", kickoff_at: "2026-06-20T20:00:00.000Z", stage: "Group Stage - 2", status: "cancelled", access_scope: "public", intake_source: "api_football" },
      { id: "wrong-stage", external_id: "api-football:fixture:5", slug: "wrong-stage", competition_id: "wc", home_team_id: "h5", away_team_id: "a5", kickoff_at: "2026-06-20T23:00:00.000Z", stage: "Group Stage - 1", status: "scheduled", access_scope: "public", intake_source: "api_football" },
      { id: "kickoff-passed", external_id: "api-football:fixture:6", slug: "kickoff-passed", competition_id: "wc", home_team_id: "h6", away_team_id: "a6", kickoff_at: "2026-06-19T11:00:00.000Z", stage: "Group Stage - 2", status: "scheduled", access_scope: "public", intake_source: "api_football" },
    ];

    setupClient({
      matches,
      competitions: [{ id: "wc", name: "World Cup", slug: "world-cup-2026", usage_scope: "public_product" }],
      teams: matches.flatMap((match) => [
        { id: (match as { home_team_id: string }).home_team_id, name: `${(match as { id: string }).id}-home` },
        { id: (match as { away_team_id: string }).away_team_id, name: `${(match as { id: string }).id}-away` },
      ]),
      predictions: matches.map((match) => buildPrediction((match as { id: string }).id, `prediction-${(match as { id: string }).id}`)),
      markets: matches.flatMap((match) => buildMarketRows(`prediction-${(match as { id: string }).id}`)),
    });

    const result = await getPredictionRefreshReviewPageData();

    expect(result.atypicalAnalysisReport).not.toBeNull();
    expect(result.atypicalAnalysisReport?.fixtureCount).toBe(0);
    expect(result.atypicalAnalysisReport?.rankedFixtures).toEqual([]);
  });

  it("passes only the exact selected prediction version markets into the current review bundle", async () => {
    const match = { id: "eligible", external_id: "api-football:fixture:1", slug: "eligible", competition_id: "wc", home_team_id: "h1", away_team_id: "a1", kickoff_at: "2026-06-20T19:00:00.000Z", stage: "Group Stage - 2", status: "scheduled", access_scope: "public", intake_source: "api_football" };
    setupClient({
      matches: [match],
      competitions: [{ id: "wc", name: "World Cup", slug: "world-cup-2026", usage_scope: "public_product" }],
      teams: [
        { id: "h1", name: "Netherlands" },
        { id: "a1", name: "Sweden" },
      ],
      predictions: [
        buildPrediction("eligible", "prediction-current"),
        { ...buildPrediction("eligible", "prediction-stale"), created_at: "2026-06-18T12:00:00.000Z" },
      ],
      markets: [
        ...buildMarketRows("prediction-current"),
        { prediction_version_id: "prediction-stale", market: "btts", selection: "yes", probability: 0 },
        { prediction_version_id: "prediction-stale", market: "btts", selection: "no", probability: 100 },
      ],
    });

    await getPredictionRefreshReviewPageData();

    expect(buildPredictionReviewBundleFromVersionMock).toHaveBeenCalled();
    expect(buildPredictionReviewBundleFromVersionMock).toHaveBeenCalledWith(expect.objectContaining({
      predictionVersion: expect.objectContaining({ id: "prediction-current" }),
      markets: expect.arrayContaining([
        expect.objectContaining({ prediction_version_id: "prediction-current", market: "btts", selection: "yes", probability: 46 }),
      ]),
    }));
    expect(buildPredictionReviewBundleFromVersionMock).not.toHaveBeenCalledWith(expect.objectContaining({
      predictionVersion: expect.objectContaining({ id: "prediction-current" }),
      markets: expect.arrayContaining([
        expect.objectContaining({ prediction_version_id: "prediction-stale" }),
      ]),
    }));
  });

  it("orients Spanish display names to canonical home and away when coherence data is reversed", async () => {
    const match = { id: "eligible", external_id: "api-football:fixture:1", slug: "eligible", competition_id: "wc", home_team_id: "h1", away_team_id: "a1", kickoff_at: "2026-06-20T19:00:00.000Z", stage: "Group Stage - 2", status: "scheduled", access_scope: "public", intake_source: "api_football" };
    findPredictionReviewCoherenceFixtureMock.mockReturnValueOnce({
      teamAEn: "Curaçao",
      teamADisplayNameEs: "Curazao",
      teamBEn: "Ecuador",
      teamBDisplayNameEs: "Ecuador",
    });
    orientPredictionReviewCoherenceFixtureMock.mockReturnValueOnce({
      homeDisplayNameEs: "Ecuador",
      awayDisplayNameEs: "Curazao",
    });

    setupClient({
      matches: [match],
      competitions: [{ id: "wc", name: "World Cup", slug: "world-cup-2026", usage_scope: "public_product" }],
      teams: [
        { id: "h1", name: "Ecuador" },
        { id: "a1", name: "Curaçao" },
      ],
      predictions: [buildPrediction("eligible", "prediction-current")],
      markets: buildMarketRows("prediction-current"),
    });

    const result = await getPredictionRefreshReviewPageData();

    expect(result.cases[0]?.homeTeamDisplayNameEs).toBe("Ecuador");
    expect(result.cases[0]?.awayTeamDisplayNameEs).toBe("Curazao");
  });

  it("keeps live or finished fixtures non-actionable in the review cards", async () => {
    const match = { id: "eligible", external_id: "api-football:fixture:1", slug: "eligible", competition_id: "wc", home_team_id: "h1", away_team_id: "a1", kickoff_at: "2026-06-20T19:00:00.000Z", stage: "Group Stage - 2", status: "scheduled", access_scope: "public", intake_source: "api_football" };
    validatePredictionReviewProviderFixtureMock.mockReturnValueOnce({
      allowed: false,
      reason: "provider_status_not_actionable",
    });

    setupClient({
      matches: [match],
      competitions: [{ id: "wc", name: "World Cup", slug: "world-cup-2026", usage_scope: "public_product" }],
      teams: [
        { id: "h1", name: "Netherlands" },
        { id: "a1", name: "Sweden" },
      ],
      predictions: [buildPrediction("eligible", "prediction-current")],
      markets: buildMarketRows("prediction-current"),
    });

    const result = await getPredictionRefreshReviewPageData();

    expect(result.cases[0]?.providerStatusAvailable).toBe(false);
    expect(result.cases[0]?.providerStatusReason).toBe("provider_status_not_actionable");
  });

  it("resolves exact immutable provenance from the review snapshot linked to the selected prediction version", async () => {
    const match = { id: "eligible", external_id: "api-football:fixture:1", slug: "eligible", competition_id: "wc", home_team_id: "h1", away_team_id: "a1", kickoff_at: "2026-06-20T19:00:00.000Z", stage: "Group Stage - 2", status: "scheduled", access_scope: "public", intake_source: "api_football" };

    setupClient({
      matches: [match],
      competitions: [{ id: "wc", name: "World Cup", slug: "world-cup-2026", usage_scope: "public_product" }],
      teams: [
        { id: "h1", name: "Netherlands" },
        { id: "a1", name: "Sweden" },
      ],
      predictions: [buildPrediction("eligible", "prediction-current")],
      markets: buildMarketRows("prediction-current"),
      reviewSnapshots: [
        {
          id: "snapshot-published",
          review_case_id: "review-case-1",
          source_prediction_version_id: "prediction-current",
          source_snapshot_id: "2026-06-11",
          created_at: "2026-06-19T12:30:00.000Z",
        },
      ],
    });

    const result = await getPredictionRefreshReviewPageData();

    expect(result.atypicalAnalysisReport?.rankedFixtures[0]?.provenance.signalSnapshotId).toBe("2026-06-11");
  });
});
