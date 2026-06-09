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
        home_goals: 2,
        away_goals: 0,
        verification_status: "verified",
        intake_source: "api_football",
        source_note: "verified result",
      },
      savedPrediction: {
        id: "prediction-1",
        modelVersionId: "model-1",
        modelVersionVersion: "v0.1",
        createdAt: "2026-06-08T12:00:00Z",
        predictionType: "pre_match_24h",
        runScope: "internal_lab",
      },
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
        verification_status: "verified",
        intake_source: "api_football",
      },
      savedPrediction: {
        predictionType: "pre_match_24h",
        runScope: "internal_lab",
        modelVersionVersion: "v0.1",
      },
      savedEvaluation: {
        winnerCorrect: true,
        bttsCorrect: true,
        goalError: 1,
      },
    });
  });

  it("queries only admin_only api_football fixtures and does not perform writes", async () => {
    const eqCalls: Array<[string, unknown]> = [];
    const fromCalls: string[] = [];

    const matchesBuilder = {
      eq(column: string, value: unknown) {
        eqCalls.push([column, value]);
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

    const result = await getAdminRealFixtureLabData({
      externalId,
    });

    expect(result).toEqual({
      status: "ready",
      selectedExternalId: externalId,
      fixtures: [],
      warnings: [],
    });
    expect(fromCalls).toEqual(["matches"]);
    expect(eqCalls).toEqual([
      ["access_scope", "admin_only"],
      ["intake_source", "api_football"],
      ["external_id", externalId],
    ]);
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

        if (table === "competitions" || table === "teams" || table === "match_results" || table === "prediction_results") {
          const label =
            table === "competitions"
              ? "competition"
              : table === "teams"
                ? "team"
                : table === "match_results"
                  ? "result"
                  : "evaluation";
          const builder = {
            eq() {
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
      result: null,
      savedPrediction: null,
      savedEvaluation: null,
    });
    expect(result.warnings).toEqual([
      expect.stringContaining("competition read blocked"),
      expect.stringContaining("team read blocked"),
      expect.stringContaining("team read blocked"),
      expect.stringContaining("result read blocked"),
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
                  home_goals: 2,
                  away_goals: 0,
                  verification_status: "verified",
                  intake_source: "api_football",
                  source_note: "verified result",
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

        if (table === "model_versions") {
          const builder = {
            eq() {
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
  });
});
