import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  requireAdminMock,
  createSupabaseServerClientMock,
  readPredictionReviewProviderStateMock,
  buildRealFixturePredictionInputMock,
  generatePredictionMock,
  buildPredictionReviewBundleFromVersionMock,
  buildPredictionReviewBundleFromOutputMock,
  buildPredictionReviewBundleFromSnapshotMock,
  buildPredictionReviewSnapshotInsertMock,
  buildPublicPredictionVersionInsertFromReviewBundleMock,
  buildPredictionMarketsFromReviewBundleMock,
  redirectMock,
  revalidatePathMock,
} = vi.hoisted(() => ({
  requireAdminMock: vi.fn(),
  createSupabaseServerClientMock: vi.fn(),
  readPredictionReviewProviderStateMock: vi.fn(),
  buildRealFixturePredictionInputMock: vi.fn(),
  generatePredictionMock: vi.fn(),
  buildPredictionReviewBundleFromVersionMock: vi.fn(),
  buildPredictionReviewBundleFromOutputMock: vi.fn(),
  buildPredictionReviewBundleFromSnapshotMock: vi.fn(),
  buildPredictionReviewSnapshotInsertMock: vi.fn(),
  buildPublicPredictionVersionInsertFromReviewBundleMock: vi.fn(),
  buildPredictionMarketsFromReviewBundleMock: vi.fn(),
  redirectMock: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
  revalidatePathMock: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  requireAdmin: requireAdminMock,
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: createSupabaseServerClientMock,
}));

vi.mock("../../../lib/prediction-review/provider", async () => {
  const actual = await vi.importActual<typeof import("../../../lib/prediction-review/provider")>(
    "../../../lib/prediction-review/provider",
  );

  return {
    ...actual,
    readPredictionReviewProviderState: readPredictionReviewProviderStateMock,
  };
});

vi.mock("../../../lib/prediction-engine/real-fixture-adapter", () => ({
  buildRealFixturePredictionInput: buildRealFixturePredictionInputMock,
}));

vi.mock("../../../lib/prediction-engine/generate-prediction", () => ({
  generatePrediction: generatePredictionMock,
}));

vi.mock("../../../lib/prediction-review/bundle", () => ({
  buildPredictionReviewBundleFromVersion: buildPredictionReviewBundleFromVersionMock,
  buildPredictionReviewBundleFromOutput: buildPredictionReviewBundleFromOutputMock,
  buildPredictionReviewBundleFromSnapshot: buildPredictionReviewBundleFromSnapshotMock,
}));

vi.mock("../../../lib/prediction-review/persistence", () => ({
  buildPredictionReviewSnapshotInsert: buildPredictionReviewSnapshotInsertMock,
  buildPublicPredictionVersionInsertFromReviewBundle: buildPublicPredictionVersionInsertFromReviewBundleMock,
  buildPredictionMarketsFromReviewBundle: buildPredictionMarketsFromReviewBundleMock,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

import {
  analyzePredictionRefreshWithAiAction,
  generatePredictionRefreshShadowAction,
  previewReviewedXgAction,
  publishRefreshedPredictionReviewAction,
} from "./actions";

const match = {
  id: "00000000-0000-4000-8000-000000000111",
  external_id: "api-football:fixture:1540356",
  slug: "usa-turkiye",
  competition_id: "competition-1",
  home_team_id: "team-home",
  away_team_id: "team-away",
  kickoff_at: "2026-06-19T22:00:00Z",
  status: "scheduled",
  access_scope: "admin_only",
  intake_source: "api_football",
};

const teams = [
  { id: "team-home", name: "USA" },
  { id: "team-away", name: "Türkiye" },
];

const currentPrediction = {
  id: "prediction-current",
  match_id: match.id,
  model_version_id: "model-1",
  prediction_type: "pre_match_24h",
  home_win_prob: 44,
  draw_prob: 28,
  away_win_prob: 28,
  expected_home_goals: 1.6,
  expected_away_goals: 0.9,
  most_likely_score: "1-0",
  top_scores_json: [{ score: "1-0", probability: 12 }],
  confidence_score: 61,
  risk_level: "medium",
  run_scope: "public_product",
  created_at: "2026-06-18T12:00:00Z",
};

const modelVersion = { id: "model-1", version: "v2" };

const baseBundle = {
  kind: "current_reference" as const,
  predictionVersionId: "prediction-current",
  modelVersionId: "model-1",
  modelVersionLabel: "v2",
  sourceSnapshotId: "2026-06-19",
  predictionType: "pre_match_24h" as const,
  runScope: "public_product" as const,
  homeWinProb: 44,
  drawProb: 28,
  awayWinProb: 28,
  expectedHomeGoals: 1.6,
  expectedAwayGoals: 0.9,
  mostLikelyScore: "1-0",
  topScorelines: [{ score: "1-0", probability: 12 }],
  bttsYesProb: 51,
  bttsNoProb: 49,
  over25Prob: 48,
  under25Prob: 52,
  confidenceScore: 61,
  confidenceBucket: "medium" as const,
  riskLevel: "medium" as const,
  notes: [],
  factors: [],
  provenanceLabel: "Current public prediction",
};

const shadowBundle = {
  ...baseBundle,
  kind: "shadow_refresh" as const,
  predictionVersionId: null,
  runScope: "internal_lab" as const,
  homeWinProb: 46,
  expectedHomeGoals: 1.7,
  provenanceLabel: "Shadow refresh prediction",
};

function buildFormData(values: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value);
  }
  return formData;
}

function createSingleRowBuilder(response: { data: unknown; error: unknown }) {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    in: vi.fn(() => builder),
    order: vi.fn(() => builder),
    limit: vi.fn(() => builder),
    maybeSingle: vi.fn(() => Promise.resolve(response)),
  };
  return builder;
}

function createInsertableBuilder(options?: {
  maybeSingleResponse?: { data: unknown; error: unknown };
  insertResponse?: { data: unknown; error: unknown };
}) {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    in: vi.fn(() => builder),
    order: vi.fn(() => builder),
    limit: vi.fn(() => builder),
    maybeSingle: vi.fn(() => Promise.resolve(options?.maybeSingleResponse ?? { data: null, error: null })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        maybeSingle: vi.fn(() =>
          Promise.resolve(options?.insertResponse ?? { data: null, error: null }),
        ),
      })),
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ error: null })),
    })),
  };
  return builder;
}

function createPredictionMarketsTable(markets: unknown[] = []) {
  return {
    select: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ data: markets, error: null })),
    })),
    insert: vi.fn(() => Promise.resolve({ error: null })),
  };
}

function buildClient(options?: {
  providerState?: unknown;
  reviewCaseResponse?: { data: unknown; error: unknown };
  reviewCaseInsertResponse?: { data: unknown; error: unknown };
  snapshotInsertResponse?: { data: unknown; error: unknown };
  snapshotSelectResponse?: { data: unknown; error: unknown };
  decisionInsertResponse?: { data: unknown; error: unknown };
  existingPublishedDecision?: { data: unknown; error: unknown };
  publishInsertResponse?: { data: unknown; error: unknown };
  matchOverride?: Partial<typeof match>;
}) {
  const competitionBuilder = createSingleRowBuilder({
    data: { id: "competition-1", usage_scope: "public_product" },
    error: null,
  });
  const matchesBuilder = createSingleRowBuilder({
    data: { ...match, ...(options?.matchOverride ?? {}) },
    error: null,
  });
  const teamsBuilder = {
    select: vi.fn(() => teamsBuilder),
    in: vi.fn(() => Promise.resolve({ data: teams, error: null })),
  };
  const predictionVersionsBuilder = createInsertableBuilder({
    maybeSingleResponse: { data: currentPrediction, error: null },
    insertResponse: options?.publishInsertResponse ?? { data: { id: "prediction-published" }, error: null },
  });
  const modelVersionsBuilder = createSingleRowBuilder({
    data: modelVersion,
    error: null,
  });
  const predictionMarketsBuilder = createPredictionMarketsTable([]);
  const reviewCasesBuilder = createInsertableBuilder({
    maybeSingleResponse: options?.reviewCaseResponse ?? {
      data: {
        id: "review-case-1",
        match_id: match.id,
        latest_shadow_snapshot_id: "snapshot-shadow-1",
      },
      error: null,
    },
    insertResponse: options?.reviewCaseInsertResponse ?? {
      data: {
        id: "review-case-created",
        match_id: match.id,
        latest_shadow_snapshot_id: null,
      },
      error: null,
    },
  });
  const reviewSnapshotsBuilder = createInsertableBuilder({
    maybeSingleResponse: options?.snapshotSelectResponse ?? {
      data: {
        id: "snapshot-shadow-1",
        review_case_id: "review-case-1",
      },
      error: null,
    },
    insertResponse: options?.snapshotInsertResponse ?? {
      data: { id: "snapshot-created" },
      error: null,
    },
  });
  const aiExecutionsBuilder = createInsertableBuilder();
  const reviewDecisionsBuilder = createInsertableBuilder({
    maybeSingleResponse: options?.existingPublishedDecision ?? { data: null, error: null },
    insertResponse: options?.decisionInsertResponse ?? {
      data: { id: "decision-created" },
      error: null,
    },
  });
  const rpc = vi.fn(() => Promise.resolve({ data: match.id, error: null }));

  const from = vi.fn((table: string) => {
    if (table === "matches") return matchesBuilder;
    if (table === "competitions") return competitionBuilder;
    if (table === "teams") return teamsBuilder;
    if (table === "prediction_versions") return predictionVersionsBuilder;
    if (table === "model_versions") return modelVersionsBuilder;
    if (table === "prediction_markets") return predictionMarketsBuilder;
    if (table === "prediction_review_cases") return reviewCasesBuilder;
    if (table === "prediction_review_snapshots") return reviewSnapshotsBuilder;
    if (table === "prediction_review_ai_executions") return aiExecutionsBuilder;
    if (table === "prediction_review_decisions") return reviewDecisionsBuilder;
    throw new Error(`unexpected table ${table}`);
  });

  readPredictionReviewProviderStateMock.mockResolvedValue(
    options?.providerState ?? {
      status: "available",
      fixture: {
        provider: "api-football",
        providerFixtureId: 1540356,
        kickoffAt: match.kickoff_at,
        timezone: "UTC",
        status: "scheduled",
        statusShort: "NS",
        elapsedMinutes: null,
        competition: { providerCompetitionId: 1, name: "World Cup", country: null, season: 2026, round: "GS" },
        homeTeam: { providerTeamId: 1, name: "USA", winner: null },
        awayTeam: { providerTeamId: 2, name: "Türkiye", winner: null },
        goals: { home: null, away: null },
      },
    },
  );

  createSupabaseServerClientMock.mockResolvedValue({ from, rpc });

  return {
    from,
    rpc,
    predictionVersionsBuilder,
    predictionMarketsBuilder,
    reviewCasesBuilder,
    reviewSnapshotsBuilder,
    aiExecutionsBuilder,
    reviewDecisionsBuilder,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  requireAdminMock.mockResolvedValue({ user: { id: "admin-1" } });
  buildRealFixturePredictionInputMock.mockReturnValue({ matchId: match.id });
  generatePredictionMock.mockReturnValue({ ok: true });
  buildPredictionReviewBundleFromVersionMock.mockReturnValue(baseBundle);
  buildPredictionReviewBundleFromOutputMock.mockReturnValue(shadowBundle);
  buildPredictionReviewBundleFromSnapshotMock.mockReturnValue(shadowBundle);
  buildPredictionReviewSnapshotInsertMock.mockImplementation((value) => value);
  buildPublicPredictionVersionInsertFromReviewBundleMock.mockReturnValue({
    match_id: match.id,
    model_version_id: modelVersion.id,
    prediction_type: "pre_match_24h",
    run_scope: "public_product",
  });
  buildPredictionMarketsFromReviewBundleMock.mockReturnValue([
    {
      prediction_version_id: "prediction-published",
      market: "match_winner",
      selection: "home",
      probability: 46,
      confidence: 61,
      is_premium: false,
    },
  ]);
});

describe("prediction refresh review actions", () => {
  it("uses admin auth and reuses an existing review case when generating a shadow snapshot", async () => {
    const client = buildClient();

    await expect(
      generatePredictionRefreshShadowAction(
        buildFormData({
          matchId: match.id,
          externalId: match.external_id,
        }),
      ),
    ).rejects.toThrow(
      `REDIRECT:/admin/prediction-refresh-review?externalId=${encodeURIComponent(match.external_id)}&action=shadow_generated`,
    );

    expect(requireAdminMock).toHaveBeenCalledWith("/admin/prediction-refresh-review");
    expect(client.reviewCasesBuilder.insert).not.toHaveBeenCalled();
    expect(client.reviewSnapshotsBuilder.insert).toHaveBeenCalledTimes(1);
  });

  it("does not attempt or store a fake AI response when no provider is configured", async () => {
    const client = buildClient({
      providerState: {
        status: "available",
        fixture: {
          provider: "api-football",
          providerFixtureId: 1540356,
          kickoffAt: match.kickoff_at,
          timezone: "UTC",
          status: "scheduled",
          statusShort: "NS",
          elapsedMinutes: null,
          competition: { providerCompetitionId: 1, name: "World Cup", country: null, season: 2026, round: "GS" },
          homeTeam: { providerTeamId: 1, name: "USA", winner: null },
          awayTeam: { providerTeamId: 2, name: "Türkiye", winner: null },
          goals: { home: null, away: null },
        },
      },
    });
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_PREDICTION_REVIEW_MODEL;

    await expect(
      analyzePredictionRefreshWithAiAction(
        buildFormData({
          matchId: match.id,
          externalId: match.external_id,
        }),
      ),
    ).rejects.toThrow(
      `REDIRECT:/admin/prediction-refresh-review?externalId=${encodeURIComponent(match.external_id)}&action=ai_unavailable`,
    );

    expect(client.aiExecutionsBuilder.insert).not.toHaveBeenCalled();
  });

  it("fails closed on provider identity mismatch before writing reviewed xg previews", async () => {
    const client = buildClient({
      providerState: {
        status: "available",
        fixture: {
          provider: "api-football",
          providerFixtureId: 1540356,
          kickoffAt: match.kickoff_at,
          timezone: "UTC",
          status: "scheduled",
          statusShort: "NS",
          elapsedMinutes: null,
          competition: { providerCompetitionId: 1, name: "World Cup", country: null, season: 2026, round: "GS" },
          homeTeam: { providerTeamId: 1, name: "Mexico", winner: null },
          awayTeam: { providerTeamId: 2, name: "South Korea", winner: null },
          goals: { home: null, away: null },
        },
      },
    });

    await expect(
      previewReviewedXgAction(
        buildFormData({
          matchId: match.id,
          externalId: match.external_id,
          homeXg: "1.70",
          awayXg: "0.85",
        }),
      ),
    ).rejects.toThrow(/action=blocked/);

    expect(client.reviewSnapshotsBuilder.insert).not.toHaveBeenCalled();
  });

  it("publishes by inserting a new prediction version and markets while leaving the existing version untouched", async () => {
    const client = buildClient();

    await expect(
      publishRefreshedPredictionReviewAction(
        buildFormData({
          matchId: match.id,
          externalId: match.external_id,
          reason: "Refresco aprobado por revision humana.",
        }),
      ),
    ).rejects.toThrow(
      `REDIRECT:/admin/prediction-refresh-review?externalId=${encodeURIComponent(match.external_id)}&action=published_refreshed`,
    );

    expect(client.predictionVersionsBuilder.insert).toHaveBeenCalledTimes(1);
    expect(client.predictionMarketsBuilder.insert).toHaveBeenCalledTimes(1);
    expect(client.predictionVersionsBuilder.update).not.toHaveBeenCalled();
    expect(client.reviewDecisionsBuilder.insert).toHaveBeenCalled();
  });

  it("blocks duplicate publish submissions before creating another public version", async () => {
    const client = buildClient({
      existingPublishedDecision: {
        data: {
          id: "decision-published",
          published_prediction_version_id: "prediction-published",
        },
        error: null,
      },
    });

    await expect(
      publishRefreshedPredictionReviewAction(
        buildFormData({
          matchId: match.id,
          externalId: match.external_id,
          reason: "No deberia duplicarse.",
        }),
      ),
    ).rejects.toThrow(
      `REDIRECT:/admin/prediction-refresh-review?externalId=${encodeURIComponent(match.external_id)}&action=already_published`,
    );

    expect(client.predictionVersionsBuilder.insert).not.toHaveBeenCalled();
    expect(client.predictionMarketsBuilder.insert).not.toHaveBeenCalled();
  });
});
