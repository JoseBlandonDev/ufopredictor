import { describe, expect, it } from "vitest";

import {
  buildTask2C3RunnerOutput,
  getTask2C3RunnerExitCode,
  type RunTask2C3Result,
} from "./run-task2c-standings-import";

function buildResult(overrides?: {
  conflictCount?: number;
  invalidCount?: number;
  standingInsertCount?: number;
  rerunStandingSkipCount?: number;
  tablePresent?: boolean;
}) {
  return {
    stageState: {
      competitionId: "competition-1",
      seasonId: "season-2026",
      standingsTablePresent: overrides?.tablePresent ?? true,
      standingsTablePresenceError: overrides?.tablePresent === false ? "schema cache missing" : null,
      sourceSnapshots: [],
      teamTournamentStandingSnapshots: [],
    },
    knockoutEvidence: {
      mode: "stage_probe",
      inspected_at_utc: "2026-06-30T00:00:00.000Z",
      matches_found: 0,
      result_rows_found: 0,
      known_fixture_targets: ["wc2026-match-069", "wc2026-match-070"],
      preservation: {
        winner_flag_preserved_in_stage: false,
        extra_time_or_penalties_detail_preserved_in_stage: false,
      },
      classification_gap: false,
      notes: [],
      known_fixtures: [],
      sample_matches: [],
      sample_results: [],
    },
    plan: {
      summary: {
        sourceSnapshots: {
          insert: 1,
          skip_identical: 0,
          conflict: 0,
          invalid: 0,
        },
        teamTournamentStandingSnapshots: {
          insert: overrides?.standingInsertCount ?? 48,
          skip_identical: 0,
          conflict: 0,
          invalid: 0,
        },
        totals: {
          insert: 1 + (overrides?.standingInsertCount ?? 48),
          skip_identical: 0,
          conflict: overrides?.conflictCount ?? 0,
          invalid: overrides?.invalidCount ?? 0,
        },
      },
      globalBlockers: overrides?.tablePresent === false ? ["stage_team_tournament_standing_snapshots_missing"] : [],
      stablePlanSha256: "plan-sha",
    },
    rerunPlan: {
      summary: {
        sourceSnapshots: {
          skip_identical: 1,
        },
        teamTournamentStandingSnapshots: {
          skip_identical: overrides?.rerunStandingSkipCount ?? 48,
        },
      },
      stablePlanSha256: "rerun-sha",
    },
    artifact: {
      rawProviderPath: "D:\\artifact\\api-football-standings-raw.json",
      rawProviderSha256: "raw-sha",
      knockoutEvidencePath: "D:\\artifact\\task2c3-knockout-evidence.json",
      standingsPackageManifestPath: "D:\\artifact\\standings-package\\task2c3-standings-manifest.json",
      standingsPackageManifestSha256: "manifest-sha",
      planPath: "D:\\artifact\\task2c3-standings-import-dry-run.json",
      rerunPlanPath: "D:\\artifact\\task2c3-standings-import-rerun.json",
    },
  } as unknown as RunTask2C3Result;
}

describe("task2c.3 runner output", () => {
  it("exits zero when the dry-run is conflict-free", () => {
    expect(getTask2C3RunnerExitCode(buildResult())).toBe(0);
    const output = buildTask2C3RunnerOutput(buildResult()).join("\n");
    expect(output).toContain("standing_snapshot_insert_count=48");
    expect(output).toContain("rerun_standing_snapshot_skip_identical_count=48");
  });

  it("exits nonzero when the plan contains conflicts or invalid rows", () => {
    expect(getTask2C3RunnerExitCode(buildResult({ conflictCount: 1 }))).toBe(1);
    expect(getTask2C3RunnerExitCode(buildResult({ invalidCount: 1 }))).toBe(1);
  });
});
