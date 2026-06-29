import fs from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import {
  evaluateTask2APlanEligibility,
  resolveTask2ASignalBaselineDefaults,
  runTask2ASignalBaseline,
} from "../../lib/prediction-intelligence-v2/task2a-signal-baseline";

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
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.DEV_SUPABASE_ANON_KEY) {
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.DEV_SUPABASE_ANON_KEY;
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.DEV_SUPABASE_SERVICE_ROLE_KEY) {
    process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.DEV_SUPABASE_SERVICE_ROLE_KEY;
  }
}

export function buildTask2ACliSummaryLines(result: Awaited<ReturnType<typeof runTask2ASignalBaseline>>): string[] {
  const eligibility = evaluateTask2APlanEligibility(result.plan);
  return [
    `artifact=${result.artifactPath}`,
    `coverage_artifact=${result.coverageArtifactPath}`,
    `mode=${result.plan.mode}`,
    `state=${result.plan.expectedPriorState}`,
    `manifest_status=${result.plan.manifestStatus}`,
    `blocker_count=${result.plan.blockers.length}`,
    ...result.plan.blockers.map((blocker, index) => `blocker_${index + 1}=${blocker}`),
    `conflict_count=${result.plan.conflicts.length}`,
    ...result.plan.conflicts.map((conflict, index) => `conflict_${index + 1}=${conflict}`),
    `apply_eligible=${eligibility.eligible}`,
    `apply_ineligible_reasons=${eligibility.reasons.join(" | ")}`,
    `stable_plan_sha256=${result.plan.stablePlanSha256}`,
    `expected_signal_rows=${result.plan.summary.expectedSignalRowCount}`,
    `baseline_ready_fixtures=${result.plan.coverageSummary.baselineReadyCount}`,
  ];
}

export function computeTask2ACliExitCode(result: Awaited<ReturnType<typeof runTask2ASignalBaseline>>): number {
  return evaluateTask2APlanEligibility(result.plan).eligible ? 0 : 1;
}

async function main() {
  const repoRoot = process.cwd();
  const defaults = resolveTask2ASignalBaselineDefaults(repoRoot);
  const envFile = parseFlagValue(process.argv, "--env-file") ?? ".env.stage.local";
  const projectRef = parseFlagValue(process.argv, "--project-ref") ?? "";
  const denyProjectRef = parseFlagValue(process.argv, "--deny-project-ref") ?? "";
  const preparedDir = parseFlagValue(process.argv, "--prepared-dir") ?? defaults.preparedDir;
  const artifactsDir = parseFlagValue(process.argv, "--artifacts-dir") ?? defaults.artifactsDir;
  const reviewedPlanPath = parseFlagValue(process.argv, "--reviewed-plan");
  const reviewedStablePlanSha256 = parseFlagValue(process.argv, "--reviewed-stable-plan-sha256");
  const dryRun = hasFlag(process.argv, "--dry-run");
  const apply = hasFlag(process.argv, "--apply");
  const verify = hasFlag(process.argv, "--verify");

  loadEnvFile(envFile);
  applyDevelopmentSupabaseAliases();

  const result = await runTask2ASignalBaseline({
    repoRoot,
    preparedDir,
    artifactsDir,
    projectRef,
    denyProjectRef,
    dryRun,
    apply,
    verify,
    reviewedPlanPath,
    reviewedStablePlanSha256,
  });

  for (const line of buildTask2ACliSummaryLines(result)) {
    console.log(line);
  }

  const exitCode = computeTask2ACliExitCode(result);
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
