import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  evaluateTask2B2Eligibility,
  resolveTask2B2Defaults,
  runTask2B2ResultRefresh,
  type RunTask2B2Result,
} from "../../lib/prediction-intelligence-v2/task2b-result-refresh";

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

export function buildTask2B2RunnerOutput(result: RunTask2B2Result): string[] {
  const lines = [
    `artifact=${result.artifactPath}`,
    `provider_snapshot=${result.providerSnapshotPath}`,
    `provider_snapshot_sha256=${result.providerSnapshotSha256}`,
    `mode=${result.plan.mode}`,
    `safe_action_count=${result.plan.summary.safeActionCount}`,
    `global_blocker_count=${result.plan.globalBlockers.length}`,
    `row_exclusion_count=${result.plan.rowLevelExclusions.length}`,
    `stable_plan_sha256=${result.plan.stablePlanSha256}`,
  ];

  const eligibility = evaluateTask2B2Eligibility(result.plan);
  lines.push(`apply_eligible=${eligibility.eligible}`);
  lines.push(`apply_ineligible_reasons=${eligibility.reasons.join(" | ")}`);

  if (result.plan.mode === "apply") {
    lines.push(`attempted_result_action_count=${result.plan.safeActions.length}`);
    lines.push(`completed_result_action_count=${result.applyResult?.completedActionKeys.length ?? 0}`);
    lines.push(`failed_result_action_key=${result.applyResult?.failedActionKey ?? ""}`);
    lines.push(`ambiguous_result_action_key=${result.applyResult?.ambiguousActionKey ?? ""}`);
    lines.push(`attempted_evaluation_count=${result.applyResult?.attemptedEvaluationCount ?? 0}`);
    lines.push(`completed_evaluation_count=${result.applyResult?.completedEvaluationCount ?? 0}`);
    lines.push(`evaluation_writes_applied=${result.applyResult?.evaluationWritesApplied ?? 0}`);
    lines.push(`evaluation_failure_count=${result.applyResult?.evaluationFailures.length ?? 0}`);
  } else if (result.plan.mode === "verification" && result.verificationResult) {
    lines.push(`reviewed_result_action_count=${result.verificationResult.reviewedResultActionCount}`);
    lines.push(`satisfied_result_action_count=${result.verificationResult.satisfiedResultActionCount}`);
    lines.push(`missing_result_action_count=${result.verificationResult.missingResultActionCount}`);
    lines.push(`mismatched_result_action_count=${result.verificationResult.mismatchedResultActionCount}`);
    lines.push(`ambiguous_result_action_count=${result.verificationResult.ambiguousResultActionCount}`);
    lines.push(`reviewed_evaluation_count=${result.verificationResult.reviewedEvaluationCount}`);
    lines.push(`satisfied_evaluation_count=${result.verificationResult.satisfiedEvaluationCount}`);
    lines.push(`missing_evaluation_count=${result.verificationResult.missingEvaluationCount}`);
    lines.push(`mismatched_evaluation_count=${result.verificationResult.mismatchedEvaluationCount}`);
    lines.push(`pending_evaluation_count=${result.verificationResult.pendingEvaluationCount}`);
    lines.push(`excluded_row_count=${result.verificationResult.excludedRowCount}`);
    lines.push(`verification_passed=${result.verificationResult.verificationPassed}`);
  }

  return lines;
}

export function getTask2B2RunnerExitCode(result: RunTask2B2Result): number {
  if (result.plan.mode === "apply") {
    const attemptedResultActionCount = result.plan.safeActions.length;
    const completedResultActionCount = result.applyResult?.completedActionKeys.length ?? 0;
    const resultCoreFailed =
      !result.applyResult ||
      result.applyResult.failedActionKey !== null ||
      result.applyResult.ambiguousActionKey !== null ||
      completedResultActionCount !== attemptedResultActionCount;
    return resultCoreFailed ? 1 : 0;
  }

  if (result.plan.mode === "verification") {
    return result.verificationResult?.verificationPassed ? 0 : 1;
  }

  const eligibility = evaluateTask2B2Eligibility(result.plan);
  return eligibility.eligible ? 0 : 1;
}

async function main() {
  const repoRoot = process.cwd();
  const defaults = resolveTask2B2Defaults(repoRoot);
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

  const result = await runTask2B2ResultRefresh({
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

  for (const line of buildTask2B2RunnerOutput(result)) {
    console.log(line);
  }
  process.exitCode = getTask2B2RunnerExitCode(result);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
