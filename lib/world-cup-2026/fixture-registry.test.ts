import { describe, expect, it } from "vitest";

import type { ProviderFixture } from "@/lib/football-api/api-football-types";
import { sanitizeProviderSnapshot } from "../prediction-intelligence-v2/task2b-shared";
import { WORLD_CUP_2026_FIXTURES, WORLD_CUP_2026_TEAMS } from "./index";
import {
  getWorldCupFixtures,
  applyWorldCupGroupStageFixtureRegistryPlan,
  planWorldCupFixtureRegistry,
  buildFixtureRegistryApplyCounts,
  buildFixtureRegistrySelection,
  planWorldCupGroupStageFixtureRegistry,
  resolveWorldCupProviderFixtureFromSanitizedSnapshot,
  resolveFixtureRegistryApplyPlan,
  type FixtureRegistryMatchInsert,
  type FixtureRegistryMatchUpdate,
  type WorldCupRegistryCompetitionRow,
  type WorldCupRegistryDatabaseSnapshot,
  type WorldCupRegistryMatchRow,
  type WorldCupRegistrySeasonRow,
  type WorldCupRegistryTeamRow,
} from "./fixture-registry";

const FIXED_NOW = new Date("2026-06-23T12:00:00.000Z");

function expectedProviderRound(matchNumber: number) {
  if (matchNumber <= 24) {
    return "Group Stage - 1";
  }
  if (matchNumber <= 48) {
    return "Group Stage - 2";
  }
  if (matchNumber <= 72) {
    return "Group Stage - 3";
  }

  return "Round of 32";
}

function buildTeams(): WorldCupRegistryTeamRow[] {
  return WORLD_CUP_2026_TEAMS.map((team) => ({
    id: `team-${team.teamKey}`,
    slug: team.teamKey,
    name: team.displayName,
  }));
}

function buildSnapshot(overrides: Partial<WorldCupRegistryDatabaseSnapshot> = {}): WorldCupRegistryDatabaseSnapshot {
  const competition: WorldCupRegistryCompetitionRow = {
    id: "competition-world-cup",
    slug: "world-cup-2026",
    external_id: "api-football:league:1",
    usage_scope: "public_product",
  };
  const season: WorldCupRegistrySeasonRow = {
    id: "season-world-cup-2026",
    competition_id: competition.id,
    year: 2026,
  };

  return {
    competitions: [competition],
    seasons: [season],
    teams: buildTeams(),
    matches: [],
    predictionVersions: [],
    ...overrides,
  };
}

function buildProviderFixture(
  fixtureKey: string,
  overrides: Partial<ProviderFixture> = {},
): ProviderFixture {
  const canonicalFixture = WORLD_CUP_2026_FIXTURES.find((fixture) => fixture.fixtureKey === fixtureKey);
  if (!canonicalFixture) {
    throw new Error(`Missing canonical fixture ${fixtureKey}`);
  }

  return {
    provider: "api-football",
    providerFixtureId:
      overrides.providerFixtureId ??
      canonicalFixture.apiFootballFixtureId ??
      900000 + canonicalFixture.matchNumber,
    kickoffAt: overrides.kickoffAt ?? canonicalFixture.kickoffAt,
    timezone: overrides.timezone ?? "America/New_York",
    status: overrides.status ?? "scheduled",
    statusShort: overrides.statusShort ?? "NS",
    elapsedMinutes: overrides.elapsedMinutes ?? null,
    competition: {
      providerCompetitionId: overrides.competition?.providerCompetitionId ?? 1,
      name: overrides.competition?.name ?? "World Cup",
      country: overrides.competition?.country ?? "World",
      season: overrides.competition?.season ?? 2026,
      round: overrides.competition?.round ?? expectedProviderRound(canonicalFixture.matchNumber),
    },
    homeTeam: {
      providerTeamId: overrides.homeTeam?.providerTeamId ?? canonicalFixture.matchNumber * 10 + 1,
      name:
        overrides.homeTeam?.name ??
        WORLD_CUP_2026_TEAMS.find((team) => team.teamKey === canonicalFixture.homeTeamKey)?.aliases[1] ??
        canonicalFixture.homeTeamKey,
      winner: overrides.homeTeam?.winner ?? null,
    },
    awayTeam: {
      providerTeamId: overrides.awayTeam?.providerTeamId ?? canonicalFixture.matchNumber * 10 + 2,
      name:
        overrides.awayTeam?.name ??
        WORLD_CUP_2026_TEAMS.find((team) => team.teamKey === canonicalFixture.awayTeamKey)?.aliases[1] ??
        canonicalFixture.awayTeamKey,
      winner: overrides.awayTeam?.winner ?? null,
    },
    goals: {
      home: overrides.goals?.home ?? null,
      away: overrides.goals?.away ?? null,
    },
  };
}

function buildMatchRow(fixtureKey: string, overrides: Partial<WorldCupRegistryMatchRow> = {}): WorldCupRegistryMatchRow {
  const canonicalFixture = WORLD_CUP_2026_FIXTURES.find((fixture) => fixture.fixtureKey === fixtureKey);
  if (!canonicalFixture) {
    throw new Error(`Missing canonical fixture ${fixtureKey}`);
  }

  return {
    id: `match-${fixtureKey}`,
    external_id: overrides.external_id ?? null,
    slug: overrides.slug ?? canonicalFixture.matchSlug,
    competition_id: overrides.competition_id ?? "competition-world-cup",
    season_id: overrides.season_id ?? "season-world-cup-2026",
    home_team_id: overrides.home_team_id ?? `team-${canonicalFixture.homeTeamKey}`,
    away_team_id: overrides.away_team_id ?? `team-${canonicalFixture.awayTeamKey}`,
    kickoff_at: overrides.kickoff_at ?? canonicalFixture.kickoffAt,
    stage: overrides.stage ?? expectedProviderRound(canonicalFixture.matchNumber),
    status: overrides.status ?? "scheduled",
    access_scope: overrides.access_scope ?? "admin_only",
    intake_source: overrides.intake_source ?? "manual",
    source_note: overrides.source_note ?? null,
  };
}

describe("world cup fixture registry planner", () => {
  it("includes all 72 canonical fixtures in deterministic order", () => {
    const report = planWorldCupGroupStageFixtureRegistry({
      providerFixtures: [],
      databaseSnapshot: buildSnapshot(),
      now: FIXED_NOW,
    });

    expect(report.rows).toHaveLength(72);
    expect(report.rows[0]?.canonicalFixtureId).toBe("wc2026-match-001");
    const ordering = report.rows.map((row) => `${row.canonicalKickoffUtc}|${row.canonicalFixtureId}`);
    expect(ordering).toEqual([...ordering].sort());
    expect(report.summary.canonicalFixtureTotal).toBe(72);
  });

  it("keeps 88 canonical fixtures with unique round-of-32 identities", () => {
    expect(WORLD_CUP_2026_FIXTURES).toHaveLength(88);

    const knockoutFixtures = WORLD_CUP_2026_FIXTURES.filter((fixture) => fixture.stage === "round_of_32");
    expect(knockoutFixtures).toHaveLength(16);
    expect(new Set(knockoutFixtures.map((fixture) => fixture.fixtureKey)).size).toBe(16);
    expect(new Set(knockoutFixtures.map((fixture) => fixture.matchNumber)).size).toBe(16);
    expect(new Set(knockoutFixtures.map((fixture) => fixture.matchSlug)).size).toBe(16);
    expect(new Set(knockoutFixtures.map((fixture) => fixture.apiFootballFixtureId)).size).toBe(16);
    expect(new Set(knockoutFixtures.map((fixture) => fixture.apiFootballExternalId)).size).toBe(16);
  });

  it("classifies all 16 round-of-32 fixtures as create candidates in a bounded dry-run", () => {
    const canonicalFixtures = getWorldCupFixtures({ stage: "round_of_32" });
    const providerFixtures = canonicalFixtures.map((fixture) => buildProviderFixture(fixture.fixtureKey));

    const report = planWorldCupFixtureRegistry({
      canonicalFixtures,
      providerFixtures,
      databaseSnapshot: buildSnapshot(),
      now: new Date("2026-06-28T12:00:00.000Z"),
    });

    expect(report.rows).toHaveLength(16);
    expect(report.summary.createCandidates).toBe(16);
    expect(report.summary.conflicts).toBe(0);
    expect(report.rows.every((row) => row.persistenceState === "create_candidate")).toBe(true);
  });

  it("treats a simulated post-apply round-of-32 rerun as fully already stored", () => {
    const canonicalFixtures = getWorldCupFixtures({ stage: "round_of_32" });
    const providerFixtures = canonicalFixtures.map((fixture) => buildProviderFixture(fixture.fixtureKey));
    const snapshot = buildSnapshot({
      matches: canonicalFixtures.map((fixture) =>
        buildMatchRow(fixture.fixtureKey, {
          external_id: fixture.apiFootballExternalId,
          intake_source: "api_football",
          stage: "Round of 32",
        }),
      ),
    });

    const report = planWorldCupFixtureRegistry({
      canonicalFixtures,
      providerFixtures,
      databaseSnapshot: snapshot,
      now: new Date("2026-06-28T12:00:00.000Z"),
    });

    expect(report.summary.alreadyStored).toBe(16);
    expect(report.summary.createCandidates).toBe(0);
    expect(report.rows.every((row) => row.persistenceState === "already_stored")).toBe(true);
  });

  it("resolves the verified round-of-32 provider aliases through existing canonical team identity", () => {
    const canonicalFixtureIds = [
      "wc2026-match-078",
      "wc2026-match-080",
      "wc2026-match-081",
      "wc2026-match-086",
    ];
    const aliasFixtures = [
      buildProviderFixture("wc2026-match-078", {
        homeTeam: { providerTeamId: 781, name: "Ivory Coast", winner: null },
      }),
      buildProviderFixture("wc2026-match-080", {
        awayTeam: { providerTeamId: 802, name: "Congo DR", winner: null },
      }),
      buildProviderFixture("wc2026-match-081", {
        awayTeam: { providerTeamId: 812, name: "Bosnia & Herzegovina", winner: null },
      }),
      buildProviderFixture("wc2026-match-086", {
        awayTeam: { providerTeamId: 862, name: "Cape Verde Islands", winner: null },
      }),
    ];

    const report = planWorldCupFixtureRegistry({
      canonicalFixtures: getWorldCupFixtures({ canonicalFixtureIds }),
      providerFixtures: aliasFixtures,
      databaseSnapshot: buildSnapshot(),
      now: new Date("2026-06-28T12:00:00.000Z"),
    });

    expect(report.rows).toHaveLength(4);
    expect(report.rows.every((row) => row.registryLinkState === "linked")).toBe(true);
  });

  it("rejects a round-of-32 fixture when the provider round is unsupported", () => {
    const row = planWorldCupFixtureRegistry({
      canonicalFixtures: getWorldCupFixtures({ canonicalFixtureIds: ["wc2026-match-073"] }),
      providerFixtures: [
        buildProviderFixture("wc2026-match-073", {
          competition: {
            providerCompetitionId: 1,
            name: "World Cup",
            country: "World",
            season: 2026,
            round: "Quarter-finals",
          },
        }),
      ],
      databaseSnapshot: buildSnapshot(),
      now: new Date("2026-06-28T12:00:00.000Z"),
    }).rows[0];

    expect(row?.registryLinkState).toBe("conflict");
    expect(row?.conflictCode).toBe("provider_stage_mismatch");
  });

  it("marks an existing exact provider link as already stored", () => {
    const providerFixture = buildProviderFixture("wc2026-match-001", {
      providerFixtureId: 1489369,
    });
    const snapshot = buildSnapshot({
      matches: [
        buildMatchRow("wc2026-match-001", {
          external_id: "api-football:fixture:1489369",
          intake_source: "api_football",
        }),
      ],
    });

    const row = planWorldCupGroupStageFixtureRegistry({
      providerFixtures: [providerFixture],
      databaseSnapshot: snapshot,
      now: FIXED_NOW,
    }).rows.find((candidate) => candidate.canonicalFixtureId === "wc2026-match-001");

    expect(row).toMatchObject({
      registryLinkState: "linked",
      persistenceState: "already_stored",
      proposedAction: "none",
      internalMatchExists: true,
      externalLinkExists: true,
    });
  });

  it("treats a linked fixture without an internal row as a create candidate", () => {
    const providerFixture = buildProviderFixture("wc2026-match-005");
    const row = planWorldCupGroupStageFixtureRegistry({
      providerFixtures: [providerFixture],
      databaseSnapshot: buildSnapshot(),
      now: FIXED_NOW,
    }).rows.find((candidate) => candidate.canonicalFixtureId === "wc2026-match-005");

    expect(row).toMatchObject({
      registryLinkState: "linked",
      persistenceState: "create_candidate",
      proposedAction: "create_match_with_provider_link",
      internalMatchExists: false,
    });
  });

  it("treats a missing external link on an existing internal row as an update candidate", () => {
    const providerFixture = buildProviderFixture("wc2026-match-005");
    const row = planWorldCupGroupStageFixtureRegistry({
      providerFixtures: [providerFixture],
      databaseSnapshot: buildSnapshot({
        matches: [buildMatchRow("wc2026-match-005")],
      }),
      now: FIXED_NOW,
    }).rows.find((candidate) => candidate.canonicalFixtureId === "wc2026-match-005");

    expect(row).toMatchObject({
      registryLinkState: "linked",
      persistenceState: "update_candidate",
      proposedAction: "update_match_provider_link",
      internalMatchExists: true,
      externalLinkExists: false,
    });
  });

  it("detects duplicate provider ids across canonical fixtures", () => {
    const providerFixtures = [
      buildProviderFixture("wc2026-match-005", { providerFixtureId: 999001 }),
      buildProviderFixture("wc2026-match-006", { providerFixtureId: 999001 }),
    ];

    const report = planWorldCupGroupStageFixtureRegistry({
      providerFixtures,
      databaseSnapshot: buildSnapshot(),
      now: FIXED_NOW,
    });

    const first = report.rows.find((row) => row.canonicalFixtureId === "wc2026-match-005");
    const fifth = report.rows.find((row) => row.canonicalFixtureId === "wc2026-match-006");

    expect(first?.conflictCode).toBe("provider_id_duplicate");
    expect(fifth?.conflictCode).toBe("provider_id_duplicate");
  });

  it.each([
    {
      name: "team mismatch",
      fixture: buildProviderFixture("wc2026-match-001", {
        providerFixtureId: 1489369,
        homeTeam: { providerTeamId: 11, name: "Germany", winner: null },
      }),
      expectedCode: "provider_team_mismatch",
    },
    {
      name: "reversed teams",
      fixture: buildProviderFixture("wc2026-match-001", {
        providerFixtureId: 1489369,
        homeTeam: { providerTeamId: 12, name: "South Africa", winner: null },
        awayTeam: { providerTeamId: 11, name: "Mexico", winner: null },
      }),
      expectedCode: "provider_reversed_teams",
    },
    {
      name: "kickoff mismatch",
      fixture: buildProviderFixture("wc2026-match-001", {
        providerFixtureId: 1489369,
        kickoffAt: "2026-06-11T20:00:00Z",
      }),
      expectedCode: "provider_kickoff_mismatch",
    },
    {
      name: "group/stage mismatch",
      fixture: buildProviderFixture("wc2026-match-001", {
        providerFixtureId: 1489369,
        competition: {
          providerCompetitionId: 1,
          name: "World Cup",
          country: "World",
          season: 2026,
          round: "Round of 32",
        },
      }),
      expectedCode: "provider_group_stage_mismatch",
    },
  ])("reports $name as an explicit conflict", ({ fixture, expectedCode }) => {
    const row = planWorldCupGroupStageFixtureRegistry({
      providerFixtures: [fixture],
      databaseSnapshot: buildSnapshot(),
      now: FIXED_NOW,
    }).rows.find((candidate) => candidate.canonicalFixtureId === "wc2026-match-001");

    expect(row?.registryLinkState).toBe("conflict");
    expect(row?.conflictCode).toBe(expectedCode);
  });

  it("keeps a started fixture linkable but not prediction eligible", () => {
    const row = planWorldCupGroupStageFixtureRegistry({
      providerFixtures: [buildProviderFixture("wc2026-match-041", { status: "live", statusShort: "1H" })],
      databaseSnapshot: buildSnapshot(),
      now: FIXED_NOW,
    }).rows.find((candidate) => candidate.canonicalFixtureId === "wc2026-match-041");

    expect(row).toMatchObject({
      registryLinkState: "linked",
      lifecycleState: "started",
      predictionEligible: "not_prediction_eligible",
      persistenceState: "create_candidate",
    });
  });

  it("keeps a finished fixture linkable but not prediction eligible", () => {
    const row = planWorldCupGroupStageFixtureRegistry({
      providerFixtures: [
        buildProviderFixture("wc2026-match-041", {
          status: "finished",
          statusShort: "FT",
          goals: { home: 2, away: 1 },
        }),
      ],
      databaseSnapshot: buildSnapshot(),
      now: FIXED_NOW,
    }).rows.find((candidate) => candidate.canonicalFixtureId === "wc2026-match-041");

    expect(row).toMatchObject({
      registryLinkState: "linked",
      lifecycleState: "finished",
      predictionEligible: "not_prediction_eligible",
      persistenceState: "create_candidate",
    });
  });

  it.each([
    { status: "postponed", statusShort: "PST", lifecycleState: "postponed" },
    { status: "cancelled", statusShort: "CANC", lifecycleState: "cancelled" },
    { status: "unknown", statusShort: "UNK", lifecycleState: "started" },
  ] as const)("handles $status lifecycle explicitly", ({ status, statusShort, lifecycleState }) => {
    const row = planWorldCupGroupStageFixtureRegistry({
      providerFixtures: [buildProviderFixture("wc2026-match-041", { status, statusShort })],
      databaseSnapshot: buildSnapshot(),
      now: FIXED_NOW,
    }).rows.find((candidate) => candidate.canonicalFixtureId === "wc2026-match-041");

    expect(row?.lifecycleState).toBe(lifecycleState);
    expect(row?.predictionEligible).toBe("not_prediction_eligible");
  });

  it("builds a bounded selection without changing the 72-row report", () => {
    const report = planWorldCupGroupStageFixtureRegistry({
      providerFixtures: [buildProviderFixture("wc2026-match-025"), buildProviderFixture("wc2026-match-026")],
      databaseSnapshot: buildSnapshot(),
      now: FIXED_NOW,
    });
    const selection = buildFixtureRegistrySelection(report, { matchday: 2 });

    expect(report.rows).toHaveLength(72);
    expect(selection?.total).toBe(24);
  });

  it("resolves the same canonical fixture from sanitized provider snapshot evidence without rehydrating full provider rows", () => {
    const canonicalFixture = WORLD_CUP_2026_FIXTURES.find((fixture) => fixture.fixtureKey === "wc2026-match-001");
    if (!canonicalFixture) {
      throw new Error("Missing canonical fixture wc2026-match-001");
    }

    const sanitizedSnapshot = sanitizeProviderSnapshot({
      fixtures: [buildProviderFixture("wc2026-match-001")],
      acquiredAt: "2026-06-23T12:00:00.000Z",
      from: "2026-06-11",
      to: "2026-06-28",
    });

    expect(Object.prototype.hasOwnProperty.call(sanitizedSnapshot.fixtures[0] ?? {}, "provider")).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(sanitizedSnapshot.fixtures[0] ?? {}, "statusShort")).toBe(false);
    expect(sanitizedSnapshot.fixtures[0]?.providerStatusShort).toBe("NS");

    const resolution = resolveWorldCupProviderFixtureFromSanitizedSnapshot({
      canonicalFixture: {
        fixtureKey: canonicalFixture.fixtureKey,
        homeTeamKey: canonicalFixture.homeTeamKey,
        awayTeamKey: canonicalFixture.awayTeamKey,
        kickoffAt: canonicalFixture.kickoffAt,
        apiFootballFixtureId: canonicalFixture.apiFootballFixtureId,
      },
      providerFixtures: sanitizedSnapshot.fixtures,
    });

    expect(resolution).toMatchObject({
      state: "linked",
      evidence: "canonical_verified_provider_id",
      providerFixture: {
        providerFixtureId: canonicalFixture.apiFootballFixtureId,
        providerStatusShort: "NS",
      },
    });
  });
});

describe("world cup fixture registry apply", () => {
  it("requires an exact allowlist for apply mode", () => {
    const report = planWorldCupGroupStageFixtureRegistry({
      providerFixtures: [buildProviderFixture("wc2026-match-005")],
      databaseSnapshot: buildSnapshot(),
      now: FIXED_NOW,
    });

    expect(() =>
      resolveFixtureRegistryApplyPlan(report, {
        apply: true,
      }),
    ).toThrow(/exact allowlist/i);
  });

  it("does not perform writes during dry-run planning", () => {
    const counts = buildFixtureRegistryApplyCounts();
    const report = planWorldCupGroupStageFixtureRegistry({
      providerFixtures: [buildProviderFixture("wc2026-match-005")],
      databaseSnapshot: buildSnapshot(),
      now: FIXED_NOW,
    });

    expect(report.summary.createCandidates).toBeGreaterThan(0);
    expect(counts.created).toBe(0);
    expect(counts.updated).toBe(0);
  });

  it("creates a match on first apply and is idempotent on the second apply", async () => {
    const snapshot = buildSnapshot();
    const providerFixtures = [buildProviderFixture("wc2026-match-005")];
    const inserts: FixtureRegistryMatchInsert[] = [];
    const updates: Array<{ matchId: string; payload: FixtureRegistryMatchUpdate }> = [];

    const adapter = {
      async insertMatch(payload: FixtureRegistryMatchInsert) {
        inserts.push(payload);
        snapshot.matches.push({
          id: `match-${inserts.length}`,
          external_id: payload.external_id,
          slug: payload.slug,
          competition_id: payload.competition_id,
          season_id: payload.season_id,
          home_team_id: payload.home_team_id,
          away_team_id: payload.away_team_id,
          kickoff_at: payload.kickoff_at,
          stage: payload.stage,
          status: payload.status,
          access_scope: payload.access_scope,
          intake_source: payload.intake_source,
          source_note: payload.source_note,
        });
        return { id: `match-${inserts.length}` };
      },
      async updateMatch(matchId: string, payload: FixtureRegistryMatchUpdate) {
        updates.push({ matchId, payload });
        const match = snapshot.matches.find((candidate) => candidate.id === matchId);
        if (!match) {
          throw new Error(`Missing match ${matchId}`);
        }

        match.external_id = payload.external_id;
        match.kickoff_at = payload.kickoff_at;
        match.stage = payload.stage;
        match.status = payload.status;
        match.intake_source = payload.intake_source;
        match.source_note = payload.source_note;
      },
    };

    const initialReport = planWorldCupGroupStageFixtureRegistry({
      providerFixtures,
      databaseSnapshot: snapshot,
      now: FIXED_NOW,
    });
    const applyPlan = resolveFixtureRegistryApplyPlan(initialReport, {
      apply: true,
      allowCanonicalFixtureIds: ["wc2026-match-005"],
    });

    const firstApply = await applyWorldCupGroupStageFixtureRegistryPlan({
      report: initialReport,
      databaseSnapshot: snapshot,
      providerFixtures,
      applyPlan: applyPlan!,
      writeAdapter: adapter,
      now: FIXED_NOW,
    });

    const secondReport = planWorldCupGroupStageFixtureRegistry({
      providerFixtures,
      databaseSnapshot: snapshot,
      now: FIXED_NOW,
    });
    const secondApplyPlan = resolveFixtureRegistryApplyPlan(secondReport, {
      apply: true,
      allowCanonicalFixtureIds: ["wc2026-match-005"],
    });
    const secondApply = await applyWorldCupGroupStageFixtureRegistryPlan({
      report: secondReport,
      databaseSnapshot: snapshot,
      providerFixtures,
      applyPlan: secondApplyPlan!,
      writeAdapter: adapter,
      now: FIXED_NOW,
    });

    expect(firstApply).toMatchObject({
      created: 1,
      updated: 0,
      duplicates: 0,
    });
    expect(secondApply).toMatchObject({
      created: 0,
      updated: 0,
      alreadyStored: 1,
      duplicates: 0,
    });
    expect(inserts).toHaveLength(1);
    expect(updates).toHaveLength(0);
  });

  it("updates an existing exact row without calling any prediction or result code", async () => {
    const snapshot = buildSnapshot({
      matches: [buildMatchRow("wc2026-match-005")],
    });
    const providerFixtures = [buildProviderFixture("wc2026-match-005")];
    const inserts: FixtureRegistryMatchInsert[] = [];
    const updates: Array<{ matchId: string; payload: FixtureRegistryMatchUpdate }> = [];

    const report = planWorldCupGroupStageFixtureRegistry({
      providerFixtures,
      databaseSnapshot: snapshot,
      now: FIXED_NOW,
    });
    const applyPlan = resolveFixtureRegistryApplyPlan(report, {
      apply: true,
      allowCanonicalFixtureIds: ["wc2026-match-005"],
    });

    const counts = await applyWorldCupGroupStageFixtureRegistryPlan({
      report,
      databaseSnapshot: snapshot,
      providerFixtures,
      applyPlan: applyPlan!,
      writeAdapter: {
        async insertMatch(payload) {
          inserts.push(payload);
          return { id: "unused" };
        },
        async updateMatch(matchId, payload) {
          updates.push({ matchId, payload });
        },
      },
      now: FIXED_NOW,
    });

    expect(counts.updated).toBe(1);
    expect(inserts).toHaveLength(0);
    expect(updates).toHaveLength(1);
  });
});
