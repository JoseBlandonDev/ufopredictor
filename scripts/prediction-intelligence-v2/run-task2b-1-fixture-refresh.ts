import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  evaluateTask2B1Eligibility,
  resolveTask2B1Defaults,
  runTask2B1FixtureRefresh,
  type RunTask2B1Result,
} from "../../lib/prediction-intelligence-v2/task2b-fixture-refresh";

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

function parseCsv(value: string | null): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

function parseNumberCsv(value: string | null): number[] {
  return parseCsv(value)
    .map((part) => Number(part))
    .filter((part) => Number.isInteger(part) && part > 0);
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

export function buildTask2B1RunnerOutput(result: RunTask2B1Result): string[] {
  const lines = [
    `artifact=${result.artifactPath}`,
    `provider_snapshot=${result.providerSnapshotPath}`,
    `provider_snapshot_sha256=${result.providerSnapshotSha256}`,
    `safe_action_count=${result.plan.summary.safeActionCount}`,
    `global_blocker_count=${result.plan.globalBlockers.length}`,
    `row_exclusion_count=${result.plan.rowLevelExclusions.length}`,
    `provider_only_unknown_count=${result.plan.summary.providerOnlyUnknownCount}`,
    `stable_plan_sha256=${result.plan.stablePlanSha256}`,
  ];

  if (result.plan.mode === "verification") {
    lines.unshift("mode=verification");
    lines.push(`reviewed_action_count=${result.verifyResult?.reviewedActionCount ?? 0}`);
    lines.push(`satisfied_action_count=${result.verifyResult?.satisfiedActionCount ?? 0}`);
    lines.push(`missing_action_count=${result.verifyResult?.missingActionCount ?? 0}`);
    lines.push(`mismatched_action_count=${result.verifyResult?.mismatchedActionCount ?? 0}`);
    lines.push(`ambiguous_action_count=${result.verifyResult?.ambiguousActionCount ?? 0}`);
    lines.push(`pending_reviewed_action_count=${result.verifyResult?.pendingReviewedActionCount ?? 0}`);
    lines.push(`verification_passed=${result.verifyResult?.verificationPassed === true}`);
    return lines;
  }

  lines.unshift(`mode=${result.plan.mode}`);
  const eligibility = evaluateTask2B1Eligibility(result.plan);
  lines.push(`apply_eligible=${eligibility.eligible}`);
  lines.push(`apply_ineligible_reasons=${eligibility.reasons.join(" | ")}`);

  if (result.plan.mode === "apply") {
    const attemptedActionCount = result.plan.safeActions.length;
    const completedActionCount = result.applyResult?.completedActionKeys.length ?? 0;
    lines.push(`attempted_action_count=${attemptedActionCount}`);
    lines.push(`completed_action_count=${completedActionCount}`);
    lines.push(`failed_action_key=${result.applyResult?.failedActionKey ?? ""}`);
    lines.push(`ambiguous_action_key=${result.applyResult?.ambiguousActionKey ?? ""}`);
  }

  return lines;
}

export function getTask2B1RunnerExitCode(result: RunTask2B1Result): number {
  if (result.plan.mode === "verification") {
    return result.verifyResult?.verificationPassed === true ? 0 : 1;
  }

  if (result.plan.mode === "apply") {
    const attemptedActionCount = result.plan.safeActions.length;
    const completedActionCount = result.applyResult?.completedActionKeys.length ?? 0;
    const hasFailure =
      !result.applyResult ||
      result.applyResult.failedActionKey !== null ||
      result.applyResult.ambiguousActionKey !== null ||
      completedActionCount !== attemptedActionCount;
    return hasFailure ? 1 : 0;
  }

  const eligibility = evaluateTask2B1Eligibility(result.plan);
  return eligibility.eligible ? 0 : 1;
}

async function main() {
  const repoRoot = process.cwd();
  const defaults = resolveTask2B1Defaults(repoRoot);
  const envFile = parseFlagValue(process.argv, "--env-file") ?? ".env.stage.local";
  const artifactsDir = parseFlagValue(process.argv, "--artifacts-dir") ?? defaults.artifactsDir;
  const projectRef = parseFlagValue(process.argv, "--project-ref") ?? "";
  const denyProjectRef = parseFlagValue(process.argv, "--deny-project-ref") ?? "";
  const reviewedPlanPath = parseFlagValue(process.argv, "--reviewed-plan");
  const reviewedStablePlanSha256 = parseFlagValue(process.argv, "--reviewed-stable-plan-sha256");
  const providerSnapshotPath = parseFlagValue(process.argv, "--provider-snapshot");
  const dryRun = hasFlag(process.argv, "--dry-run");
  const apply = hasFlag(process.argv, "--apply");
  const verify = hasFlag(process.argv, "--verify");

  loadEnvFile(envFile);
  applyDevelopmentSupabaseAliases();

  const result = await runTask2B1FixtureRefresh({
    repoRoot,
    artifactsDir,
    envSupabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    projectRef,
    denyProjectRef,
    dryRun,
    apply,
    verify,
    reviewedPlanPath,
    reviewedStablePlanSha256,
    providerSnapshotPath,
    selection: {
      canonicalFixtureIds: parseCsv(parseFlagValue(process.argv, "--canonical-fixture-ids")),
      matchIds: parseCsv(parseFlagValue(process.argv, "--match-ids")),
      apiFootballFixtureIds: parseNumberCsv(parseFlagValue(process.argv, "--api-football-fixture-ids")),
      matchday: parseFlagValue(process.argv, "--matchday") ? Number(parseFlagValue(process.argv, "--matchday")) : null,
      from: parseFlagValue(process.argv, "--from"),
      to: parseFlagValue(process.argv, "--to"),
    },
  });

  for (const line of buildTask2B1RunnerOutput(result)) {
    console.log(line);
  }
  process.exitCode = getTask2B1RunnerExitCode(result);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
