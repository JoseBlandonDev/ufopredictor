import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  requireAdminMock,
  createSupabaseServerClientMock,
  getAdminRealFixtureLabDataMock,
  buildRealFixturePredictionInputMock,
  generatePredictionMock,
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

import { saveRealFixturePredictionAction } from "./actions";

const fixture = {
  id: "match-1",
  externalId: "api-football:fixture:1546413",
  slug: "colombia-final",
  competitionId: "competition-1",
  kickoffAt: "2026-06-08T22:00:00Z",
  stage: "Final",
  status: "scheduled",
  accessScope: "admin_only" as const,
  intakeSource: "api_football" as const,
  sourceNote: "tracked by ingest",
  competitionName: "Primera A",
  homeTeamId: "team-1",
  homeTeamName: "Atletico Nacional",
  awayTeamId: "team-2",
  awayTeamName: "Junior",
  result: null,
  savedPrediction: null,
};

const predictionInput = { matchId: "match-1" };
const predictionOutput = { predictionVersionProjection: {}, predictionMarketsProjection: [] };

function buildFormData() {
  const formData = new FormData();
  formData.set("externalId", "api-football:fixture:1546413");
  return formData;
}

function makeQueryBuilder(options: {
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
    const modelVersionsBuilder = makeQueryBuilder({
      maybeSingle: { data: { id: "model-1", version: "v0.1", created_at: "2026-06-08T10:00:00Z" }, error: null },
    });
    const predictionVersionsBuilder = makeQueryBuilder({
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

    await expect(saveRealFixturePredictionAction(buildFormData())).rejects.toThrow(
      "REDIRECT:/admin/real-fixture-lab?externalId=api-football%3Afixture%3A1546413&save=duplicate",
    );
    expect(predictionVersionsBuilder.insert).not.toHaveBeenCalled();
    expect(from).not.toHaveBeenCalledWith("prediction_markets");
    expect(from).not.toHaveBeenCalledWith("prediction_results");
  });

  it("rejects fixtures outside admin_only api_football scope", async () => {
    getAdminRealFixtureLabDataMock.mockResolvedValue({
      status: "ready",
      selectedExternalId: fixture.externalId,
      fixtures: [
        {
          ...fixture,
          accessScope: "public",
        },
      ],
      warnings: [],
    });

    await expect(saveRealFixturePredictionAction(buildFormData())).rejects.toThrow(
      "REDIRECT:/admin/real-fixture-lab?externalId=api-football%3Afixture%3A1546413&save=error",
    );
    expect(createSupabaseServerClientMock).not.toHaveBeenCalled();
  });

  it("does not persist anything when no active model version exists", async () => {
    const modelVersionsBuilder = makeQueryBuilder({
      maybeSingle: { data: null, error: null },
    });
    const predictionVersionsBuilder = makeQueryBuilder({
      maybeSingle: { data: null, error: null },
    });
    const from = vi.fn((table: string) => {
      if (table === "model_versions") return modelVersionsBuilder;
      if (table === "prediction_versions") return predictionVersionsBuilder;
      throw new Error(`unexpected table ${table}`);
    });

    createSupabaseServerClientMock.mockResolvedValue({ from });

    await expect(saveRealFixturePredictionAction(buildFormData())).rejects.toThrow(
      "REDIRECT:/admin/real-fixture-lab?externalId=api-football%3Afixture%3A1546413&save=no_model",
    );
    expect(predictionVersionsBuilder.insert).not.toHaveBeenCalled();
    expect(from).not.toHaveBeenCalledWith("prediction_markets");
  });

  it("persists prediction_versions and prediction_markets without touching prediction_results", async () => {
    const modelVersionsBuilder = makeQueryBuilder({
      maybeSingle: { data: { id: "model-1", version: "v0.1", created_at: "2026-06-08T10:00:00Z" }, error: null },
    });
    const predictionVersionsBuilder = makeQueryBuilder({
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

    await expect(saveRealFixturePredictionAction(buildFormData())).rejects.toThrow(
      "REDIRECT:/admin/real-fixture-lab?externalId=api-football%3Afixture%3A1546413&save=saved",
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
