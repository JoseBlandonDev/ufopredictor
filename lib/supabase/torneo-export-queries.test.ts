import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getDefaultTorneoExportRange,
  getTorneoUfoExport,
  parseTorneoExportRange,
  resolveTorneoExportOrigin,
} from "./torneo-export-queries";

const { createSupabaseServerClientMock, isLaunchSafePublicMatchMock } = vi.hoisted(() => ({
  createSupabaseServerClientMock: vi.fn(),
  isLaunchSafePublicMatchMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("./server", () => ({
  createSupabaseServerClient: createSupabaseServerClientMock,
}));

vi.mock("./public-launch-filters", () => ({
  isLaunchSafePublicMatch: isLaunchSafePublicMatchMock,
}));

function createQueryBuilder(response: unknown) {
  return {
    eq() {
      return this;
    },
    gte() {
      return this;
    },
    lte() {
      return this;
    },
    in() {
      return this;
    },
    order() {
      return this;
    },
    maybeSingle() {
      return Promise.resolve(response);
    },
    then(onFulfilled: (value: unknown) => unknown) {
      return Promise.resolve(response).then(onFulfilled);
    },
  };
}

function buildFakeExportClient(overrides?: {
  matches?: unknown[];
  predictions?: unknown[];
  markets?: unknown[];
}) {
  return {
    from(table: string) {
      if (table === "competitions") {
        return {
          select() {
            return createQueryBuilder({
              data: {
                id: "competition-1",
                slug: "world-cup-2026",
                usage_scope: "public_product",
              },
              error: null,
            });
          },
        };
      }

      if (table === "matches") {
        return {
          select() {
            return createQueryBuilder({
              data:
                overrides?.matches ??
                [
                  {
                    id: "match-1",
                    external_id: "api-football:fixture:1489385",
                    slug: "world-cup-2026-ghana-vs-panama-2026-06-17",
                    kickoff_at: "2026-06-17T23:00:00Z",
                    stage: "Group Stage - 2",
                    status: "scheduled",
                    competition_id: "competition-1",
                    home_team_id: "team-1",
                    away_team_id: "team-2",
                    access_scope: "public",
                  },
                ],
              error: null,
            });
          },
        };
      }

      if (table === "teams") {
        return {
          select() {
            return createQueryBuilder({
              data: [
                { id: "team-1", name: "Ghana" },
                { id: "team-2", name: "Panama" },
              ],
              error: null,
            });
          },
        };
      }

      if (table === "prediction_versions") {
        return {
          select() {
            return createQueryBuilder({
              data:
                overrides?.predictions ??
                [
                  {
                    id: "prediction-new",
                    match_id: "match-1",
                    created_at: "2026-06-16T18:00:00Z",
                    home_win_prob: 58.0619,
                    draw_prob: 23.9985,
                    away_win_prob: 17.9396,
                    expected_home_goals: 1.6816,
                    expected_away_goals: 0.6126,
                    most_likely_score: "1-0",
                    top_scores_json: [
                      { score: "1-0", probability: 13.8 },
                      { score: "2-0", probability: "11.7" },
                      { score: "1-1", probability: 11.3 },
                    ],
                    confidence_score: 93.84,
                    risk_level: "low",
                  },
                  {
                    id: "prediction-old",
                    match_id: "match-1",
                    created_at: "2026-06-15T18:00:00Z",
                    home_win_prob: 50,
                    draw_prob: 25,
                    away_win_prob: 25,
                    expected_home_goals: 1,
                    expected_away_goals: 1,
                    most_likely_score: "1-1",
                    top_scores_json: [{ score: "1-1", probability: 17.5 }],
                    confidence_score: 50,
                    risk_level: "medium",
                  },
                ],
              error: null,
            });
          },
        };
      }

      if (table === "prediction_markets") {
        return {
          select() {
            return createQueryBuilder({
              data:
                overrides?.markets ??
                [
                  { prediction_version_id: "prediction-new", market: "btts", selection: "yes", probability: 45.4 },
                  { prediction_version_id: "prediction-new", market: "btts", selection: "no", probability: 54.6 },
                  { prediction_version_id: "prediction-new", market: "over_2_5", selection: "over", probability: 45.6 },
                  { prediction_version_id: "prediction-new", market: "over_2_5", selection: "under", probability: 54.4 },
                  { prediction_version_id: "prediction-old", market: "btts", selection: "yes", probability: 99 },
                  { prediction_version_id: "prediction-old", market: "btts", selection: "no", probability: 1 },
                  { prediction_version_id: "prediction-old", market: "over_2_5", selection: "over", probability: 88 },
                  { prediction_version_id: "prediction-old", market: "over_2_5", selection: "under", probability: 12 },
                ],
              error: null,
            });
          },
        };
      }

      throw new Error(`Unexpected table ${table}`);
    },
    rpc() {
      return Promise.resolve({ data: null, error: null });
    },
  };
}

describe("torneo export queries", () => {
  const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;

  beforeEach(() => {
    createSupabaseServerClientMock.mockReset();
    isLaunchSafePublicMatchMock.mockReset();
    isLaunchSafePublicMatchMock.mockImplementation((slug: string) => slug !== "not-launch-safe");
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
  });

  it("builds the default next-7-day date range", () => {
    expect(getDefaultTorneoExportRange(new Date("2026-06-16T12:00:00Z"))).toEqual({
      from: "2026-06-16",
      to: "2026-06-22",
    });
  });

  it("validates date ranges safely", () => {
    expect(parseTorneoExportRange({}, new Date("2026-06-16T12:00:00Z"))).toMatchObject({
      status: "valid",
      range: { from: "2026-06-16", to: "2026-06-22" },
    });

    expect(parseTorneoExportRange({ from: "bad", to: "2026-06-22" })).toEqual({
      status: "invalid",
      statusCode: 400,
      message: "Los parametros from y to deben usar el formato YYYY-MM-DD.",
    });

    expect(parseTorneoExportRange({ from: "2026-06-22", to: "2026-06-16" })).toEqual({
      status: "invalid",
      statusCode: 400,
      message: "El parametro from no puede ser posterior a to.",
    });

    expect(parseTorneoExportRange({ from: "2026-06-01", to: "2026-07-05" })).toEqual({
      status: "invalid",
      statusCode: 400,
      message: "El rango maximo permitido es de 31 dias.",
    });
  });

  it("resolves production export origin and rejects accidental localhost fallback", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://ufopredictor.com";
    expect(resolveTorneoExportOrigin({ allowLocalhostOrigin: false })).toBe("https://ufopredictor.com");

    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
    expect(
      resolveTorneoExportOrigin({
        explicitOrigin: "https://ufopredictor.com",
        allowLocalhostOrigin: false,
      }),
    ).toBe("https://ufopredictor.com");

    expect(() => resolveTorneoExportOrigin({ allowLocalhostOrigin: false })).toThrow(/localhost/i);
  });

  it("uses the explicit production origin for sourceAppUrl and fixture URLs", async () => {
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
    createSupabaseServerClientMock.mockResolvedValue(buildFakeExportClient());

    const result = await getTorneoUfoExport({
      range: { from: "2026-06-16", to: "2026-06-22" },
      fromStartIso: "2026-06-16T00:00:00.000Z",
      toEndIso: "2026-06-22T23:59:59.999Z",
      explicitOrigin: "https://ufopredictor.com",
      excludeFinished: false,
    });

    expect(result.sourceAppUrl).toBe("https://ufopredictor.com");
    expect(result.fixtures[0]?.ufoUrl).toBe("https://ufopredictor.com/matches/world-cup-2026-ghana-vs-panama-2026-06-17");
  });

  it("associates BTTS and O/U 2.5 markets with the exact selected public prediction version", async () => {
    createSupabaseServerClientMock.mockResolvedValue(buildFakeExportClient());

    const result = await getTorneoUfoExport({
      range: { from: "2026-06-16", to: "2026-06-22" },
      fromStartIso: "2026-06-16T00:00:00.000Z",
      toEndIso: "2026-06-22T23:59:59.999Z",
      explicitOrigin: "https://ufopredictor.com",
      excludeFinished: false,
    });

    expect(result.fixtures[0]?.prediction).toEqual({
      homeWinProbability: 0.580619,
      drawProbability: 0.239985,
      awayWinProbability: 0.179396,
      confidenceScore: 93.84,
      riskLevel: "low",
      mostLikelyScore: "1-0",
      expectedGoals: { home: 1.6816, away: 0.6126 },
      topScorelines: [
        { score: "1-0", probability: 0.138 },
        { score: "2-0", probability: 0.117 },
        { score: "1-1", probability: 0.113 },
      ],
      bothTeamsToScore: {
        yesProbability: 0.454,
        noProbability: 0.546,
      },
      totalGoals25: {
        overProbability: 0.456,
        underProbability: 0.544,
      },
    });
  });

  it("preserves null BTTS and O/U only when the selected public version truly has no markets", async () => {
    createSupabaseServerClientMock.mockResolvedValue(
      buildFakeExportClient({
        markets: [],
      }),
    );

    const result = await getTorneoUfoExport({
      range: { from: "2026-06-16", to: "2026-06-22" },
      fromStartIso: "2026-06-16T00:00:00.000Z",
      toEndIso: "2026-06-22T23:59:59.999Z",
      explicitOrigin: "https://ufopredictor.com",
      excludeFinished: false,
    });

    expect(result.fixtures[0]?.prediction.bothTeamsToScore).toBeNull();
    expect(result.fixtures[0]?.prediction.totalGoals25).toBeNull();
  });

  it("keeps 24-fixture export integrity when exact external ids are requested", async () => {
    const matches = Array.from({ length: 24 }, (_, index) => ({
      id: `match-${index + 1}`,
      external_id: `api-football:fixture:${index + 1}`,
      slug: `world-cup-2026-fixture-${index + 1}`,
      kickoff_at: `2026-06-${String(18 + Math.floor(index / 4)).padStart(2, "0")}T12:00:00Z`,
      stage: "Group Stage - 2",
      status: "scheduled",
      competition_id: "competition-1",
      home_team_id: "team-1",
      away_team_id: "team-2",
      access_scope: "public",
    }));
    const predictions = matches.map((match, index) => ({
      id: `prediction-${index + 1}`,
      match_id: match.id,
      created_at: "2026-06-19T12:00:00Z",
      home_win_prob: 40,
      draw_prob: 30,
      away_win_prob: 30,
      expected_home_goals: 1.2,
      expected_away_goals: 1.1,
      most_likely_score: "1-1",
      top_scores_json: [{ score: "1-1", probability: 12 }],
      confidence_score: 70,
      risk_level: "medium",
    }));
    const markets = predictions.flatMap((prediction) => [
      { prediction_version_id: prediction.id, market: "btts", selection: "yes", probability: 50 },
      { prediction_version_id: prediction.id, market: "btts", selection: "no", probability: 50 },
      { prediction_version_id: prediction.id, market: "over_2_5", selection: "over", probability: 48 },
      { prediction_version_id: prediction.id, market: "over_2_5", selection: "under", probability: 52 },
    ]);

    createSupabaseServerClientMock.mockResolvedValue(
      buildFakeExportClient({
        matches,
        predictions,
        markets,
      }),
    );

    const allowedMatchExternalIds = matches.map((match) => match.external_id);
    const result = await getTorneoUfoExport({
      range: { from: "2026-06-18", to: "2026-06-24" },
      fromStartIso: "2026-06-18T00:00:00.000Z",
      toEndIso: "2026-06-24T23:59:59.999Z",
      explicitOrigin: "https://ufopredictor.com",
      excludeFinished: false,
      allowedMatchExternalIds,
    });

    expect(result.fixtures).toHaveLength(24);
    expect(new Set(result.fixtures.map((fixture) => fixture.externalId)).size).toBe(24);
    expect(result.fixtures.every((fixture) => fixture.stage === "Group Stage - 2")).toBe(true);
  });
});
