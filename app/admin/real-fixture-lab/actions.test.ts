import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  requireAdminMock,
  createSupabaseServerClientMock,
  getAdminRealFixtureLabDataMock,
  buildRealFixturePredictionInputMock,
  generatePredictionMock,
  evaluatePredictionMock,
  buildRealFixturePredictionVersionInsertMock,
  buildRealFixturePredictionMarketInsertsMock,
  redirectMock,
  revalidatePathMock,
} = vi.hoisted(() => ({
  requireAdminMock: vi.fn(),
  createSupabaseServerClientMock: vi.fn(),
  getAdminRealFixtureLabDataMock: vi.fn(),
  buildRealFixturePredictionInputMock: vi.fn(),
  generatePredictionMock: vi.fn(),
  evaluatePredictionMock: vi.fn(),
  buildRealFixturePredictionVersionInsertMock: vi.fn(),
  buildRealFixturePredictionMarketInsertsMock: vi.fn(),
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

vi.mock("@/lib/supabase/real-fixture-lab-queries", () => ({
  getAdminRealFixtureLabData: getAdminRealFixtureLabDataMock,
}));

vi.mock("@/lib/prediction-engine/real-fixture-adapter", () => ({
  buildRealFixturePredictionInput: buildRealFixturePredictionInputMock,
}));

vi.mock("@/lib/prediction-engine/generate-prediction", () => ({
  generatePrediction: generatePredictionMock,
}));

vi.mock("@/lib/model-evaluation", () => ({
  evaluatePrediction: evaluatePredictionMock,
}));

vi.mock("../../../lib/prediction-engine/real-fixture-persistence", async () => {
  const actual = await vi.importActual<typeof import("../../../lib/prediction-engine/real-fixture-persistence")>(
    "../../../lib/prediction-engine/real-fixture-persistence",
  );

  return {
    ...actual,
    buildRealFixturePredictionVersionInsert: buildRealFixturePredictionVersionInsertMock,
    buildRealFixturePredictionMarketInserts: buildRealFixturePredictionMarketInsertsMock,
  };
});

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

import {
  persistRealFixtureEvaluationAction,
  publishRealFixturePredictionAction,
  refreshPublishedRealFixturePredictionAction,
  saveRealFixturePredictionAction,
  verifyRealFixtureResultAction,
} from "./actions";

const externalId = "api-football:fixture:1540356";
const predictionVersionId = "00000000-0000-4000-8000-000000000123";
const fixture = {
  id: "match-1",
  externalId,
  slug: "peru-spain",
  competitionId: "competition-1",
  kickoffAt: "2026-06-09T02:00:00Z",
  stage: "Friendly",
  status: "scheduled",
  accessScope: "admin_only" as const,
  intakeSource: "api_football" as const,
  sourceNote: "tracked by ingest",
  competitionName: "Friendlies",
  homeTeamId: "team-1",
  homeTeamName: "Peru",
  awayTeamId: "team-2",
  awayTeamName: "Spain",
  activeModelVersionId: "model-1",
  activeModelVersion: "v0.1",
  activeModelSavedPredictionId: null,
  hasSavedPredictionForActiveModel: false,
  result: null,
  savedPrediction: null,
  savedEvaluation: null,
};

const predictionInput = { matchId: "match-1" };
const predictionOutput = { predictionVersionProjection: {}, predictionMarketsProjection: [] };

function buildSaveFormData() {
  const formData = new FormData();
  formData.set("externalId", externalId);
  return formData;
}

function buildEvaluationFormData() {
  const formData = new FormData();
  formData.set("predictionVersionId", predictionVersionId);
  formData.set("externalId", externalId);
  return formData;
}

function buildVerificationFormData(matchResultId = "00000000-0000-4000-8000-000000000456") {
  const formData = new FormData();
  formData.set("externalId", externalId);
  formData.set("matchResultId", matchResultId);
  return formData;
}

function buildPublishFormData(overrides?: {
  matchId?: string;
  matchSlug?: string;
  internalPredictionVersionId?: string;
}) {
  const formData = new FormData();
  formData.set("matchId", overrides?.matchId ?? fixture.id);
  formData.set("matchSlug", overrides?.matchSlug ?? fixture.slug);
  formData.set(
    "internalPredictionVersionId",
    overrides?.internalPredictionVersionId ?? predictionVersionId,
  );
  return formData;
}

function buildRefreshFormData(targetExternalId = externalId) {
  const formData = new FormData();
  formData.set("externalId", targetExternalId);
  return formData;
}

function createPredictionVersionInsertBuilder(options: {
  maybeSingle?: { data: unknown; error: unknown };
  insertResult?: { data?: unknown; error: unknown };
}) {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    order: vi.fn(() => builder),
    limit: vi.fn(() => builder),
    maybeSingle: vi.fn(() =>
      Promise.resolve(
        options.maybeSingle ?? {
          data: null,
          error: null,
        },
      ),
    ),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        maybeSingle: vi.fn(() =>
          Promise.resolve(
            options.insertResult ?? {
              data: null,
              error: null,
            },
          ),
        ),
      })),
    })),
  };

  return builder;
}

function createSingleSelectBuilder(response: { data: unknown; error: unknown }) {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    maybeSingle: vi.fn(() => Promise.resolve(response)),
  };

  return builder;
}

function createMarketsSelectBuilder(response: { data: unknown; error: unknown }) {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    in: vi.fn(() => Promise.resolve(response)),
  };

  return builder;
}

function createPredictionResultsMutationBuilder(options: {
  maybeSingle?: { data: unknown; error: unknown };
  insertResult?: { data?: unknown; error: unknown };
  updateResult?: { data?: unknown; error: unknown };
}) {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    maybeSingle: vi.fn(() =>
      Promise.resolve(
        options.maybeSingle ?? {
          data: null,
          error: null,
        },
      ),
    ),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        maybeSingle: vi.fn(() =>
          Promise.resolve(
            options.insertResult ?? {
              data: null,
              error: null,
            },
          ),
        ),
      })),
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            maybeSingle: vi.fn(() =>
              Promise.resolve(
                options.updateResult ?? {
                  data: null,
                  error: null,
                },
              ),
            ),
          })),
        })),
      })),
    })),
  };

  return builder;
}

function createMatchResultsVerificationBuilder(options?: {
  maybeSingle?: { data: unknown; error: unknown };
  updateResult?: { data?: unknown; error: unknown };
}) {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    maybeSingle: vi.fn(() =>
      Promise.resolve(
        options?.maybeSingle ?? {
          data: null,
          error: null,
        },
      ),
    ),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              maybeSingle: vi.fn(() =>
                Promise.resolve(
                  options?.updateResult ?? {
                    data: null,
                    error: null,
                  },
                ),
              ),
            })),
          })),
        })),
      })),
    })),
  };

  return builder;
}

function createPublicationMatchBuilder(options?: {
  maybeSingle?: { data: unknown; error: unknown };
}) {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    maybeSingle: vi.fn(() =>
      Promise.resolve(
        options?.maybeSingle ?? {
          data: null,
          error: null,
        },
      ),
    ),
  };

  return builder;
}

describe("saveRealFixturePredictionAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminMock.mockResolvedValue({ user: { id: "admin-1" } });
    getAdminRealFixtureLabDataMock.mockResolvedValue({
      status: "ready",
      selectedExternalId: fixture.externalId,
      fixtures: [fixture],
      warnings: [],
    });
    buildRealFixturePredictionInputMock.mockReturnValue(predictionInput);
    generatePredictionMock.mockReturnValue(predictionOutput);
    buildRealFixturePredictionVersionInsertMock.mockReturnValue({
      match_id: "match-1",
      model_version_id: "model-1",
      prediction_type: "pre_match_24h",
      home_win_prob: 40,
      draw_prob: 30,
      away_win_prob: 30,
      expected_home_goals: 1.2,
      expected_away_goals: 0.9,
      most_likely_score: "1-0",
      top_scores_json: [{ score: "1-0", probability: 12 }],
      confidence_score: 61,
      risk_level: "medium",
      run_scope: "internal_lab",
    });
    buildRealFixturePredictionMarketInsertsMock.mockReturnValue([
      {
        prediction_version_id: "prediction-1",
        market: "match_winner",
        selection: "home",
        probability: 40,
        confidence: 61,
        is_premium: false,
      },
    ]);
  });

  it("blocks duplicate-create when an internal prediction already exists", async () => {
    const modelVersionsBuilder = createPredictionVersionInsertBuilder({
      maybeSingle: { data: { id: "model-1", version: "v0.1", created_at: "2026-06-08T10:00:00Z" }, error: null },
    });
    const predictionVersionsBuilder = createPredictionVersionInsertBuilder({
      maybeSingle: { data: { id: "prediction-1" }, error: null },
    });
    const predictionResultsBuilder = { insert: vi.fn(() => { throw new Error("should not write prediction_results"); }) };
    const from = vi.fn((table: string) => {
      if (table === "model_versions") return modelVersionsBuilder;
      if (table === "prediction_versions") return predictionVersionsBuilder;
      if (table === "prediction_results") return predictionResultsBuilder;
      throw new Error(`unexpected table ${table}`);
    });

    createSupabaseServerClientMock.mockResolvedValue({ from });

    await expect(saveRealFixturePredictionAction(buildSaveFormData())).rejects.toThrow(
      `REDIRECT:/admin/real-fixture-lab?externalId=${encodeURIComponent(externalId)}&save=duplicate`,
    );
    expect(predictionVersionsBuilder.insert).not.toHaveBeenCalled();
    expect(from).not.toHaveBeenCalledWith("prediction_markets");
    expect(from).not.toHaveBeenCalledWith("prediction_results");
  });

  it("rejects fixtures outside admin_only api_football scope", async () => {
    getAdminRealFixtureLabDataMock.mockResolvedValue({
      status: "ready",
      selectedExternalId: fixture.externalId,
      fixtures: [{ ...fixture, accessScope: "public" }],
      warnings: [],
    });

    await expect(saveRealFixturePredictionAction(buildSaveFormData())).rejects.toThrow(
      `REDIRECT:/admin/real-fixture-lab?externalId=${encodeURIComponent(externalId)}&save=error`,
    );
    expect(createSupabaseServerClientMock).not.toHaveBeenCalled();
  });

  it("does not persist anything when no active model version exists", async () => {
    const modelVersionsBuilder = createPredictionVersionInsertBuilder({
      maybeSingle: { data: null, error: null },
    });
    const predictionVersionsBuilder = createPredictionVersionInsertBuilder({
      maybeSingle: { data: null, error: null },
    });
    const from = vi.fn((table: string) => {
      if (table === "model_versions") return modelVersionsBuilder;
      if (table === "prediction_versions") return predictionVersionsBuilder;
      throw new Error(`unexpected table ${table}`);
    });

    createSupabaseServerClientMock.mockResolvedValue({ from });

    await expect(saveRealFixturePredictionAction(buildSaveFormData())).rejects.toThrow(
      `REDIRECT:/admin/real-fixture-lab?externalId=${encodeURIComponent(externalId)}&save=no_model`,
    );
    expect(predictionVersionsBuilder.insert).not.toHaveBeenCalled();
    expect(from).not.toHaveBeenCalledWith("prediction_markets");
  });

  it("persists prediction_versions and prediction_markets without touching prediction_results", async () => {
    const modelVersionsBuilder = createPredictionVersionInsertBuilder({
      maybeSingle: { data: { id: "model-1", version: "v0.1", created_at: "2026-06-08T10:00:00Z" }, error: null },
    });
    const predictionVersionsBuilder = createPredictionVersionInsertBuilder({
      maybeSingle: { data: null, error: null },
      insertResult: { data: { id: "prediction-1" }, error: null },
    });
    const predictionMarketsBuilder = {
      insert: vi.fn(() => Promise.resolve({ error: null })),
    };
    const predictionResultsBuilder = { insert: vi.fn(() => { throw new Error("should not write prediction_results"); }) };
    const from = vi.fn((table: string) => {
      if (table === "model_versions") return modelVersionsBuilder;
      if (table === "prediction_versions") return predictionVersionsBuilder;
      if (table === "prediction_markets") return predictionMarketsBuilder;
      if (table === "prediction_results") return predictionResultsBuilder;
      throw new Error(`unexpected table ${table}`);
    });

    createSupabaseServerClientMock.mockResolvedValue({ from });

    await expect(saveRealFixturePredictionAction(buildSaveFormData())).rejects.toThrow(
      `REDIRECT:/admin/real-fixture-lab?externalId=${encodeURIComponent(externalId)}&save=saved`,
    );

    expect(buildRealFixturePredictionInputMock).toHaveBeenCalledWith(fixture);
    expect(generatePredictionMock).toHaveBeenCalledWith(predictionInput);
    expect(buildRealFixturePredictionVersionInsertMock).toHaveBeenCalledWith({
      matchId: "match-1",
      modelVersionId: "model-1",
      predictionOutput,
    });
    expect(predictionVersionsBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        match_id: "match-1",
        model_version_id: "model-1",
      }),
    );
    expect(buildRealFixturePredictionMarketInsertsMock).toHaveBeenCalledWith({
      predictionVersionId: "prediction-1",
      predictionOutput,
    });
    expect(predictionMarketsBuilder.insert).toHaveBeenCalledWith([
      expect.objectContaining({
        prediction_version_id: "prediction-1",
        is_premium: false,
      }),
    ]);
    expect(from).not.toHaveBeenCalledWith("prediction_results");
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/real-fixture-lab");
  });
});

describe("persistRealFixtureEvaluationAction", () => {
  const predictionVersion = {
    id: predictionVersionId,
    match_id: "match-1",
    run_scope: "internal_lab",
    prediction_type: "pre_match_24h",
    home_win_prob: 40,
    draw_prob: 30,
    away_win_prob: 30,
    most_likely_score: "1-0",
    top_scores_json: [
      { score: "1-0", probability: 40 },
      { score: "2-0", probability: 18 },
    ],
  };

  const verifiedResult = {
    match_id: "match-1",
    home_goals: 2,
    away_goals: 0,
    verification_status: "verified",
  };

  const completeMarkets = [
    { market: "btts", selection: "yes", probability: 44 },
    { market: "btts", selection: "no", probability: 56 },
    { market: "over_2_5", selection: "over", probability: 48 },
    { market: "over_2_5", selection: "under", probability: 52 },
  ];

  const evaluablePayload = {
    prediction_version_id: predictionVersionId,
    actual_home_goals: 2,
    actual_away_goals: 0,
    winner_correct: true,
    btts_correct: true,
    over_2_5_correct: true,
    exact_score_correct: false,
    goal_error: 1,
    error_summary: "Predicted score 1-0; actual score 2-0.",
  };

  const publicFinishedMatch = {
    id: "match-1",
    competition_id: "competition-1",
    external_id: externalId,
    access_scope: "public",
    intake_source: "api_football",
    status: "finished",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminMock.mockResolvedValue({ user: { id: "admin-1" } });
    evaluatePredictionMock.mockReturnValue({
      status: "evaluable",
      predictionVersionId,
      matchId: "match-1",
      warnings: [],
      actual: {
        score: "2-0",
        outcome: "home",
        btts: "no",
        overUnder25: "under",
      },
      predicted: {
        score: "1-0",
        outcome: { status: "selected", selection: "home", probability: 40, margin: 10 },
        btts: { status: "selected", selection: "no", probability: 56, margin: 12 },
        overUnder25: { status: "selected", selection: "under", probability: 52, margin: 4 },
        exactScore: { status: "selected", selection: "1-0", probability: null, margin: 0 },
      },
      metrics: {
        winnerCorrect: true,
        bttsCorrect: true,
        over25Correct: true,
        exactScoreCorrect: false,
        goalError: 1,
      },
      errorSummary: evaluablePayload.error_summary,
      predictionResultsPayload: evaluablePayload,
    });
  });

  function buildEvaluationClient(options?: {
    prediction?: { data: unknown; error: unknown };
    match?: { data: unknown; error: unknown };
    competition?: { data: unknown; error: unknown };
    result?: { data: unknown; error: unknown };
    markets?: { data: unknown; error: unknown };
    existingEvaluation?: { data: unknown; error: unknown };
    insertResult?: { data?: unknown; error: unknown };
    updateResult?: { data?: unknown; error: unknown };
  }) {
    const predictionBuilder = createSingleSelectBuilder(
      options?.prediction ?? { data: predictionVersion, error: null },
    );
    const matchBuilder = createSingleSelectBuilder(
      options?.match ?? {
        data: {
          id: "match-1",
          competition_id: "competition-1",
          external_id: externalId,
          access_scope: "admin_only",
          intake_source: "api_football",
          status: "scheduled",
        },
        error: null,
      },
    );
    const competitionBuilder = createSingleSelectBuilder(
      options?.competition ?? {
        data: { id: "competition-1", usage_scope: "public_product" },
        error: null,
      },
    );
    const resultBuilder = createSingleSelectBuilder(options?.result ?? { data: verifiedResult, error: null });
    const marketsBuilder = createMarketsSelectBuilder(options?.markets ?? { data: completeMarkets, error: null });
    const predictionResultsBuilder = createPredictionResultsMutationBuilder({
      maybeSingle: options?.existingEvaluation ?? { data: null, error: null },
      insertResult: options?.insertResult ?? { data: { id: "evaluation-1" }, error: null },
      updateResult: options?.updateResult ?? { data: { id: "evaluation-1" }, error: null },
    });

    const from = vi.fn((table: string) => {
      if (table === "prediction_versions") return predictionBuilder;
      if (table === "matches") return matchBuilder;
      if (table === "competitions") return competitionBuilder;
      if (table === "match_results") return resultBuilder;
      if (table === "prediction_markets") return marketsBuilder;
      if (table === "prediction_results") return predictionResultsBuilder;
      throw new Error(`unexpected table ${table}`);
    });

    return {
      from,
      predictionBuilder,
      matchBuilder,
      competitionBuilder,
      resultBuilder,
      marketsBuilder,
      predictionResultsBuilder,
    };
  }

  it("inserts an evaluation when a verified result exists and no evaluation row exists", async () => {
    const client = buildEvaluationClient();
    createSupabaseServerClientMock.mockResolvedValue({ from: client.from });

    await expect(persistRealFixtureEvaluationAction(buildEvaluationFormData())).rejects.toThrow(
      `REDIRECT:/admin/real-fixture-lab?externalId=${encodeURIComponent(externalId)}&evaluation=saved`,
    );

    expect(evaluatePredictionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        predictionVersionId,
        matchId: "match-1",
        mostLikelyScore: "1-0",
      }),
      expect.objectContaining({
        matchId: "match-1",
        verificationStatus: "verified",
      }),
    );
    expect(client.predictionResultsBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        prediction_version_id: predictionVersionId,
        actual_home_goals: 2,
        actual_away_goals: 0,
      }),
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/real-fixture-lab");
  });

  it("allows internal evaluation persistence for an exact public finished api_football fixture", async () => {
    const client = buildEvaluationClient({
      match: { data: publicFinishedMatch, error: null },
    });
    createSupabaseServerClientMock.mockResolvedValue({ from: client.from });

    await expect(persistRealFixtureEvaluationAction(buildEvaluationFormData())).rejects.toThrow(
      `REDIRECT:/admin/real-fixture-lab?externalId=${encodeURIComponent(externalId)}&evaluation=saved`,
    );

    expect(client.competitionBuilder.select).toHaveBeenCalled();
    expect(client.predictionResultsBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        prediction_version_id: predictionVersionId,
        actual_home_goals: 2,
        actual_away_goals: 0,
      }),
    );
  });

  it("refreshes an evaluation when a row already exists", async () => {
    const client = buildEvaluationClient({
      existingEvaluation: { data: { id: "evaluation-1" }, error: null },
    });
    createSupabaseServerClientMock.mockResolvedValue({ from: client.from });

    await expect(persistRealFixtureEvaluationAction(buildEvaluationFormData())).rejects.toThrow(
      `REDIRECT:/admin/real-fixture-lab?externalId=${encodeURIComponent(externalId)}&evaluation=refreshed`,
    );

    expect(client.predictionResultsBuilder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        actual_home_goals: 2,
        actual_away_goals: 0,
        goal_error: 1,
      }),
    );
  });

  it("blocks when no prediction version exists", async () => {
    const client = buildEvaluationClient({
      prediction: { data: null, error: null },
    });
    createSupabaseServerClientMock.mockResolvedValue({ from: client.from });

    await expect(persistRealFixtureEvaluationAction(buildEvaluationFormData())).rejects.toThrow(
      `REDIRECT:/admin/real-fixture-lab?externalId=${encodeURIComponent(externalId)}&evaluation=not_found`,
    );
    expect(evaluatePredictionMock).not.toHaveBeenCalled();
  });

  it("blocks when fixture scope is wrong", async () => {
    const client = buildEvaluationClient({
      match: { data: null, error: null },
    });
    createSupabaseServerClientMock.mockResolvedValue({ from: client.from });

    await expect(persistRealFixtureEvaluationAction(buildEvaluationFormData())).rejects.toThrow(
      `REDIRECT:/admin/real-fixture-lab?externalId=${encodeURIComponent(externalId)}&evaluation=not_found`,
    );
    expect(client.from).not.toHaveBeenCalledWith("prediction_results");
  });

  it("blocks when no result exists", async () => {
    const client = buildEvaluationClient({
      result: { data: null, error: null },
    });
    createSupabaseServerClientMock.mockResolvedValue({ from: client.from });

    await expect(persistRealFixtureEvaluationAction(buildEvaluationFormData())).rejects.toThrow(
      `REDIRECT:/admin/real-fixture-lab?externalId=${encodeURIComponent(externalId)}&evaluation=no_result`,
    );
    expect(evaluatePredictionMock).not.toHaveBeenCalled();
  });

  it("blocks when the result is not verified", async () => {
    const client = buildEvaluationClient({
      result: {
        data: {
          ...verifiedResult,
          verification_status: "pending_review",
        },
        error: null,
      },
    });
    createSupabaseServerClientMock.mockResolvedValue({ from: client.from });

    await expect(persistRealFixtureEvaluationAction(buildEvaluationFormData())).rejects.toThrow(
      `REDIRECT:/admin/real-fixture-lab?externalId=${encodeURIComponent(externalId)}&evaluation=unverified`,
    );
    expect(evaluatePredictionMock).not.toHaveBeenCalled();
  });

  it("blocks when required markets are incomplete", async () => {
    const client = buildEvaluationClient({
      markets: {
        data: completeMarkets.slice(0, 3),
        error: null,
      },
    });
    createSupabaseServerClientMock.mockResolvedValue({ from: client.from });

    await expect(persistRealFixtureEvaluationAction(buildEvaluationFormData())).rejects.toThrow(
      `REDIRECT:/admin/real-fixture-lab?externalId=${encodeURIComponent(externalId)}&evaluation=incomplete`,
    );
    expect(evaluatePredictionMock).not.toHaveBeenCalled();
  });

  it("blocks when top_scores_json is invalid", async () => {
    const client = buildEvaluationClient({
      prediction: {
        data: {
          ...predictionVersion,
          top_scores_json: [{ score: "bad-format", probability: 40 }],
        },
        error: null,
      },
    });
    createSupabaseServerClientMock.mockResolvedValue({ from: client.from });

    await expect(persistRealFixtureEvaluationAction(buildEvaluationFormData())).rejects.toThrow(
      `REDIRECT:/admin/real-fixture-lab?externalId=${encodeURIComponent(externalId)}&evaluation=incomplete`,
    );
    expect(evaluatePredictionMock).not.toHaveBeenCalled();
  });
});

describe("verifyRealFixtureResultAction", () => {
  const pendingReviewResult = {
    id: "00000000-0000-4000-8000-000000000456",
    match_id: "match-1",
    verification_status: "pending_review",
  };

  const publicFinishedVerificationMatch = {
    id: "match-1",
    competition_id: "competition-1",
    external_id: externalId,
    access_scope: "public",
    intake_source: "api_football",
    status: "finished",
  };

  function buildVerificationClient(options?: {
    result?: { data: unknown; error: unknown };
    match?: { data: unknown; error: unknown };
    competition?: { data: unknown; error: unknown };
    updateResult?: { data?: unknown; error: unknown };
  }) {
    const matchResultsBuilder = createMatchResultsVerificationBuilder({
      maybeSingle: options?.result ?? { data: pendingReviewResult, error: null },
      updateResult: options?.updateResult ?? { data: { id: "00000000-0000-4000-8000-000000000456" }, error: null },
    });
    const matchBuilder = createSingleSelectBuilder(
      options?.match ?? {
        data: {
          id: "match-1",
          competition_id: "competition-1",
          external_id: externalId,
          access_scope: "admin_only",
          intake_source: "api_football",
          status: "scheduled",
        },
        error: null,
      },
    );
    const competitionBuilder = createSingleSelectBuilder(
      options?.competition ?? {
        data: { id: "competition-1", usage_scope: "public_product" },
        error: null,
      },
    );

    const from = vi.fn((table: string) => {
      if (table === "match_results") return matchResultsBuilder;
      if (table === "matches") return matchBuilder;
      if (table === "competitions") return competitionBuilder;
      throw new Error(`unexpected table ${table}`);
    });

    return {
      from,
      matchBuilder,
      competitionBuilder,
      matchResultsBuilder,
    };
  }

  it("verifies an existing pending_review result using only verification fields", async () => {
    const client = buildVerificationClient();
    createSupabaseServerClientMock.mockResolvedValue({ from: client.from });

    await expect(verifyRealFixtureResultAction(buildVerificationFormData())).rejects.toThrow(
      `REDIRECT:/admin/real-fixture-lab?externalId=${encodeURIComponent(externalId)}&result=verified`,
    );

    expect(client.matchResultsBuilder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        verification_status: "verified",
        reviewed_by: "admin-1",
      }),
    );
    expect(client.matchResultsBuilder.update).toHaveBeenCalledWith(
      expect.not.objectContaining({
        home_goals: expect.anything(),
        away_goals: expect.anything(),
        match_id: expect.anything(),
        intake_source: expect.anything(),
        source_note: expect.anything(),
        recorded_at: expect.anything(),
        id: expect.anything(),
      }),
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/real-fixture-lab");
  });

  it("allows verification for an exact public finished api_football fixture in public_product scope", async () => {
    const client = buildVerificationClient({
      match: { data: publicFinishedVerificationMatch, error: null },
    });
    createSupabaseServerClientMock.mockResolvedValue({ from: client.from });

    await expect(verifyRealFixtureResultAction(buildVerificationFormData())).rejects.toThrow(
      `REDIRECT:/admin/real-fixture-lab?externalId=${encodeURIComponent(externalId)}&result=verified`,
    );

    expect(client.competitionBuilder.select).toHaveBeenCalled();
    expect(client.matchResultsBuilder.update).toHaveBeenCalled();
  });

  it("blocks when no result exists", async () => {
    const client = buildVerificationClient({
      result: { data: null, error: null },
    });
    createSupabaseServerClientMock.mockResolvedValue({ from: client.from });

    await expect(verifyRealFixtureResultAction(buildVerificationFormData())).rejects.toThrow(
      `REDIRECT:/admin/real-fixture-lab?externalId=${encodeURIComponent(externalId)}&result=no_result`,
    );
    expect(client.from).not.toHaveBeenCalledWith("prediction_results");
  });

  it("blocks when fixture scope or external id no longer matches", async () => {
    const client = buildVerificationClient({
      match: { data: null, error: null },
    });
    createSupabaseServerClientMock.mockResolvedValue({ from: client.from });

    await expect(verifyRealFixtureResultAction(buildVerificationFormData())).rejects.toThrow(
      `REDIRECT:/admin/real-fixture-lab?externalId=${encodeURIComponent(externalId)}&result=not_found`,
    );
  });

  it("blocks verification for a public scheduled fixture", async () => {
    const client = buildVerificationClient({
      match: {
        data: {
          ...publicFinishedVerificationMatch,
          status: "scheduled",
        },
        error: null,
      },
    });
    createSupabaseServerClientMock.mockResolvedValue({ from: client.from });

    await expect(verifyRealFixtureResultAction(buildVerificationFormData())).rejects.toThrow(
      `REDIRECT:/admin/real-fixture-lab?externalId=${encodeURIComponent(externalId)}&result=not_found`,
    );
    expect(client.matchResultsBuilder.update).not.toHaveBeenCalled();
  });

  it("blocks when the result is already verified", async () => {
    const client = buildVerificationClient({
      result: {
        data: { ...pendingReviewResult, verification_status: "verified" },
        error: null,
      },
    });
    createSupabaseServerClientMock.mockResolvedValue({ from: client.from });

    await expect(verifyRealFixtureResultAction(buildVerificationFormData())).rejects.toThrow(
      `REDIRECT:/admin/real-fixture-lab?externalId=${encodeURIComponent(externalId)}&result=already_verified`,
    );
    expect(client.matchResultsBuilder.update).not.toHaveBeenCalled();
  });

  it("blocks when the result is rejected", async () => {
    const client = buildVerificationClient({
      result: {
        data: { ...pendingReviewResult, verification_status: "rejected" },
        error: null,
      },
    });
    createSupabaseServerClientMock.mockResolvedValue({ from: client.from });

    await expect(verifyRealFixtureResultAction(buildVerificationFormData())).rejects.toThrow(
      `REDIRECT:/admin/real-fixture-lab?externalId=${encodeURIComponent(externalId)}&result=rejected`,
    );
    expect(client.matchResultsBuilder.update).not.toHaveBeenCalled();
  });
});

describe("publishRealFixturePredictionAction", () => {
  const internalPrediction = {
    id: predictionVersionId,
    match_id: fixture.id,
    model_version_id: "model-1",
    prediction_type: "pre_match_24h",
    home_win_prob: 37.8395,
    draw_prob: 25.8141,
    away_win_prob: 36.3464,
    expected_home_goals: 1.1,
    expected_away_goals: 1.05,
    most_likely_score: "1-1",
    top_scores_json: [
      { score: "1-1", probability: 12.2464 },
      { score: "1-0", probability: 9.1816 },
    ],
    confidence_score: 41.05,
    risk_level: "high",
    run_scope: "internal_lab",
  };

  function buildPublicationClient(options?: {
    match?: { data: unknown; error: unknown };
    competition?: { data: unknown; error: unknown };
    internalPrediction?: { data: unknown; error: unknown };
    existingPublicPrediction?: { data: unknown; error: unknown };
    insertPublicPrediction?: { data?: unknown; error: unknown };
    publishMatchRpc?: { data: unknown; error: unknown };
  }) {
    const matchBuilder = createPublicationMatchBuilder({
      maybeSingle:
        options?.match ?? {
          data: {
            id: fixture.id,
            slug: fixture.slug,
            competition_id: fixture.competitionId,
            status: "scheduled",
            access_scope: "admin_only",
            intake_source: "api_football",
          },
          error: null,
        },
    });
    const competitionBuilder = createSingleSelectBuilder(
      options?.competition ?? {
        data: { id: fixture.competitionId, usage_scope: "public_product" },
        error: null,
      },
    );
    const internalPredictionBuilder = createPredictionVersionInsertBuilder({
      maybeSingle: options?.internalPrediction ?? { data: internalPrediction, error: null },
    });
    const existingPublicPredictionBuilder = createPredictionVersionInsertBuilder({
      maybeSingle: options?.existingPublicPrediction ?? { data: null, error: null },
      insertResult: options?.insertPublicPrediction ?? { data: { id: "public-prediction-1" }, error: null },
    });
    const predictionResultsBuilder = {
      select: vi.fn(() => {
        throw new Error("should not read prediction_results");
      }),
      insert: vi.fn(() => {
        throw new Error("should not write prediction_results");
      }),
      update: vi.fn(() => {
        throw new Error("should not update prediction_results");
      }),
    };
    const predictionMarketsBuilder = {
      select: vi.fn(() => {
        throw new Error("should not read prediction_markets");
      }),
      insert: vi.fn(() => {
        throw new Error("should not write prediction_markets");
      }),
    };
    const rpc = vi.fn((fn: string, args: unknown) => {
      if (fn === "publish_real_fixture_match_access_scope") {
        return Promise.resolve(
          options?.publishMatchRpc ?? {
            data: fixture.id,
            error: null,
          },
        );
      }

      throw new Error(`unexpected rpc ${fn} ${JSON.stringify(args)}`);
    });

    const from = vi.fn((table: string) => {
      if (table === "matches") return matchBuilder;
      if (table === "competitions") return competitionBuilder;
      if (table === "prediction_versions") {
        if (internalPredictionBuilder.maybeSingle.mock.calls.length === 0) {
          return internalPredictionBuilder;
        }

        return existingPublicPredictionBuilder;
      }
      if (table === "prediction_results") return predictionResultsBuilder;
      if (table === "prediction_markets") return predictionMarketsBuilder;
      throw new Error(`unexpected table ${table}`);
    });

    return {
      from,
      rpc,
      matchBuilder,
      competitionBuilder,
      internalPredictionBuilder,
      existingPublicPredictionBuilder,
    };
  }

  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminMock.mockResolvedValue({ user: { id: "admin-1" } });
  });

  it("publishes an exact admin_only api_football scheduled match with a matching internal prediction", async () => {
    const client = buildPublicationClient();
    createSupabaseServerClientMock.mockResolvedValue({ from: client.from, rpc: client.rpc });

    await expect(publishRealFixturePredictionAction(buildPublishFormData())).rejects.toThrow(
      "REDIRECT:/admin/real-fixture-lab?publish=published",
    );

    expect(client.existingPublicPredictionBuilder.insert).toHaveBeenCalledWith({
      match_id: fixture.id,
      model_version_id: "model-1",
      prediction_type: "pre_match_24h",
      home_win_prob: 37.8395,
      draw_prob: 25.8141,
      away_win_prob: 36.3464,
      expected_home_goals: 1.1,
      expected_away_goals: 1.05,
      most_likely_score: "1-1",
      top_scores_json: internalPrediction.top_scores_json,
      confidence_score: 41.05,
      risk_level: "high",
      run_scope: "public_product",
    });
    expect(client.rpc).toHaveBeenCalledWith("publish_real_fixture_match_access_scope", {
      target_match_id: fixture.id,
      target_match_slug: fixture.slug,
    });
    expect(client.from).not.toHaveBeenCalledWith("prediction_markets");
    expect(client.from).not.toHaveBeenCalledWith("prediction_results");
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/real-fixture-lab");
    expect(revalidatePathMock).toHaveBeenCalledWith("/predictions");
    expect(revalidatePathMock).toHaveBeenCalledWith(`/matches/${fixture.slug}`);
  });

  it("leaves the internal prediction row untouched while creating a new public_product row", async () => {
    const client = buildPublicationClient();
    createSupabaseServerClientMock.mockResolvedValue({ from: client.from, rpc: client.rpc });

    await expect(publishRealFixturePredictionAction(buildPublishFormData())).rejects.toThrow(
      "REDIRECT:/admin/real-fixture-lab?publish=published",
    );

    expect(client.internalPredictionBuilder.insert).not.toHaveBeenCalled();
    expect(client.internalPredictionBuilder.maybeSingle).toHaveBeenCalledTimes(1);
    expect(client.existingPublicPredictionBuilder.insert).toHaveBeenCalledTimes(1);
  });

  it("is idempotent when a public_product prediction already exists for the same match and type", async () => {
    const client = buildPublicationClient({
      existingPublicPrediction: { data: { id: "public-prediction-1" }, error: null },
    });
    createSupabaseServerClientMock.mockResolvedValue({ from: client.from, rpc: client.rpc });

    await expect(publishRealFixturePredictionAction(buildPublishFormData())).rejects.toThrow(
      "REDIRECT:/admin/real-fixture-lab?publish=already_published",
    );

    expect(client.existingPublicPredictionBuilder.insert).not.toHaveBeenCalled();
    expect(client.rpc).toHaveBeenCalledWith("publish_real_fixture_match_access_scope", {
      target_match_id: fixture.id,
      target_match_slug: fixture.slug,
    });
  });

  it("rejects when the match is not admin_only", async () => {
    const client = buildPublicationClient({
      match: {
        data: {
          id: fixture.id,
          slug: fixture.slug,
          competition_id: fixture.competitionId,
          status: "scheduled",
          access_scope: "public",
          intake_source: "api_football",
        },
        error: null,
      },
    });
    createSupabaseServerClientMock.mockResolvedValue({ from: client.from, rpc: client.rpc });

    await expect(publishRealFixturePredictionAction(buildPublishFormData())).rejects.toThrow(
      "REDIRECT:/admin/real-fixture-lab?publish=blocked",
    );
    expect(client.from).not.toHaveBeenCalledWith("prediction_results");
  });

  it("rejects when the match intake source is not api_football", async () => {
    const client = buildPublicationClient({
      match: {
        data: {
          id: fixture.id,
          slug: fixture.slug,
          competition_id: fixture.competitionId,
          status: "scheduled",
          access_scope: "admin_only",
          intake_source: "manual",
        },
        error: null,
      },
    });
    createSupabaseServerClientMock.mockResolvedValue({ from: client.from, rpc: client.rpc });

    await expect(publishRealFixturePredictionAction(buildPublishFormData())).rejects.toThrow(
      "REDIRECT:/admin/real-fixture-lab?publish=blocked",
    );
  });

  it("rejects when the fixture is not scheduled", async () => {
    const client = buildPublicationClient({
      match: {
        data: {
          id: fixture.id,
          slug: fixture.slug,
          competition_id: fixture.competitionId,
          status: "finished",
          access_scope: "admin_only",
          intake_source: "api_football",
        },
        error: null,
      },
    });
    createSupabaseServerClientMock.mockResolvedValue({ from: client.from, rpc: client.rpc });

    await expect(publishRealFixturePredictionAction(buildPublishFormData())).rejects.toThrow(
      "REDIRECT:/admin/real-fixture-lab?publish=blocked",
    );
  });

  it("rejects when the source prediction is not internal_lab", async () => {
    const client = buildPublicationClient({
      internalPrediction: {
        data: { ...internalPrediction, run_scope: "public_product" },
        error: null,
      },
    });
    createSupabaseServerClientMock.mockResolvedValue({ from: client.from, rpc: client.rpc });

    await expect(publishRealFixturePredictionAction(buildPublishFormData())).rejects.toThrow(
      "REDIRECT:/admin/real-fixture-lab?publish=blocked",
    );
  });

  it("rejects when the source prediction does not belong to the match", async () => {
    const client = buildPublicationClient({
      internalPrediction: {
        data: { ...internalPrediction, match_id: "other-match" },
        error: null,
      },
    });
    createSupabaseServerClientMock.mockResolvedValue({ from: client.from, rpc: client.rpc });

    await expect(publishRealFixturePredictionAction(buildPublishFormData())).rejects.toThrow(
      "REDIRECT:/admin/real-fixture-lab?publish=blocked",
    );
  });

  it("rejects when the competition is not public_product", async () => {
    const client = buildPublicationClient({
      competition: {
        data: { id: fixture.competitionId, usage_scope: "internal_lab" },
        error: null,
      },
    });
    createSupabaseServerClientMock.mockResolvedValue({ from: client.from, rpc: client.rpc });

    await expect(publishRealFixturePredictionAction(buildPublishFormData())).rejects.toThrow(
      "REDIRECT:/admin/real-fixture-lab?publish=blocked",
    );
  });
});

describe("refreshPublishedRealFixturePredictionAction", () => {
  const publicFixture = {
    ...fixture,
    accessScope: "public" as const,
    savedPrediction: {
      id: "old-internal-prediction-1",
      modelVersionId: "model-0",
      modelVersionVersion: "v0.1",
      createdAt: "2026-06-08T12:00:00Z",
      predictionType: "pre_match_24h" as const,
      runScope: "internal_lab" as const,
    },
    hasSavedPredictionForActiveModel: true,
    activeModelSavedPredictionId: "old-internal-prediction-1",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminMock.mockResolvedValue({ user: { id: "admin-1" } });
    getAdminRealFixtureLabDataMock.mockResolvedValue({
      status: "ready",
      selectedExternalId: publicFixture.externalId,
      fixtures: [publicFixture],
      warnings: [],
    });
    buildRealFixturePredictionInputMock.mockReturnValue(predictionInput);
    generatePredictionMock.mockReturnValue(predictionOutput);
    buildRealFixturePredictionVersionInsertMock.mockReturnValue({
      match_id: "match-1",
      model_version_id: "model-1",
      prediction_type: "pre_match_24h",
      home_win_prob: 51,
      draw_prob: 24,
      away_win_prob: 25,
      expected_home_goals: 1.4,
      expected_away_goals: 0.9,
      most_likely_score: "1-0",
      top_scores_json: [{ score: "1-0", probability: 14 }],
      confidence_score: 58,
      risk_level: "medium",
      run_scope: "internal_lab",
    });
    buildRealFixturePredictionMarketInsertsMock.mockReturnValue([
      {
        prediction_version_id: "new-internal-prediction-1",
        market: "match_winner",
        selection: "home",
        probability: 51,
        confidence: 58,
        is_premium: false,
      },
    ]);
  });

  function buildRefreshClient(options?: {
    competition?: { data: unknown; error: unknown };
    existingPublicPrediction?: { data: unknown; error: unknown };
    insertInternalPrediction?: { data?: unknown; error: unknown };
    insertReplacementPublicPrediction?: { data?: unknown; error: unknown };
  }) {
    const modelVersionsBuilder = createPredictionVersionInsertBuilder({
      maybeSingle: { data: { id: "model-1", version: "v0.2", created_at: "2026-06-11T08:00:00Z" }, error: null },
    });
    const competitionBuilder = createSingleSelectBuilder(
      options?.competition ?? {
        data: { id: fixture.competitionId, usage_scope: "public_product" },
        error: null,
      },
    );
    const internalPredictionInsertBuilder = createPredictionVersionInsertBuilder({
      insertResult: options?.insertInternalPrediction ?? {
        data: { id: "new-internal-prediction-1" },
        error: null,
      },
    });
    const existingPublicPredictionBuilder = createPredictionVersionInsertBuilder({
      maybeSingle: options?.existingPublicPrediction ?? {
        data: { id: "old-public-prediction-1" },
        error: null,
      },
      insertResult: options?.insertReplacementPublicPrediction ?? {
        data: { id: "new-public-prediction-1" },
        error: null,
      },
    });
    const predictionMarketsBuilder = {
      insert: vi.fn(() => Promise.resolve({ error: null })),
    };

    const predictionVersionBuilders = [
      existingPublicPredictionBuilder,
      internalPredictionInsertBuilder,
      existingPublicPredictionBuilder,
    ];
    let predictionVersionIndex = 0;

    const from = vi.fn((table: string) => {
      if (table === "model_versions") return modelVersionsBuilder;
      if (table === "competitions") return competitionBuilder;
      if (table === "prediction_versions") {
        const builder =
          predictionVersionBuilders[predictionVersionIndex] ?? existingPublicPredictionBuilder;
        predictionVersionIndex += 1;
        return builder;
      }
      if (table === "prediction_markets") return predictionMarketsBuilder;
      throw new Error(`unexpected table ${table}`);
    });

    return {
      from,
      modelVersionsBuilder,
      competitionBuilder,
      internalPredictionInsertBuilder,
      existingPublicPredictionBuilder,
      predictionMarketsBuilder,
    };
  }

  it("saves a new internal evidence row and appends a replacement public_product row for an exact public fixture", async () => {
    const client = buildRefreshClient();
    createSupabaseServerClientMock.mockResolvedValue({ from: client.from });

    await expect(refreshPublishedRealFixturePredictionAction(buildRefreshFormData())).rejects.toThrow(
      `REDIRECT:/admin/real-fixture-lab?externalId=${encodeURIComponent(externalId)}&refresh=refreshed`,
    );

    expect(getAdminRealFixtureLabDataMock).toHaveBeenCalledWith({
      externalId,
      includePublicExactMatch: true,
    });
    expect(client.internalPredictionInsertBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        match_id: fixture.id,
        model_version_id: "model-1",
        run_scope: "internal_lab",
      }),
    );
    expect(client.predictionMarketsBuilder.insert).toHaveBeenCalledWith([
      expect.objectContaining({
        prediction_version_id: "new-internal-prediction-1",
        is_premium: false,
      }),
    ]);
    expect(client.existingPublicPredictionBuilder.insert).toHaveBeenCalledWith({
      match_id: fixture.id,
      model_version_id: "model-1",
      prediction_type: "pre_match_24h",
      home_win_prob: 51,
      draw_prob: 24,
      away_win_prob: 25,
      expected_home_goals: 1.4,
      expected_away_goals: 0.9,
      most_likely_score: "1-0",
      top_scores_json: [{ score: "1-0", probability: 14 }],
      confidence_score: 58,
      risk_level: "medium",
      run_scope: "public_product",
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/real-fixture-lab");
    expect(revalidatePathMock).toHaveBeenCalledWith("/predictions");
    expect(revalidatePathMock).toHaveBeenCalledWith(`/matches/${fixture.slug}`);
  });

  it("blocks refresh when the selected fixture is not already public", async () => {
    getAdminRealFixtureLabDataMock.mockResolvedValue({
      status: "ready",
      selectedExternalId: fixture.externalId,
      fixtures: [fixture],
      warnings: [],
    });

    await expect(refreshPublishedRealFixturePredictionAction(buildRefreshFormData())).rejects.toThrow(
      `REDIRECT:/admin/real-fixture-lab?externalId=${encodeURIComponent(externalId)}&refresh=blocked`,
    );
    expect(createSupabaseServerClientMock).not.toHaveBeenCalled();
  });

  it("blocks refresh when no public_product baseline exists yet", async () => {
    const client = buildRefreshClient({
      existingPublicPrediction: { data: null, error: null },
    });
    createSupabaseServerClientMock.mockResolvedValue({ from: client.from });

    await expect(refreshPublishedRealFixturePredictionAction(buildRefreshFormData())).rejects.toThrow(
      `REDIRECT:/admin/real-fixture-lab?externalId=${encodeURIComponent(externalId)}&refresh=not_found`,
    );

    expect(client.internalPredictionInsertBuilder.insert).not.toHaveBeenCalled();
    expect(client.predictionMarketsBuilder.insert).not.toHaveBeenCalled();
  });
});
