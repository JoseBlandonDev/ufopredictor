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
          external_id: externalId,
          access_scope: "admin_only",
          intake_source: "api_football",
        },
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
      if (table === "match_results") return resultBuilder;
      if (table === "prediction_markets") return marketsBuilder;
      if (table === "prediction_results") return predictionResultsBuilder;
      throw new Error(`unexpected table ${table}`);
    });

    return {
      from,
      predictionBuilder,
      matchBuilder,
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

  function buildVerificationClient(options?: {
    result?: { data: unknown; error: unknown };
    match?: { data: unknown; error: unknown };
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
        },
        error: null,
      },
    );

    const from = vi.fn((table: string) => {
      if (table === "match_results") return matchResultsBuilder;
      if (table === "matches") return matchBuilder;
      throw new Error(`unexpected table ${table}`);
    });

    return {
      from,
      matchBuilder,
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
