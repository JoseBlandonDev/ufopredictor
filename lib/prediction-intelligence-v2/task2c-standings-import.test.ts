import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import type { ProviderStandingsResult } from "../football-api/api-football-types";
import {
  TASK2C3_PACKAGE_VERSION,
  applyTask2C3StandingsPlanToLocalState,
  assertTask2C3LocalRunPreflight,
  buildTask2C3KnockoutEvidenceReport,
  buildDefaultTask2C3ArtifactsDir,
  buildTask2C3StandingsPackage,
  loadTask2C3ProviderStandingsFromRawCapture,
  planTask2C3StandingsImport,
} from "./task2c-standings-import";
import { WORLD_CUP_2026_TEAMS } from "../world-cup-2026/canonical-teams";

const cleanupPaths = new Set<string>();

function registerCleanup(targetPath: string) {
  cleanupPaths.add(targetPath);
  return targetPath;
}

afterEach(() => {
  for (const targetPath of cleanupPaths) {
    fs.rmSync(targetPath, { recursive: true, force: true });
  }
  cleanupPaths.clear();
});

function createTempDir(label: string) {
  return registerCleanup(path.join(os.tmpdir(), `${label}-${Date.now()}-${Math.random().toString(16).slice(2)}`));
}

function buildProviderStandings(): ProviderStandingsResult {
  const groups = new Map<string, Array<(typeof WORLD_CUP_2026_TEAMS)[number]>>();
  for (const team of WORLD_CUP_2026_TEAMS) {
    const existing = groups.get(team.groupKey) ?? [];
    existing.push(team);
    groups.set(team.groupKey, existing);
  }

  return {
    league: {
      providerLeagueId: 1,
      name: "World Cup 2026",
      country: "World",
      season: 2026,
    },
    diagnostics: {
      endpoint: "/standings",
      query: {
        league: "1",
        season: "2026",
      },
      results: 1,
      errors: [],
      paging: {
        current: 1,
        total: 1,
      },
    },
    rawPayload: { ok: true },
    httpStatus: 200,
    groups: [...groups.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([groupKey, teams]) => ({
        groupLabel: `Group ${groupKey.slice(-1).toUpperCase()}`,
        rows: [...teams].map((team, index) => ({
          rank: index + 1,
          team: {
            providerTeamId: index + 1 + groupKey.charCodeAt(groupKey.length - 1) * 10,
            name: team.displayName,
            logo: null,
          },
          points: [7, 4, 3, 0][index] ?? 0,
          goalsDiff: [4, 1, -2, -3][index] ?? 0,
          group: `Group ${groupKey.slice(-1).toUpperCase()}`,
          form: "WWW",
          status: "same",
          description: index < 2 ? "Round of 32" : null,
          all: {
            played: 3,
            win: [2, 1, 1, 0][index] ?? 0,
            draw: [1, 1, 0, 0][index] ?? 0,
            lose: [0, 1, 2, 3][index] ?? 0,
            goals: {
              for: [5, 3, 2, 1][index] ?? 0,
              against: [1, 2, 4, 4][index] ?? 0,
            },
          },
          home: {
            played: 0,
            win: 0,
            draw: 0,
            lose: 0,
            goals: {
              for: 0,
              against: 0,
            },
          },
          away: {
            played: 0,
            win: 0,
            draw: 0,
            lose: 0,
            goals: {
              for: 0,
              against: 0,
            },
          },
          update: "2026-06-30T00:00:00+00:00",
        })),
      })),
  };
}

function buildState() {
  return {
    competitionId: "competition-1",
    seasonId: "season-2026",
    standingsTablePresent: true,
    standingsTablePresenceError: null,
    sourceSnapshots: [],
    teamTournamentStandingSnapshots: [],
  };
}

function buildAcquisition() {
  return {
    capturedAtUtc: "2026-06-30T08:06:52.789Z",
    cutoffAtUtc: "2026-06-30T08:06:52.789Z",
    capturedAtSource: "artifact_run_dir_timestamp" as const,
    cutoffAtSource: "acquisition_based" as const,
    effectivePrecision: "date" as const,
  };
}

describe("task2c.3 standings import", () => {
  it("builds a deterministic standings package and rerun plan", () => {
    const repoRoot = process.cwd();
    const artifactsDir = createTempDir("task2c3");
    const rawProviderPath = path.join(artifactsDir, "api-football-standings-raw.json");
    const provider = buildProviderStandings();

    const first = buildTask2C3StandingsPackage({
      repoRoot,
      provider,
      rawProviderPath,
      acquisition: buildAcquisition(),
      packageVersion: TASK2C3_PACKAGE_VERSION,
      competitionId: "competition-1",
      seasonId: "season-2026",
    });
    const second = buildTask2C3StandingsPackage({
      repoRoot,
      provider,
      rawProviderPath,
      acquisition: buildAcquisition(),
      packageVersion: TASK2C3_PACKAGE_VERSION,
      competitionId: "competition-1",
      seasonId: "season-2026",
    });

    expect(first.manifest.semantic_package_sha256).toBe(second.manifest.semantic_package_sha256);
    expect(first.dataset.rows).toHaveLength(48);
    expect(first.standingSnapshots).toHaveLength(48);
    expect(first.dataset.effective_at_utc).toBe("2026-06-30T00:00:00.000Z");
    expect(first.dataset.captured_at_utc).toBe("2026-06-30T08:06:52.789Z");
    expect(first.dataset.cutoff_at_utc).toBe("2026-06-30T08:06:52.789Z");
    expect((first.dataset.reliability as { timestamp_semantics?: { effective_precision?: string } }).timestamp_semantics?.effective_precision).toBe("date");

    const plan = planTask2C3StandingsImport({
      standingsPackage: first,
      currentState: buildState(),
      standingsPackageManifestPath: path.join(artifactsDir, "standings-package", "task2c3-standings-manifest.json"),
      standingsPackageManifestSha256: "manifest-sha",
    });
    const rerunPlan = planTask2C3StandingsImport({
      standingsPackage: first,
      currentState: applyTask2C3StandingsPlanToLocalState(buildState(), plan),
      standingsPackageManifestPath: path.join(artifactsDir, "standings-package", "task2c3-standings-manifest.json"),
      standingsPackageManifestSha256: "manifest-sha",
    });

    expect(plan.summary.sourceSnapshots.insert).toBe(1);
    expect(plan.summary.teamTournamentStandingSnapshots.insert).toBe(48);
    expect(rerunPlan.summary.sourceSnapshots.skip_identical).toBe(1);
    expect(rerunPlan.summary.teamTournamentStandingSnapshots.skip_identical).toBe(48);
  });

  it("surfaces the missing stage table as a global blocker while keeping local inserts deterministic", () => {
    const repoRoot = process.cwd();
    const artifactsDir = createTempDir("task2c3-blocked");
    const pkg = buildTask2C3StandingsPackage({
      repoRoot,
      provider: buildProviderStandings(),
      rawProviderPath: path.join(artifactsDir, "api-football-standings-raw.json"),
      acquisition: buildAcquisition(),
      competitionId: "competition-1",
      seasonId: "season-2026",
    });

    const plan = planTask2C3StandingsImport({
      standingsPackage: pkg,
      currentState: {
        ...buildState(),
        standingsTablePresent: false,
        standingsTablePresenceError: "schema cache missing",
      },
      standingsPackageManifestPath: path.join(artifactsDir, "standings-package", "task2c3-standings-manifest.json"),
      standingsPackageManifestSha256: "manifest-sha",
    });

    expect(plan.globalBlockers).toContain("stage_team_tournament_standing_snapshots_missing");
    expect(plan.summary.teamTournamentStandingSnapshots.insert).toBe(48);
  });

  it("keeps dry-run artifacts inside the task2c-3 local-run path shape", () => {
    const defaultDir = buildDefaultTask2C3ArtifactsDir(process.cwd());
    expect(defaultDir).toContain(path.join("artifacts", "prediction-intelligence-v2", "task2c-3", "local-run"));

    const allowed = path.join(process.cwd(), "artifacts", "prediction-intelligence-v2", "task2c-3", "local-run", "2026-06-30", "nested");
    expect(() => assertTask2C3LocalRunPreflight(process.cwd(), allowed)).not.toThrow();

    const rejected = path.join(process.cwd(), "artifacts", "prediction-intelligence-v2", "task2c-2", "local-run", "2026-06-30");
    expect(() => assertTask2C3LocalRunPreflight(process.cwd(), rejected)).toThrow(/Task 2C.3 local run refused/);
  });

  it("loads preserved raw capture metadata and preserves the acquisition instant without truncation", () => {
    const baseDir = createTempDir("task2c3-raw");
    const runDir = path.join(baseDir, "2026-06-30T08-06-52-789Z");
    fs.mkdirSync(runDir, { recursive: true });
    const rawCapturePath = path.join(runDir, "api-football-standings-raw.json");
    fs.writeFileSync(
      rawCapturePath,
      JSON.stringify(
        {
          schema_name: "prediction-intelligence-v2-task2c3-raw-provider-capture",
          schema_version: "1.0.0",
          provider: "api-football",
          logical_endpoint: "/standings",
          request_parameters: { league: "1", season: "2026" },
          competition_identity: { league_id: 1, league_name: "World Cup", country: "World" },
          season_identity: { season: 2026 },
          http_status: 200,
          raw_response_sha256: "raw",
          normalized_payload_sha256: "normalized",
          effective_at_utc: "2026-06-30T00:00:00.000Z",
          captured_at_utc: "2026-06-30T00:00:00.000Z",
          cutoff_at_utc: "2026-06-30T00:00:00.000Z",
          coverage: { status: "complete", target_team_count: 48, missing_team_keys: [] },
          missing_data: {},
          disagreement: {},
          payload: {
            results: 1,
            errors: [],
            paging: { current: 1, total: 1 },
            response: [
              {
                league: {
                  id: 1,
                  name: "World Cup",
                  country: "World",
                  season: 2026,
                  standings: buildProviderStandings().groups.map((group) =>
                    group.rows.map((row) => ({
                      rank: row.rank,
                      team: { id: row.team.providerTeamId, name: row.team.name, logo: row.team.logo },
                      points: row.points,
                      goalsDiff: row.goalsDiff,
                      group: row.group,
                      form: row.form,
                      status: row.status,
                      description: row.description,
                      all: row.all,
                      home: row.home,
                      away: row.away,
                      update: row.update,
                    })),
                  ),
                },
              },
            ],
          },
        },
        null,
        2,
      ),
      "utf8",
    );

    const loaded = loadTask2C3ProviderStandingsFromRawCapture(rawCapturePath);
    expect(loaded.acquisition.capturedAtUtc).toBe("2026-06-30T08:06:52.789Z");
    expect(loaded.acquisition.capturedAtUtc.endsWith("00:00:00.000Z")).toBe(false);
    expect(loaded.acquisition.cutoffAtUtc).toBe("2026-06-30T08:06:52.789Z");
    expect(loaded.acquisition.effectivePrecision).toBe("date");
  });

  it("reports a classification gap for known fixtures instead of reporting zero knockout fixtures", () => {
    const report = buildTask2C3KnockoutEvidenceReport({
      inspectedAtUtc: "2026-06-30T08:10:00.000Z",
      stageMatches: [
        {
          id: "175ad663-ad61-4fe5-a899-d86d3f74e0da",
          external_id: "api-football:fixture:1489418",
          slug: "world-cup-2026-algeria-vs-austria-2026-06-28",
          stage: "group_stage",
          status: "finished",
          kickoff_at: "2026-06-28T02:00:00+00:00",
        },
        {
          id: "210ee157-ea3c-4b7c-92fa-b7bb0f55ce7d",
          external_id: "api-football:fixture:1489421",
          slug: "world-cup-2026-jordan-vs-argentina-2026-06-28",
          stage: "group_stage",
          status: "finished",
          kickoff_at: "2026-06-28T02:00:00+00:00",
        },
      ],
      resultRows: [
        {
          match_id: "175ad663-ad61-4fe5-a899-d86d3f74e0da",
          home_goals: 3,
          away_goals: 3,
          intake_source: "api_football",
          source_note: "provider_status_short=FT",
          recorded_at: "2026-06-29T08:17:58.292Z",
        },
      ],
      officialScheduleMatches: [
        {
          id: "official-69",
          official_match_number: 69,
          stage_key: "group_stage",
          group_key: "J",
          home_team_key: "algeria",
          away_team_key: "austria",
          scheduled_at_utc: "2026-06-28T02:00:00+00:00",
        },
        {
          id: "official-70",
          official_match_number: 70,
          stage_key: "group_stage",
          group_key: "J",
          home_team_key: "jordan",
          away_team_key: "argentina",
          scheduled_at_utc: "2026-06-28T02:00:00+00:00",
        },
      ],
      officialScheduleLinks: [
        {
          official_schedule_match_id: "official-69",
          match_id: "175ad663-ad61-4fe5-a899-d86d3f74e0da",
          api_football_fixture_id: 1489418,
          link_status: "linked",
          metadata_json: {},
        },
        {
          official_schedule_match_id: "official-70",
          match_id: "210ee157-ea3c-4b7c-92fa-b7bb0f55ce7d",
          api_football_fixture_id: 1489421,
          link_status: "linked",
          metadata_json: {},
        },
      ],
      providerSnapshotEvidence: new Map([
        [1489418, { providerStatusShort: "FT", competition: { round: "Group Stage - 3" }, goals: { home: 3, away: 3 } }],
        [1489421, { providerStatusShort: "FT", competition: { round: "Group Stage - 3" }, goals: { home: 1, away: 3 } }],
      ]),
    });

    expect(report.matches_found).toBe(2);
    expect(report.classification_gap).toBe(true);
    expect(report.known_fixtures[0]?.classification_finding).toBe("fixture_exists_with_non_knockout_classification");
    expect(report.known_fixtures[0]?.provider_snapshot_evidence.found).toBe(true);
  });
});
