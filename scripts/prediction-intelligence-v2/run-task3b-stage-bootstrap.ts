import fs from "node:fs";
import path from "node:path";

import {
  resolveTask3BStageBootstrapDefaults,
  runTask3BStageBootstrap,
} from "../../lib/prediction-intelligence-v2/task3b-stage-bootstrap";

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

async function main() {
  const repoRoot = process.cwd();
  const defaults = resolveTask3BStageBootstrapDefaults(repoRoot);
  const envFile = parseFlagValue(process.argv, "--env-file") ?? ".env.task3b.development.local";
  const projectRef = parseFlagValue(process.argv, "--project-ref");
  const denyProjectRef = parseFlagValue(process.argv, "--deny-project-ref");
  const expectedMigrationCount = parseFlagValue(process.argv, "--expected-migration-count");
  const acceptExternalMigrationVerification = hasFlag(process.argv, "--accept-external-migration-verification");
  const preparedDir = parseFlagValue(process.argv, "--prepared-dir") ?? defaults.preparedDir;
  const artifactsDir = parseFlagValue(process.argv, "--artifacts-dir") ?? defaults.artifactsDir;
  const dryRun = hasFlag(process.argv, "--dry-run");
  const apply = hasFlag(process.argv, "--apply");

  loadEnvFile(envFile);
  applyDevelopmentSupabaseAliases();

  const result = await runTask3BStageBootstrap({
    repoRoot,
    preparedDir,
    artifactsDir,
    projectRef: projectRef ?? "",
    denyProjectRef: denyProjectRef ?? "",
    expectedMigrationCount: expectedMigrationCount == null ? null : Number(expectedMigrationCount),
    acceptExternalMigrationVerification,
    dryRun,
    apply,
  });

  console.log(`artifact=${result.artifactPath}`);
  console.log(`mode=${result.plan.authorization.mode}`);
  console.log(`target_host=${result.plan.authorization.supabaseUrlHost}`);
  console.log(`manifest_status=${result.plan.manifestStatus}`);
  console.log(`blockers=${result.plan.blockers.length}`);
  console.log(`publish_queue_competition_resolvable=${result.plan.worldCupResolution.publishQueueCompetitionResolvable}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
