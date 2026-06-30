import { describe, expect, it } from "vitest";

import {
  buildTask2C2RunnerOutput,
  getTask2C2RunnerExitCode,
} from "./run-task2c-ratings-import";

function buildResult(overrides?: {
  conflictCount?: number;
  invalidCount?: number;
  sourceInsertCount?: number;
  ratingInsertCount?: number;
  rerunSourceSkipCount?: number;
  rerunRatingSkipCount?: number;
}) {
  return {
    plan: {
      sourceInputSchemaVersion: "ufo-national-team-ratings-source-refresh-v3",
      sourceInputSnapshotDate: "2026-06-29",
      baselineCutoffDate: "2026-06-20",
      summary: {
        sourceSnapshots: {
          insert: overrides?.sourceInsertCount ?? 2,
          skip_identical: 0,
          conflict: 0,
          invalid: 0,
        },
        teamRatingSnapshots: {
          insert: overrides?.ratingInsertCount ?? 96,
          skip_identical: 0,
          conflict: 0,
          invalid: 0,
        },
        totals: {
          insert: (overrides?.sourceInsertCount ?? 2) + (overrides?.ratingInsertCount ?? 96),
          skip_identical: 0,
          conflict: overrides?.conflictCount ?? 0,
          invalid: overrides?.invalidCount ?? 0,
        },
      },
      stablePlanSha256: "plan-sha",
    },
    rerunPlan: {
      summary: {
        sourceSnapshots: {
          skip_identical: overrides?.rerunSourceSkipCount ?? 2,
        },
        teamRatingSnapshots: {
          skip_identical: overrides?.rerunRatingSkipCount ?? 96,
        },
      },
      stablePlanSha256: "rerun-sha",
    },
    artifact: {
      ratingsPackageManifestPath: "D:\\artifact\\task2c2-ratings-manifest.json",
      ratingsPackageManifestSha256: "manifest-sha",
      planPath: "D:\\artifact\\task2c2-ratings-import-dry-run.json",
      rerunPlanPath: "D:\\artifact\\task2c2-ratings-import-rerun.json",
      rerunPlanSha256: "rerun-plan-sha",
    },
  } as const;
}

describe("task2c.2 runner output", () => {
  it("exits zero when the dry-run is conflict-free", () => {
    expect(getTask2C2RunnerExitCode(buildResult())).toBe(0);
    const output = buildTask2C2RunnerOutput(buildResult()).join("\n");
    expect(output).toContain("source_snapshot_insert_count=2");
    expect(output).toContain("team_rating_insert_count=96");
    expect(output).toContain("rerun_team_rating_skip_identical_count=96");
  });

  it("exits nonzero when the plan contains conflicts or invalid rows", () => {
    expect(getTask2C2RunnerExitCode(buildResult({ conflictCount: 1 }))).toBe(1);
    expect(getTask2C2RunnerExitCode(buildResult({ invalidCount: 1 }))).toBe(1);
  });
});
