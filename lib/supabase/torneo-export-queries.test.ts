import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getDefaultTorneoExportRange,
  getTorneoUfoExport,
  parseTorneoExportRange,
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

describe("torneo export queries", () => {
  beforeEach(() => {
    createSupabaseServerClientMock.mockReset();
    isLaunchSafePublicMatchMock.mockReset();
    isLaunchSafePublicMatchMock.mockImplementation((slug: string) => slug !== "not-launch-safe");
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

  it("filters to launch-safe latest public_product rows, rounds probabilities, and reads public-safe model detail from the RPC", async () => {
    const fakeClient = {
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
                data: [
                  {
                    id: "match-1",
                    external_id: "api-football:fixture:1489385",
                    slug: "world-cup-2026-ghana-vs-panama-2026-06-17",
                    kickoff_at: "2026-06-17T23:00:00Z",
                    stage: "World Cup - Group Stage - 1",
                    status: "scheduled",
                    competition_id: "competition-1",
                    home_team_id: "team-1",
                    away_team_id: "team-2",
                    access_scope: "public",
                  },
                  {
                    id: "match-2",
                    external_id: "api-football:fixture:1489378",
                    slug: "world-cup-2026-iran-vs-new-zealand-2026-06-16",
                    kickoff_at: "2026-06-16T14:00:00Z",
                    stage: "World Cup - Group Stage - 1",
                    status: "finished",
                    competition_id: "competition-1",
                    home_team_id: "team-3",
                    away_team_id: "team-4",
                    access_scope: "public",
                  },
                  {
                    id: "match-3",
                    external_id: "api-football:fixture:9999999",
                    slug: "not-launch-safe",
                    kickoff_at: "2026-06-18T23:00:00Z",
                    stage: "World Cup - Group Stage - 1",
                    status: "scheduled",
                    competition_id: "competition-1",
                    home_team_id: "team-5",
                    away_team_id: "team-6",
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
                  { id: "team-3", name: "Iran" },
                  { id: "team-4", name: "New Zealand" },
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
                data: [
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
                    top_scores_json: [],
                    confidence_score: 50,
                    risk_level: "medium",
                  },
                  {
                    id: "prediction-finished",
                    match_id: "match-2",
                    created_at: "2026-06-16T10:00:00Z",
                    home_win_prob: 0.31,
                    draw_prob: 0.33,
                    away_win_prob: 0.36,
                    expected_home_goals: 1.2,
                    expected_away_goals: 1.1,
                    most_likely_score: "1-1",
                    top_scores_json: [],
                    confidence_score: 74.5,
                    risk_level: "medium",
                  },
                ],
                error: null,
              });
            },
          };
        }

        throw new Error(`Unexpected table ${table}`);
      },
      rpc(fn: string, args: { p_match_id: string }) {
        expect(fn).toBe("get_premium_match_projection");

        if (args.p_match_id === "match-1") {
          return Promise.resolve({
            data: {
              markets: [],
              narratives: [],
              model_detail: {
                expected_goals: {
                  home: 1.6816,
                  away: 0.6126,
                },
                top_scorelines: [
                  { score: "1-0", probability: 13.8 },
                  { score: "2-0", probability: 11.7 },
                  { score: "1-1", probability: 11.3 },
                ],
                both_teams_to_score: {
                  yes_probability: 45.4,
                  no_probability: 54.6,
                },
                total_goals_2_5: {
                  over_probability: 45.6,
                  under_probability: 54.4,
                },
              },
            },
            error: null,
          });
        }

        return Promise.resolve({
          data: null,
          error: null,
        });
      },
    };

    createSupabaseServerClientMock.mockResolvedValue(fakeClient);

    const result = await getTorneoUfoExport({
      range: { from: "2026-06-16", to: "2026-06-22" },
      fromStartIso: "2026-06-16T00:00:00.000Z",
      toEndIso: "2026-06-22T23:59:59.999Z",
      fallbackOrigin: "https://ufopredictor.com",
      excludeFinished: true,
    });

    expect(result.fixtures).toHaveLength(1);
    expect(result.fixtures[0]).toEqual({
      externalId: "api-football:fixture:1489385",
      fixtureId: 1489385,
      slug: "world-cup-2026-ghana-vs-panama-2026-06-17",
      ufoUrl: "https://ufopredictor.com/matches/world-cup-2026-ghana-vs-panama-2026-06-17",
      kickoffAt: "2026-06-17T23:00:00Z",
      stage: "World Cup - Group Stage - 1",
      status: "scheduled",
      homeTeam: "Ghana",
      awayTeam: "Panama",
      prediction: {
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
      },
    });
  });

  it("allows finished fixtures when the admin explicitly requests a custom range", async () => {
    const fakeClient = {
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
                data: [
                  {
                    id: "match-2",
                    external_id: "api-football:fixture:1489378",
                    slug: "world-cup-2026-iran-vs-new-zealand-2026-06-16",
                    kickoff_at: "2026-06-16T14:00:00Z",
                    stage: "World Cup - Group Stage - 1",
                    status: "finished",
                    competition_id: "competition-1",
                    home_team_id: "team-3",
                    away_team_id: "team-4",
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
                  { id: "team-3", name: "Iran" },
                  { id: "team-4", name: "New Zealand" },
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
                data: [
                  {
                    id: "prediction-finished",
                    match_id: "match-2",
                    created_at: "2026-06-16T10:00:00Z",
                    home_win_prob: 0.31,
                    draw_prob: 0.33,
                    away_win_prob: 0.36,
                    expected_home_goals: 1.2,
                    expected_away_goals: 1.1,
                    most_likely_score: "1-1",
                    top_scores_json: [{ score: "1-1", probability: 0.18 }],
                    confidence_score: 74.5,
                    risk_level: "medium",
                  },
                ],
                error: null,
              });
            },
          };
        }

        throw new Error(`Unexpected table ${table}`);
      },
      rpc() {
        return Promise.resolve({
          data: null,
          error: null,
        });
      },
    };

    createSupabaseServerClientMock.mockResolvedValue(fakeClient);

    const result = await getTorneoUfoExport({
      range: { from: "2026-06-16", to: "2026-06-22" },
      fromStartIso: "2026-06-16T00:00:00.000Z",
      toEndIso: "2026-06-22T23:59:59.999Z",
      fallbackOrigin: "https://ufopredictor.com",
      excludeFinished: false,
    });

    expect(result.fixtures).toHaveLength(1);
    expect(result.fixtures[0]?.externalId).toBe("api-football:fixture:1489378");
    expect(result.fixtures[0]?.status).toBe("finished");
  });

  it("keeps optional model-detail fields nullable instead of failing the export", async () => {
    const fakeClient = {
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
                data: [
                  {
                    id: "match-1",
                    external_id: "api-football:fixture:1489385",
                    slug: "world-cup-2026-ghana-vs-panama-2026-06-17",
                    kickoff_at: "2026-06-17T23:00:00Z",
                    stage: null,
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
                data: [
                  {
                    id: "prediction-new",
                    match_id: "match-1",
                    created_at: "2026-06-16T18:00:00Z",
                    home_win_prob: 0.58,
                    draw_prob: 0.24,
                    away_win_prob: 0.18,
                    expected_home_goals: null,
                    expected_away_goals: null,
                    most_likely_score: null,
                    top_scores_json: [{ score: "bad", probability: "oops" }],
                    confidence_score: null,
                    risk_level: null,
                  },
                ],
                error: null,
              });
            },
          };
        }

        throw new Error(`Unexpected table ${table}`);
      },
      rpc() {
        return Promise.resolve({
          data: {
            markets: [],
            narratives: [],
            model_detail: {
              expected_goals: null,
              top_scorelines: [{ score: "", probability: null }],
              both_teams_to_score: {
                yes_probability: null,
                no_probability: 55,
              },
              total_goals_2_5: null,
            },
          },
          error: null,
        });
      },
    };

    createSupabaseServerClientMock.mockResolvedValue(fakeClient);

    const result = await getTorneoUfoExport({
      range: { from: "2026-06-16", to: "2026-06-22" },
      fromStartIso: "2026-06-16T00:00:00.000Z",
      toEndIso: "2026-06-22T23:59:59.999Z",
      fallbackOrigin: "https://ufopredictor.com",
    });

    expect(result.fixtures[0]?.prediction).toEqual({
      homeWinProbability: 0.58,
      drawProbability: 0.24,
      awayWinProbability: 0.18,
      confidenceScore: null,
      riskLevel: null,
      mostLikelyScore: null,
      expectedGoals: null,
      topScorelines: [],
      bothTeamsToScore: null,
      totalGoals25: null,
    });
  });
});
