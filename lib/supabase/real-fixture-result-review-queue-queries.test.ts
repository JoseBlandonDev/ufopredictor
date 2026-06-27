import { beforeEach, describe, expect, it, vi } from "vitest";

import { getRealFixtureResultReviewQueueData } from "./real-fixture-result-review-queue-queries";

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
    lte(column: string) {
      calls.push(`lte:${column}`);
      return this;
    },
    order(column: string) {
      calls.push(`order:${column}`);
      return Promise.resolve(response);
    },
    maybeSingle() {
      return Promise.resolve(response);
    },
    then(onFulfilled: (value: unknown) => unknown) {
      return Promise.resolve(response).then(onFulfilled);
    },
  };
}

describe("real fixture result review queue queries", () => {
  beforeEach(() => {
    createSupabaseServerClientMock.mockReset();
  });

  it("returns pending World Cup rows and manual candidates without reading prediction_results", async () => {
    const calls: string[] = [];
    let matchResultsSelectCount = 0;
    let matchesSelectCount = 0;

    const fakeClient = {
      from(table: string) {
        calls.push(`from:${table}`);

        if (table === "match_results") {
          matchResultsSelectCount += 1;

          return {
            select() {
              if (matchResultsSelectCount === 1) {
                return createQueryBuilder(
                  {
                    data: [
                      {
                        id: "result-1",
                        match_id: "match-1",
                        home_goals: 3,
                        away_goals: 1,
                        verification_status: "pending_review",
                        intake_source: "manual",
                        source_note: "Official FIFA report",
                        recorded_at: "2026-06-17T02:00:00Z",
                      },
                    ],
                    error: null,
                  },
                  calls,
                );
              }

              return createQueryBuilder(
                {
                  data: [
                    {
                      id: "result-1",
                      match_id: "match-1",
                      home_goals: 3,
                      away_goals: 1,
                      verification_status: "pending_review",
                      intake_source: "manual",
                      source_note: "Official FIFA report",
                      recorded_at: "2026-06-17T02:00:00Z",
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
          matchesSelectCount += 1;

          return {
            select() {
              if (matchesSelectCount === 1) {
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
              }

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
                    {
                      id: "match-2",
                      external_id: "api-football:fixture:1489384",
                      slug: "world-cup-2026-japan-vs-cameroon-2026-06-17",
                      competition_id: "competition-1",
                      home_team_id: "team-3",
                      away_team_id: "team-4",
                      kickoff_at: "2026-06-17T19:00:00Z",
                      status: "scheduled",
                      access_scope: "admin_only",
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
                      usage_scope: "public_product",
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
                    { id: "team-3", name: "Japan" },
                    { id: "team-4", name: "Cameroon" },
                  ],
                  error: null,
                },
                calls,
              );
            },
          };
        }

        return {
          select() {
            throw new Error(`unexpected table access: ${table}`);
          },
          insert() {
            throw new Error("writes are not allowed in result review queue query helper");
          },
          update() {
            throw new Error("writes are not allowed in result review queue query helper");
          },
          delete() {
            throw new Error("writes are not allowed in result review queue query helper");
          },
        };
      },
    };

    createSupabaseServerClientMock.mockResolvedValue(fakeClient);

    const result = await getRealFixtureResultReviewQueueData();

    expect(result).toEqual({
      rows: [
        {
          matchId: "match-1",
          matchResultId: "result-1",
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
          verificationStatus: "pending_review",
          resultIntakeSource: "manual",
          sourceNote: "Official FIFA report",
          recordedAt: "2026-06-17T02:00:00Z",
        },
      ],
      manualCandidates: [
        {
          matchId: "match-2",
          externalId: "api-football:fixture:1489384",
          apiFootballFixtureId: "1489384",
          slug: "world-cup-2026-japan-vs-cameroon-2026-06-17",
          kickoffAt: "2026-06-17T19:00:00Z",
          matchStatus: "scheduled",
          accessScope: "admin_only",
          competitionName: "World Cup",
          homeTeamName: "Japan",
          awayTeamName: "Cameroon",
          existingResultState: "no_result",
        },
      ],
    });
    expect(calls).not.toContain("from:prediction_results");
    expect(calls).toContain("eq:verification_status");
    expect(calls).toContain("lte:kickoff_at");
  });

  it("filters pending rows and manual candidates to World Cup competition only", async () => {
    let matchResultsSelectCount = 0;
    let matchesSelectCount = 0;

    const fakeClient = {
      from(table: string) {
        if (table === "match_results") {
          matchResultsSelectCount += 1;

          return {
            select() {
              if (matchResultsSelectCount === 1) {
                return createQueryBuilder(
                  {
                    data: [
                      {
                        id: "result-1",
                        match_id: "match-1",
                        home_goals: 1,
                        away_goals: 1,
                        verification_status: "pending_review",
                        intake_source: "api_football",
                        source_note: "provider",
                        recorded_at: "2026-06-17T02:00:00Z",
                      },
                    ],
                    error: null,
                  },
                  [],
                );
              }

              return createQueryBuilder({ data: [], error: null }, []);
            },
          };
        }

        if (table === "matches") {
          matchesSelectCount += 1;

          return {
            select() {
              if (matchesSelectCount === 1) {
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
              }

              return createQueryBuilder(
                {
                  data: [
                    {
                      id: "match-2",
                      external_id: "api-football:fixture:1000",
                      slug: "friendly-test-2",
                      competition_id: "competition-2",
                      home_team_id: "team-1",
                      away_team_id: "team-2",
                      kickoff_at: "2026-06-17T19:00:00Z",
                      status: "scheduled",
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
                      usage_scope: "public_product",
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
              return createQueryBuilder(
                {
                  data: [
                    { id: "team-1", name: "Team 1" },
                    { id: "team-2", name: "Team 2" },
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

    await expect(getRealFixtureResultReviewQueueData()).resolves.toEqual({
      rows: [],
      manualCandidates: [],
    });
  });
});
