import { fileURLToPath } from "node:url";
import path from "node:path";

import {
  TASK2C2_RATINGS_MANIFEST_FILE,
  applyTask2C2RatingsPlanToLocalState,
  assertTask2C2LocalRunPreflight,
  buildDefaultTask2C2ArtifactsDir,
  buildTask2C2BaselineLocalStateFromSourceDir,
  buildTask2C2RatingsPackage,
  planTask2C2RatingsImport,
  writeTask2C2DryRunArtifacts,
  writeTask2C2RatingsPackage,
  type Task2C2DryRunArtifact,
  type Task2C2RatingsImportPlan,
} from "../../lib/prediction-intelligence-v2/task2c-ratings-import";

type RunTask2C2Result = {
  plan: Task2C2RatingsImportPlan;
  rerunPlan: Task2C2RatingsImportPlan;
  artifact: Task2C2DryRunArtifact;
};

function parseFlagValue(argv: string[], flag: string): string | null {
  const index = argv.indexOf(flag);
  if (index === -1) {
    return null;
  }
  return argv[index + 1] ?? null;
}

function hasFlag(argv: string[], flag: string): boolean {
  return argv.includes(flag);
}

function buildDefaults(repoRoot: string) {
  return {
    sourceDir: path.resolve(repoRoot, "codex-inputs", "signal-refresh", "v3"),
    baselineDir: path.resolve(repoRoot, "codex-inputs", "signal-refresh", "v2"),
    artifactsDir: buildDefaultTask2C2ArtifactsDir(repoRoot),
  };
}

export function runTask2CRatingsImport(input: {
  repoRoot: string;
  sourceDir: string;
  baselineDir: string | null;
  artifactsDir: string;
  emptyState?: boolean;
}): RunTask2C2Result {
  assertTask2C2LocalRunPreflight(input.repoRoot, input.artifactsDir);

  const ratingsPackage = buildTask2C2RatingsPackage({
    sourceDir: input.sourceDir,
  });
  const packageDir = path.join(input.artifactsDir, "ratings-package");
  const writtenPackage = writeTask2C2RatingsPackage(packageDir, ratingsPackage);
  const currentState =
    input.emptyState || input.baselineDir == null
      ? { sourceSnapshots: [], teamRatingSnapshots: [] }
      : buildTask2C2BaselineLocalStateFromSourceDir(input.baselineDir);
  const manifestPath = path.join(packageDir, TASK2C2_RATINGS_MANIFEST_FILE);
  const plan = planTask2C2RatingsImport({
    ratingsPackage,
    currentState,
    ratingsPackageManifestPath: manifestPath,
    ratingsPackageManifestSha256: writtenPackage.manifestSha256,
    sourceDir: input.sourceDir,
    baselineDir: input.baselineDir,
  });
  const rerunPlan = planTask2C2RatingsImport({
    ratingsPackage,
    currentState: applyTask2C2RatingsPlanToLocalState(currentState, plan),
    ratingsPackageManifestPath: manifestPath,
    ratingsPackageManifestSha256: writtenPackage.manifestSha256,
    sourceDir: input.sourceDir,
    baselineDir: input.baselineDir,
  });
  const artifact = writeTask2C2DryRunArtifacts({
    artifactsDir: input.artifactsDir,
    ratingsPackage,
    plan,
    rerunPlan,
  });
  return {
    plan,
    rerunPlan,
    artifact,
  };
}

export function buildTask2C2RunnerOutput(result: RunTask2C2Result): string[] {
  return [
    `ratings_manifest=${result.artifact.ratingsPackageManifestPath}`,
    `ratings_manifest_sha256=${result.artifact.ratingsPackageManifestSha256}`,
    `plan=${result.artifact.planPath}`,
    `rerun_plan=${result.artifact.rerunPlanPath}`,
    `source_schema=${result.plan.sourceInputSchemaVersion}`,
    `source_snapshot_date=${result.plan.sourceInputSnapshotDate}`,
    `baseline_cutoff_date=${result.plan.baselineCutoffDate}`,
    `source_snapshot_insert_count=${result.plan.summary.sourceSnapshots.insert}`,
    `source_snapshot_skip_identical_count=${result.plan.summary.sourceSnapshots.skip_identical}`,
    `team_rating_insert_count=${result.plan.summary.teamRatingSnapshots.insert}`,
    `team_rating_skip_identical_count=${result.plan.summary.teamRatingSnapshots.skip_identical}`,
    `conflict_count=${result.plan.summary.totals.conflict}`,
    `invalid_count=${result.plan.summary.totals.invalid}`,
    `stable_plan_sha256=${result.plan.stablePlanSha256}`,
    `rerun_source_snapshot_skip_identical_count=${result.rerunPlan.summary.sourceSnapshots.skip_identical}`,
    `rerun_team_rating_skip_identical_count=${result.rerunPlan.summary.teamRatingSnapshots.skip_identical}`,
    `rerun_stable_plan_sha256=${result.rerunPlan.stablePlanSha256}`,
  ];
}

export function getTask2C2RunnerExitCode(result: RunTask2C2Result): number {
  return result.plan.summary.totals.conflict === 0 && result.plan.summary.totals.invalid === 0 ? 0 : 1;
}

async function main() {
  const repoRoot = process.cwd();
  const defaults = buildDefaults(repoRoot);
  const sourceDir = parseFlagValue(process.argv, "--source-dir") ?? defaults.sourceDir;
  const artifactsDir = parseFlagValue(process.argv, "--artifacts-dir") ?? defaults.artifactsDir;
  const emptyState = hasFlag(process.argv, "--empty-state");
  const baselineDir = emptyState ? null : parseFlagValue(process.argv, "--baseline-dir") ?? defaults.baselineDir;
  const result = runTask2CRatingsImport({
    repoRoot,
    sourceDir,
    baselineDir,
    artifactsDir,
    emptyState,
  });
  for (const line of buildTask2C2RunnerOutput(result)) {
    console.log(line);
  }
  const exitCode = getTask2C2RunnerExitCode(result);
  if (exitCode !== 0) {
    process.exitCode = exitCode;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
