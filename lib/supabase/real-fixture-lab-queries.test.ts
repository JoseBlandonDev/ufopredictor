import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getAdminRealFixtureLabData,
  mapRealFixtureLabFixtureView,
} from "./real-fixture-lab-queries";

const { createSupabaseServerClientMock } = vi.hoisted(() => ({
  createSupabaseServerClientMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: createSupabaseServerClientMock,
}));

describe("real fixture lab queries", () => {
  beforeEach(() => {
    createSupabaseServerClientMock.mockReset();
  });

  it("maps a real fixture view with competition, teams, and result", () => {
    const view = mapRealFixtureLabFixtureView({
      match: {
        id: "match-1",
        external_id: "api-football:fixture:1546413",
        slug: "colombia-final",
        competition_id: "competition-1",
        home_team_id: "team-1",
        away_team_id: "team-2",
        kickoff_at: "2026-06-08T22:00:00Z",
        stage: "Final",
        status: "scheduled",
        access_scope: "admin_only",
        intake_source: "api_football",
        source_note: "tracked by ingest",
      },
      competition: {
        id: "competition-1",
        name: "Primera A",
      },
      homeTeam: {
        id: "team-1",
        name: "Atletico Nacional",
      },
      awayTeam: {
        id: "team-2",
        name: "Junior",
      },
      result: {
        home_goals: 2,
        away_goals: 1,
        verification_status: "pending_review",
        intake_source: "api_football",
        source_note: "provider score",
      },
    });

    expect(view).toMatchObject({
      id: "match-1",
      externalId: "api-football:fixture:1546413",
      slug: "colombia-final",
      competitionName: "Primera A",
      homeTeamName: "Atletico Nacional",
      awayTeamName: "Junior",
      accessScope: "admin_only",
      intakeSource: "api_football",
      result: {
        verification_status: "pending_review",
        intake_source: "api_football",
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
      externalId: "api-football:fixture:1546413",
    });

    expect(result).toEqual({
      status: "ready",
      selectedExternalId: "api-football:fixture:1546413",
      fixtures: [],
    });
    expect(fromCalls).toEqual(["matches"]);
    expect(eqCalls).toEqual([
      ["access_scope", "admin_only"],
      ["intake_source", "api_football"],
      ["external_id", "api-football:fixture:1546413"],
    ]);
  });
});
