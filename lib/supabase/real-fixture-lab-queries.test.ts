import { beforeEach, describe, expect, it, vi } from "vitest";

import { getAdminRealFixtureLabData, mapRealFixtureLabFixtureView } from "./real-fixture-lab-queries";

const { createSupabaseServerClientMock } = vi.hoisted(() => ({
  createSupabaseServerClientMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: createSupabaseServerClientMock,
}));

const externalId = "api-football:fixture:1540356";

describe("real fixture lab queries", () => {
  beforeEach(() => {
    createSupabaseServerClientMock.mockReset();
  });

  it("maps a real fixture view with competition, teams, result, saved prediction, and saved evaluation", () => {
    const view = mapRealFixtureLabFixtureView({
      match: {
        id: "match-1",
        external_id: externalId,
        slug: "peru-spain",
        competition_id: "competition-1",
        home_team_id: "team-1",
        away_team_id: "team-2",
        kickoff_at: "2026-06-09T02:00:00Z",
        stage: "Friendly",
        status: "finished",
        access_scope: "admin_only",
        intake_source: "api_football",
        source_note: "tracked by ingest",
      },
      competition: {
        id: "competition-1",
        name: "Friendlies",
      },
      homeTeam: {
        id: "team-1",
        name: "Peru",
      },
      awayTeam: {
        id: "team-2",
        name: "Spain",
      },
      result: {
        id: "result-1",
        home_goals: 2,
        away_goals: 0,
        verification_status: "verified",
        intake_source: "api_football",
        source_note: "verified result",
        reviewed_at: "2026-06-10T12:30:00Z",
        reviewed_by: "admin-1",
      },
      savedPrediction: {
        id: "prediction-1",
        modelVersionId: "model-1",
        modelVersionVersion: "v0.1",
        createdAt: "2026-06-08T12:00:00Z",
        predictionType: "pre_match_24h",
        runScope: "internal_lab",
      },
      latestPublicPredictionId: "public-prediction-1",
      latestPublicPredictionCreatedAt: "2026-06-08T13:00:00Z",
      latestPublicPredictionMarketCount: 4,
      hasLatestPublicModelDetail: true,
      savedEvaluation: {
        winnerCorrect: true,
        bttsCorrect: true,
        over25Correct: false,
        exactScoreCorrect: false,
        goalError: 1,
        errorSummary: "Predicted score 1-0; actual score 2-0.",
        validatedAt: "2026-06-10T12:00:00Z",
      },
    });

    expect(view).toMatchObject({
      externalId,
      competitionName: "Friendlies",
      homeTeamName: "Peru",
      awayTeamName: "Spain",
      result: {
        id: "result-1",
        verification_status: "verified",
        intake_source: "api_football",
        reviewed_by: "admin-1",
      },
      savedPrediction: {
        predictionType: "pre_match_24h",
        runScope: "internal_lab",
        modelVersionVersion: "v0.1",
      },
      latestPublicPredictionId: "public-prediction-1",
      latestPublicPredictionCreatedAt: "2026-06-08T13:00:00Z",
      latestPublicPredictionMarketCount: 4,
      hasLatestPublicModelDetail: true,
      savedEvaluation: {
        winnerCorrect: true,
        bttsCorrect: true,
        goalError: 1,
      },
    });
  });

  it("queries admin_only and public api_football fixtures for the summary without performing writes", async () => {
    const eqCalls: Array<[string, unknown]> = [];
    const inCalls: Array<[string, unknown[]]> = [];
    const fromCalls: string[] = [];

    const matchesBuilder = {
      eq(column: string, value: unknown) {
        eqCalls.push([column, value]);
        return matchesBuilder;
      },
      in(column: string, values: unknown[]) {
        inCalls.push([column, values]);
        return matchesBuilder;
      },
      maybeSingle() {
        return Promise.resolve({
          data: null,
          error: null,
        });
      },
      order() {
        return Promise.resolve({
          data: [],
          error: null,
        });
      },
    };

    const fakeClient = {
      from(table: string) {
        fromCalls.push(table);
        return {
          select() {
            return matchesBuilder;
          },
          insert() {
            throw new Error("writes are not allowed in real fixture lab query helper");
          },
          update() {
            throw new Error("writes are not allowed in real fixture lab query helper");
          },
          delete() {
            throw new Error("writes are not allowed in real fixture lab query helper");
          },
        };
      },
    };

    createSupabaseServerClientMock.mockResolvedValue(fakeClient);

    const result = await getAdminRealFixtureLabData();

    expect(result).toEqual({
      status: "ready",
      selectedExternalId: null,
      fixtures: [],
      warnings: [],
    });
    expect(fromCalls).toEqual(["matches"]);
    expect(eqCalls).toEqual([["intake_source", "api_football"]]);
    expect(inCalls).toEqual([["access_scope", ["admin_only", "public"]]]);
  });

  it("keeps exact admin_only lookup restricted when public refresh mode is disabled", async () => {
    const eqCalls: Array<[string, unknown]> = [];
    const inCalls: Array<[string, unknown[]]> = [];

    const matchBuilder = {
      eq(column: string, value: unknown) {
        eqCalls.push([column, value]);
        return matchBuilder;
      },
      in(column: string, values: unknown[]) {
        inCalls.push([column, values]);
        return matchBuilder;
      },
      maybeSingle() {
        return Promise.resolve({
          data: {
            id: "match-1",
            external_id: externalId,
            slug: "peru-spain",
            competition_id: "competition-1",
            home_team_id: "team-1",
            away_team_id: "team-2",
            kickoff_at: "2026-06-09T02:00:00Z",
            stage: "Friendly",
            status: "scheduled",
            access_scope: "admin_only",
            intake_source: "api_football",
            source_note: "tracked by ingest",
          },
          error: null,
        });
      },
      order() {
        return Promise.resolve({
          data: [],
          error: null,
        });
      },
    };

    const fakeClient = {
      from(table: string) {
        if (table === "matches") {
          return {
            select() {
              return matchBuilder;
            },
          };
        }

        const builder = {
          eq() {
            return builder;
          },
          maybeSingle() {
            if (table === "competitions") {
              return Promise.resolve({ data: { id: "competition-1", name: "Friendlies" }, error: null });
            }

            if (table === "teams") {
              return Promise.resolve({ data: { id: "team-1", name: "Peru" }, error: null });
            }

            return Promise.resolve({ data: null, error: null });
          },
          order() {
            return builder;
          },
          limit() {
            return builder;
          },
        };

        return {
          select() {
            return builder;
          },
        };
      },
    };

    createSupabaseServerClientMock.mockResolvedValue(fakeClient);

    const result = await getAdminRealFixtureLabData({
      externalId,
      includePublicExactMatch: false,
    });

    expect(result.status).toBe("ready");
    if (result.status !== "ready") {
      throw new Error("expected ready result");
    }
    expect(result.fixtures).toHaveLength(1);
    expect(result.fixtures[0].accessScope).toBe("admin_only");
    expect(eqCalls).toEqual([
      ["external_id", externalId],
      ["intake_source", "api_football"],
      ["access_scope", "admin_only"],
    ]);
    expect(inCalls).toEqual([]);
  });

  it("can load one exact public api_football fixture only when public refresh mode is enabled", async () => {
    const eqCalls: Array<[string, unknown]> = [];
    const inCalls: Array<[string, unknown[]]> = [];

    const matchBuilder = {
      eq(column: string, value: unknown) {
        eqCalls.push([column, value]);
        return matchBuilder;
      },
      in(column: string, values: unknown[]) {
        inCalls.push([column, values]);
        return matchBuilder;
      },
      maybeSingle() {
        return Promise.resolve({
          data: {
            id: "match-public-1",
            external_id: externalId,
            slug: "mexico-south-africa",
            competition_id: "competition-1",
            home_team_id: "team-1",
            away_team_id: "team-2",
            kickoff_at: "2026-06-11T02:00:00Z",
            stage: "Group stage",
            status: "scheduled",
            access_scope: "public",
            intake_source: "api_football",
            source_note: "public refresh target",
          },
          error: null,
        });
      },
      order() {
        return Promise.resolve({
          data: [],
          error: null,
        });
      },
    };

    const fakeClient = {
      from(table: string) {
        if (table === "matches") {
          return {
            select() {
              return matchBuilder;
            },
          };
        }

        const builder = {
          eq() {
            return builder;
          },
          maybeSingle() {
            if (table === "competitions") {
              return Promise.resolve({ data: { id: "competition-1", name: "World Cup" }, error: null });
            }

            if (table === "teams") {
              return Promise.resolve({ data: { id: "team-1", name: "Mexico" }, error: null });
            }

            return Promise.resolve({ data: null, error: null });
          },
          order() {
            return builder;
          },
          limit() {
            return builder;
          },
        };

        return {
          select() {
            return builder;
          },
        };
      },
    };

    createSupabaseServerClientMock.mockResolvedValue(fakeClient);

    const result = await getAdminRealFixtureLabData({
      externalId,
      includePublicExactMatch: true,
    });

    expect(result.status).toBe("ready");
    if (result.status !== "ready") {
      throw new Error("expected ready result");
    }
    expect(result.fixtures).toHaveLength(1);
    expect(result.fixtures[0]).toMatchObject({
      externalId,
      accessScope: "public",
      intakeSource: "api_football",
    });
    expect(eqCalls).toEqual([
      ["external_id", externalId],
      ["intake_source", "api_football"],
    ]);
    expect(inCalls).toEqual([["access_scope", ["admin_only", "public"]]]);
  });

  it("does not allow exact public lookup when public refresh mode is disabled", async () => {
    const eqCalls: Array<[string, unknown]> = [];
    const inCalls: Array<[string, unknown[]]> = [];

    const matchBuilder = {
      eq(column: string, value: unknown) {
        eqCalls.push([column, value]);
        return matchBuilder;
      },
      in(column: string, values: unknown[]) {
        inCalls.push([column, values]);
        return matchBuilder;
      },
      maybeSingle() {
        return Promise.resolve({
          data: null,
          error: null,
        });
      },
      order() {
        return Promise.resolve({
          data: [],
          error: null,
        });
      },
    };

    const fakeClient = {
      from(table: string) {
        if (table === "matches") {
          return {
            select() {
              return matchBuilder;
            },
          };
        }

        throw new Error(`unexpected table ${table}`);
      },
    };

    createSupabaseServerClientMock.mockResolvedValue(fakeClient);

    const result = await getAdminRealFixtureLabData({
      externalId,
      includePublicExactMatch: false,
    });

    expect(result).toEqual({
      status: "ready",
      selectedExternalId: externalId,
      fixtures: [],
      warnings: [],
    });
    expect(eqCalls).toEqual([
      ["external_id", externalId],
      ["intake_source", "api_football"],
      ["access_scope", "admin_only"],
    ]);
    expect(inCalls).toEqual([]);
  });

  it("returns the base match even when related reads fail", async () => {
    const fakeClient = {
      from(table: string) {
        if (table === "matches") {
          const matchBuilder = {
            eq() {
              return matchBuilder;
            },
            maybeSingle() {
              return Promise.resolve({
                data: {
                  id: "match-1",
                  external_id: externalId,
                  slug: "peru-spain",
                  competition_id: "competition-1",
                  home_team_id: "team-1",
                  away_team_id: "team-2",
                  kickoff_at: "2026-06-09T02:00:00Z",
                  stage: "Friendly",
                  status: "scheduled",
                  access_scope: "admin_only",
                  intake_source: "api_football",
                  source_note: "tracked by ingest",
                },
                error: null,
              });
            },
          };

          return {
            select() {
              return matchBuilder;
            },
          };
        }

        if (
          table === "competitions" ||
          table === "teams" ||
          table === "match_results" ||
          table === "prediction_results" ||
          table === "model_versions" ||
          table === "prediction_markets"
        ) {
          const label =
            table === "competitions"
              ? "competition"
              : table === "teams"
                ? "team"
                : table === "match_results"
                  ? "result"
                  : table === "prediction_results"
                    ? "evaluation"
                    : table === "prediction_markets"
                      ? "public markets"
                      : "model";
          const builder = {
            eq() {
              return builder;
            },
            order() {
              return builder;
            },
            limit() {
              return builder;
            },
            maybeSingle() {
              return Promise.resolve({
                data: null,
                error: { message: `${label} read blocked` },
              });
            },
          };

          return {
            select() {
              return builder;
            },
          };
        }

        if (table === "prediction_versions") {
          const builder = {
            eq() {
              return builder;
            },
            order() {
              return builder;
            },
            limit() {
              return builder;
            },
            maybeSingle() {
              return Promise.resolve({
                data: null,
                error: { message: "prediction read blocked" },
              });
            },
          };

          return {
            select() {
              return builder;
            },
          };
        }

        throw new Error(`unexpected table ${table}`);
      },
    };

    createSupabaseServerClientMock.mockResolvedValue(fakeClient);

    const result = await getAdminRealFixtureLabData({
      externalId,
    });

    expect(result.status).toBe("ready");
    if (result.status !== "ready") {
      throw new Error("expected ready result");
    }
    expect(result.fixtures).toHaveLength(1);
    expect(result.fixtures[0]).toMatchObject({
      externalId,
      competitionName: "Competicion no disponible",
      homeTeamName: "Equipo local no disponible",
      awayTeamName: "Equipo visitante no disponible",
      latestPublicPredictionId: null,
      latestPublicPredictionCreatedAt: null,
      latestPublicPredictionMarketCount: 0,
      hasLatestPublicModelDetail: false,
      result: null,
      savedPrediction: null,
      savedEvaluation: null,
    });
    expect(result.warnings).toEqual([
      expect.stringContaining("model read blocked"),
      expect.stringContaining("competition read blocked"),
      expect.stringContaining("team read blocked"),
      expect.stringContaining("team read blocked"),
      expect.stringContaining("result read blocked"),
      expect.stringContaining("prediction read blocked"),
      expect.stringContaining("prediction read blocked"),
    ]);
  });

  it("reads back a saved evaluation for the saved prediction version", async () => {
    let teamReads = 0;

    const fakeClient = {
      from(table: string) {
        if (table === "matches") {
          const builder = {
            eq() {
              return builder;
            },
            maybeSingle() {
              return Promise.resolve({
                data: {
                  id: "match-1",
                  external_id: externalId,
                  slug: "peru-spain",
                  competition_id: "competition-1",
                  home_team_id: "team-1",
                  away_team_id: "team-2",
                  kickoff_at: "2026-06-09T02:00:00Z",
                  stage: "Friendly",
                  status: "finished",
                  access_scope: "admin_only",
                  intake_source: "api_football",
                  source_note: "tracked by ingest",
                },
                error: null,
              });
            },
          };

          return {
            select() {
              return builder;
            },
          };
        }

        if (table === "competitions") {
          const builder = {
            eq() {
              return builder;
            },
            maybeSingle() {
              return Promise.resolve({
                data: { id: "competition-1", name: "Friendlies" },
                error: null,
              });
            },
          };

          return {
            select() {
              return builder;
            },
          };
        }

        if (table === "teams") {
          const builder = {
            eq() {
              return builder;
            },
            maybeSingle() {
              teamReads += 1;
              return Promise.resolve({
                data: {
                  id: teamReads === 1 ? "team-1" : "team-2",
                  name: teamReads === 1 ? "Peru" : "Spain",
                },
                error: null,
              });
            },
          };

          return {
            select() {
              return builder;
            },
          };
        }

        if (table === "match_results") {
          const builder = {
            eq() {
              return builder;
            },
            maybeSingle() {
              return Promise.resolve({
                data: {
                  id: "result-1",
                  home_goals: 2,
                  away_goals: 0,
                  verification_status: "verified",
                  intake_source: "api_football",
                  source_note: "verified result",
                  reviewed_at: "2026-06-10T12:30:00Z",
                  reviewed_by: "admin-1",
                },
                error: null,
              });
            },
          };

          return {
            select() {
              return builder;
            },
          };
        }

        if (table === "prediction_versions") {
          const builder = {
            eq() {
              return builder;
            },
            order() {
              return builder;
            },
            limit() {
              return builder;
            },
            maybeSingle() {
              return Promise.resolve({
                data: {
                  id: "prediction-1",
                  model_version_id: "model-1",
                  created_at: "2026-06-08T12:00:00Z",
                  prediction_type: "pre_match_24h",
                  run_scope: "internal_lab",
                },
                error: null,
              });
            },
          };

          return {
            select() {
              return builder;
            },
          };
        }

        if (table === "prediction_markets") {
          const builder = {
            eq() {
              return Promise.resolve({
                data: [{ id: "market-1" }, { id: "market-2" }],
                error: null,
              });
            },
          };

          return {
            select() {
              return builder;
            },
          };
        }

        if (table === "model_versions") {
          const builder = {
            eq() {
              return builder;
            },
            order() {
              return builder;
            },
            limit() {
              return builder;
            },
            maybeSingle() {
              return Promise.resolve({
                data: { id: "model-1", version: "v0.1" },
                error: null,
              });
            },
          };

          return {
            select() {
              return builder;
            },
          };
        }

        if (table === "prediction_results") {
          const builder = {
            eq() {
              return builder;
            },
            maybeSingle() {
              return Promise.resolve({
                data: {
                  winner_correct: true,
                  btts_correct: true,
                  over_2_5_correct: false,
                  exact_score_correct: false,
                  goal_error: 1,
                  error_summary: "Predicted score 1-0; actual score 2-0.",
                  validated_at: "2026-06-10T12:00:00Z",
                },
                error: null,
              });
            },
          };

          return {
            select() {
              return builder;
            },
          };
        }

        throw new Error(`unexpected table ${table}`);
      },
    };

    createSupabaseServerClientMock.mockResolvedValue(fakeClient);

    const result = await getAdminRealFixtureLabData({
      externalId,
    });

    expect(result.status).toBe("ready");
    if (result.status !== "ready") {
      throw new Error("expected ready result");
    }
    expect(result.fixtures[0].savedEvaluation).toEqual({
      winnerCorrect: true,
      bttsCorrect: true,
      over25Correct: false,
      exactScoreCorrect: false,
      goalError: 1,
      errorSummary: "Predicted score 1-0; actual score 2-0.",
      validatedAt: "2026-06-10T12:00:00Z",
    });
    expect(result.fixtures[0]).toMatchObject({
      latestPublicPredictionId: "prediction-1",
      latestPublicPredictionCreatedAt: "2026-06-08T12:00:00Z",
      latestPublicPredictionMarketCount: 2,
      hasLatestPublicModelDetail: false,
    });
    expect(result.fixtures[0].result).toMatchObject({
      id: "result-1",
      verification_status: "verified",
      reviewed_at: "2026-06-10T12:30:00Z",
      reviewed_by: "admin-1",
    });
  });

  it("falls back to the premium projection rpc model detail when direct public market reads return zero rows", async () => {
    let teamReads = 0;
    let predictionVersionReads = 0;

    const fakeClient = {
      from(table: string) {
        if (table === "matches") {
          const builder = {
            eq() {
              return builder;
            },
            in() {
              return builder;
            },
            maybeSingle() {
              return Promise.resolve({
                data: {
                  id: "match-public-1",
                  external_id: externalId,
                  slug: "germany-curacao",
                  competition_id: "competition-1",
                  home_team_id: "team-1",
                  away_team_id: "team-2",
                  kickoff_at: "2026-06-14T17:00:00Z",
                  stage: "Group Stage - 1",
                  status: "scheduled",
                  access_scope: "public",
                  intake_source: "api_football",
                  source_note: "public fixture",
                },
                error: null,
              });
            },
          };

          return {
            select() {
              return builder;
            },
          };
        }

        if (table === "competitions") {
          const builder = {
            eq() {
              return builder;
            },
            maybeSingle() {
              return Promise.resolve({
                data: { id: "competition-1", name: "World Cup" },
                error: null,
              });
            },
          };

          return {
            select() {
              return builder;
            },
          };
        }

        if (table === "teams") {
          const builder = {
            eq() {
              return builder;
            },
            maybeSingle() {
              teamReads += 1;
              return Promise.resolve({
                data: {
                  id: teamReads === 1 ? "team-1" : "team-2",
                  name: teamReads === 1 ? "Germany" : "Curacao",
                },
                error: null,
              });
            },
          };

          return {
            select() {
              return builder;
            },
          };
        }

        if (table === "match_results") {
          const builder = {
            eq() {
              return builder;
            },
            maybeSingle() {
              return Promise.resolve({
                data: null,
                error: null,
              });
            },
          };

          return {
            select() {
              return builder;
            },
          };
        }

        if (table === "prediction_versions") {
          const builder = {
            eq() {
              return builder;
            },
            order() {
              return builder;
            },
            limit() {
              return builder;
            },
            maybeSingle() {
              predictionVersionReads += 1;
              if (predictionVersionReads === 1) {
                return Promise.resolve({
                  data: {
                    id: "internal-prediction-1",
                    model_version_id: "model-1",
                    created_at: "2026-06-13T20:00:00Z",
                    prediction_type: "pre_match_24h",
                    run_scope: "internal_lab",
                  },
                  error: null,
                });
              }

              if (predictionVersionReads === 2) {
                return Promise.resolve({
                  data: {
                    id: "active-model-internal-prediction-1",
                  },
                  error: null,
                });
              }

              return Promise.resolve({
                data: {
                  id: "public-prediction-1",
                  created_at: "2026-06-13T23:15:24.49231+00:00",
                },
                error: null,
              });
            },
          };

          return {
            select() {
              return builder;
            },
          };
        }

        if (table === "prediction_markets") {
          const builder = {
            eq() {
              return Promise.resolve({
                data: [],
                error: null,
              });
            },
          };

          return {
            select() {
              return builder;
            },
          };
        }

        if (table === "model_versions") {
          const builder = {
            eq() {
              return builder;
            },
            order() {
              return builder;
            },
            limit() {
              return builder;
            },
            maybeSingle() {
              return Promise.resolve({
                data: { id: "model-1", version: "v0.2" },
                error: null,
              });
            },
          };

          return {
            select() {
              return builder;
            },
          };
        }

        if (table === "prediction_results") {
          const builder = {
            eq() {
              return builder;
            },
            maybeSingle() {
              return Promise.resolve({
                data: null,
                error: null,
              });
            },
          };

          return {
            select() {
              return builder;
            },
          };
        }

        throw new Error(`unexpected table ${table}`);
      },
      rpc(fn: string, args: Record<string, unknown>) {
        expect(fn).toBe("get_premium_match_projection");
        expect(args).toEqual({
          p_match_id: "match-public-1",
        });

        return Promise.resolve({
          data: {
            markets: [],
            model_detail: {
              expected_goals: {
                home: 2.1,
                away: 0.6,
              },
              top_scorelines: [
                { score: "2-0", probability: 18.2 },
                { score: "3-0", probability: 15.1 },
                { score: "2-1", probability: 12.3 },
              ],
              both_teams_to_score: {
                yes_probability: 38.4,
                no_probability: 61.6,
              },
              total_goals_2_5: {
                over_probability: 57.2,
                under_probability: 42.8,
              },
            },
          },
          error: null,
        });
      },
    };

    createSupabaseServerClientMock.mockResolvedValue(fakeClient);

    const result = await getAdminRealFixtureLabData({
      externalId,
      includePublicExactMatch: true,
    });

    expect(result.status).toBe("ready");
    if (result.status !== "ready") {
      throw new Error("expected ready result");
    }
    expect(result.fixtures[0]).toMatchObject({
      accessScope: "public",
      latestPublicPredictionId: "public-prediction-1",
      latestPublicPredictionCreatedAt: "2026-06-13T23:15:24.49231+00:00",
      latestPublicPredictionMarketCount: 0,
      hasLatestPublicModelDetail: true,
    });
  });

  it("reads back pending_review and rejected result states for internal UI", async () => {
    const pendingView = mapRealFixtureLabFixtureView({
      match: {
        id: "match-1",
        external_id: externalId,
        slug: "peru-spain",
        competition_id: "competition-1",
        home_team_id: "team-1",
        away_team_id: "team-2",
        kickoff_at: "2026-06-09T02:00:00Z",
        stage: "Friendly",
        status: "finished",
        access_scope: "admin_only",
        intake_source: "api_football",
        source_note: "tracked by ingest",
      },
      competition: null,
      homeTeam: null,
      awayTeam: null,
      result: {
        id: "result-pending",
        home_goals: 2,
        away_goals: 1,
        verification_status: "pending_review",
        intake_source: "api_football",
        source_note: "api-football final score",
        reviewed_at: null,
        reviewed_by: null,
      },
      latestPublicPredictionId: null,
      latestPublicPredictionCreatedAt: null,
      latestPublicPredictionMarketCount: 0,
      hasLatestPublicModelDetail: false,
      savedPrediction: null,
      savedEvaluation: null,
    });

    const rejectedView = mapRealFixtureLabFixtureView({
      match: {
        id: "match-2",
        external_id: "api-football:fixture:1540999",
        slug: "peru-spain-rematch",
        competition_id: "competition-1",
        home_team_id: "team-1",
        away_team_id: "team-2",
        kickoff_at: "2026-06-10T02:00:00Z",
        stage: "Friendly",
        status: "finished",
        access_scope: "admin_only",
        intake_source: "api_football",
        source_note: "tracked by ingest",
      },
      competition: null,
      homeTeam: null,
      awayTeam: null,
      result: {
        id: "result-rejected",
        home_goals: 0,
        away_goals: 0,
        verification_status: "rejected",
        intake_source: "api_football",
        source_note: "manual rejection",
        reviewed_at: "2026-06-10T18:00:00Z",
        reviewed_by: "admin-2",
      },
      latestPublicPredictionId: null,
      latestPublicPredictionCreatedAt: null,
      latestPublicPredictionMarketCount: 0,
      hasLatestPublicModelDetail: false,
      savedPrediction: null,
      savedEvaluation: null,
    });

    expect(pendingView.result).toMatchObject({
      id: "result-pending",
      verification_status: "pending_review",
      reviewed_at: null,
      reviewed_by: null,
    });
    expect(rejectedView.result).toMatchObject({
      id: "result-rejected",
      verification_status: "rejected",
      reviewed_at: "2026-06-10T18:00:00Z",
      reviewed_by: "admin-2",
    });
  });
});
