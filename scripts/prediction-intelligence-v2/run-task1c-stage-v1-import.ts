import fs from "node:fs";
import path from "node:path";

import {
  resolveTask1cStageV1ImportDefaults,
  runTask1cStageV1Import,
} from "../../lib/prediction-intelligence-v2/task1c-stage-v1-import";

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

async function main() {
  const repoRoot = process.cwd();
  const defaults = resolveTask1cStageV1ImportDefaults(repoRoot);
  const envFile = parseFlagValue(process.argv, "--env-file") ?? ".env.local";
  const artifactsDir = parseFlagValue(process.argv, "--artifacts-dir") ?? defaults.artifactsDir;
  const sourceArtifactDir = parseFlagValue(process.argv, "--source-artifact-dir") ?? defaults.sourceArtifactDir;
  const projectRef = parseFlagValue(process.argv, "--project-ref") ?? "";
  const denyProjectRef = parseFlagValue(process.argv, "--deny-project-ref") ?? "";
  const apply = hasFlag(process.argv, "--apply");
  const reviewedPlanPath = parseFlagValue(process.argv, "--reviewed-plan");

  loadEnvFile(envFile);

  const result = await runTask1cStageV1Import({
    repoRoot,
    artifactsDir,
    projectRef,
    denyProjectRef,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    sourceArtifactDir,
    apply,
    reviewedPlanPath,
  });

  console.log(`target_project_ref=${result.plan.targetProjectRef}`);
  console.log(`denied_project_ref=${result.plan.deniedProjectRef}`);
  console.log(`mode=${result.plan.mode}`);
  console.log(`state=${result.plan.expectedPriorState}`);
  console.log(`artifact_path=${result.artifactPath}`);
  console.log(`stable_plan_sha256=${result.plan.stablePlanSha256}`);
  console.log(`expected_match_publications=${result.plan.summary.expectedFirstApplyCounts.matchPublications}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
