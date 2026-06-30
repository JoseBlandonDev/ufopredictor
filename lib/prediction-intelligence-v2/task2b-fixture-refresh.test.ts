import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { describe, expect, it, beforeEach, afterEach } from "vitest";

import type { ProviderFixture } from "../football-api/api-football-types";
import { WORLD_CUP_2026_FIXTURES, WORLD_CUP_2026_TEAMS } from "../world-cup-2026";
import {
  applyTask2B1Plan,
  evaluateTask2B1Eligibility,
  runTask2B1FixtureRefresh,
  verifyTask2B1PostState,
  type Task2B1MatchRow,
  type Task2B1StageSnapshot,
} from "./task2b-fixture-refresh";

const repoRoot = process.cwd();
const artifactsRoot = path.join(repoRoot, "artifacts", "prediction-intelligence-v2", "task2b-1", "local-run", "unit-test");
const stageUrl = "https://yfmklapgjrupctgxaako.supabase.co";
let artifactsDir = path.join(artifactsRoot, "initial");

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

function canonicalFixture(fixtureKey: string) {
  const fixture = WORLD_CUP_2026_FIXTURES.find((candidate) => candidate.fixtureKey === fixtureKey);
  if (!fixture) {
    throw new Error(`Missing fixture ${fixtureKey}`);
  }
  return fixture;
}

function teamName(teamKey: string) {
  return WORLD_CUP_2026_TEAMS.find((team) => team.teamKey === teamKey)?.displayName ?? teamKey;
}

function buildProviderFixture(fixtureKey: string, overrides: Partial<ProviderFixture> = {}): ProviderFixture {
  const fixture = canonicalFixture(fixtureKey);
  return {
    provider: "api-football",
    providerFixtureId: overrides.providerFixtureId ?? fixture.apiFootballFixtureId ?? 900000 + fixture.matchNumber,
    kickoffAt: overrides.kickoffAt ?? fixture.kickoffAt,
    timezone: overrides.timezone ?? "UTC",
    status: overrides.status ?? "scheduled",
    statusShort: overrides.statusShort ?? "NS",
    elapsedMinutes: overrides.elapsedMinutes ?? null,
    competition: {
      providerCompetitionId: 1,
      name: "World Cup",
      country: "World",
      season: 2026,
      round: expectedProviderRound(fixture.matchNumber),
      ...overrides.competition,
    },
    homeTeam: {
      providerTeamId: overrides.homeTeam?.providerTeamId ?? fixture.matchNumber * 10 + 1,
      name: overrides.homeTeam?.name ?? teamName(fixture.homeTeamKey),
      winner: overrides.homeTeam?.winner ?? null,
    },
    awayTeam: {
      providerTeamId: overrides.awayTeam?.providerTeamId ?? fixture.matchNumber * 10 + 2,
      name: overrides.awayTeam?.name ?? teamName(fixture.awayTeamKey),
      winner: overrides.awayTeam?.winner ?? null,
    },
    goals: {
      home: overrides.goals?.home ?? null,
      away: overrides.goals?.away ?? null,
    },
  };
}

function buildStageSnapshot(fixtureKey: string, overrides: Partial<Task2B1MatchRow> = {}): Task2B1StageSnapshot {
  const fixture = canonicalFixture(fixtureKey);
  const matchId = `match-${fixture.fixtureKey}`;
  const providerFixtureId = fixture.apiFootballFixtureId ?? 900000 + fixture.matchNumber;
  return {
    competitions: [{ id: "competition-1", slug: "world-cup-2026" }],
    seasons: [{ id: "season-1", competition_id: "competition-1", year: 2026 }],
    teams: [
      { id: `team-${fixture.homeTeamKey}`, slug: fixture.homeTeamKey, name: teamName(fixture.homeTeamKey) },
      { id: `team-${fixture.awayTeamKey}`, slug: fixture.awayTeamKey, name: teamName(fixture.awayTeamKey) },
    ],
    matches: [
      {
        id: matchId,
        external_id: null,
        slug: fixture.matchSlug,
        competition_id: "competition-1",
        season_id: "season-1",
        home_team_id: `team-${fixture.homeTeamKey}`,
        away_team_id: `team-${fixture.awayTeamKey}`,
        kickoff_at: fixture.kickoffAt,
        stage: "group_stage",
        status: "scheduled",
        access_scope: "admin_only",
        intake_source: "manual",
        source_note: null,
        ...overrides,
      },
    ],
    officialScheduleMatches: [
      {
        id: "official-1",
        official_match_number: fixture.matchNumber,
        home_team_key: fixture.homeTeamKey,
        away_team_key: fixture.awayTeamKey,
        scheduled_at_utc: fixture.kickoffAt,
      },
    ],
    officialScheduleMatchLinks: [
      {
        official_schedule_match_id: "official-1",
        match_id: matchId,
        api_football_fixture_id: providerFixtureId,
        link_status: "linked",
      },
    ],
  };
}

function buildMemoryAdapter(snapshot: Task2B1StageSnapshot) {
  return {
    updateCalls: [] as Array<{ matchId: string; payload: { external_id?: string; kickoff_at?: string } }>,
    async readStageSnapshot() {
      return snapshot;
    },
    async rereadMatches(matchIds: string[]) {
      return snapshot.matches.filter((match) => matchIds.includes(match.id));
    },
    async updateMatch(matchId: string, payload: { external_id?: string; kickoff_at?: string }) {
      this.updateCalls.push({ matchId, payload });
      const match = snapshot.matches.find((candidate) => candidate.id === matchId);
      if (!match) {
        throw new Error(`Missing match ${matchId}`);
      }
      if (payload.external_id !== undefined) {
        match.external_id = payload.external_id;
      }
      if (payload.kickoff_at !== undefined) {
        match.kickoff_at = payload.kickoff_at;
      }
    },
  };
}

function writeJson(pathname: string, value: unknown) {
  fs.mkdirSync(path.dirname(pathname), { recursive: true });
  fs.writeFileSync(pathname, JSON.stringify(value, null, 2));
}

describe("task2b fixture refresh", () => {
  beforeEach(() => {
    process.env.PREDICTION_INTELLIGENCE_TARGET = "development";
    delete process.env.PREDICTION_INTELLIGENCE_ALLOW_REMOTE_DEV_WRITE;
    artifactsDir = path.join(artifactsRoot, randomUUID());
    fs.mkdirSync(artifactsDir, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(artifactsDir, { recursive: true, force: true });
  });

  it("honors an explicit bounded provider date selection instead of the legacy group-stage range", async () => {
    const requestedRanges: Array<{ from?: string; to?: string }> = [];

    await runTask2B1FixtureRefresh(
      {
        repoRoot,
        artifactsDir,
        envSupabaseUrl: stageUrl,
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        dryRun: true,
        apply: false,
        verify: false,
        selection: { from: "2026-06-28", to: "2026-07-04" },
      },
      {
        databaseAdapter: buildMemoryAdapter(buildStageSnapshot("wc2026-match-069")),
        providerFetcher: async (params) => {
          requestedRanges.push({ from: params.from, to: params.to });
          return [];
        },
      },
    );

    expect(requestedRanges).toEqual([{ from: "2026-06-28", to: "2026-07-04" }]);
  });

  it("creates a reviewed dry-run with a safe provider-link-only action for an exact not-started fixture", async () => {
    const fixtureKey = "wc2026-match-069";
    const snapshot = buildStageSnapshot(fixtureKey);
    const result = await runTask2B1FixtureRefresh(
      {
        repoRoot,
        artifactsDir,
        envSupabaseUrl: stageUrl,
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        dryRun: true,
        apply: false,
        verify: false,
        selection: { canonicalFixtureIds: [fixtureKey] },
      },
      {
        databaseAdapter: buildMemoryAdapter(snapshot),
        providerFetcher: async () => [buildProviderFixture(fixtureKey)],
      },
    );

    expect(result.plan.summary.providerLinkOnlyCount).toBe(1);
    expect(result.plan.summary.safeActionCount).toBe(1);
    expect(result.plan.rows[0]?.classification).toBe("provider_link_only");
    expect(result.plan.rows[0]?.patch).toEqual({
      external_id: `api-football:fixture:${canonicalFixture(fixtureKey).apiFootballFixtureId ?? 900000 + canonicalFixture(fixtureKey).matchNumber}`,
    });
    expect(evaluateTask2B1Eligibility(result.plan)).toEqual({
      eligible: true,
      reasons: [],
    });
  });

  it("keeps kickoff conflicts excluded and never marks them safe", async () => {
    const fixtureKey = "wc2026-match-069";
    const snapshot = buildStageSnapshot(fixtureKey);
    const result = await runTask2B1FixtureRefresh(
      {
        repoRoot,
        artifactsDir,
        envSupabaseUrl: stageUrl,
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        dryRun: true,
        apply: false,
        verify: false,
        selection: { canonicalFixtureIds: [fixtureKey] },
      },
      {
        databaseAdapter: buildMemoryAdapter(snapshot),
        providerFetcher: async () => [buildProviderFixture(fixtureKey, { kickoffAt: "2026-06-28T00:00:00Z" })],
      },
    );

    expect(result.plan.rows[0]?.classification).toBe("blocked_kickoff_conflict");
    expect(result.plan.safeActions).toHaveLength(0);
    expect(result.plan.rowLevelExclusions[0]?.reason).toContain("kickoff");
  });

  it("classifies provider-only rows without creating fixtures", async () => {
    const fixtureKey = "wc2026-match-069";
    const snapshot = buildStageSnapshot(fixtureKey);
    const providerOnly = buildProviderFixture("wc2026-match-070");
    const result = await runTask2B1FixtureRefresh(
      {
        repoRoot,
        artifactsDir,
        envSupabaseUrl: stageUrl,
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        dryRun: true,
        apply: false,
        verify: false,
        selection: { canonicalFixtureIds: [fixtureKey] },
      },
      {
        databaseAdapter: buildMemoryAdapter(snapshot),
        providerFetcher: async () => [buildProviderFixture(fixtureKey), providerOnly],
      },
    );

    expect(result.plan.providerOnlyRows).toHaveLength(1);
    expect(result.plan.providerOnlyRows[0]?.classification).toBe("provider_only_unknown");
    expect(result.plan.summary.providerOnlyUnknownCount).toBe(1);
  });

  it("reconciles an unlinked stored fixture by exact canonical identity while keeping extra provider rows unknown", async () => {
    const fixtureKey = "wc2026-match-069";
    const snapshot = buildStageSnapshot(fixtureKey);
    snapshot.officialScheduleMatchLinks[0]!.api_football_fixture_id = null;
    const matchingProviderRow = buildProviderFixture(fixtureKey);
    const extraProviderRow = buildProviderFixture("wc2026-match-070");

    const result = await runTask2B1FixtureRefresh(
      {
        repoRoot,
        artifactsDir,
        envSupabaseUrl: stageUrl,
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        dryRun: true,
        apply: false,
        verify: false,
        selection: { canonicalFixtureIds: [fixtureKey] },
      },
      {
        databaseAdapter: buildMemoryAdapter(snapshot),
        providerFetcher: async () => [matchingProviderRow, extraProviderRow],
      },
    );

    expect(result.plan.rows[0]?.apiFootballFixtureId).toBe(matchingProviderRow.providerFixtureId);
    expect(result.plan.rows[0]?.classification).toBe("provider_link_only");
    expect(result.plan.summary.providerOnlyUnknownCount).toBe(1);
    expect(result.plan.providerOnlyRows[0]?.providerFixtureId).toBe(extraProviderRow.providerFixtureId);
  });

  it("creates an external-id-only safe action for an exact unlinked terminal fixture and preserves terminal readiness metadata", async () => {
    const fixtureKey = "wc2026-match-008";
    const snapshot = buildStageSnapshot(fixtureKey);
    snapshot.matches[0]!.external_id = null;
    const result = await runTask2B1FixtureRefresh(
      {
        repoRoot,
        artifactsDir,
        envSupabaseUrl: stageUrl,
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        dryRun: true,
        apply: false,
        verify: false,
        selection: { canonicalFixtureIds: [fixtureKey] },
      },
      {
        databaseAdapter: buildMemoryAdapter(snapshot),
        providerFetcher: async () => [buildProviderFixture(fixtureKey, { status: "finished", statusShort: "FT", goals: { home: 1, away: 1 } })],
      },
    );

    expect(result.plan.rows[0]?.classification).toBe("provider_link_only");
    expect(result.plan.rows[0]?.normalizedProviderStatus).toBe("terminal_ft");
    expect(result.plan.rows[0]?.patch).toEqual({
      external_id: `api-football:fixture:${canonicalFixture(fixtureKey).apiFootballFixtureId ?? 900000 + canonicalFixture(fixtureKey).matchNumber}`,
    });
    expect(result.plan.rows[0]?.patch).not.toHaveProperty("kickoff_at");
    expect(result.plan.safeActions[0]?.patch).toEqual(result.plan.rows[0]?.patch);
    expect(result.plan.safeActions[0]?.patch).not.toHaveProperty("kickoff_at");
  });

  it("keeps an already linked terminal fixture write-free", async () => {
    const fixtureKey = "wc2026-match-008";
    const snapshot = buildStageSnapshot(fixtureKey, {
      external_id: `api-football:fixture:${canonicalFixture(fixtureKey).apiFootballFixtureId ?? 900000 + canonicalFixture(fixtureKey).matchNumber}`,
    });
    const result = await runTask2B1FixtureRefresh(
      {
        repoRoot,
        artifactsDir,
        envSupabaseUrl: stageUrl,
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        dryRun: true,
        apply: false,
        verify: false,
        selection: { canonicalFixtureIds: [fixtureKey] },
      },
      {
        databaseAdapter: buildMemoryAdapter(snapshot),
        providerFetcher: async () => [buildProviderFixture(fixtureKey, { status: "finished", statusShort: "FT", goals: { home: 1, away: 1 } })],
      },
    );

    expect(result.plan.rows[0]?.classification).toBe("terminal_result_ready");
    expect(result.plan.rows[0]?.patch).toBeNull();
    expect(result.plan.safeActions).toHaveLength(0);
  });

  it("creates an external-id-only safe action for an exact unlinked live fixture", async () => {
    const fixtureKey = "wc2026-match-069";
    const snapshot = buildStageSnapshot(fixtureKey);
    const result = await runTask2B1FixtureRefresh(
      {
        repoRoot,
        artifactsDir,
        envSupabaseUrl: stageUrl,
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        dryRun: true,
        apply: false,
        verify: false,
        selection: { canonicalFixtureIds: [fixtureKey] },
      },
      {
        databaseAdapter: buildMemoryAdapter(snapshot),
        providerFetcher: async () => [buildProviderFixture(fixtureKey, { status: "live", statusShort: "1H" })],
      },
    );

    expect(result.plan.rows[0]?.classification).toBe("provider_link_only");
    expect(result.plan.rows[0]?.normalizedProviderStatus).toBe("live_or_in_progress");
    expect(result.plan.rows[0]?.patch).toEqual({
      external_id: `api-football:fixture:${canonicalFixture(fixtureKey).apiFootballFixtureId ?? 900000 + canonicalFixture(fixtureKey).matchNumber}`,
    });
    expect(result.plan.rows[0]?.patch).not.toHaveProperty("kickoff_at");
  });

  it("reports already linked live states without producing a durable mutation", async () => {
    const fixtureKey = "wc2026-match-069";
    const snapshot = buildStageSnapshot(fixtureKey, {
      external_id: `api-football:fixture:${canonicalFixture(fixtureKey).apiFootballFixtureId ?? 900000 + canonicalFixture(fixtureKey).matchNumber}`,
    });
    const result = await runTask2B1FixtureRefresh(
      {
        repoRoot,
        artifactsDir,
        envSupabaseUrl: stageUrl,
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        dryRun: true,
        apply: false,
        verify: false,
        selection: { canonicalFixtureIds: [fixtureKey] },
      },
      {
        databaseAdapter: buildMemoryAdapter(snapshot),
        providerFetcher: async () => [buildProviderFixture(fixtureKey, { status: "live", statusShort: "1H" })],
      },
    );

    expect(result.plan.rows[0]?.classification).toBe("live_state_observed");
    expect(result.plan.safeActions).toHaveLength(0);
  });

  it("rechecks prior state during apply and writes only the reviewed patch", async () => {
    process.env.PREDICTION_INTELLIGENCE_ALLOW_REMOTE_DEV_WRITE = "true";
    const fixtureKey = "wc2026-match-069";
    const snapshot = buildStageSnapshot(fixtureKey);
    const adapter = buildMemoryAdapter(snapshot);
    const dryRun = await runTask2B1FixtureRefresh(
      {
        repoRoot,
        artifactsDir,
        envSupabaseUrl: stageUrl,
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        dryRun: true,
        apply: false,
        verify: false,
        selection: { canonicalFixtureIds: [fixtureKey] },
      },
      {
        databaseAdapter: adapter,
        providerFetcher: async () => [buildProviderFixture(fixtureKey)],
      },
    );

    const applyResult = await applyTask2B1Plan({
      reviewedPlan: dryRun.plan,
      currentPlan: dryRun.plan,
      reviewedStablePlanSha256: dryRun.plan.stablePlanSha256,
      reviewedSnapshotSha256: dryRun.providerSnapshotSha256,
      authorization: {
        mode: "apply",
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        supabaseUrlHost: "yfmklapgjrupctgxaako.supabase.co",
        targetEnvironment: "development",
        productionDenied: true,
        allowRemoteDevWrite: true,
      },
      databaseAdapter: adapter,
      now: "2026-06-20T00:00:00Z",
    });

    expect(applyResult.writesApplied).toBe(1);
    expect(snapshot.matches[0]?.external_id).toBe(
      `api-football:fixture:${canonicalFixture(fixtureKey).apiFootballFixtureId ?? 900000 + canonicalFixture(fixtureKey).matchNumber}`,
    );
    expect(snapshot.matches[0]?.intake_source).toBe("manual");
    expect(adapter.updateCalls).toHaveLength(1);
  });

  it("apply mode rejects an altered but still eligible pre-apply semantic plan with the semantic binding guard", async () => {
    process.env.PREDICTION_INTELLIGENCE_ALLOW_REMOTE_DEV_WRITE = "true";
    const fixtureKey = "wc2026-match-069";
    const snapshot = buildStageSnapshot(fixtureKey);
    const adapter = buildMemoryAdapter(snapshot);
    const reviewedPlanRun = await runTask2B1FixtureRefresh(
      {
        repoRoot,
        artifactsDir,
        envSupabaseUrl: stageUrl,
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        dryRun: true,
        apply: false,
        verify: false,
        selection: { canonicalFixtureIds: [fixtureKey] },
      },
      {
        databaseAdapter: adapter,
        providerFetcher: async () => [buildProviderFixture(fixtureKey)],
      },
    );
    const currentPlanRun = await runTask2B1FixtureRefresh(
      {
        repoRoot,
        artifactsDir,
        envSupabaseUrl: stageUrl,
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        dryRun: true,
        apply: false,
        verify: false,
        selection: { canonicalFixtureIds: [fixtureKey] },
      },
      {
        databaseAdapter: buildMemoryAdapter(
          buildStageSnapshot(fixtureKey, {
            external_id: "api-football:fixture:999999",
          }),
        ),
        providerFetcher: async () => [buildProviderFixture(fixtureKey)],
      },
    );

    expect(evaluateTask2B1Eligibility(currentPlanRun.plan)).toEqual({
      eligible: true,
      reasons: [],
    });

    await expect(
      applyTask2B1Plan({
        reviewedPlan: reviewedPlanRun.plan,
        currentPlan: currentPlanRun.plan,
        reviewedStablePlanSha256: reviewedPlanRun.plan.stablePlanSha256,
        reviewedSnapshotSha256: reviewedPlanRun.providerSnapshotSha256,
        authorization: {
          mode: "apply",
          projectRef: "yfmklapgjrupctgxaako",
          denyProjectRef: "gcpdffkgsdomzyoenalg",
          supabaseUrlHost: "yfmklapgjrupctgxaako.supabase.co",
          targetEnvironment: "development",
          productionDenied: true,
          allowRemoteDevWrite: true,
        },
        databaseAdapter: adapter,
        now: "2026-06-20T00:00:00Z",
      }),
    ).rejects.toThrow("current semantic plan differed");

    expect(adapter.updateCalls).toHaveLength(0);
  });

  it("apply mode rejects an unchanged but ineligible reviewed plan before any write", async () => {
    process.env.PREDICTION_INTELLIGENCE_ALLOW_REMOTE_DEV_WRITE = "true";
    const fixtureKey = "wc2026-match-069";
    const snapshot = buildStageSnapshot(fixtureKey);
    const adapter = buildMemoryAdapter(snapshot);
    const reviewedPlanRun = await runTask2B1FixtureRefresh(
      {
        repoRoot,
        artifactsDir,
        envSupabaseUrl: stageUrl,
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        dryRun: true,
        apply: false,
        verify: false,
        selection: { canonicalFixtureIds: [fixtureKey] },
      },
      {
        databaseAdapter: buildMemoryAdapter(snapshot),
        providerFetcher: async () => [buildProviderFixture(fixtureKey, { kickoffAt: "2026-06-28T00:00:00Z" })],
      },
    );

    expect(evaluateTask2B1Eligibility(reviewedPlanRun.plan).eligible).toBe(false);

    await expect(
      applyTask2B1Plan({
        reviewedPlan: reviewedPlanRun.plan,
        currentPlan: reviewedPlanRun.plan,
        reviewedStablePlanSha256: reviewedPlanRun.plan.stablePlanSha256,
        reviewedSnapshotSha256: reviewedPlanRun.providerSnapshotSha256,
        authorization: {
          mode: "apply",
          projectRef: "yfmklapgjrupctgxaako",
          denyProjectRef: "gcpdffkgsdomzyoenalg",
          supabaseUrlHost: "yfmklapgjrupctgxaako.supabase.co",
          targetEnvironment: "development",
          productionDenied: true,
          allowRemoteDevWrite: true,
        },
        databaseAdapter: adapter,
        now: "2026-06-20T00:00:00Z",
      }),
    ).rejects.toThrow("reviewed plan is ineligible");

    expect(adapter.updateCalls).toHaveLength(0);
  });

  it("apply mode rejects an ineligible current plan safely under the existing ordering before any write", async () => {
    process.env.PREDICTION_INTELLIGENCE_ALLOW_REMOTE_DEV_WRITE = "true";
    const fixtureKey = "wc2026-match-069";
    const snapshot = buildStageSnapshot(fixtureKey);
    const adapter = buildMemoryAdapter(snapshot);
    const reviewedPlanRun = await runTask2B1FixtureRefresh(
      {
        repoRoot,
        artifactsDir,
        envSupabaseUrl: stageUrl,
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        dryRun: true,
        apply: false,
        verify: false,
        selection: { canonicalFixtureIds: [fixtureKey] },
      },
      {
        databaseAdapter: buildMemoryAdapter(snapshot),
        providerFetcher: async () => [buildProviderFixture(fixtureKey)],
      },
    );
    const currentPlanRun = await runTask2B1FixtureRefresh(
      {
        repoRoot,
        artifactsDir,
        envSupabaseUrl: stageUrl,
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        dryRun: true,
        apply: false,
        verify: false,
        selection: { canonicalFixtureIds: [fixtureKey] },
      },
      {
        databaseAdapter: buildMemoryAdapter(buildStageSnapshot(fixtureKey, { kickoff_at: "2026-06-28T03:00:00Z" })),
        providerFetcher: async () => [buildProviderFixture(fixtureKey)],
      },
    );

    expect(evaluateTask2B1Eligibility(currentPlanRun.plan).eligible).toBe(false);

    await expect(
      applyTask2B1Plan({
        reviewedPlan: reviewedPlanRun.plan,
        currentPlan: currentPlanRun.plan,
        reviewedStablePlanSha256: reviewedPlanRun.plan.stablePlanSha256,
        reviewedSnapshotSha256: reviewedPlanRun.providerSnapshotSha256,
        authorization: {
          mode: "apply",
          projectRef: "yfmklapgjrupctgxaako",
          denyProjectRef: "gcpdffkgsdomzyoenalg",
          supabaseUrlHost: "yfmklapgjrupctgxaako.supabase.co",
          targetEnvironment: "development",
          productionDenied: true,
          allowRemoteDevWrite: true,
        },
        databaseAdapter: adapter,
        now: "2026-06-20T00:00:00Z",
      }),
    ).rejects.toThrow("current plan is ineligible");

    expect(adapter.updateCalls).toHaveLength(0);
  });

  it("verify mode accepts a satisfied post-state without requiring semantic equality and writes a bounded summary", async () => {
    const fixtureKey = "wc2026-match-008";
    const reviewedSnapshot = buildStageSnapshot(fixtureKey);
    reviewedSnapshot.matches[0]!.external_id = null;
    const dryRun = await runTask2B1FixtureRefresh(
      {
        repoRoot,
        artifactsDir,
        envSupabaseUrl: stageUrl,
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        dryRun: true,
        apply: false,
        verify: false,
        selection: { canonicalFixtureIds: [fixtureKey] },
      },
      {
        databaseAdapter: buildMemoryAdapter(reviewedSnapshot),
        providerFetcher: async () => [buildProviderFixture(fixtureKey, { status: "finished", statusShort: "FT", goals: { home: 1, away: 1 } })],
      },
    );

    const reviewedPlanPath = path.join(artifactsDir, "reviewed-plan.json");
    const reviewedSnapshotPath = path.join(artifactsDir, "reviewed-snapshot.json");
    writeJson(reviewedPlanPath, dryRun.plan);
    fs.copyFileSync(dryRun.providerSnapshotPath, reviewedSnapshotPath);

    const postApplySnapshot = buildStageSnapshot(fixtureKey, {
      external_id: dryRun.plan.safeActions[0]!.patch.external_id!,
    });
    const verifyRun = await runTask2B1FixtureRefresh(
      {
        repoRoot,
        artifactsDir,
        envSupabaseUrl: stageUrl,
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        dryRun: false,
        apply: false,
        verify: true,
        reviewedPlanPath,
        reviewedStablePlanSha256: dryRun.plan.stablePlanSha256,
        providerSnapshotPath: reviewedSnapshotPath,
        selection: { canonicalFixtureIds: [fixtureKey] },
      },
      {
        databaseAdapter: buildMemoryAdapter(postApplySnapshot),
      },
    );

    expect(verifyRun.verifyResult?.verificationPassed).toBe(true);
    expect(verifyRun.verifyResult?.reviewedActionCount).toBe(1);
    expect(verifyRun.verifyResult?.satisfiedActionCount).toBe(1);
    expect(verifyRun.plan.safeActions).toHaveLength(0);
    const verifyArtifact = JSON.parse(fs.readFileSync(verifyRun.artifactPath, "utf8"));
    expect(verifyArtifact.verificationSummary).toMatchObject({
      reviewedActionCount: 1,
      satisfiedActionCount: 1,
      missingActionCount: 0,
      mismatchedActionCount: 0,
      ambiguousActionCount: 0,
      pendingReviewedActionCount: 0,
      verificationPassed: true,
    });
  });

  it("verify fails when one reviewed external id is missing", async () => {
    const fixtureKey = "wc2026-match-008";
    const reviewedSnapshot = buildStageSnapshot(fixtureKey);
    const dryRun = await runTask2B1FixtureRefresh(
      {
        repoRoot,
        artifactsDir,
        envSupabaseUrl: stageUrl,
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        dryRun: true,
        apply: false,
        verify: false,
        selection: { canonicalFixtureIds: [fixtureKey] },
      },
      {
        databaseAdapter: buildMemoryAdapter(reviewedSnapshot),
        providerFetcher: async () => [buildProviderFixture(fixtureKey, { status: "finished", statusShort: "FT", goals: { home: 1, away: 1 } })],
      },
    );
    const verifyResult = await verifyTask2B1PostState({
      reviewedPlan: dryRun.plan,
      currentPlan: dryRun.plan,
      reviewedStablePlanSha256: dryRun.plan.stablePlanSha256,
      reviewedSnapshotSha256: dryRun.providerSnapshotSha256,
      authorization: {
        mode: "verification",
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        supabaseUrlHost: "yfmklapgjrupctgxaako.supabase.co",
        targetEnvironment: "development",
        productionDenied: true,
        allowRemoteDevWrite: false,
      },
      databaseAdapter: buildMemoryAdapter(buildStageSnapshot(fixtureKey, { external_id: null })),
      stageSnapshot: buildStageSnapshot(fixtureKey, { external_id: null }),
    });
    expect(verifyResult.verificationPassed).toBe(false);
    expect(verifyResult.mismatchedActionCount).toBe(1);
  });

  it("verify fails when one reviewed external id differs", async () => {
    const fixtureKey = "wc2026-match-008";
    const reviewedSnapshot = buildStageSnapshot(fixtureKey);
    const dryRun = await runTask2B1FixtureRefresh(
      {
        repoRoot,
        artifactsDir,
        envSupabaseUrl: stageUrl,
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        dryRun: true,
        apply: false,
        verify: false,
        selection: { canonicalFixtureIds: [fixtureKey] },
      },
      {
        databaseAdapter: buildMemoryAdapter(reviewedSnapshot),
        providerFetcher: async () => [buildProviderFixture(fixtureKey, { status: "finished", statusShort: "FT", goals: { home: 1, away: 1 } })],
      },
    );
    const wrongExternalId = "api-football:fixture:999999";
    const verifyResult = await verifyTask2B1PostState({
      reviewedPlan: dryRun.plan,
      currentPlan: dryRun.plan,
      reviewedStablePlanSha256: dryRun.plan.stablePlanSha256,
      reviewedSnapshotSha256: dryRun.providerSnapshotSha256,
      authorization: {
        mode: "verification",
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        supabaseUrlHost: "yfmklapgjrupctgxaako.supabase.co",
        targetEnvironment: "development",
        productionDenied: true,
        allowRemoteDevWrite: false,
      },
      databaseAdapter: buildMemoryAdapter(buildStageSnapshot(fixtureKey, { external_id: wrongExternalId })),
      stageSnapshot: buildStageSnapshot(fixtureKey, { external_id: wrongExternalId }),
    });
    expect(verifyResult.verificationPassed).toBe(false);
    expect(verifyResult.mismatchedActionCount).toBe(1);
  });

  it("verify fails when a reviewed provider external id has duplicate ownership", async () => {
    const fixtureKey = "wc2026-match-008";
    const reviewedSnapshot = buildStageSnapshot(fixtureKey);
    const dryRun = await runTask2B1FixtureRefresh(
      {
        repoRoot,
        artifactsDir,
        envSupabaseUrl: stageUrl,
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        dryRun: true,
        apply: false,
        verify: false,
        selection: { canonicalFixtureIds: [fixtureKey] },
      },
      {
        databaseAdapter: buildMemoryAdapter(reviewedSnapshot),
        providerFetcher: async () => [buildProviderFixture(fixtureKey, { status: "finished", statusShort: "FT", goals: { home: 1, away: 1 } })],
      },
    );
    const externalId = dryRun.plan.safeActions[0]!.patch.external_id!;
    const duplicateSnapshot = buildStageSnapshot(fixtureKey, { external_id: externalId });
    duplicateSnapshot.matches.push({
      ...duplicateSnapshot.matches[0]!,
      id: "match-duplicate",
      slug: "duplicate-fixture",
    });
    const verifyResult = await verifyTask2B1PostState({
      reviewedPlan: dryRun.plan,
      currentPlan: dryRun.plan,
      reviewedStablePlanSha256: dryRun.plan.stablePlanSha256,
      reviewedSnapshotSha256: dryRun.providerSnapshotSha256,
      authorization: {
        mode: "verification",
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        supabaseUrlHost: "yfmklapgjrupctgxaako.supabase.co",
        targetEnvironment: "development",
        productionDenied: true,
        allowRemoteDevWrite: false,
      },
      databaseAdapter: buildMemoryAdapter(duplicateSnapshot),
      stageSnapshot: duplicateSnapshot,
    });
    expect(verifyResult.verificationPassed).toBe(false);
    expect(verifyResult.ambiguousActionCount).toBe(1);
  });

  it("verify fails if one reviewed action remains pending", async () => {
    const fixtureKey = "wc2026-match-008";
    const reviewedSnapshot = buildStageSnapshot(fixtureKey);
    const dryRun = await runTask2B1FixtureRefresh(
      {
        repoRoot,
        artifactsDir,
        envSupabaseUrl: stageUrl,
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        dryRun: true,
        apply: false,
        verify: false,
        selection: { canonicalFixtureIds: [fixtureKey] },
      },
      {
        databaseAdapter: buildMemoryAdapter(reviewedSnapshot),
        providerFetcher: async () => [buildProviderFixture(fixtureKey, { status: "finished", statusShort: "FT", goals: { home: 1, away: 1 } })],
      },
    );
    const pendingSnapshot = buildStageSnapshot(fixtureKey, {
      external_id: dryRun.plan.safeActions[0]!.patch.external_id!,
    });
    const currentPendingPlan = await runTask2B1FixtureRefresh(
      {
        repoRoot,
        artifactsDir,
        envSupabaseUrl: stageUrl,
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        dryRun: true,
        apply: false,
        verify: false,
        selection: { canonicalFixtureIds: [fixtureKey] },
      },
      {
        databaseAdapter: buildMemoryAdapter(buildStageSnapshot(fixtureKey, { external_id: null })),
        providerFetcher: async () => [buildProviderFixture(fixtureKey, { status: "finished", statusShort: "FT", goals: { home: 1, away: 1 } })],
      },
    );
    const verifyResult = await verifyTask2B1PostState({
      reviewedPlan: dryRun.plan,
      currentPlan: currentPendingPlan.plan,
      reviewedStablePlanSha256: dryRun.plan.stablePlanSha256,
      reviewedSnapshotSha256: dryRun.providerSnapshotSha256,
      authorization: {
        mode: "verification",
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        supabaseUrlHost: "yfmklapgjrupctgxaako.supabase.co",
        targetEnvironment: "development",
        productionDenied: true,
        allowRemoteDevWrite: false,
      },
      databaseAdapter: buildMemoryAdapter(pendingSnapshot),
      stageSnapshot: pendingSnapshot,
    });
    expect(verifyResult.verificationPassed).toBe(false);
    expect(verifyResult.pendingReviewedActionCount).toBe(1);
  });

  it("apply artifact includes its bounded execution summary for future runs", async () => {
    process.env.PREDICTION_INTELLIGENCE_ALLOW_REMOTE_DEV_WRITE = "true";
    const fixtureKey = "wc2026-match-069";
    const snapshot = buildStageSnapshot(fixtureKey);
    const adapter = buildMemoryAdapter(snapshot);
    const dryRun = await runTask2B1FixtureRefresh(
      {
        repoRoot,
        artifactsDir,
        envSupabaseUrl: stageUrl,
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        dryRun: true,
        apply: false,
        verify: false,
        selection: { canonicalFixtureIds: [fixtureKey] },
      },
      {
        databaseAdapter: adapter,
        providerFetcher: async () => [buildProviderFixture(fixtureKey)],
      },
    );
    const reviewedPlanPath = path.join(artifactsDir, "apply-reviewed-plan.json");
    const reviewedSnapshotPath = path.join(artifactsDir, "apply-reviewed-snapshot.json");
    writeJson(reviewedPlanPath, dryRun.plan);
    fs.copyFileSync(dryRun.providerSnapshotPath, reviewedSnapshotPath);

    const applyRun = await runTask2B1FixtureRefresh(
      {
        repoRoot,
        artifactsDir,
        envSupabaseUrl: stageUrl,
        projectRef: "yfmklapgjrupctgxaako",
        denyProjectRef: "gcpdffkgsdomzyoenalg",
        dryRun: false,
        apply: true,
        verify: false,
        reviewedPlanPath,
        reviewedStablePlanSha256: dryRun.plan.stablePlanSha256,
        providerSnapshotPath: reviewedSnapshotPath,
        selection: { canonicalFixtureIds: [fixtureKey] },
      },
      {
        databaseAdapter: adapter,
      },
    );

    const applyArtifact = JSON.parse(fs.readFileSync(applyRun.artifactPath, "utf8"));
    expect(applyArtifact.applySummary).toMatchObject({
      attemptedActionCount: 1,
      completedActionCount: 1,
      failedActionKey: null,
      ambiguousActionKey: null,
    });
    expect(applyArtifact.applySummary.completedActionKeys).toHaveLength(1);
  });
});
