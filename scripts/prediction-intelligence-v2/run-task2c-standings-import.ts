import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  TASK2C3_KNOCKOUT_EVIDENCE_FILE,
  acquireTask2C3ProviderStandings,
  applyTask2C3StandingsPlanToLocalState,
  assertTask2C3LocalRunPreflight,
  buildDefaultTask2C3ArtifactsDir,
  buildTask2C3StandingsPackage,
  inspectTask2C3KnockoutEvidence,
  inspectTask2C3StageState,
  loadTask2C3ProviderStandingsFromRawCapture,
  planTask2C3StandingsImport,
  writeTask2C3DryRunArtifacts,
  type Task2C3DryRunArtifact,
  type Task2C3KnockoutEvidence,
  type Task2C3LocalState,
  type Task2C3StandingsImportPlan,
} from "../../lib/prediction-intelligence-v2/task2c-standings-import";

export type RunTask2C3Result = {
  stageState: Task2C3LocalState;
  knockoutEvidence: Task2C3KnockoutEvidence;
  plan: Task2C3StandingsImportPlan;
  rerunPlan: Task2C3StandingsImportPlan;
  artifact: Task2C3DryRunArtifact;
};

function parseFlagValue(argv: string[], flag: string): string | null {
  const index = argv.indexOf(flag);
  if (index === -1) {
    return null;
  }
  return argv[index + 1] ?? null;
}

function loadEnvFile(envFilePath: string): void {
  const absolutePath = path.resolve(envFilePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Environment file not found: ${absolutePath}`);
  }

  const lines = fs.readFileSync(absolutePath, "utf8").split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const name = line.slice(0, separatorIndex).trim();
    const rawValue = line.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
    process.env[name] = value;
  }
}

function applyDevelopmentSupabaseAliases(): void {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.DEV_SUPABASE_URL) {
    process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.DEV_SUPABASE_URL;
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.DEV_SUPABASE_SERVICE_ROLE_KEY) {
    process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.DEV_SUPABASE_SERVICE_ROLE_KEY;
  }
}

export async function runTask2C3StandingsImport(input: {
  repoRoot: string;
  artifactsDir: string;
  rawProviderPath?: string | null;
}): Promise<RunTask2C3Result> {
  assertTask2C3LocalRunPreflight(input.repoRoot, input.artifactsDir);

  const runnerClock = new Date().toISOString();
  const acquisition =
    input.rawProviderPath != null
      ? loadTask2C3ProviderStandingsFromRawCapture(input.rawProviderPath)
      : {
          provider: await acquireTask2C3ProviderStandings(),
          acquisition: {
            capturedAtUtc: runnerClock,
            cutoffAtUtc: runnerClock,
            capturedAtSource: "runner_clock" as const,
            cutoffAtSource: "acquisition_based" as const,
            effectivePrecision: "date" as const,
          },
        };
  const stageState = await inspectTask2C3StageState();
  const knockoutEvidence = await inspectTask2C3KnockoutEvidence({
    repoRoot: input.repoRoot,
    competitionId: stageState.competitionId,
    seasonId: stageState.seasonId,
  });

  if (!stageState.competitionId || !stageState.seasonId) {
    throw new Error("Task 2C.3 cannot build standing snapshot inserts because stage competition/season identifiers are missing.");
  }

  const rawProviderPath = path.join(input.artifactsDir, "api-football-standings-raw.json");
  const standingsPackage = buildTask2C3StandingsPackage({
    repoRoot: input.repoRoot,
    provider: acquisition.provider,
    rawProviderPath,
    acquisition: acquisition.acquisition,
    competitionId: stageState.competitionId,
    seasonId: stageState.seasonId,
  });
  const packageDir = path.join(input.artifactsDir, "standings-package");
  const manifestPath = path.join(packageDir, "task2c3-standings-manifest.json");
  const plan = planTask2C3StandingsImport({
    standingsPackage,
    currentState: stageState,
    standingsPackageManifestPath: manifestPath,
    standingsPackageManifestSha256: "",
  });
  const rerunPlan = planTask2C3StandingsImport({
    standingsPackage,
    currentState: applyTask2C3StandingsPlanToLocalState(stageState, plan),
    standingsPackageManifestPath: manifestPath,
    standingsPackageManifestSha256: "",
  });
  const artifact = writeTask2C3DryRunArtifacts({
    repoRoot: input.repoRoot,
    artifactsDir: input.artifactsDir,
    provider: acquisition.provider,
    knockoutEvidence,
    standingsPackage,
    plan,
    rerunPlan,
  });

  const materializedPlan = planTask2C3StandingsImport({
    standingsPackage,
    currentState: stageState,
    standingsPackageManifestPath: artifact.standingsPackageManifestPath,
    standingsPackageManifestSha256: artifact.standingsPackageManifestSha256,
  });
  const materializedRerunPlan = planTask2C3StandingsImport({
    standingsPackage,
    currentState: applyTask2C3StandingsPlanToLocalState(stageState, materializedPlan),
    standingsPackageManifestPath: artifact.standingsPackageManifestPath,
    standingsPackageManifestSha256: artifact.standingsPackageManifestSha256,
  });
  const finalArtifact = writeTask2C3DryRunArtifacts({
    repoRoot: input.repoRoot,
    artifactsDir: input.artifactsDir,
    provider: acquisition.provider,
    knockoutEvidence,
    standingsPackage,
    plan: materializedPlan,
    rerunPlan: materializedRerunPlan,
  });

  return {
    stageState,
    knockoutEvidence,
    plan: materializedPlan,
    rerunPlan: materializedRerunPlan,
    artifact: finalArtifact,
  };
}

export function buildTask2C3RunnerOutput(result: RunTask2C3Result): string[] {
  return [
    `raw_provider=${result.artifact.rawProviderPath}`,
    `raw_provider_sha256=${result.artifact.rawProviderSha256}`,
    `knockout_evidence=${path.join(path.dirname(result.artifact.rawProviderPath), TASK2C3_KNOCKOUT_EVIDENCE_FILE)}`,
    `standings_manifest=${result.artifact.standingsPackageManifestPath}`,
    `standings_manifest_sha256=${result.artifact.standingsPackageManifestSha256}`,
    `plan=${result.artifact.planPath}`,
    `rerun_plan=${result.artifact.rerunPlanPath}`,
    `stage_competition_id=${result.stageState.competitionId ?? ""}`,
    `stage_season_id=${result.stageState.seasonId ?? ""}`,
    `stage_standings_table_present=${result.stageState.standingsTablePresent}`,
    `source_snapshot_insert_count=${result.plan.summary.sourceSnapshots.insert}`,
    `source_snapshot_skip_identical_count=${result.plan.summary.sourceSnapshots.skip_identical}`,
    `standing_snapshot_insert_count=${result.plan.summary.teamTournamentStandingSnapshots.insert}`,
    `standing_snapshot_skip_identical_count=${result.plan.summary.teamTournamentStandingSnapshots.skip_identical}`,
    `conflict_count=${result.plan.summary.totals.conflict}`,
    `invalid_count=${result.plan.summary.totals.invalid}`,
    `global_blocker_count=${result.plan.globalBlockers.length}`,
    `stable_plan_sha256=${result.plan.stablePlanSha256}`,
    `rerun_source_snapshot_skip_identical_count=${result.rerunPlan.summary.sourceSnapshots.skip_identical}`,
    `rerun_standing_snapshot_skip_identical_count=${result.rerunPlan.summary.teamTournamentStandingSnapshots.skip_identical}`,
    `rerun_stable_plan_sha256=${result.rerunPlan.stablePlanSha256}`,
    `knockout_matches_found=${result.knockoutEvidence.matches_found}`,
    `knockout_result_rows_found=${result.knockoutEvidence.result_rows_found}`,
  ];
}

export function getTask2C3RunnerExitCode(result: RunTask2C3Result): number {
  return result.plan.summary.totals.conflict === 0 && result.plan.summary.totals.invalid === 0 ? 0 : 1;
}

async function main() {
  const repoRoot = process.cwd();
  const envFile = parseFlagValue(process.argv, "--env-file") ?? ".env.stage.local";
  const artifactsDir = parseFlagValue(process.argv, "--artifacts-dir") ?? buildDefaultTask2C3ArtifactsDir(repoRoot);
  const rawProviderPath = parseFlagValue(process.argv, "--raw-provider-path");
  loadEnvFile(envFile);
  applyDevelopmentSupabaseAliases();

  const result = await runTask2C3StandingsImport({
    repoRoot,
    artifactsDir,
    rawProviderPath,
  });
  for (const line of buildTask2C3RunnerOutput(result)) {
    console.log(line);
  }
  const exitCode = getTask2C3RunnerExitCode(result);
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
