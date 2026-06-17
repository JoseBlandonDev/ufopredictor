import { beforeEach, describe, expect, it, vi } from "vitest";

import { getRealFixtureEvaluationQueueData } from "./real-fixture-evaluation-queue-queries";

const { createSupabaseServerClientMock } = vi.hoisted(() => ({
  createSupabaseServerClientMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: createSupabaseServerClientMock,
}));

function createQueryBuilder(response: unknown, calls: string[]) {
  return {
    eq(column: string) {
      calls.push(`eq:${column}`);
      return this;
    },
    in(column: string) {
      calls.push(`in:${column}`);
      return this;
    },
    order(column: string) {
      calls.push(`order:${column}`);
      return Promise.resolve(response);
    },
    then(onFulfilled: (value: unknown) => unknown) {
      return Promise.resolve(response).then(onFulfilled);
    },
  };
}

describe("real fixture evaluation queue queries", () => {
  beforeEach(() => {
    createSupabaseServerClientMock.mockReset();
  });

  it("returns verified World Cup rows with internal prediction and missing evaluation", async () => {
    const calls: string[] = [];

    const fakeClient = {
      from(table: string) {
        calls.push(`from:${table}`);

        if (table === "match_results") {
          return {
            select() {
              return createQueryBuilder(
                {
                  data: [
                    {
                      id: "result-1",
                      match_id: "match-1",
                      home_goals: 3,
                      away_goals: 1,
                      verification_status: "verified",
                      reviewed_at: "2026-06-17T05:44:03.116Z",
                    },
                  ],
                  error: null,
                },
                calls,
              );
            },
          };
        }

        if (table === "matches") {
          return {
            select() {
              return createQueryBuilder(
                {
                  data: [
                    {
                      id: "match-1",
                      external_id: "api-football:fixture:1489383",
                      slug: "world-cup-2026-france-vs-senegal-2026-06-16",
                      competition_id: "competition-1",
                      home_team_id: "team-1",
                      away_team_id: "team-2",
                      kickoff_at: "2026-06-16T19:00:00Z",
                      status: "finished",
                      access_scope: "public",
                      intake_source: "api_football",
                    },
                  ],
                  error: null,
                },
                calls,
              );
            },
          };
        }

        if (table === "competitions") {
          return {
            select() {
              return createQueryBuilder(
                {
                  data: [
                    {
                      id: "competition-1",
                      name: "World Cup",
                      slug: "world-cup-2026",
                    },
                  ],
                  error: null,
                },
                calls,
              );
            },
          };
        }

        if (table === "teams") {
          return {
            select() {
              return createQueryBuilder(
                {
                  data: [
                    { id: "team-1", name: "France" },
                    { id: "team-2", name: "Senegal" },
                  ],
                  error: null,
                },
                calls,
              );
            },
          };
        }

        if (table === "prediction_versions") {
          return {
            select() {
              return createQueryBuilder(
                {
                  data: [
                    {
                      id: "internal-prediction-1",
                      match_id: "match-1",
                      run_scope: "internal_lab",
                      prediction_type: "pre_match_24h",
                      created_at: "2026-06-16T17:00:00Z",
                    },
                    {
                      id: "public-prediction-1",
                      match_id: "match-1",
                      run_scope: "public_product",
                      prediction_type: "pre_match_24h",
                      created_at: "2026-06-16T18:00:00Z",
                    },
                  ],
                  error: null,
                },
                calls,
              );
            },
          };
        }

        if (table === "prediction_results") {
          return {
            select() {
              return createQueryBuilder({ data: [], error: null }, calls);
            },
          };
        }

        return {
          select() {
            throw new Error(`unexpected table access: ${table}`);
          },
          insert() {
            throw new Error("writes are not allowed in evaluation queue query helper");
          },
          update() {
            throw new Error("writes are not allowed in evaluation queue query helper");
          },
          delete() {
            throw new Error("writes are not allowed in evaluation queue query helper");
          },
        };
      },
    };

    createSupabaseServerClientMock.mockResolvedValue(fakeClient);

    const result = await getRealFixtureEvaluationQueueData();

    expect(result.rows).toEqual([
      {
        matchId: "match-1",
        externalId: "api-football:fixture:1489383",
        apiFootballFixtureId: "1489383",
        slug: "world-cup-2026-france-vs-senegal-2026-06-16",
        kickoffAt: "2026-06-16T19:00:00Z",
        matchStatus: "finished",
        accessScope: "public",
        competitionName: "World Cup",
        homeTeamName: "France",
        awayTeamName: "Senegal",
        homeGoals: 3,
        awayGoals: 1,
        verificationStatus: "verified",
        reviewedAt: "2026-06-17T05:44:03.116Z",
        internalPredictionId: "internal-prediction-1",
        latestPublicPredictionId: "public-prediction-1",
        evaluationStatus: "pending",
      },
    ]);
    expect(calls).toContain("eq:verification_status");
    expect(calls).toContain("in:run_scope");
  });

  it("filters out rows that already have persisted evaluations or are not World Cup fixtures", async () => {
    const fakeClient = {
      from(table: string) {
        if (table === "match_results") {
          return {
            select() {
              return createQueryBuilder(
                {
                  data: [
                    {
                      id: "result-1",
                      match_id: "match-1",
                      home_goals: 1,
                      away_goals: 0,
                      verification_status: "verified",
                      reviewed_at: "2026-06-17T05:44:03.116Z",
                    },
                  ],
                  error: null,
                },
                [],
              );
            },
          };
        }

        if (table === "matches") {
          return {
            select() {
              return createQueryBuilder(
                {
                  data: [
                    {
                      id: "match-1",
                      external_id: "api-football:fixture:999",
                      slug: "friendly-test",
                      competition_id: "competition-2",
                      home_team_id: "team-1",
                      away_team_id: "team-2",
                      kickoff_at: "2026-06-16T19:00:00Z",
                      status: "finished",
                      access_scope: "public",
                      intake_source: "api_football",
                    },
                  ],
                  error: null,
                },
                [],
              );
            },
          };
        }

        if (table === "competitions") {
          return {
            select() {
              return createQueryBuilder(
                {
                  data: [
                    {
                      id: "competition-2",
                      name: "Friendlies",
                      slug: "friendlies-2026",
                    },
                  ],
                  error: null,
                },
                [],
              );
            },
          };
        }

        if (table === "teams") {
          return {
            select() {
              return createQueryBuilder({ data: [], error: null }, []);
            },
          };
        }

        if (table === "prediction_versions") {
          return {
            select() {
              return createQueryBuilder(
                {
                  data: [
                    {
                      id: "internal-prediction-1",
                      match_id: "match-1",
                      run_scope: "internal_lab",
                      prediction_type: "pre_match_24h",
                      created_at: "2026-06-16T17:00:00Z",
                    },
                  ],
                  error: null,
                },
                [],
              );
            },
          };
        }

        if (table === "prediction_results") {
          return {
            select() {
              return createQueryBuilder(
                {
                  data: [
                    {
                      id: "evaluation-1",
                      prediction_version_id: "internal-prediction-1",
                      validated_at: "2026-06-17T06:00:00Z",
                    },
                  ],
                  error: null,
                },
                [],
              );
            },
          };
        }

        throw new Error(`unexpected table access: ${table}`);
      },
    };

    createSupabaseServerClientMock.mockResolvedValue(fakeClient);

    await expect(getRealFixtureEvaluationQueueData()).resolves.toEqual({ rows: [] });
  });
});
