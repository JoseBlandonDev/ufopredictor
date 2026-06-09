import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ProviderFixture } from "@/lib/football-api/api-football-types";
import type { TargetCompetition } from "@/lib/football-api/target-competitions";
import {
  buildCountsSummary,
  buildIngestRunHeaderInsertPayload,
  buildIngestRunItemInsertPayload,
  executeControlledFixtureWrite,
} from "./writer";
import { planControlledFixtureWrite } from "./apply";

const { createSupabaseScriptAdminClientMock } = vi.hoisted(() => ({
  createSupabaseScriptAdminClientMock: vi.fn(),
}));

vi.mock("@/lib/supabase/script-admin", () => ({
  createSupabaseScriptAdminClient: createSupabaseScriptAdminClientMock,
}));

const colombiaTarget: TargetCompetition = {
  key: "colombia-primera-a",
  provider: "api-football",
  leagueId: 239,
  season: 2026,
  useCase: "beta_local",
};

const friendliesTarget: TargetCompetition = {
  key: "friendlies",
  provider: "api-football",
  leagueId: 10,
  season: 2026,
  useCase: "beta_pre_world_cup",
};

function buildFixture(overrides: Partial<ProviderFixture> = {}): ProviderFixture {
  return {
    provider: "api-football",
    providerFixtureId: 9001,
    kickoffAt: "2026-06-01T20:00:00Z",
    timezone: "UTC",
    status: "scheduled",
    statusShort: "NS",
    elapsedMinutes: null,
    competition: {
      providerCompetitionId: 239,
      name: "Primera A",
      country: "Colombia",
      season: 2026,
      round: "Apertura - Jornada 1",
    },
    homeTeam: {
      providerTeamId: 1,
      name: "Atletico Nacional",
      winner: null,
    },
    awayTeam: {
      providerTeamId: 2,
      name: "Millonarios",
      winner: null,
    },
    goals: {
      home: null,
      away: null,
    },
    ...overrides,
  };
}

describe("writer tracking payload helpers", () => {
  it("builds ingest run header payload for real apply tracking", () => {
    const plan = planControlledFixtureWrite(
      [buildFixture()],
      colombiaTarget,
      {
        competitionKey: "colombia-primera-a",
        from: "2026-05-25",
        to: "2026-06-10",
        limit: 5,
      },
    );

    const counts = {
      competitionsCreated: 0,
      competitionsUpdated: 0,
      competitionsSkipped: 0,
      seasonsCreated: 0,
      seasonsUpdated: 0,
      seasonsSkipped: 0,
      teamsCreated: 0,
      teamsUpdated: 0,
      teamsSkipped: 0,
      matchesCreated: 0,
      matchesUpdated: 0,
      matchesSkipped: 0,
      matchResultsCreated: 0,
      matchResultsUpdated: 0,
      matchResultsSkipped: 0,
    };

    const payload = buildIngestRunHeaderInsertPayload({
      target: colombiaTarget,
      plan,
      applyConfig: {
        from: "2026-05-25",
        to: "2026-06-10",
        limit: 5,
      },
      counts,
    });

    expect(payload).toMatchObject({
      provider: "api_football",
      competition_key: "colombia-primera-a",
      provider_league_id: 239,
      from_date: "2026-05-25",
      to_date: "2026-06-10",
      limit_value: 5,
      apply_mode: true,
      run_tag: plan.runTag,
      source_note: plan.sourceNote,
      status: "started",
      fetched_fixtures_count: 1,
      planned_fixtures_count: 1,
      execution_context: "local_cli_script",
    });
    expect(payload.counts_summary).toEqual(buildCountsSummary(plan, counts));
  });

  it("builds created item payload without requiring before_snapshot", () => {
    const payload = buildIngestRunItemInsertPayload({
      runId: "run-1",
      entityTable: "teams",
      action: "created",
      entityId: "team-1",
      entityExternalId: "api-football:team:1",
      afterSnapshot: {
        id: "team-1",
        external_id: "api-football:team:1",
        name: "Atletico Nacional",
      },
    });

    expect(payload).toEqual({
      run_id: "run-1",
      entity_table: "teams",
      entity_id: "team-1",
      entity_external_id: "api-football:team:1",
      entity_natural_key: null,
      action: "created",
      before_snapshot: null,
      after_snapshot: {
        id: "team-1",
        external_id: "api-football:team:1",
        name: "Atletico Nacional",
      },
      skip_reason: null,
      error_message: null,
    });
  });

  it("builds updated item payload with before_snapshot", () => {
    const payload = buildIngestRunItemInsertPayload({
      runId: "run-1",
      entityTable: "matches",
      action: "updated",
      entityId: "match-1",
      entityExternalId: "api-football:fixture:9001",
      beforeSnapshot: {
        id: "match-1",
        access_scope: "public",
      },
      afterSnapshot: {
        id: "match-1",
        access_scope: "public",
        status: "finished",
      },
    });

    expect(payload.before_snapshot).toEqual({
      id: "match-1",
      access_scope: "public",
    });
    expect(payload.after_snapshot).toEqual({
      id: "match-1",
      access_scope: "public",
      status: "finished",
    });
  });
});

describe("writer apply guards", () => {
  beforeEach(() => {
    createSupabaseScriptAdminClientMock.mockReset();
  });

  it("does not create a DB client when apply is false", async () => {
    await expect(
      executeControlledFixtureWrite({
        target: colombiaTarget,
        fixtures: [buildFixture()],
        apply: false,
        from: "2026-05-25",
        to: "2026-06-10",
        limit: 5,
      }),
    ).rejects.toThrow(/requires --apply true/i);

    expect(createSupabaseScriptAdminClientMock).not.toHaveBeenCalled();
  });

  it("rejects broad friendlies apply without fixtureId before tracking writes", async () => {
    await expect(
      executeControlledFixtureWrite({
        target: friendliesTarget,
        fixtures: [buildFixture()],
        apply: true,
        from: "2026-06-09",
        to: "2026-06-09",
        limit: 1,
      }),
    ).rejects.toThrow(/friendlies apply requires explicit --fixtureId/i);

    expect(createSupabaseScriptAdminClientMock).not.toHaveBeenCalled();
  });

  it("rejects friendlies apply with limit greater than one before tracking writes", async () => {
    await expect(
      executeControlledFixtureWrite({
        target: friendliesTarget,
        fixtures: [buildFixture()],
        apply: true,
        fixtureId: 1540356,
        from: "2026-06-09",
        to: "2026-06-09",
        limit: 2,
      }),
    ).rejects.toThrow(/friendlies apply requires explicit --fixtureId, --from, --to, and --limit 1/i);

    expect(createSupabaseScriptAdminClientMock).not.toHaveBeenCalled();
  });
});

describe("writer failure-path preservation", () => {
  beforeEach(() => {
    createSupabaseScriptAdminClientMock.mockReset();
  });

  it("preserves the original write error if marking the run as failed also fails", async () => {
    const fakeClient = {
      from(table: string) {
        let mode: "select" | "insert" | "update" | null = null;
        let insertPayload: unknown;

        const builder = {
          select() {
            if (mode === null) {
              mode = "select";
            }
            return builder;
          },
          eq(column: string) {
            if (mode === "select") {
              return builder;
            }

            if (table === "ingest_runs" && mode === "update" && column === "id") {
              return Promise.resolve({
                error: { message: "failed to mark run as failed" },
              });
            }

            return Promise.resolve({
              error: null,
            });
          },
          limit() {
            return Promise.resolve({
              data: [],
              error: null,
            });
          },
          in() {
            return Promise.resolve({
              data: [],
              error: null,
            });
          },
          insert(payload: unknown) {
            mode = "insert";
            insertPayload = payload;
            if (table === "ingest_run_items") {
              return Promise.resolve({
                error: null,
              });
            }

            return builder;
          },
          update() {
            mode = "update";
            return builder;
          },
          single() {
            if (table === "ingest_runs" && mode === "insert") {
              return Promise.resolve({
                data: { id: "run-1" },
                error: null,
              });
            }

            if (table === "competitions" && mode === "insert") {
              return Promise.resolve({
                data: null,
                error: { message: "original competition insert failure" },
              });
            }

            return Promise.resolve({
              data: insertPayload ?? null,
              error: null,
            });
          },
        };

        return builder;
      },
    };

    createSupabaseScriptAdminClientMock.mockReturnValue(fakeClient);

    await expect(
      executeControlledFixtureWrite({
        target: colombiaTarget,
        fixtures: [buildFixture()],
        apply: true,
        from: "2026-05-25",
        to: "2026-06-10",
        limit: 1,
      }),
    ).rejects.toThrow(/original competition insert failure/i);
  });
});
