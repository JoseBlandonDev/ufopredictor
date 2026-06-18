import { beforeEach, describe, expect, it, vi } from "vitest";

import { getRealFixturePublishQueueData } from "./real-fixture-publish-queue-queries";

const { createSupabaseServerClientMock } = vi.hoisted(() => ({
  createSupabaseServerClientMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: createSupabaseServerClientMock,
}));

describe("real fixture publish queue queries", () => {
  beforeEach(() => {
    createSupabaseServerClientMock.mockReset();
  });

  it("includes dynamic admin_only scheduled World Cup rows that still need save or publish", async () => {
    const matchFilters: string[] = [];

    const fakeClient = {
      from(table: string) {
        if (table === "model_versions") {
          return {
            select() {
              return {
                eq() {
                  return this;
                },
                order() {
                  return this;
                },
                limit() {
                  return this;
                },
                maybeSingle() {
                  return Promise.resolve({
                    data: { id: "model-1", created_at: "2026-06-16T00:00:00Z" },
                    error: null,
                  });
                },
              };
            },
          };
        }

        if (table === "competitions") {
          return {
            select() {
              return {
                eq() {
                  return this;
                },
                maybeSingle() {
                  return Promise.resolve({
                    data: {
                      id: "competition-1",
                      slug: "world-cup-2026",
                      usage_scope: "public_product",
                    },
                    error: null,
                  });
                },
              };
            },
          };
        }

        if (table === "matches") {
          return {
            select() {
              return {
                eq(column: string) {
                  matchFilters.push(`eq:${column}`);
                  return this;
                },
                gte(column: string) {
                  matchFilters.push(`gte:${column}`);
                  return this;
                },
                lte(column: string) {
                  matchFilters.push(`lte:${column}`);
                  return this;
                },
                order() {
                  return Promise.resolve({
                    data: [
                      {
                        id: "match-usa",
                        external_id: "api-football:fixture:1489391",
                        slug: "world-cup-2026-usa-vs-australia-2026-06-19",
                        competition_id: "competition-1",
                        home_team_id: "team-1",
                        away_team_id: "team-2",
                        kickoff_at: "2026-06-19T19:00:00Z",
                        status: "scheduled",
                        access_scope: "admin_only",
                        intake_source: "api_football",
                      },
                      {
                        id: "match-mock",
                        external_id: "mock-colombia-portugal",
                        slug: "colombia-vs-portugal",
                        competition_id: "competition-1",
                        home_team_id: "team-3",
                        away_team_id: "team-4",
                        kickoff_at: "2026-06-18T20:00:00Z",
                        status: "scheduled",
                        access_scope: "admin_only",
                        intake_source: "api_football",
                      },
                      {
                        id: "match-public-ready",
                        external_id: "api-football:fixture:1489388",
                        slug: "world-cup-2026-mexico-vs-south-korea-2026-06-19",
                        competition_id: "competition-1",
                        home_team_id: "team-5",
                        away_team_id: "team-6",
                        kickoff_at: "2026-06-19T01:00:00Z",
                        status: "scheduled",
                        access_scope: "admin_only",
                        intake_source: "api_football",
                      },
                    ],
                    error: null,
                  });
                },
              };
            },
          };
        }

        if (table === "teams") {
          return {
            select() {
              return {
                in() {
                  return Promise.resolve({
                    data: [
                      { id: "team-1", name: "USA" },
                      { id: "team-2", name: "Australia" },
                      { id: "team-3", name: "Colombia" },
                      { id: "team-4", name: "Portugal" },
                      { id: "team-5", name: "Mexico" },
                      { id: "team-6", name: "South Korea" },
                    ],
                    error: null,
                  });
                },
              };
            },
          };
        }

        if (table === "prediction_versions") {
          return {
            select() {
              return {
                in() {
                  return this;
                },
                eq() {
                  return this;
                },
                order() {
                  return Promise.resolve({
                    data: [
                      {
                        id: "internal-public-ready",
                        match_id: "match-public-ready",
                        created_at: "2026-06-18T00:00:00Z",
                      },
                      {
                        id: "public-public-ready",
                        match_id: "match-public-ready",
                        created_at: "2026-06-18T00:30:00Z",
                      },
                    ],
                    error: null,
                  });
                },
              };
            },
          };
        }

        return {
          select() {
            throw new Error(`unexpected table access: ${table}`);
          },
          insert() {
            throw new Error("writes are not allowed in publish queue query helper");
          },
          update() {
            throw new Error("writes are not allowed in publish queue query helper");
          },
          delete() {
            throw new Error("writes are not allowed in publish queue query helper");
          },
        };
      },
    };

    createSupabaseServerClientMock.mockResolvedValue(fakeClient);

    const result = await getRealFixturePublishQueueData();

    expect(result).toEqual({
      activeModelVersionId: "model-1",
      rows: [
        {
          id: "match-usa",
          externalId: "api-football:fixture:1489391",
          apiFootballFixtureId: "1489391",
          slug: "world-cup-2026-usa-vs-australia-2026-06-19",
          kickoffAt: "2026-06-19T19:00:00Z",
          status: "scheduled",
          accessScope: "admin_only",
          homeTeamName: "USA",
          awayTeamName: "Australia",
          savedPredictionId: null,
          latestPublicPredictionId: null,
        },
      ],
    });

    expect(matchFilters).toContain("eq:access_scope");
    expect(matchFilters).toContain("eq:intake_source");
    expect(matchFilters).toContain("eq:status");
    expect(matchFilters).toContain("gte:kickoff_at");
    expect(matchFilters).toContain("lte:kickoff_at");
  });

  it("returns an empty queue when no bounded admin_only World Cup fixtures match", async () => {
    const fakeClient = {
      from(table: string) {
        if (table === "model_versions") {
          return {
            select() {
              return {
                eq() {
                  return this;
                },
                order() {
                  return this;
                },
                limit() {
                  return this;
                },
                maybeSingle() {
                  return Promise.resolve({ data: null, error: null });
                },
              };
            },
          };
        }

        if (table === "competitions") {
          return {
            select() {
              return {
                eq() {
                  return this;
                },
                maybeSingle() {
                  return Promise.resolve({
                    data: {
                      id: "competition-1",
                      slug: "world-cup-2026",
                      usage_scope: "public_product",
                    },
                    error: null,
                  });
                },
              };
            },
          };
        }

        if (table === "matches") {
          return {
            select() {
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
                order() {
                  return Promise.resolve({ data: [], error: null });
                },
              };
            },
          };
        }

        throw new Error(`unexpected table access: ${table}`);
      },
    };

    createSupabaseServerClientMock.mockResolvedValue(fakeClient);

    await expect(getRealFixturePublishQueueData()).resolves.toEqual({
      activeModelVersionId: null,
      rows: [],
    });
  });
});
