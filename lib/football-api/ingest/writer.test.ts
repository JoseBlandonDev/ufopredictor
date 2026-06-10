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

const worldCupTarget: TargetCompetition = {
  key: "world-cup",
  provider: "api-football",
  leagueId: 1,
  season: 2026,
  useCase: "core_world_cup",
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

function buildWorldCupFixture(overrides: Partial<ProviderFixture> = {}): ProviderFixture {
  return buildFixture({
    providerFixtureId: 1489369,
    kickoffAt: "2026-06-11T19:00:00Z",
    competition: {
      providerCompetitionId: 1,
      name: "World Cup",
      country: "World",
      season: 2026,
      round: "Group Stage - 1",
    },
    homeTeam: {
      providerTeamId: 16,
      name: "Mexico",
      winner: null,
    },
    awayTeam: {
      providerTeamId: 1531,
      name: "South Africa",
      winner: null,
    },
    ...overrides,
  });
}

function createStatefulWriterClient(state: {
  competitions?: Array<{
    id: string;
    external_id: string | null;
    name: string;
    slug: string;
    country: string | null;
    type: "international" | "league" | "cup";
    usage_scope: "public_product" | "internal_lab";
  }>;
  teams?: Array<{
    id: string;
    external_id: string | null;
    name: string;
    slug: string;
    country: string | null;
  }>;
}) {
  const db = {
    competitions: [...(state.competitions ?? [])],
    seasons: [] as Array<{
      id: string;
      competition_id: string;
      name: string;
      year: number;
      starts_at: string;
      ends_at: string;
    }>,
    teams: [...(state.teams ?? [])],
    matches: [] as Array<{
      id: string;
      external_id: string | null;
      slug: string;
      competition_id: string;
      season_id: string;
      home_team_id: string;
      away_team_id: string;
      venue_id: string | null;
      kickoff_at: string;
      stage: string | null;
      status: string;
      access_scope: string;
      intake_source: string;
      source_note: string | null;
    }>,
    match_results: [] as Array<{
      id: string;
      match_id: string;
      home_goals: number;
      away_goals: number;
      verification_status: string;
      intake_source: string;
      source_note: string | null;
    }>,
    ingest_runs: [] as Array<Record<string, unknown>>,
    ingest_run_items: [] as Array<Record<string, unknown>>,
  };

  const calls = {
    competitionInserts: [] as Array<Record<string, unknown>>,
    competitionUpdates: [] as Array<Record<string, unknown>>,
    teamInserts: [] as Array<Record<string, unknown>>,
    teamUpdates: [] as Array<Record<string, unknown>>,
    matchInserts: [] as Array<Record<string, unknown>>,
    touchedTables: [] as string[],
  };

  let idCounter = 1;
  const nextId = (prefix: string) => `${prefix}-${idCounter++}`;

  const client = {
    from(table: string) {
      calls.touchedTables.push(table);
      const filters: Array<{ op: "eq" | "in"; column: string; value: unknown }> = [];
      let mode: "select" | "insert" | "update" | null = null;
      let insertPayload: unknown = null;
      let updatePayload: Record<string, unknown> | null = null;

      const getRows = () => {
        const tableRows = db[table as keyof typeof db] as Array<Record<string, unknown>>;
        return tableRows.filter((row) =>
          filters.every((filter) => {
            if (filter.op === "eq") {
              return row[filter.column] === filter.value;
            }

            const values = filter.value as unknown[];
            return values.includes(row[filter.column]);
          }),
        );
      };

      const builder = {
        select() {
          mode = mode ?? "select";
          return builder;
        },
        eq(column: string, value: unknown) {
          filters.push({ op: "eq", column, value });
          return builder;
        },
        in(column: string, value: unknown[]) {
          filters.push({ op: "in", column, value });
          return Promise.resolve({
            data: getRows(),
            error: null,
          });
        },
        limit() {
          return Promise.resolve({
            data: getRows().slice(0, 1),
            error: null,
          });
        },
        insert(payload: unknown) {
          mode = "insert";
          insertPayload = payload;
          return builder;
        },
        update(payload: Record<string, unknown>) {
          mode = "update";
          updatePayload = payload;
          return builder;
        },
        single() {
          if (table === "ingest_runs" && mode === "insert") {
            const row = { id: nextId("run"), ...(insertPayload as Record<string, unknown>) };
            db.ingest_runs.push(row);
            return Promise.resolve({ data: { id: row.id }, error: null });
          }

          if (table === "competitions" && mode === "insert") {
            const payload = insertPayload as Record<string, unknown>;
            calls.competitionInserts.push(payload);
            const row = {
              id: nextId("competition"),
              ...payload,
            };
            db.competitions.push(row as (typeof db.competitions)[number]);
            return Promise.resolve({ data: { id: row.id }, error: null });
          }

          if (table === "seasons" && mode === "insert") {
            const payload = insertPayload as Record<string, unknown>;
            const row = { id: nextId("season"), ...payload };
            db.seasons.push(row as (typeof db.seasons)[number]);
            return Promise.resolve({ data: { id: row.id }, error: null });
          }

          if (table === "teams" && mode === "insert") {
            const payload = insertPayload as Record<string, unknown>;
            calls.teamInserts.push(payload);
            const row = { id: nextId("team"), ...payload };
            db.teams.push(row as (typeof db.teams)[number]);
            return Promise.resolve({ data: { id: row.id }, error: null });
          }

          if (table === "matches" && mode === "insert") {
            const payload = insertPayload as Record<string, unknown>;
            calls.matchInserts.push(payload);
            const row = { id: nextId("match"), ...payload };
            db.matches.push(row as (typeof db.matches)[number]);
            return Promise.resolve({ data: { id: row.id }, error: null });
          }

          if (table === "match_results" && mode === "insert") {
            const payload = insertPayload as Record<string, unknown>;
            const row = { id: nextId("result"), ...payload };
            db.match_results.push(row as (typeof db.match_results)[number]);
            return Promise.resolve({ data: { id: row.id }, error: null });
          }

          return Promise.resolve({ data: null, error: null });
        },
        maybeSingle() {
          const rows = getRows();
          return Promise.resolve({
            data: rows[0] ?? null,
            error: null,
          });
        },
        order() {
          return builder;
        },
        then<TResult1 = { data: Record<string, unknown>[]; error: null }, TResult2 = never>(
          onfulfilled?:
            | ((value: { data: Record<string, unknown>[]; error: null }) => TResult1 | PromiseLike<TResult1>)
            | null,
          onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
        ) {
          if (mode === "update") {
            return executeUpdate().then(onfulfilled as never, onrejected as never);
          }

          if (table === "ingest_run_items" && mode === "insert") {
            db.ingest_run_items.push(insertPayload as Record<string, unknown>);
            return Promise.resolve({ error: null }).then(
              onfulfilled as never,
              onrejected as never,
            );
          }

          return Promise.resolve({
            data: getRows(),
            error: null,
          }).then(onfulfilled, onrejected);
        },
      };

      const executeUpdate = () => {
        const rows = getRows();
        if (table === "ingest_runs") {
          rows.forEach((row) => Object.assign(row, updatePayload ?? {}));
          return Promise.resolve({ error: null });
        }

        if (table === "competitions") {
          calls.competitionUpdates.push(updatePayload ?? {});
        }

        if (table === "teams") {
          calls.teamUpdates.push(updatePayload ?? {});
        }

        rows.forEach((row) => {
          for (const [key, value] of Object.entries(updatePayload ?? {})) {
            if (value !== undefined) {
              row[key] = value;
            }
          }
        });

        return Promise.resolve({ error: null });
      };

      return new Proxy(builder, {
        get(target, prop, receiver) {
          if (prop === "eq" && mode === "update") {
            return (...args: [string, unknown]) => {
              target.eq(...args);
              return executeUpdate();
            };
          }

          return Reflect.get(target, prop, receiver);
        },
      });
    },
  };

  return { client, db, calls };
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

describe("writer competition slug reuse", () => {
  beforeEach(() => {
    createSupabaseScriptAdminClientMock.mockReset();
  });

  it("reuses an existing competition row when the slug already exists and external_id is missing", async () => {
    const fake = createStatefulWriterClient({
      competitions: [
        {
          id: "competition-existing",
          external_id: null,
          name: "World Cup",
          slug: "world-cup-2026",
          country: "World",
          type: "international",
          usage_scope: "public_product",
        },
      ],
    });

    createSupabaseScriptAdminClientMock.mockReturnValue(fake.client);

    const report = await executeControlledFixtureWrite({
      target: worldCupTarget,
      fixtures: [
        buildFixture({
          providerFixtureId: 1489369,
          kickoffAt: "2026-06-11T19:00:00Z",
          competition: {
            providerCompetitionId: 1,
            name: "World Cup",
            country: "World",
            season: 2026,
            round: "Group Stage - 1",
          },
          homeTeam: {
            providerTeamId: 16,
            name: "Mexico",
            winner: null,
          },
          awayTeam: {
            providerTeamId: 1531,
            name: "South Africa",
            winner: null,
          },
        }),
      ],
      apply: true,
      fixtureId: 1489369,
      from: "2026-06-11",
      to: "2026-06-11",
      limit: 1,
    });

    expect(fake.calls.competitionInserts).toHaveLength(0);
    expect(fake.calls.competitionUpdates).toHaveLength(1);
    expect(fake.calls.competitionUpdates[0]).toMatchObject({
      external_id: "api-football:league:1",
      name: "World Cup",
      country: "World",
      type: "international",
    });
    expect(report.counts.competitionsUpdated).toBe(1);
    expect(fake.db.matches).toHaveLength(1);
    expect(fake.db.matches[0]).toMatchObject({
      external_id: "api-football:fixture:1489369",
      access_scope: "admin_only",
      intake_source: "api_football",
    });
  });

  it("reuses an existing competition row when the slug already exists with a different external_id", async () => {
    const fake = createStatefulWriterClient({
      competitions: [
        {
          id: "competition-existing",
          external_id: "legacy-world-cup",
          name: "World Cup",
          slug: "world-cup-2026",
          country: "World",
          type: "international",
          usage_scope: "public_product",
        },
      ],
    });

    createSupabaseScriptAdminClientMock.mockReturnValue(fake.client);

    const report = await executeControlledFixtureWrite({
      target: worldCupTarget,
      fixtures: [
        buildFixture({
          providerFixtureId: 1489369,
          kickoffAt: "2026-06-11T19:00:00Z",
          competition: {
            providerCompetitionId: 1,
            name: "World Cup",
            country: "World",
            season: 2026,
            round: "Group Stage - 1",
          },
          homeTeam: {
            providerTeamId: 16,
            name: "Mexico",
            winner: null,
          },
          awayTeam: {
            providerTeamId: 1531,
            name: "South Africa",
            winner: null,
          },
        }),
      ],
      apply: true,
      fixtureId: 1489369,
      from: "2026-06-11",
      to: "2026-06-11",
      limit: 1,
    });

    expect(fake.calls.competitionInserts).toHaveLength(0);
    expect(fake.calls.competitionUpdates).toHaveLength(1);
    expect(fake.calls.competitionUpdates[0]).not.toHaveProperty("external_id");
    expect(fake.db.competitions[0]?.external_id).toBe("legacy-world-cup");
    expect(report.counts.competitionsUpdated).toBe(1);
  });
});

describe("writer team slug reuse", () => {
  beforeEach(() => {
    createSupabaseScriptAdminClientMock.mockReset();
  });

  it("reuses an existing team row when the slug already exists and external_id is missing", async () => {
    const fake = createStatefulWriterClient({
      competitions: [
        {
          id: "competition-existing",
          external_id: "api-football:league:1",
          name: "World Cup",
          slug: "world-cup-2026",
          country: "World",
          type: "international",
          usage_scope: "public_product",
        },
      ],
      teams: [
        {
          id: "team-mexico",
          external_id: null,
          name: "Mexico",
          slug: "mexico",
          country: "Mexico",
        },
      ],
    });

    createSupabaseScriptAdminClientMock.mockReturnValue(fake.client);

    const report = await executeControlledFixtureWrite({
      target: worldCupTarget,
      fixtures: [buildWorldCupFixture()],
      apply: true,
      fixtureId: 1489369,
      from: "2026-06-11",
      to: "2026-06-11",
      limit: 1,
    });

    expect(fake.calls.teamInserts).toHaveLength(1);
    expect(fake.calls.teamInserts[0]).toMatchObject({
      external_id: "api-football:team:1531",
      slug: "south-africa",
    });
    expect(fake.calls.teamUpdates).toHaveLength(1);
    expect(fake.calls.teamUpdates[0]).toMatchObject({
      external_id: "api-football:team:16",
      name: "Mexico",
      country: null,
    });
    expect(fake.db.teams.find((team) => team.id === "team-mexico")).toMatchObject({
      external_id: "api-football:team:16",
      slug: "mexico",
    });
    expect(report.counts.teamsUpdated).toBe(1);
    expect(report.counts.teamsCreated).toBe(1);
  });

  it("reuses an existing team row when the slug already exists with a different external_id", async () => {
    const fake = createStatefulWriterClient({
      competitions: [
        {
          id: "competition-existing",
          external_id: "api-football:league:1",
          name: "World Cup",
          slug: "world-cup-2026",
          country: "World",
          type: "international",
          usage_scope: "public_product",
        },
      ],
      teams: [
        {
          id: "team-mexico",
          external_id: "mock-mexico",
          name: "Mexico",
          slug: "mexico",
          country: "Mexico",
        },
      ],
    });

    createSupabaseScriptAdminClientMock.mockReturnValue(fake.client);

    const report = await executeControlledFixtureWrite({
      target: worldCupTarget,
      fixtures: [buildWorldCupFixture()],
      apply: true,
      fixtureId: 1489369,
      from: "2026-06-11",
      to: "2026-06-11",
      limit: 1,
    });

    expect(fake.calls.teamInserts).toHaveLength(1);
    expect(fake.calls.teamUpdates).toHaveLength(1);
    expect(fake.calls.teamUpdates[0]).toMatchObject({
      external_id: "mock-mexico",
      name: "Mexico",
      country: null,
    });
    expect(fake.db.teams.find((team) => team.id === "team-mexico")).toMatchObject({
      external_id: "mock-mexico",
      slug: "mexico",
    });
    expect(report.counts.teamsUpdated).toBe(1);
    expect(report.counts.teamsCreated).toBe(1);
  });

  it("aliases a reused slug match under the planned API-Football external_id so match writes can reference it", async () => {
    const fake = createStatefulWriterClient({
      competitions: [
        {
          id: "competition-existing",
          external_id: "mock-world-cup-2026",
          name: "World Cup",
          slug: "world-cup-2026",
          country: "World",
          type: "international",
          usage_scope: "public_product",
        },
      ],
      teams: [
        {
          id: "team-mexico",
          external_id: "mock-mexico",
          name: "MÃƒÂ©xico",
          slug: "mexico",
          country: "Mexico",
        },
      ],
    });

    createSupabaseScriptAdminClientMock.mockReturnValue(fake.client);

    const report = await executeControlledFixtureWrite({
      target: worldCupTarget,
      fixtures: [buildWorldCupFixture()],
      apply: true,
      fixtureId: 1489369,
      from: "2026-06-11",
      to: "2026-06-11",
      limit: 1,
    });

    expect(report.counts.matchesCreated).toBe(1);
    expect(fake.db.matches).toHaveLength(1);
    expect(fake.db.matches[0]).toMatchObject({
      external_id: "api-football:fixture:1489369",
      home_team_id: "team-mexico",
      access_scope: "admin_only",
      intake_source: "api_football",
    });
  });

  it("keeps existing friendlies behavior unchanged", async () => {
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

  it("does not introduce any public publication writes while reusing existing team slugs", async () => {
    const fake = createStatefulWriterClient({
      competitions: [
        {
          id: "competition-existing",
          external_id: "mock-world-cup-2026",
          name: "World Cup",
          slug: "world-cup-2026",
          country: "World",
          type: "international",
          usage_scope: "public_product",
        },
      ],
      teams: [
        {
          id: "team-mexico",
          external_id: "mock-mexico",
          name: "Mexico",
          slug: "mexico",
          country: "Mexico",
        },
      ],
    });

    createSupabaseScriptAdminClientMock.mockReturnValue(fake.client);

    await executeControlledFixtureWrite({
      target: worldCupTarget,
      fixtures: [buildWorldCupFixture()],
      apply: true,
      fixtureId: 1489369,
      from: "2026-06-11",
      to: "2026-06-11",
      limit: 1,
    });

    expect(fake.calls.touchedTables).not.toContain("prediction_versions");
    expect(fake.calls.touchedTables).not.toContain("prediction_results");
  });
});
